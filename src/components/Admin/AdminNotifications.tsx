import React, { useState, useEffect } from 'react';
import { notificationApi, EmailNotification, RecipientsResponse } from '../../services/notificationApi';
import { useAuthStore } from '../../stores/authStore';

const AdminNotifications: React.FC = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<EmailNotification>({
    subject: '',
    message: '',
    include_unsubscribed: false
  });
  const [recipients, setRecipients] = useState<RecipientsResponse | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRecipients, setShowRecipients] = useState(false);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-notifications">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden enviar notificaciones masivas.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadRecipients();
  }, [formData.include_unsubscribed]);

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const data = await notificationApi.getBroadcastRecipients(formData.include_unsubscribed);
      setRecipients(data);
    } catch (err) {
      console.error('Error loading recipients:', err);
      setError('Error al cargar la lista de destinatarios');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Por favor, completa tanto el asunto como el mensaje');
      return;
    }

    setSending(true);

    try {
      const result = await notificationApi.sendBroadcast(formData);
      
      if (result.success) {
        setSuccess(`✅ Notificación enviada exitosamente a ${result.sent_count} usuarios`);
        setFormData({
          subject: '',
          message: '',
          include_unsubscribed: false
        });
        loadRecipients(); // Refresh recipient count
      } else {
        setError(`Error al enviar notificación: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setError(err.response?.data?.detail || 'Error al enviar la notificación');
    } finally {
      setSending(false);
    }
  };

  const handleTestNotification = async () => {
    setError(null);
    setSuccess(null);
    setSending(true);

    try {
      const result = await notificationApi.testNewPostNotification();
      
      if (result.success) {
        setSuccess('✅ Notificación de prueba enviada exitosamente');
      } else {
        setError(`Error al enviar notificación de prueba: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error sending test notification:', err);
      setError(err.response?.data?.detail || 'Error al enviar notificación de prueba');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-notifications">
      <div className="admin-section-header">
        <h2>📢 Notificaciones Administrativas</h2>
        <p>Envía anuncios importantes a todos los miembros de la comunidad.</p>
      </div>

      {/* Recipients Summary */}
      {loadingRecipients ? (
        <div className="recipients-summary">
          <div className="loading">Cargando destinatarios...</div>
        </div>
      ) : recipients && (
        <div className="recipients-summary">
          <div className="recipients-stats">
            <div className="stat">
              <span className="stat-number">{recipients.subscribed_count}</span>
              <span className="stat-label">Usuarios suscritos</span>
            </div>
            <div className="stat">
              <span className="stat-number">{recipients.total_users}</span>
              <span className="stat-label">Total usuarios activos</span>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={() => setShowRecipients(!showRecipients)}
            className="btn btn-outline btn-sm"
          >
            {showRecipients ? 'Ocultar' : 'Ver'} Destinatarios
          </button>
        </div>
      )}

      {/* Recipients List */}
      {showRecipients && recipients && (
        <div className="recipients-list">
          <h3>Destinatarios ({formData.include_unsubscribed ? 'Todos' : 'Solo suscritos'})</h3>
          <div className="recipients-grid">
            {recipients.users.map(user => (
              <div key={user.id} className={`recipient-card ${!user.subscribed ? 'unsubscribed' : ''}`}>
                <span className="recipient-name">{user.name}</span>
                <span className="recipient-email">{user.email}</span>
                {!user.subscribed && <span className="unsubscribed-badge">No suscrito</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Form */}
      <div className="notification-form-container">
        <form onSubmit={handleSubmit} className="notification-form">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="form-group">
            <label htmlFor="subject">Asunto del Email</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Ej: Actualización importante de la comunidad"
              required
              maxLength={200}
            />
            <small>{formData.subject.length}/200 caracteres</small>
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Escribe tu mensaje aquí. Puedes usar saltos de línea para organizar el contenido."
              required
              rows={8}
            />
            <small>{formData.message.length} caracteres</small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="include_unsubscribed"
                checked={formData.include_unsubscribed}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Incluir usuarios que se han desuscrito de notificaciones administrativas
              <small className="checkbox-help">
                Solo usar para anuncios críticos o de emergencia
              </small>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleTestNotification}
              className="btn btn-outline"
              disabled={sending}
            >
              🧪 Prueba de Notificación
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !recipients}
            >
              {sending ? 'Enviando...' : `📧 Enviar a ${formData.include_unsubscribed ? recipients?.total_users : recipients?.subscribed_count} usuarios`}
            </button>
          </div>
        </form>
      </div>

      {/* Usage Guidelines */}
      <div className="notification-guidelines">
        <h3>💡 Guías de Uso</h3>
        <ul>
          <li><strong>Frecuencia:</strong> Usa las notificaciones administrativas con moderación para evitar spam</li>
          <li><strong>Contenido:</strong> Mantén el mensaje claro, conciso y relevante para toda la comunidad</li>
          <li><strong>Timing:</strong> Considera la zona horaria de los usuarios al enviar notificaciones</li>
          <li><strong>Pruebas:</strong> Utiliza la función de prueba para verificar el formato antes de enviar masivamente</li>
          <li><strong>Respeto:</strong> Respeta las preferencias de suscripción de los usuarios</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminNotifications;