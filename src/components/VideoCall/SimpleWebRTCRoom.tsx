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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeWebRTC();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      console.log('SimpleWebRTCRoom: Initializing WebRTC for call:', callId);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
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
        console.log('SimpleWebRTCRoom: Received remote stream');
        const [stream] = event.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('SimpleWebRTCRoom: Sending ICE candidate');
          const socket = socketService.getSocket();
          if (socket) {
            socket.emit('webrtc_ice_candidate', {
              callId,
              candidate: event.candidate,
              userId: user?.id
            });
          }
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('SimpleWebRTCRoom: Connection state:', peerConnection.connectionState);
        setIsConnected(peerConnection.connectionState === 'connected');
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

    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to initialize WebRTC:', error);
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
    setRemoteUser(data.username);

    // If this is the caller, create and send offer
    if (data.userId !== user?.id && peerConnectionRef.current) {
      await createOffer();
    }
  };

  const createOffer = async () => {
    try {
      const peerConnection = peerConnectionRef.current!;
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log('SimpleWebRTCRoom: Sending offer');
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
    }
  };

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit, userId: string }) => {
    try {
      console.log('SimpleWebRTCRoom: Received offer from:', data.userId);
      const peerConnection = peerConnectionRef.current!;

      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log('SimpleWebRTCRoom: Sending answer');
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
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit, userId: string }) => {
    try {
      console.log('SimpleWebRTCRoom: Received answer from:', data.userId);
      const peerConnection = peerConnectionRef.current!;
      await peerConnection.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to handle answer:', error);
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit, userId: string }) => {
    try {
      console.log('SimpleWebRTCRoom: Received ICE candidate from:', data.userId);
      const peerConnection = peerConnectionRef.current!;
      await peerConnection.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('SimpleWebRTCRoom: Failed to add ICE candidate:', error);
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
          Status: {isConnected ? 'Connected' : 'Connecting...'}
          {remoteUser && <span> | With: {remoteUser}</span>}
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