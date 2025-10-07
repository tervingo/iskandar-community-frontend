import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socket';

interface RemoteUser {
  userId: string;
  username: string;
  isScreenSharing: boolean;
}

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  isInitiator: boolean;
}

interface MultiParticipantWebRTCRoomProps {
  callId: string;
  onLeave: () => void;
}

const MultiParticipantWebRTCRoom: React.FC<MultiParticipantWebRTCRoomProps> = ({ callId, onLeave }) => {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const queuedIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebug(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const createPeerConnection = (remoteUserId: string, isInitiator: boolean): RTCPeerConnection => {
    console.log(`Creating peer connection for ${remoteUserId}, isInitiator: ${isInitiator}`);
    addDebugMessage(`Creating peer connection for ${remoteUserId}`);

    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log(`Received remote track from ${remoteUserId}:`, event);
      addDebugMessage(`Received remote track from ${remoteUserId}`);

      const remoteStream = event.streams[0];
      const videoElement = remoteVideoRefs.current.get(remoteUserId);
      if (videoElement && remoteStream) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${remoteUserId}`);
        const socket = socketService.getSocket();
        socket.emit('webrtc_ice_candidate', {
          callId,
          candidate: event.candidate,
          targetUserId: remoteUserId,
          fromUserId: user?.id
        });
      }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUserId}:`, peerConnection.connectionState);
      addDebugMessage(`Connection with ${remoteUserId}: ${peerConnection.connectionState}`);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${remoteUserId}:`, peerConnection.iceConnectionState);
      addDebugMessage(`ICE state with ${remoteUserId}: ${peerConnection.iceConnectionState}`);
    };

    return peerConnection;
  };

  const setupMedia = async () => {
    try {
      console.log('MultiParticipantWebRTCRoom: Setting up media...');
      addDebugMessage('Setting up camera and microphone');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addDebugMessage('Local video stream set');
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      addDebugMessage(`Media access error: ${error}`);
      throw error;
    }
  };

  const joinRoom = () => {
    const socket = socketService.getSocket();

    if (socket && user) {
      console.log('MultiParticipantWebRTCRoom: Joining WebRTC room', callId);
      addDebugMessage(`Joining room: ${callId}`);

      socket.emit('join_webrtc_room', {
        callId,
        userId: user.id,
        username: user.name
      });
    }
  };

  const setupSocketListeners = () => {
    const socket = socketService.getSocket();

    if (socket) {
      console.log('MultiParticipantWebRTCRoom: Setting up socket listeners');

      // Clean up existing listeners
      socket.off('webrtc_user_joined', handleUserJoined);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_user_left', handleUserLeft);
      socket.off('webrtc_screen_share_status', handleScreenShareStatus);

      // Add fresh listeners
      socket.on('webrtc_user_joined', handleUserJoined);
      socket.on('webrtc_offer', handleOffer);
      socket.on('webrtc_answer', handleAnswer);
      socket.on('webrtc_ice_candidate', handleIceCandidate);
      socket.on('webrtc_user_left', handleUserLeft);
      socket.on('webrtc_screen_share_status', handleScreenShareStatus);

      addDebugMessage('Socket listeners set up');
    }
  };

  const handleUserJoined = async (data: { userId: string, username: string }) => {
    console.log('MultiParticipantWebRTCRoom: User joined:', data);
    addDebugMessage(`User joined: ${data.username} (${data.userId})`);

    // Only handle if it's NOT the current user
    if (data.userId !== user?.id) {
      // Add to remote users list
      setRemoteUsers(prev => {
        if (!prev.find(u => u.userId === data.userId)) {
          return [...prev, {
            userId: data.userId,
            username: data.username,
            isScreenSharing: false
          }];
        }
        return prev;
      });

      // Create peer connection and initiate offer (we are the initiator)
      const peerConnection = createPeerConnection(data.userId, true);
      peerConnectionsRef.current.set(data.userId, {
        userId: data.userId,
        connection: peerConnection,
        isInitiator: true
      });

      // Process any queued ICE candidates
      const queuedCandidates = queuedIceCandidatesRef.current.get(data.userId) || [];
      for (const candidate of queuedCandidates) {
        try {
          await peerConnection.addIceCandidate(candidate);
          addDebugMessage(`Added queued ICE candidate for ${data.userId}`);
        } catch (error) {
          console.error('Error adding queued ICE candidate:', error);
        }
      }
      queuedIceCandidatesRef.current.delete(data.userId);

      // Create and send offer
      await createOffer(data.userId);
    } else {
      addDebugMessage('I joined the room (my own join event)');
      setIsConnected(true);
    }
  };

  const createOffer = async (targetUserId: string) => {
    try {
      const peerConnectionData = peerConnectionsRef.current.get(targetUserId);
      if (!peerConnectionData) {
        console.error(`No peer connection found for ${targetUserId}`);
        return;
      }

      const peerConnection = peerConnectionData.connection;
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log(`Sending offer to ${targetUserId}`);
      addDebugMessage(`Sending offer to ${targetUserId}`);

      const socket = socketService.getSocket();
      socket.emit('webrtc_offer', {
        callId,
        offer,
        targetUserId,
        fromUserId: user?.id
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      addDebugMessage(`Error creating offer: ${error}`);
    }
  };

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit, fromUserId: string }) => {
    try {
      console.log(`Received offer from ${data.fromUserId}`);
      addDebugMessage(`Received offer from ${data.fromUserId}`);

      // Create peer connection for this user (we are not the initiator)
      const peerConnection = createPeerConnection(data.fromUserId, false);
      peerConnectionsRef.current.set(data.fromUserId, {
        userId: data.fromUserId,
        connection: peerConnection,
        isInitiator: false
      });

      await peerConnection.setRemoteDescription(data.offer);

      // Process any queued ICE candidates
      const queuedCandidates = queuedIceCandidatesRef.current.get(data.fromUserId) || [];
      for (const candidate of queuedCandidates) {
        try {
          await peerConnection.addIceCandidate(candidate);
          addDebugMessage(`Added queued ICE candidate for ${data.fromUserId}`);
        } catch (error) {
          console.error('Error adding queued ICE candidate:', error);
        }
      }
      queuedIceCandidatesRef.current.delete(data.fromUserId);

      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`Sending answer to ${data.fromUserId}`);
      addDebugMessage(`Sending answer to ${data.fromUserId}`);

      const socket = socketService.getSocket();
      socket.emit('webrtc_answer', {
        callId,
        answer,
        targetUserId: data.fromUserId,
        fromUserId: user?.id
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      addDebugMessage(`Error handling offer: ${error}`);
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit, fromUserId: string }) => {
    try {
      console.log(`Received answer from ${data.fromUserId}`);
      addDebugMessage(`Received answer from ${data.fromUserId}`);

      const peerConnectionData = peerConnectionsRef.current.get(data.fromUserId);
      if (peerConnectionData) {
        await peerConnectionData.connection.setRemoteDescription(data.answer);
        addDebugMessage(`Set remote description for ${data.fromUserId}`);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      addDebugMessage(`Error handling answer: ${error}`);
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit, fromUserId: string }) => {
    try {
      console.log(`Received ICE candidate from ${data.fromUserId}`);

      const peerConnectionData = peerConnectionsRef.current.get(data.fromUserId);
      if (peerConnectionData && peerConnectionData.connection.remoteDescription) {
        await peerConnectionData.connection.addIceCandidate(data.candidate);
        addDebugMessage(`Added ICE candidate from ${data.fromUserId}`);
      } else {
        // Queue the candidate for later
        const queue = queuedIceCandidatesRef.current.get(data.fromUserId) || [];
        queue.push(data.candidate);
        queuedIceCandidatesRef.current.set(data.fromUserId, queue);
        addDebugMessage(`Queued ICE candidate from ${data.fromUserId}`);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      addDebugMessage(`Error handling ICE candidate: ${error}`);
    }
  };

  const handleUserLeft = (data: { userId: string, username: string }) => {
    console.log('MultiParticipantWebRTCRoom: User left:', data);
    addDebugMessage(`User left: ${data.username}`);

    // Remove from remote users
    setRemoteUsers(prev => prev.filter(u => u.userId !== data.userId));

    // Clean up peer connection
    const peerConnectionData = peerConnectionsRef.current.get(data.userId);
    if (peerConnectionData) {
      peerConnectionData.connection.close();
      peerConnectionsRef.current.delete(data.userId);
    }

    // Clean up video element
    const videoElement = remoteVideoRefs.current.get(data.userId);
    if (videoElement) {
      videoElement.srcObject = null;
      remoteVideoRefs.current.delete(data.userId);
    }

    // Clean up queued candidates
    queuedIceCandidatesRef.current.delete(data.userId);
  };

  const handleScreenShareStatus = (data: { userId: string, isScreenSharing: boolean }) => {
    console.log('MultiParticipantWebRTCRoom: Screen share status update:', data);

    setRemoteUsers(prev => prev.map(user =>
      user.userId === data.userId
        ? { ...user, isScreenSharing: data.isScreenSharing }
        : user
    ));
  };

  const cleanup = () => {
    console.log('MultiParticipantWebRTCRoom: Cleaning up...');
    addDebugMessage('Starting cleanup');

    // Close all peer connections
    peerConnectionsRef.current.forEach(({ connection }) => {
      connection.close();
    });
    peerConnectionsRef.current.clear();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Clear video refs
    remoteVideoRefs.current.clear();

    // Remove socket listeners
    const socket = socketService.getSocket();
    if (socket) {
      socket.off('webrtc_user_joined', handleUserJoined);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_user_left', handleUserLeft);
      socket.off('webrtc_screen_share_status', handleScreenShareStatus);

      // Leave the room
      socket.emit('leave_webrtc_room', {
        callId,
        userId: user?.id
      });
    }

    addDebugMessage('Cleanup completed');
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        addDebugMessage(`Audio ${audioTrack.enabled ? 'enabled' : 'muted'}`);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        addDebugMessage(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      console.log('MultiParticipantWebRTCRoom: Starting screen share');
      addDebugMessage('Starting screen share');

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (!screenVideoTrack) {
        throw new Error('No video track in screen share');
      }

      // Replace video track in all peer connections
      peerConnectionsRef.current.forEach(({ connection }) => {
        const sender = connection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(screenVideoTrack);
        }
      });

      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Handle screen share end
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);

      // Notify other users
      const socket = socketService.getSocket();
      socket.emit('webrtc_screen_share_status', {
        callId,
        userId: user?.id,
        isScreenSharing: true
      });

      addDebugMessage('Screen share started');
    } catch (error) {
      console.error('Error starting screen share:', error);
      addDebugMessage(`Screen share error: ${error}`);
    }
  };

  const stopScreenShare = async () => {
    try {
      console.log('MultiParticipantWebRTCRoom: Stopping screen share');
      addDebugMessage('Stopping screen share');

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];

        // Replace screen share with camera in all peer connections
        peerConnectionsRef.current.forEach(({ connection }) => {
          const sender = connection.getSenders().find(s =>
            s.track && s.track.kind === 'video'
          );
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Restore local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }

      setIsScreenSharing(false);

      // Notify other users
      const socket = socketService.getSocket();
      socket.emit('webrtc_screen_share_status', {
        callId,
        userId: user?.id,
        isScreenSharing: false
      });

      addDebugMessage('Screen share stopped');
    } catch (error) {
      console.error('Error stopping screen share:', error);
      addDebugMessage(`Stop screen share error: ${error}`);
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Initialize everything
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        if (!user) return;

        await setupMedia();

        if (mounted) {
          setupSocketListeners();
          joinRoom();
        }
      } catch (error) {
        console.error('Error initializing WebRTC room:', error);
        addDebugMessage(`Initialization error: ${error}`);
      }
    };

    initialize();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [callId, user]);

  // Create video grid layout
  const getGridLayout = () => {
    const totalParticipants = remoteUsers.length + 1; // +1 for local user

    if (totalParticipants <= 2) return 'grid-2';
    if (totalParticipants <= 4) return 'grid-4';
    if (totalParticipants <= 6) return 'grid-6';
    return 'grid-many';
  };

  return (
    <div className="webrtc-room">
      <div className="room-info">
        <h3>Video Call - Room {callId}</h3>
        <p>Participants: {remoteUsers.length + 1}</p>
        {!isConnected && <p>Connecting...</p>}
      </div>

      <div className={`video-grid ${getGridLayout()}`}>
        {/* Local video */}
        <div className="video-container local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
          <div className="video-label">
            You ({user?.name}) {isScreenSharing && '🖥️ Sharing Screen'}
          </div>
        </div>

        {/* Remote videos */}
        {remoteUsers.map((remoteUser) => (
          <div key={remoteUser.userId} className="video-container remote-video-container">
            <video
              ref={(el) => {
                if (el) {
                  remoteVideoRefs.current.set(remoteUser.userId, el);
                }
              }}
              autoPlay
              playsInline
              className="remote-video"
            />
            <div className="video-label">
              {remoteUser.username}
              {remoteUser.isScreenSharing && ' 🖥️ Sharing Screen'}
            </div>
          </div>
        ))}

        {/* Placeholder for empty slots */}
        {remoteUsers.length === 0 && (
          <div className="video-container placeholder-container">
            <div className="placeholder-content">
              <p>Waiting for other participants...</p>
            </div>
          </div>
        )}
      </div>

      <div className="webrtc-controls">
        <button
          onClick={toggleAudio}
          className={`control-btn audio-btn ${!isAudioEnabled ? 'muted' : ''}`}
        >
          {isAudioEnabled ? '🎤' : '🔇'} Audio
        </button>
        <button
          onClick={toggleVideo}
          className={`control-btn video-btn ${!isVideoEnabled ? 'video-disabled' : ''}`}
        >
          {isVideoEnabled ? '📹' : '📵'} Video
        </button>
        <button onClick={toggleScreenShare} className="control-btn screen-share-btn">
          {isScreenSharing ? '📱 Dejar de Compartir' : '🖥️ Compartir Pantalla'}
        </button>
        <button onClick={onLeave} className="control-btn leave-btn">
          📞 Salir
        </button>
      </div>

      {/* Debug info */}
      {debug.length > 0 && (
        <div className="debug-info">
          <details>
            <summary>Debug Info ({debug.length} messages)</summary>
            <div className="debug-messages">
              {debug.slice(-10).map((msg, idx) => (
                <div key={idx} className="debug-message">{msg}</div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default MultiParticipantWebRTCRoom;