import React, { useState, useEffect } from 'react';
import { FaClock, FaVideo, FaUsers, FaCalendarAlt } from 'react-icons/fa';

interface CallHistoryItem {
  id: string;
  call_type: 'private' | 'meeting';
  creator_name: string;
  room_name?: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  participant_count: number;
}

const CallHistory: React.FC = () => {
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'private' | 'meeting'>('all');

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/video-calls/call-history?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setCallHistory(history);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const filteredHistory = callHistory.filter(call => {
    if (filter === 'all') return true;
    return call.call_type === filter;
  });

  const getCallTypeIcon = (callType: string) => {
    return callType === 'private' ? <FaVideo /> : <FaUsers />;
  };

  const getCallTypeColor = (callType: string) => {
    return callType === 'private' ? '#4CAF50' : '#2196F3';
  };

  if (loading) {
    return <div className="loading">Loading call history...</div>;
  }

  return (
    <div className="call-history">
      <div className="history-header">
        <h3>Call History</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Calls
          </button>
          <button
            className={`filter-btn ${filter === 'private' ? 'active' : ''}`}
            onClick={() => setFilter('private')}
          >
            <FaVideo /> 1:1 Calls
          </button>
          <button
            className={`filter-btn ${filter === 'meeting' ? 'active' : ''}`}
            onClick={() => setFilter('meeting')}
          >
            <FaUsers /> Meetings
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <FaClock size={48} />
          <h3>No Call History</h3>
          <p>Your completed video calls will appear here</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((call) => (
            <div key={call.id} className="history-item">
              <div className="call-icon" style={{ color: getCallTypeColor(call.call_type) }}>
                {getCallTypeIcon(call.call_type)}
              </div>

              <div className="call-details">
                <h4 className="call-title">
                  {call.call_type === 'meeting' && call.room_name
                    ? call.room_name
                    : call.call_type === 'private'
                    ? `1:1 Call with ${call.creator_name}`
                    : `Meeting by ${call.creator_name}`
                  }
                </h4>

                <div className="call-meta">
                  <span className="meta-item">
                    <FaCalendarAlt />
                    {formatDateTime(call.started_at)}
                  </span>

                  {call.duration && (
                    <span className="meta-item">
                      <FaClock />
                      {formatDuration(call.duration)}
                    </span>
                  )}

                  <span className="meta-item">
                    <FaUsers />
                    {call.participant_count} participant{call.participant_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="call-status">
                  <span className="status-badge completed">Completed</span>
                </div>
              </div>

              <div className="call-actions">
                {/* Future: Add options to view call details, export, etc. */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {callHistory.length > 0 && (
        <div className="history-stats">
          <h4>📊 Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{callHistory.length}</span>
              <span className="stat-label">Total Calls</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {callHistory.filter(c => c.call_type === 'private').length}
              </span>
              <span className="stat-label">1:1 Calls</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {callHistory.filter(c => c.call_type === 'meeting').length}
              </span>
              <span className="stat-label">Meetings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {Math.round(
                  callHistory
                    .filter(c => c.duration)
                    .reduce((total, c) => total + (c.duration || 0), 0) / 60
                )}m
              </span>
              <span className="stat-label">Total Time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;