import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';
import { useAuthStore } from '../../stores/authStore';
import { useSocket } from '../../hooks/useSocket';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaPhone } from 'react-icons/fa';

interface VideoCallRoomProps {
  callId: string;
  onLeave: () => void;
}

interface RemoteUser {
  uid: UID;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  username?: string;
}

const VideoCallRoom: React.FC<VideoCallRoomProps> = ({ callId, onLeave }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Map<UID, RemoteUser>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const socket = useSocket();

  // App ID - In production, get this from environment variables
  // Using a demo App ID for testing - replace with your own for production
  const APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'aab8b8f5a8cd4469a63042fcfafe7063';

  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('VideoCallRoom: Initializing call with:', { callId, APP_ID, user: user?.name });

        // Create Agora client
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(agoraClient);

        // Set up event handlers
        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-left', handleUserLeft);

        // Generate token and get channel name
        const tokenData = await generateToken(callId);
        console.log('VideoCallRoom: Generated token data:', tokenData);

        // Join channel using the actual channel name
        console.log('VideoCallRoom: Joining Agora channel:', {
          appId: APP_ID,
          channel: tokenData.channel,
          token: tokenData.token ? tokenData.token.substring(0, 20) + '...' : 'null (testing mode)',
          uid: user?.id
        });
        await agoraClient.join(APP_ID, tokenData.channel, tokenData.token, user?.id);

        // Create and publish local tracks
        console.log('VideoCallRoom: Creating microphone and camera tracks...');

        // Check for permissions first
        console.log('VideoCallRoom: Checking browser permissions...');
        try {
          const permissionsCheck = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log('VideoCallRoom: Browser permissions granted');
          permissionsCheck.getTracks().forEach(track => track.stop()); // Stop the test stream
        } catch (permError) {
          console.error('VideoCallRoom: Browser permissions denied:', permError);
          alert('Por favor, permite el acceso a tu cámara y micrófono para unirte a la videollamada.');
          return;
        }

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        console.log('VideoCallRoom: Created tracks:', {
          audioTrack: audioTrack ? 'OK' : 'FAILED',
          videoTrack: videoTrack ? 'OK' : 'FAILED',
          videoTrackEnabled: videoTrack?.enabled,
          audioTrackEnabled: audioTrack?.enabled
        });
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Play local video
        if (localVideoRef.current && videoTrack) {
          console.log('VideoCallRoom: Playing local video track...');
          console.log('VideoCallRoom: Video container element:', localVideoRef.current);
          try {
            await videoTrack.play(localVideoRef.current);
            console.log('VideoCallRoom: Local video playing successfully');
          } catch (playError) {
            console.error('VideoCallRoom: Error playing local video:', playError);
          }
        } else {
          console.log('VideoCallRoom: Cannot play video:', {
            hasContainer: !!localVideoRef.current,
            hasVideoTrack: !!videoTrack
          });
        }

        // Publish tracks
        console.log('VideoCallRoom: Publishing tracks...');
        await agoraClient.publish([audioTrack, videoTrack]);
        console.log('VideoCallRoom: Tracks published successfully');

        // Join socket room for call coordination
        socket?.emit('join_video_call_room', {
          call_id: callId,
          user_name: user?.name
        });

      } catch (error) {
        console.error('VideoCallRoom: Error initializing call:', error);
        console.error('VideoCallRoom: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        });

        // Show user-friendly error message
        alert(`Error al inicializar la videollamada: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };

    if (user && socket) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [callId, user, socket]);

  const generateToken = async (callId: string): Promise<{token: string | null, channel: string}> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/video-calls/generate-token?call_id=${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating token:', error);
      // For testing mode, return null token and use callId as channel
      return { token: null, channel: callId };
    }
  };

  const handleUserPublished = async (user: any, mediaType: 'video' | 'audio') => {
    await client?.subscribe(user, mediaType);

    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid) || { uid: user.uid };
        const updatedUser: RemoteUser = { ...existingUser, videoTrack: user.videoTrack };
        newMap.set(user.uid, updatedUser);
        return newMap;
      });
    }

    if (mediaType === 'audio') {
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid) || { uid: user.uid };
        const updatedUser: RemoteUser = { ...existingUser, audioTrack: user.audioTrack };
        newMap.set(user.uid, updatedUser);
        return newMap;
      });
      user.audioTrack?.play();
    }
  };

  const handleUserUnpublished = (user: any, mediaType: 'video' | 'audio') => {
    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid);
        if (existingUser) {
          const updatedUser: RemoteUser = { ...existingUser, videoTrack: undefined };
          newMap.set(user.uid, updatedUser);
        }
        return newMap;
      });
    }
  };

  const handleUserLeft = (user: any) => {
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      newMap.delete(user.uid);
      return newMap;
    });
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);

      socket?.emit('video_call_signal', {
        call_id: callId,
        signal_type: 'audio_toggle',
        signal_data: { enabled: !isAudioEnabled },
        user_name: user?.name
      });
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);

      socket?.emit('video_call_signal', {
        call_id: callId,
        signal_type: 'video_toggle',
        signal_data: { enabled: !isVideoEnabled },
        user_name: user?.name
      });
    }
  };

  const startScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (localVideoTrack && client) {
        await client.unpublish([localVideoTrack]);
        localVideoTrack.stop();
        localVideoTrack.close();

        // Create new camera track
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        await client.publish([videoTrack]);
        setIsScreenSharing(false);
      }
    } else {
      // Start screen sharing
      try {
        if (localVideoTrack && client) {
          await client.unpublish([localVideoTrack]);
          localVideoTrack.stop();
          localVideoTrack.close();

          // Create screen track
          const screenTracks = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: "1080p_1",
            optimizationMode: "detail"
          });

          // Handle both single track and array of tracks
          const videoTrack = Array.isArray(screenTracks) ? screenTracks[0] : screenTracks;
          setLocalVideoTrack(videoTrack);

          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
          }

          await client.publish([videoTrack]);
          setIsScreenSharing(true);

          // Handle screen share end
          videoTrack.on('track-ended', async () => {
            await startScreenShare(); // This will stop screen sharing
          });
        }
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }

    socket?.emit('video_call_signal', {
      call_id: callId,
      signal_type: 'screen_share',
      signal_data: { enabled: !isScreenSharing },
      user_name: user?.name
    });
  };

  const leaveCall = async () => {
    await cleanup();

    // Leave socket room
    socket?.emit('leave_video_call_room', {
      call_id: callId,
      user_name: user?.name
    });

    // Update call status in backend
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/video-calls/leave-call/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error leaving call:', error);
    }

    onLeave();
  };

  const cleanup = async () => {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }

    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }

    if (client) {
      await client.leave();
      setClient(null);
    }

    setRemoteUsers(new Map());
  };

  return (
    <div className="video-call-room">
      <div className="video-grid">
        {/* Local video */}
        <div className="video-container local-video">
          <div ref={localVideoRef} className="video-player"></div>
          <div className="video-overlay">
            <span className="username">You {isScreenSharing && '(Screen)'}</span>
            {!isAudioEnabled && <FaMicrophoneSlash className="muted-icon" />}
            {!isVideoEnabled && <FaVideoSlash className="video-off-icon" />}
          </div>
        </div>

        {/* Remote videos */}
        {Array.from(remoteUsers.values()).map((remoteUser) => (
          <RemoteVideo
            key={remoteUser.uid}
            remoteUser={remoteUser}
          />
        ))}
      </div>

      <div className="call-controls">
        <button
          className={`control-btn ${!isAudioEnabled ? 'muted' : ''}`}
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>

        <button
          className={`control-btn ${!isVideoEnabled ? 'video-off' : ''}`}
          onClick={toggleVideo}
          title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
        >
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>

        <button
          className={`control-btn ${isScreenSharing ? 'screen-sharing' : ''}`}
          onClick={startScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <FaDesktop />
        </button>

        <button
          className="control-btn leave-btn"
          onClick={leaveCall}
          title="Leave call"
        >
          <FaPhone />
        </button>
      </div>

      <div className="call-info">
        <span>Call ID: {callId}</span>
        <span>Participants: {remoteUsers.size + 1}</span>
      </div>
    </div>
  );
};

// Component for remote video streams
interface RemoteVideoProps {
  remoteUser: RemoteUser;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ remoteUser }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (remoteUser.videoTrack && videoRef.current) {
      remoteUser.videoTrack.play(videoRef.current);
    }

    return () => {
      if (remoteUser.videoTrack) {
        remoteUser.videoTrack.stop();
      }
    };
  }, [remoteUser.videoTrack]);

  return (
    <div className="video-container remote-video">
      <div ref={videoRef} className="video-player"></div>
      <div className="video-overlay">
        <span className="username">{remoteUser.username || `User ${remoteUser.uid}`}</span>
      </div>
    </div>
  );
};

export default VideoCallRoom;