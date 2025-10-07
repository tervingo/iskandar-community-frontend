import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaComment, FaClock, FaCheck, FaTimes as FaNo, FaQuestion } from 'react-icons/fa';
import { useAuthStore } from '../../stores/authStore';

interface DoodleOption {
  option_id: string;
  datetime: string;
  label: string;
}

interface UserResponse {
  user_id: string;
  username: string;
  responses: Record<string, string>;
  comment?: string;
  responded_at: string;
}

interface DoodleSettings {
  is_public: boolean;
  deadline?: string;
  max_participants?: number;
  allow_comments: boolean;
  allow_maybe: boolean;
}

interface DoodleDetails {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_name: string;
  options: DoodleOption[];
  responses: UserResponse[];
  settings: DoodleSettings;
  status: string;
  final_option?: string;
  created_at: string;
  closed_at?: string;
  total_responses: number;
  option_stats: Record<string, Record<string, number>>;
}

interface DoodleDetailsModalProps {
  doodleId: string;
  onClose: () => void;
  onDoodleUpdated: () => void;
}

const DoodleDetailsModal: React.FC<DoodleDetailsModalProps> = ({ doodleId, onClose, onDoodleUpdated }) => {
  const { token, user } = useAuthStore();
  const [doodle, setDoodle] = useState<DoodleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCloseDoodle, setShowCloseDoodle] = useState(false);
  const [selectedFinalOption, setSelectedFinalOption] = useState('');

  useEffect(() => {
    fetchDoodleDetails();
  }, [doodleId]);

  const fetchDoodleDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/calendar/doodles/${doodleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar el doodle');
      }

      const doodleData = await response.json();
      setDoodle(doodleData);

      // Load user's existing responses if any
      const existingResponse = doodleData.responses.find((r: UserResponse) => r.user_id === user?.id);
      if (existingResponse) {
        setUserResponses(existingResponse.responses);
        setComment(existingResponse.comment || '');
      }

    } catch (err) {
      console.error('Error fetching doodle:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (optionId: string, response: string) => {
    setUserResponses(prev => ({
      ...prev,
      [optionId]: response
    }));
  };

  const submitResponses = async () => {
    if (!doodle || Object.keys(userResponses).length === 0) {
      alert('Por favor, responde a al menos una opción');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/calendar/doodles/${doodleId}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: userResponses,
          comment: comment.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar respuestas');
      }

      const updatedDoodle = await response.json();
      setDoodle(updatedDoodle);
      alert('¡Respuestas guardadas exitosamente!');
      onDoodleUpdated();

    } catch (err) {
      console.error('Error submitting responses:', err);
      alert(err instanceof Error ? err.message : 'Error al enviar respuestas');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDoodle = async () => {
    if (!selectedFinalOption) {
      alert('Por favor, selecciona una opción ganadora');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/calendar/doodles/${doodleId}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          final_option: selectedFinalOption
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cerrar el doodle');
      }

      alert('¡Doodle cerrado exitosamente!');
      setShowCloseDoodle(false);
      onDoodleUpdated();
      onClose();

    } catch (err) {
      console.error('Error closing doodle:', err);
      alert(err instanceof Error ? err.message : 'Error al cerrar el doodle');
    }
  };

  const getResponseIcon = (response: string) => {
    switch (response) {
      case 'yes': return <FaCheck className="response-icon yes" />;
      case 'no': return <FaNo className="response-icon no" />;
      case 'maybe': return <FaQuestion className="response-icon maybe" />;
      default: return <span className="response-icon empty">-</span>;
    }
  };

  const getResponseClass = (response: string) => {
    switch (response) {
      case 'yes': return 'response-yes';
      case 'no': return 'response-no';
      case 'maybe': return 'response-maybe';
      default: return 'response-empty';
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content loading">
          <div className="loading-spinner"></div>
          <p>Cargando doodle...</p>
        </div>
      </div>
    );
  }

  if (error || !doodle) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content error" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Error</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <p>{error || 'Doodle no encontrado'}</p>
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  const isCreator = user?.id === doodle.creator_id;
  const canRespond = doodle.status === 'active' && (!doodle.settings.deadline || new Date() < new Date(doodle.settings.deadline));
  const userHasResponded = doodle.responses.some(r => r.user_id === user?.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content doodle-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{doodle.title}</h2>
            <span className={`status-badge ${doodle.status}`}>
              {doodle.status === 'active' ? 'Activo' : doodle.status === 'closed' ? 'Finalizado' : 'Expirado'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="doodle-details">
          {doodle.description && (
            <div className="description">
              <p>{doodle.description}</p>
            </div>
          )}

          <div className="doodle-info">
            <div className="info-item">
              <FaUser />
              <span>Creado por: <strong>{doodle.creator_name}</strong></span>
            </div>
            <div className="info-item">
              <FaClock />
              <span>Creado: {new Date(doodle.created_at).toLocaleDateString('es-ES')}</span>
            </div>
            {doodle.settings.deadline && (
              <div className="info-item">
                <FaClock />
                <span>Fecha límite: {new Date(doodle.settings.deadline).toLocaleDateString('es-ES')}</span>
              </div>
            )}
            <div className="info-item">
              <span>{doodle.total_responses} respuesta{doodle.total_responses !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="results-section">
            <h3>Resultados</h3>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Opción</th>
                    {doodle.responses.map(response => (
                      <th key={response.user_id} className="participant-header">
                        {response.username}
                      </th>
                    ))}
                    {canRespond && <th className="participant-header">Tú</th>}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {doodle.options.map(option => (
                    <tr key={option.option_id}>
                      <td className="option-label">
                        {option.label}
                        {doodle.final_option === option.option_id && (
                          <span className="winner-badge">🏆 Ganadora</span>
                        )}
                      </td>
                      {doodle.responses.map(response => (
                        <td key={response.user_id} className={`response-cell ${getResponseClass(response.responses[option.option_id] || '')}`}>
                          {getResponseIcon(response.responses[option.option_id] || '')}
                        </td>
                      ))}
                      {canRespond && (
                        <td className="response-cell your-response">
                          <div className="response-buttons">
                            <button
                              className={`response-btn ${userResponses[option.option_id] === 'yes' ? 'active yes' : ''}`}
                              onClick={() => handleResponseChange(option.option_id, 'yes')}
                              title="Disponible"
                            >
                              <FaCheck />
                            </button>
                            <button
                              className={`response-btn ${userResponses[option.option_id] === 'no' ? 'active no' : ''}`}
                              onClick={() => handleResponseChange(option.option_id, 'no')}
                              title="No disponible"
                            >
                              <FaNo />
                            </button>
                            {doodle.settings.allow_maybe && (
                              <button
                                className={`response-btn ${userResponses[option.option_id] === 'maybe' ? 'active maybe' : ''}`}
                                onClick={() => handleResponseChange(option.option_id, 'maybe')}
                                title="Tal vez"
                              >
                                <FaQuestion />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="stats-cell">
                        <div className="option-stats">
                          {doodle.option_stats[option.option_id] && (
                            <>
                              <span className="stat yes">{doodle.option_stats[option.option_id].yes || 0}✅</span>
                              <span className="stat no">{doodle.option_stats[option.option_id].no || 0}❌</span>
                              {doodle.settings.allow_maybe && (
                                <span className="stat maybe">{doodle.option_stats[option.option_id].maybe || 0}❓</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments Section */}
          {doodle.settings.allow_comments && (
            <div className="comments-section">
              <h3><FaComment /> Comentarios</h3>
              <div className="comments-list">
                {doodle.responses.filter(r => r.comment).map(response => (
                  <div key={response.user_id} className="comment-item">
                    <strong>{response.username}:</strong> {response.comment}
                  </div>
                ))}
                {doodle.responses.filter(r => r.comment).length === 0 && (
                  <p className="no-comments">No hay comentarios aún</p>
                )}
              </div>

              {canRespond && (
                <div className="add-comment">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Agregar un comentario (opcional)..."
                    maxLength={500}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            {canRespond && (
              <button
                className="btn btn-primary"
                onClick={submitResponses}
                disabled={submitting || Object.keys(userResponses).length === 0}
              >
                {submitting ? 'Guardando...' : userHasResponded ? 'Actualizar Respuestas' : 'Guardar Respuestas'}
              </button>
            )}

            {isCreator && doodle.status === 'active' && (
              <button
                className="btn btn-warning"
                onClick={() => setShowCloseDoodle(true)}
              >
                Cerrar Doodle
              </button>
            )}

            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        {/* Close Doodle Modal */}
        {showCloseDoodle && (
          <div className="close-doodle-overlay">
            <div className="close-doodle-modal">
              <h3>Cerrar Doodle</h3>
              <p>Selecciona la opción ganadora:</p>
              <div className="final-options">
                {doodle.options.map(option => (
                  <label key={option.option_id} className="final-option">
                    <input
                      type="radio"
                      name="finalOption"
                      value={option.option_id}
                      onChange={(e) => setSelectedFinalOption(e.target.value)}
                    />
                    <span>{option.label}</span>
                    <span className="option-votes">
                      ({doodle.option_stats[option.option_id]?.yes || 0} votos positivos)
                    </span>
                  </label>
                ))}
              </div>
              <div className="close-doodle-actions">
                <button className="btn btn-secondary" onClick={() => setShowCloseDoodle(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={closeDoodle}>
                  Confirmar y Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoodleDetailsModal;