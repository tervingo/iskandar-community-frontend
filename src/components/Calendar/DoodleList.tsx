import React, { useState, useEffect } from 'react';
import { FaPoll, FaClock, FaUsers, FaEye, FaVoteYea, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import { useAuthStore } from '../../stores/authStore';
import DoodleDetailsModal from './DoodleDetailsModal';

interface DoodleItem {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_name: string;
  status: 'active' | 'closed' | 'expired';
  total_options: number;
  total_responses: number;
  deadline?: string;
  created_at: string;
  is_participant: boolean;
}

interface DoodleListProps {
  searchTerm?: string;
  statusFilter?: string;
  createdByMe?: boolean;
}

const DoodleList: React.FC<DoodleListProps> = ({ searchTerm, statusFilter, createdByMe }) => {
  const { token, user } = useAuthStore();
  const [doodles, setDoodles] = useState<DoodleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoodleId, setSelectedDoodleId] = useState<string | null>(null);

  useEffect(() => {
    fetchDoodles();
  }, [statusFilter, createdByMe]);

  const fetchDoodles = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (createdByMe) params.append('created_by_me', 'true');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/calendar/doodles?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const doodlesData = await response.json();
        console.log('Fetched doodles:', doodlesData);
        setDoodles(doodlesData);
      } else {
        console.error('Failed to fetch doodles:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching doodles:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDoodle = async (doodleId: string, title: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el doodle "${title}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/calendar/doodles/${doodleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Doodle "${result.title}" eliminado exitosamente.`);
        fetchDoodles(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al eliminar el doodle');
      }
    } catch (error) {
      console.error('Error deleting doodle:', error);
      alert('Error al eliminar el doodle');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'closed': return '#007bff';
      case 'expired': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaClock />;
      case 'closed': return <FaCheck />;
      case 'expired': return <FaTimes />;
      default: return <FaClock />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'closed': return 'Finalizado';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  // Filter doodles based on search term
  const filteredDoodles = doodles.filter(doodle => {
    if (!searchTerm) return true;
    return (
      doodle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doodle.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doodle.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando doodles...</p>
      </div>
    );
  }

  if (filteredDoodles.length === 0) {
    return (
      <div className="empty-state">
        <FaPoll size={48} />
        <h3>No hay doodles para mostrar</h3>
        <p>
          {searchTerm
            ? `No se encontraron doodles que coincidan con "${searchTerm}"`
            : createdByMe
            ? 'No has creado ningún doodle aún. ¡Crea tu primer doodle!'
            : 'No hay doodles disponibles en este momento.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="doodle-list">
      <div className="doodles-grid">
        {filteredDoodles.map((doodle) => (
          <div key={doodle.id} className="doodle-card">
            <div className="doodle-header">
              <h4 className="doodle-title">{doodle.title}</h4>
              <div className="doodle-status">
                <span
                  className={`status-badge ${doodle.status}`}
                  style={{ backgroundColor: getStatusColor(doodle.status) }}
                >
                  {getStatusIcon(doodle.status)}
                  {getStatusLabel(doodle.status)}
                </span>
              </div>
            </div>

            {doodle.description && (
              <p className="doodle-description">{doodle.description}</p>
            )}

            <div className="doodle-meta">
              <div className="meta-item">
                <FaUsers />
                <span>{doodle.total_responses} respuestas</span>
              </div>
              <div className="meta-item">
                <FaPoll />
                <span>{doodle.total_options} opciones</span>
              </div>
              <div className="meta-item">
                <FaClock />
                <span>{formatDateTime(doodle.created_at)}</span>
              </div>
            </div>

            <div className="doodle-creator">
              <span>Creado por: <strong>{doodle.creator_name}</strong></span>
            </div>

            {doodle.deadline && (
              <div className="doodle-deadline">
                <span>⏰ Fecha límite: {formatDateTime(doodle.deadline)}</span>
              </div>
            )}

            <div className="doodle-actions">
              <button
                className="btn btn-primary"
                onClick={() => setSelectedDoodleId(doodle.id)}
              >
                <FaEye />
                {doodle.is_participant ? 'Ver resultados' : 'Participar'}
              </button>

              {/* Show delete button only for doodle creator */}
              {user?.id === doodle.creator_id && (
                <button
                  className="btn btn-danger"
                  onClick={() => deleteDoodle(doodle.id, doodle.title)}
                  title="Eliminar doodle"
                  style={{ marginLeft: '10px' }}
                >
                  <FaTrash />
                  Eliminar
                </button>
              )}
            </div>

            {/* Participation indicator */}
            {doodle.is_participant && (
              <div className="participation-indicator">
                <FaVoteYea />
                <span>Ya has participado</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Doodle Details Modal */}
      {selectedDoodleId && (
        <DoodleDetailsModal
          doodleId={selectedDoodleId}
          onClose={() => setSelectedDoodleId(null)}
          onDoodleUpdated={fetchDoodles}
        />
      )}
    </div>
  );
};

export default DoodleList;