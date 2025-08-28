import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';

const ChatRoom: React.FC = () => {
  const { messages, loading, error, fetchMessages, sendMessage, connectSocket, disconnectSocket, connected } = useChatStore();
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetchMessages();
    connectSocket();
    
    return () => {
      disconnectSocket();
    };
  }, [fetchMessages, connectSocket, disconnectSocket]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !username.trim()) {
      return;
    }

    await sendMessage({
      username,
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

      {!username && (
        <div className="username-form">
          <h3>Enter your name to join the chat</h3>
          <form onSubmit={(e) => { e.preventDefault(); }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              required
            />
            <button 
              type="button" 
              onClick={() => {}}
              disabled={!username.trim()}
              className="btn btn-primary"
            >
              Join Chat
            </button>
          </form>
        </div>
      )}

      {username && (
        <>
          <div className="messages">
            {loading && <div className="loading">Loading messages...</div>}
            {error && <div className="error">Error: {error}</div>}
            
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.username === username ? 'own' : 'other'}`}
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