import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

const ChatRoom: React.FC = () => {
  const { messages, loading, error, fetchMessages, sendMessage, connectSocket, disconnectSocket, connected } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    fetchMessages();
    connectSocket();
    
    return () => {
      disconnectSocket();
    };
  }, [fetchMessages, connectSocket, disconnectSocket]);

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
      <div className="header">
        <h1>Community Chat</h1>
        <div className="connection-status">
          {connected ? (
            <span className="status connected">🟢 Connected</span>
          ) : (
            <span className="status disconnected">🔴 Disconnected</span>
          )}
        </div>
      </div>

      {isAuthenticated && user && (
        <>
          <div className="messages">
            {loading && <div className="loading">Loading messages...</div>}
            {error && <div className="error">Error: {error}</div>}
            
            <div style={{padding: '10px', background: '#f0f0f0', marginBottom: '10px', fontSize: '12px'}}>
              Chatting as: "{user.username}" {user.role === 'admin' && '(Admin)'}
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
              placeholder="Type your message..."
              required
            />
            <button 
              type="submit" 
              disabled={!messageInput.trim()}
              className="btn btn-primary"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatRoom;