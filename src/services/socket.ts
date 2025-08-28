import { io, Socket } from 'socket.io-client';
import { ChatMessageCreate } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to chat server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: ChatMessageCreate): void {
    if (this.socket) {
      this.socket.emit('send_message', message);
    }
  }

  onReceiveMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  offReceiveMessage(callback?: (message: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off('receive_message', callback);
      } else {
        this.socket.off('receive_message');
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();