import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';
import { User } from '../../types';

const OnlineUsers: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchOnlineUsers = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await authApi.getOnlineUsers();
      setOnlineUsers(response.online_users);
    } catch (error) {
      console.warn('Failed to fetch online users:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial fetch
    fetchOnlineUsers();

    // Poll every 30 seconds for online users
    const interval = setInterval(fetchOnlineUsers, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, user, fetchOnlineUsers]);

  if (!isAuthenticated || onlineUsers.length === 0) {
    return null;
  }

  const onlineCount = onlineUsers.length;

  return (
    <div className="online-users">
      <div
        className="online-indicator"
        onClick={() => {
          setIsExpanded(!isExpanded);
          // Refresh online users when opening dropdown
          if (!isExpanded) {
            fetchOnlineUsers();
          }
        }}
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
            opacity: '0.8'
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
          {onlineUsers.map((onlineUser) => (
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
    </div>
  );
};

export default OnlineUsers;