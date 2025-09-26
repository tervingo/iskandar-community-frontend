import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';
import { User } from '../../types';
import { FaVideo, FaCircle } from 'react-icons/fa';

interface OnlineUsersListProps {
  onStartCall: (userId: string) => void;
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({ onStartCall }) => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const socket = useSocket();

  const fetchOnlineUsers = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await authApi.getOnlineUsers();
      // Filter out current user
      const filteredUsers = response.online_users.filter(u => u.id !== user?.id);
      setOnlineUsers(filteredUsers);
    } catch (error) {
      console.warn('Failed to fetch online users for video calls:', error);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial fetch
    fetchOnlineUsers();

    // Poll every 15 seconds for online users (more frequent than header for better UX)
    const interval = setInterval(fetchOnlineUsers, 15000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, user, fetchOnlineUsers]);

  const startVideoCall = async (targetUserId: string) => {
    if (!user || !socket) return;

    setLoading(true);

    try {
      // Create video call
      const response = await fetch(`${import.meta.env.VITE_API_URL}/video-calls/create-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          call_type: 'private',
          invited_users: [targetUserId],
          max_participants: 2
        })
      });

      if (response.ok) {
        const callData = await response.json();

        // Send invitation via socket
        socket.emit('send_video_call_invitation', {
          caller_id: user.id,
          caller_name: user.name,
          callee_id: targetUserId,
          call_id: callData.id,
          channel_name: callData.channel_name,
          call_type: 'private'
        });

        // Set up response listener
        const handleResponse = (data: any) => {
          if (data.call_id === callData.id) {
            if (data.response === 'accepted') {
              onStartCall(callData.id);
            } else {
              alert(`${data.responder_name} declined the call`);
            }
            socket.off('video_call_response', handleResponse);
            setLoading(false);
          }
        };

        socket.on('video_call_response', handleResponse);

        // Timeout after 30 seconds
        setTimeout(() => {
          socket.off('video_call_response', handleResponse);
          setLoading(false);
          alert('Call timeout - no response from user');
        }, 30000);

      } else {
        throw new Error('Failed to create call');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      setLoading(false);
      alert('Failed to start video call');
    }
  };

  return (
    <div className="online-users-list">
      <div className="section-header">
        <h3>Online Users</h3>
        <button
          className="btn btn-secondary"
          onClick={fetchOnlineUsers}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {onlineUsers.length === 0 ? (
        <div className="empty-state">
          <p>No other users are currently online</p>
        </div>
      ) : (
        <div className="users-grid">
          {onlineUsers.map((onlineUser) => (
            <div key={onlineUser.id} className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {onlineUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <h4>{onlineUser.name}</h4>
                  <div className="user-status">
                    <FaCircle className="online-indicator" />
                    <span>Online</span>
                  </div>
                </div>
              </div>

              <button
                className="call-btn"
                onClick={() => startVideoCall(onlineUser.id)}
                disabled={loading}
                title={`Start video call with ${onlineUser.name}`}
              >
                <FaVideo />
                {loading ? 'Calling...' : 'Call'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="call-tips">
        <h4>💡 Tips for Video Calls</h4>
        <ul>
          <li>Ensure you have a stable internet connection</li>
          <li>Use headphones to prevent audio feedback</li>
          <li>Make sure your camera and microphone are working</li>
          <li>Find a quiet, well-lit environment</li>
        </ul>
      </div>
    </div>
  );
};

export default OnlineUsersList;