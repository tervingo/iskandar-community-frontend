import React, { useState, useEffect } from 'react';
import { FaUsers, FaClock, FaLock, FaGlobe, FaPlay } from 'react-icons/fa';

interface MeetingRoom {
  id: string;
  channel_name: string;
  creator_name: string;
  room_name?: string;
  description?: string;
  created_at: string;
  participants: any[];
  max_participants: number;
  is_public: boolean;
  status: string;
}

interface MeetingRoomListProps {
  onJoinRoom: (callId: string) => void;
}

const MeetingRoomList: React.FC<MeetingRoomListProps> = ({ onJoinRoom }) => {
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinPassword, setJoinPassword] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchMeetingRooms();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMeetingRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetingRooms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/video-calls/meeting-rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const rooms = await response.json();
        setMeetingRooms(rooms);
      }
    } catch (error) {
      console.error('Error fetching meeting rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinMeetingRoom = async (room: MeetingRoom) => {
    try {
      // If room has password and it's not provided, prompt for it
      if (!room.is_public && !joinPassword[room.id]) {
        const password = prompt('Esta sala de reunión está protegida por contraseña. Introduce la contraseña:');
        if (!password) return;
        setJoinPassword(prev => ({ ...prev, [room.id]: password }));
      }

      // Join the room
      const response = await fetch(`${import.meta.env.VITE_API_URL}/video-calls/join-call/${room.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: joinPassword[room.id]
        })
      });

      if (response.ok) {
        onJoinRoom(room.id);
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al unirse a la sala de reunión');
      }
    } catch (error) {
      console.error('Error joining meeting room:', error);
      alert('Error al unirse a la sala de reunión');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'waiting': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return <div className="loading">Cargando salas de reunión...</div>;
  }

  return (
    <div className="meeting-room-list">
      <div className="section-header">
        <h3>Salas de Reunión Activas</h3>
        <button className="btn btn-secondary" onClick={fetchMeetingRooms}>
          🔄 Actualizar
        </button>
      </div>

      {meetingRooms.length === 0 ? (
        <div className="empty-state">
          <FaUsers size={48} />
          <h3>No hay salas de reunión activas</h3>
          <p>Crea una nueva sala de reunión para empezar!</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {meetingRooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-header">
                <h4 className="room-title">
                  {room.room_name || `${room.creator_name}'s Sala de Reunión`}
                </h4>
                <div className="room-status">
                  <span
                    className={`status-badge ${room.status}`}
                    style={{ backgroundColor: getRoomStatusColor(room.status) }}
                  >
                    {room.status}
                  </span>
                </div>
              </div>

              {room.description && (
                <p className="room-description">{room.description}</p>
              )}

              <div className="room-meta">
                <div className="meta-item">
                  <FaUsers />
                  <span>{room.participants.length}/{room.max_participants}</span>
                </div>
                <div className="meta-item">
                  <FaClock />
                  <span>{formatDateTime(room.created_at)}</span>
                </div>
                <div className="meta-item">
                  {room.is_public ? <FaGlobe title="Sala de reunión pública" /> : <FaLock title="Sala de reunión privada" />}
                  <span>{room.is_public ? 'Público' : 'Privado'}</span>
                </div>
              </div>

              <div className="room-creator">
                <span>Creada por: <strong>{room.creator_name}</strong></span>
              </div>

              <div className="room-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => joinMeetingRoom(room)}
                  disabled={room.participants.length >= room.max_participants}
                >
                  <FaPlay />
                  {room.participants.length >= room.max_participants ? 'Sala llena' : 'Unirse a la sala'}
                </button>
              </div>

              {room.participants.length > 0 && (
                <div className="participants-preview">
                  <h5>Participantes actuales:</h5>
                  <div className="participants-list">
                    {room.participants.slice(0, 5).map((participant, index) => (
                      <span key={index} className="participant-badge">
                        {participant.username}
                      </span>
                    ))}
                    {room.participants.length > 5 && (
                      <span className="participant-badge">
                        +{room.participants.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MeetingRoomList;