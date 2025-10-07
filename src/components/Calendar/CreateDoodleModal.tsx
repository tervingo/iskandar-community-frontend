import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuthStore } from '../../stores/authStore';

interface DoodleOption {
  option_id: string;
  datetime: string;
  label: string;
}

interface CreateDoodleModalProps {
  onClose: () => void;
  onDoodleCreated: () => void;
}

const CreateDoodleModal: React.FC<CreateDoodleModalProps> = ({ onClose, onDoodleCreated }) => {
  const { token } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<DoodleOption[]>([]);
  const [newOptionDate, setNewOptionDate] = useState('');
  const [newOptionTime, setNewOptionTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [deadline, setDeadline] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [allowMaybe, setAllowMaybe] = useState(true);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (!newOptionDate || !newOptionTime) {
      alert('Por favor, selecciona una fecha y hora');
      return;
    }

    const datetime = `${newOptionDate}T${newOptionTime}`;
    const date = new Date(datetime);
    const label = date.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newOption: DoodleOption = {
      option_id: `opt_${Date.now()}`,
      datetime: date.toISOString(),
      label: label
    };

    setOptions([...options, newOption]);
    setNewOptionDate('');
    setNewOptionTime('');
  };

  const removeOption = (optionId: string) => {
    setOptions(options.filter(opt => opt.option_id !== optionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('El título es obligatorio');
      return;
    }

    if (options.length < 2) {
      alert('Debes agregar al menos 2 opciones de fecha/hora');
      return;
    }

    if (!token) {
      alert('No estás autenticado');
      return;
    }

    setLoading(true);

    try {
      const doodleData = {
        title: title.trim(),
        description: description.trim() || undefined,
        options: options,
        settings: {
          is_public: isPublic,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          max_participants: null,
          allow_comments: allowComments,
          allow_maybe: allowMaybe
        }
      };

      console.log('Creating doodle:', doodleData);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/calendar/doodles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(doodleData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Doodle "${result.title}" creado exitosamente!`);
        onDoodleCreated();
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al crear el doodle');
      }
    } catch (error) {
      console.error('Error creating doodle:', error);
      alert('Error al crear el doodle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-doodle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Crear Nuevo Doodle</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="doodle-form">
          {/* Basic Info */}
          <div className="form-section">
            <h3>Información básica</h3>

            <div className="form-group">
              <label htmlFor="title">Título del evento *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Reunión mensual de la comunidad"
                required
                maxLength={200}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción (opcional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el evento o proporciona más detalles..."
                maxLength={1000}
                rows={3}
                className="form-textarea"
              />
            </div>
          </div>

          {/* Date/Time Options */}
          <div className="form-section">
            <h3>Opciones de fecha y hora</h3>

            <div className="add-option-form">
              <div className="option-inputs">
                <div className="input-group">
                  <FaCalendarAlt />
                  <input
                    type="date"
                    value={newOptionDate}
                    onChange={(e) => setNewOptionDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <FaClock />
                  <input
                    type="time"
                    value={newOptionTime}
                    onChange={(e) => setNewOptionTime(e.target.value)}
                    className="form-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="btn btn-secondary"
                >
                  <FaPlus /> Agregar
                </button>
              </div>
            </div>

            <div className="options-list">
              {options.map((option, index) => (
                <div key={option.option_id} className="option-item">
                  <span className="option-number">{index + 1}</span>
                  <span className="option-label">{option.label}</span>
                  <button
                    type="button"
                    onClick={() => removeOption(option.option_id)}
                    className="btn btn-danger btn-small"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            {options.length < 2 && (
              <p className="help-text">Agrega al menos 2 opciones de fecha/hora</p>
            )}
          </div>

          {/* Settings */}
          <div className="form-section">
            <h3>Configuración</h3>

            <div className="settings-grid">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  Doodle público (visible para todos)
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                  />
                  Permitir comentarios
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={allowMaybe}
                    onChange={(e) => setAllowMaybe(e.target.checked)}
                  />
                  Permitir respuesta "Tal vez"
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Fecha límite para votar (opcional)</label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || options.length < 2}
              className="btn btn-primary"
            >
              {loading ? 'Creando...' : 'Crear Doodle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDoodleModal;