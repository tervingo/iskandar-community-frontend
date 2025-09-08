import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socket';

interface OnlineUser {
  id: string;
  name: string;
  role?: string;
}

const OnlineUsers: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Connect to socket if not already connected
    socketService.connect();

    // Listen for online users updates
    const handleUsersUpdate = (users: OnlineUser[]) => {
      setOnlineUsers(users);
    };

    const socket = socketService.socket;
    if (!socket) return;

    // Handle connection
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

    // Cleanup on unmount
    return () => {
      socket.emit('user_offline', user.id);
      socket.off('connect', handleConnect);
      socket.off('users_online_update', handleUsersUpdate);
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || onlineUsers.length === 0) {
    return null;
  }

  const onlineCount = onlineUsers.length;

  return (
    <div className="online-users">
      <div 
        className="online-indicator"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: 'rgba(46, 160, 67, 0.1)',
          border: '1px solid rgba(46, 160, 67, 0.3)',
          fontSize: '12px',
          color: '#2ea043',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(46, 160, 67, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(46, 160, 67, 0.1)';
        }}
      >
        <div 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#2ea043',
            animation: 'pulse 2s infinite'
          }}
        />
        <span>{onlineCount} online</span>
        <span style={{ fontSize: '10px' }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>

      {isExpanded && (
        <div 
          className="online-users-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
            padding: '8px',
            minWidth: '150px',
            maxWidth: '250px',
            zIndex: 1000
          }}
        >
          <div 
            style={{
              fontSize: '11px',
              color: '#656d76',
              marginBottom: '6px',
              padding: '0 4px'
            }}
          >
            Usuarios conectados
          </div>
          {onlineUsers.map((onlineUser, index) => (
            <div 
              key={onlineUser.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px',
                borderRadius: '3px',
                fontSize: '12px',
                backgroundColor: onlineUser.id === user?.id ? 'rgba(46, 160, 67, 0.08)' : 'transparent'
              }}
            >
              <div 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#2ea043'
                }}
              />
              <span style={{ color: '#24292f' }}>
                {onlineUser.name}
                {onlineUser.id === user?.id && ' (tú)'}
              </span>
              {onlineUser.role === 'admin' && (
                <span 
                  style={{
                    fontSize: '10px',
                    color: '#0969da',
                    backgroundColor: 'rgba(9, 105, 218, 0.1)',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    marginLeft: 'auto'
                  }}
                >
                  Admin
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OnlineUsers;