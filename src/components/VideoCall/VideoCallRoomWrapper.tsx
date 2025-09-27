import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoCallRoom from './VideoCallRoom';

const VideoCallRoomWrapper: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();

  console.log('VideoCallRoomWrapper: callId from route params:', callId);

  if (!callId) {
    navigate('/video-calls');
    return null;
  }

  const handleLeave = () => {
    navigate('/video-calls');
  };

  return <VideoCallRoom callId={callId} onLeave={handleLeave} />;
};

export default VideoCallRoomWrapper;