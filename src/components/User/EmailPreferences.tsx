import React, { useState, useEffect } from 'react';
import { notificationApi, EmailPreferences as EmailPrefs } from '../../services/notificationApi';

const EmailPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<EmailPrefs>({
    new_posts: true,
    admin_notifications: true,
    comment_replies: true,
    new_comments: true,
    weekly_digest: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getEmailPreferences();
      setPreferences(data);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Error al cargar las preferencias de email');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof EmailPrefs) => {
    const newValue = !preferences[key];
    const oldPreferences = { ...preferences };
    
    // Update UI immediately for better UX
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      await notificationApi.updateEmailPreferences({ [key]: newValue });
      setSuccess('✅ Preferencias actualizadas exitosamente');
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      setError(err.response?.data?.detail || 'Error al actualizar las preferencias');
      // Revert the change
      setPreferences(oldPreferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="email-preferences">
        <div className="loading">Cargando preferencias...</div>
      </div>
    );
  }

  return (
    <div className="email-preferences">
      <div className="email-preferences-header">
        <h2>📧 Preferencias de Email</h2>
        <p>Configura qué notificaciones por email deseas recibir.</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="preferences-list">
        <div className="preference-item">
          <div className="preference-content">
            <div className="preference-icon">📝</div>
            <div className="preference-details">
              <h3>Nuevos Posts</h3>
              <p>Recibe notificaciones cuando se publique nuevo contenido en la comunidad</p>
            </div>
          </div>
          <div className="preference-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.new_posts}
                onChange={() => handleToggle('new_posts')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-content">
            <div className="preference-icon">📢</div>
            <div className="preference-details">
              <h3>Notificaciones Administrativas</h3>
              <p>Recibe anuncios importantes de los administradores</p>
            </div>
          </div>
          <div className="preference-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.admin_notifications}
                onChange={() => handleToggle('admin_notifications')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-content">
            <div className="preference-icon">💬</div>
            <div className="preference-details">
              <h3>Respuestas a Comentarios</h3>
              <p>Recibe notificaciones cuando alguien responda a tus comentarios</p>
            </div>
          </div>
          <div className="preference-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.comment_replies}
                onChange={() => handleToggle('comment_replies')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-content">
            <div className="preference-icon">🗨️</div>
            <div className="preference-details">
              <h3>Nuevos Comentarios</h3>
              <p>Recibe notificaciones cuando se publique cualquier comentario nuevo en el blog</p>
            </div>
          </div>
          <div className="preference-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.new_comments}
                onChange={() => handleToggle('new_comments')}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-content">
            <div className="preference-icon">📊</div>
            <div className="preference-details">
              <h3>Resumen Semanal</h3>
              <p>Recibe un resumen semanal de la actividad de la comunidad</p>
              <small className="feature-status">Próximamente disponible</small>
            </div>
          </div>
          <div className="preference-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.weekly_digest}
                onChange={() => handleToggle('weekly_digest')}
                disabled={true} // Disabled until feature is implemented
              />
              <span className="toggle-slider disabled"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="preferences-info">
        <h3>ℹ️ Información Importante</h3>
        <ul>
          <li>Los cambios se aplican inmediatamente</li>
          <li>Siempre respetamos tus preferencias de privacidad</li>
          <li>Puedes cambiar estas configuraciones en cualquier momento</li>
          <li>Los emails críticos de seguridad siempre se envían independientemente de estas preferencias</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailPreferences;