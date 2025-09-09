import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socket';

interface OnlineUser {
  id: string;
  name: string;
  role?: string;
}

const ChatRoom: React.FC = () => {
  const { messages, loading, error, fetchMessages, sendMessage, connectSocket, disconnectSocket, connected } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    fetchMessages();
    connectSocket();
    
    // Set up online users tracking
    if (isAuthenticated && user) {
      const socket = socketService.getSocket();
      if (socket) {
        // Handle users online updates
        const handleUsersUpdate = (users: OnlineUser[]) => {
          setOnlineUsers(users);
        };

        // Handle connection and register user
        const handleConnect = () => {
          socket.emit('user_online', {
            id: user.id,
            name: user.name,
            role: user.role
          });
        };

        // Check if already connected
        if (socket.connected) {
          handleConnect();
        } else {
          socket.on('connect', handleConnect);
        }

        // Listen for updates
        socket.on('users_online_update', handleUsersUpdate);

        // Cleanup
        return () => {
          socket.emit('user_offline', user.id);
          socket.off('connect', handleConnect);
          socket.off('users_online_update', handleUsersUpdate);
          disconnectSocket();
        };
      }
    }
    
    return () => {
      disconnectSocket();
    };
  }, [fetchMessages, connectSocket, disconnectSocket, isAuthenticated, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !user?.name) {
      return;
    }

    await sendMessage({
      username: user.name,
      message: messageInput,
      message_type: 'text',
    });

    setMessageInput('');
  };

  return (
    <div className="chat-room">
      <div className="header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        padding: '15px 20px',
        minHeight: '60px'
      }}>
        <h1 style={{ margin: 0, whiteSpace: 'nowrap' }}>Community Chat</h1>
        
        {/* Online Users Display */}
        {onlineUsers.length > 0 && (
          <div className="online-users-ribbon" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            justifyContent: 'center',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            <span style={{ fontWeight: '600' }}>Conectados:</span>
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
              flexWrap: 'wrap',
              alignItems: 'center' 
            }}>
              {onlineUsers.map((onlineUser) => (
                <span
                  key={onlineUser.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: onlineUser.id === user?.id ? '600' : '500',
                    border: onlineUser.id === user?.id ? '1px solid rgba(255, 255, 255, 0.4)' : 'none'
                  }}
                >
                  {onlineUser.name}
                  {/* {onlineUser.role === 'admin' && ' ⭐'} */}
                  {onlineUser.id === user?.id && ' (tú)'}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="connection-status">
          {connected ? (
            <span className="status connected">🟢 Conectado</span>
          ) : (
            <span className="status disconnected">🔴 Desconectado</span>
          )}
        </div>
      </div>

      {isAuthenticated && user && (
        <>
          <div className="messages">
            {loading && <div className="loading">Cargando mensajes...</div>}
            {error && <div className="error">Error: {error}</div>}
            
            <div style={{padding: '10px', background: '#f0f0f0', marginBottom: '10px', fontSize: '12px'}}>
             Escribiendo como: "{user.name}" {user.role === 'admin' && '(Admin)'}
            </div>
            
            {messages.map((message, index) => (
              <div 
                key={message.id || `message-${index}`}
                className={`message ${message.username === user.name ? 'own' : 'other'}`}
              >
                <div className="message-header">
                  <strong>{message.username}</strong>
                  <span className="timestamp">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{message.message}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              required
            />
            <button 
              type="submit" 
              disabled={!messageInput.trim()}
              className="btn btn-primary"
            >
              Enviar
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatRoom;