import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socket';

interface SimpleWebRTCRoomProps {
  callId: string;
  onLeave: () => void;
}

const SimpleWebRTCRoom: React.FC<SimpleWebRTCRoomProps> = ({ callId, onLeave }) => {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [iceState, setIceState] = useState<string>('new');
  const [debug, setDebug] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isCallerRef = useRef<boolean>(false);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    // Ensure socket is connected before initializing WebRTC
    if (!socketService.isConnected()) {
      addDebugMessage('Socket not connected, connecting...');
      socketService.connect();
    }

    // Small delay to ensure socket connection is established
    const initTimer = setTimeout(() => {
      setupSocketListeners();
      initializeWebRTC();
    }, 500);

    return () => {
      clearTimeout(initTimer);
      cleanup();
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      console.log('SimpleWebRTCRoom: Initializing WebRTC for call:', callId);
      addDebugMessage(`Initializing WebRTC for call: ${callId}`);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addDebugMessage('Local video stream attached');
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('SimpleWebRTCRoom: Received remote stream:', event.streams.length, 'streams');
        addDebugMessage(`Received remote stream with ${event.streams.length} streams`);
        const [stream] = event.streams;
        if (remoteVideoRef.current && stream) {
          remoteVideoRef.current.srcObject = stream;
          addDebugMessage('Remote video stream attached');
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('SimpleWebRTCRoom: Sending ICE candidate:', event.candidate.type);
          addDebugMessage(`Sending ICE candidate: ${event.candidate.type}`);
          const socket = socketService.getSocket();
          if (socket) {
            socket.emit('webrtc_ice_candidate', {
              callId,
              candidate: event.candidate,
              userId: user?.id
            });
          }
        } else {
          console.log('SimpleWebRTCRoom: ICE gathering completed');
          addDebugMessage('ICE gathering completed');
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('SimpleWebRTCRoom: Connection state:', state);
        setConnectionState(state);
        setIsConnected(state === 'connected');
        addDebugMessage(`Connection state: ${state}`);

        if (state === 'connected' && connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
          addDebugMessage('Connection established, timeout cleared');
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log('SimpleWebRTCRoom: ICE connection state:', state);
        setIceState(state);
        addDebugMessage(`ICE state: ${state}`);
      };

      // Handle ICE gathering state changes
      peerConnection.onicegatheringstatechange = () => {
        console.log('SimpleWebRTCRoom: ICE gathering state:', peerConnection.iceGatheringState);
        addDebugMessage(`ICE gathering: ${peerConnection.iceGatheringState}`);
      };

      // Join the call room
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('join_webrtc_call', {
          callId,
          userId: user?.id,
          username: user?.name
        });
      }

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isConnected) {
          addDebugMessage('Connection timeout - no response from remote peer');
          console.warn('SimpleWebRTCRoom: Connection timeout');
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to initialize WebRTC:', error);
      addDebugMessage(`Failed to initialize WebRTC: ${error}`);
    }
  };

  const setupSocketListeners = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('webrtc_user_joined', handleUserJoined);
      socket.on('webrtc_offer', handleOffer);
      socket.on('webrtc_answer', handleAnswer);
      socket.on('webrtc_ice_candidate', handleIceCandidate);
      socket.on('webrtc_user_left', handleUserLeft);
    }
  };

  const handleUserJoined = async (data: { userId: string, username: string }) => {
    console.log('SimpleWebRTCRoom: User joined:', data);
    addDebugMessage(`User joined: ${data.username} (${data.userId})`);
    setRemoteUser(data.username);

    // If this is the caller (first user already in room), create and send offer
    if (data.userId !== user?.id && peerConnectionRef.current) {
      isCallerRef.current = true;
      addDebugMessage('I am the caller, creating offer...');
      await createOffer();
    } else if (data.userId === user?.id) {
      addDebugMessage('I joined the room');
    }
  };

  const createOffer = async () => {
    try {
      const peerConnection = peerConnectionRef.current!;
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log('SimpleWebRTCRoom: Sending offer');
      addDebugMessage('Sending offer to remote peer');
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('webrtc_offer', {
          callId,
          offer,
          userId: user?.id
        });
      }
    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to create offer:', error);
      addDebugMessage(`Failed to create offer: ${error}`);
    }
  };

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit, userId: string }) => {
    try {
      console.log('SimpleWebRTCRoom: Received offer from:', data.userId);
      addDebugMessage(`Received offer from: ${data.userId}`);
      const peerConnection = peerConnectionRef.current!;

      await peerConnection.setRemoteDescription(data.offer);
      addDebugMessage('Set remote description from offer');
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      addDebugMessage('Created and set local description (answer)');

      console.log('SimpleWebRTCRoom: Sending answer');
      addDebugMessage('Sending answer to caller');
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('webrtc_answer', {
          callId,
          answer,
          userId: user?.id
        });
      }
    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to handle offer:', error);
      addDebugMessage(`Failed to handle offer: ${error}`);
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit, userId: string }) => {
    try {
      console.log('SimpleWebRTCRoom: Received answer from:', data.userId);
      addDebugMessage(`Received answer from: ${data.userId}`);
      const peerConnection = peerConnectionRef.current!;
      await peerConnection.setRemoteDescription(data.answer);
      addDebugMessage('Set remote description from answer');
    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to handle answer:', error);
      addDebugMessage(`Failed to handle answer: ${error}`);
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit, userId: string }) => {
    try {
      console.log('SimpleWebRTCRoom: Received ICE candidate from:', data.userId);
      addDebugMessage(`Received ICE candidate from: ${data.userId}`);
      const peerConnection = peerConnectionRef.current!;

      if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(data.candidate);
        addDebugMessage('Added ICE candidate');
      } else {
        console.warn('SimpleWebRTCRoom: Remote description not set, queuing ICE candidate');
        addDebugMessage('Remote description not set, cannot add ICE candidate yet');
      }
    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to add ICE candidate:', error);
      addDebugMessage(`Failed to add ICE candidate: ${error}`);
    }
  };

  const handleUserLeft = (data: { userId: string, username: string }) => {
    console.log('SimpleWebRTCRoom: User left:', data);
    setRemoteUser(null);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const cleanup = () => {
    console.log('SimpleWebRTCRoom: Cleaning up');

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Clear timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Leave the call
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('leave_webrtc_call', {
        callId,
        userId: user?.id
      });

      // Remove socket listeners
      socket.off('webrtc_user_joined', handleUserJoined);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_user_left', handleUserLeft);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  return (
    <div className="webrtc-room">
      <div className="webrtc-header">
        <h2>Video Call - {callId}</h2>
        <div className="connection-status">
          Status: {isConnected ? 'Connected' : 'Connecting...'} | Connection: {connectionState} | ICE: {iceState}
          {remoteUser && <span> | With: {remoteUser}</span>}
        </div>
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
      </div>

      <div className="webrtc-videos">
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
          <div className="video-label">You ({user?.name})</div>
        </div>

        <div className="remote-video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          <div className="video-label">
            {remoteUser || 'Waiting for participant...'}
          </div>
        </div>
      </div>

      <div className="webrtc-controls">
        <button onClick={toggleAudio} className="control-btn audio-btn">
          🎤 Audio
        </button>
        <button onClick={toggleVideo} className="control-btn video-btn">
          📹 Video
        </button>
        <button onClick={onLeave} className="control-btn leave-btn">
          📞 Leave Call
        </button>
      </div>
    </div>
  );
};

export default SimpleWebRTCRoom;