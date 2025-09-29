import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaVideo, FaUsers, FaHistory, FaPlus } from 'react-icons/fa';
import VideoCallRoom from './VideoCallRoom';
import MeetingRoomList from './MeetingRoomList';
import CallHistory from './CallHistory';
import CreateCallModal from './CreateCallModal';
import OnlineUsersList from './OnlineUsersList';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const VideoCallsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('direct-calls');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCall, setActiveCall] = useState<string | null>(null);

  // If user is in an active call, show the call room
  if (activeCall) {
    return (
      <VideoCallRoom
        callId={activeCall}
        onLeave={() => setActiveCall(null)}
      />
    );
  }

  const tabs: TabType[] = [
    {
      id: 'direct-calls',
      label: 'Videollamadas 1:1',
      icon: <FaVideo />,
      component: (
        <OnlineUsersList
          onStartCall={(callId: string) => {
            console.log('VideoCallsPage: Starting call with callId:', callId);
            navigate(`/video-call/${callId}`);
          }}
        />
      )
    },
    {
      id: 'meeting-rooms',
      label: 'Salas deReuniones',
      icon: <FaUsers />,
      component: (
        <MeetingRoomList
          onJoinRoom={(callId: string) => setActiveCall(callId)}
        />
      )
    },
    {
      id: 'call-history',
      label: 'Historial de videollamadas',
      icon: <FaHistory />,
      component: <CallHistory />
    }
  ];

  return (
    <div className="video-calls-page">
      <div className="page-header">
        <h1>📹 Videollamadas</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus /> Crear Sala de Reunión
        </button>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>

      {showCreateModal && (
        <CreateCallModal
          onClose={() => setShowCreateModal(false)}
          onCallCreated={(callId: string) => {
            setActiveCall(callId);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default VideoCallsPage;