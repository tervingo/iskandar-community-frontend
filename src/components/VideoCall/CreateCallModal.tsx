import React, { useState } from 'react';
import { FaTimes, FaUsers, FaLock, FaGlobe } from 'react-icons/fa';

interface CreateCallModalProps {
  onClose: () => void;
  onCallCreated: (callId: string) => void;
}

const CreateCallModal: React.FC<CreateCallModalProps> = ({ onClose, onCallCreated }) => {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      alert('Room name is required');
      return;
    }

    if (!isPublic && !password.trim()) {
      alert('Password is required for private rooms');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/video-calls/create-meeting-room`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_name: roomName.trim(),
          description: description.trim(),
          max_participants: maxParticipants,
          is_public: isPublic,
          password: isPublic ? null : password.trim()
        })
      });

      if (response.ok) {
        const roomData = await response.json();
        onCallCreated(roomData.id);
      } else {
        const errorData = await response.json();
        console.error('Meeting room creation failed:', response.status, errorData);
        alert(errorData.detail || `HTTP ${response.status}: Failed to create meeting room`);
      }
    } catch (error) {
      console.error('Error creating meeting room:', error);
      alert(`Failed to create meeting room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-call-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear sala de reunión</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-room-form">
          <div className="form-group">
            <label htmlFor="roomName">Nombre de la sala *</label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the meeting (optional)"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxParticipants">
              <FaUsers /> Máximo de participantes
            </label>
            <select
              id="maxParticipants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
            >
              <option value={2}>2 participantes</option>
              <option value={5}>5 participantes</option>
              <option value={10}>10 participantes</option>
              <option value={20}>20 participantes</option>
              <option value={50}>50 participantes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Room Visibility</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                />
                <FaGlobe />
                <span>Público - Cualquiera puede unirse</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                />
                <FaLock />
                <span>Privado - Contraseña requerida</span>
              </label>
            </div>
          </div>

          {!isPublic && (
            <div className="form-group">
              <label htmlFor="password">Contraseña de la sala *</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                required
              />
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Sala de Reunión'}
            </button>
          </div>
        </form>

        <div className="room-preview">
          <h4>Vista previa de la sala</h4>
          <div className="preview-card">
            <h5>{roomName || 'Nombre de la sala'}</h5>
            {description && <p>{description}</p>}
            <div className="preview-meta">
              <span><FaUsers /> Max: {maxParticipants}</span>
              <span>{isPublic ? <FaGlobe /> : <FaLock />} {isPublic ? 'Público' : 'Privado'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCallModal;