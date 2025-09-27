import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export const useSocket = (): Socket | null => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(socket);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user && !socket) {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Connected to server');
        // Let server know user is online
        socket?.emit('user_online', {
          id: user.id,
          name: user.name,
          role: user.role
        });
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocketInstance(socket);
    }

    return () => {
      if (!isAuthenticated && socket) {
        socket.disconnect();
        socket = null;
        setSocketInstance(null);
      }
    };
  }, [isAuthenticated, user]);

  return socketInstance;
};

// Hook specifically for video call invitations
export const useVideoCallInvitations = () => {
  const socket = useSocket();
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (socket) {
      socket.on('video_call_invitation', (invitation) => {
        console.log('useSocket: Received video_call_invitation:', invitation);
        setIncomingCall(invitation);
      });

      return () => {
        socket.off('video_call_invitation');
      };
    }
  }, [socket]);

  const respondToCall = (callId: string, response: 'accepted' | 'declined', responderName: string) => {
    if (socket && incomingCall) {
      socket.emit('video_call_response', {
        caller_id: incomingCall.caller_id,
        call_id: callId,
        response,
        responder_name: responderName
      });
      setIncomingCall(null);
    }
  };

  const dismissCall = () => {
    setIncomingCall(null);
  };

  return {
    incomingCall,
    respondToCall,
    dismissCall
  };
};