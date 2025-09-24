import React, { useState, useEffect } from 'react';

interface TelegramPreferences {
  enabled: boolean;
  login_notifications: boolean;
  new_posts: boolean;
  comment_replies: boolean;
  admin_notifications: boolean;
}

interface TelegramConfig {
  telegram_id: string;
  telegram_preferences: TelegramPreferences;
}

const TelegramSettings: React.FC = () => {
  const [config, setConfig] = useState<TelegramConfig>({
    telegram_id: '',
    telegram_preferences: {
      enabled: false,
      login_notifications: true,
      new_posts: true,
      comment_replies: true,
      admin_notifications: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('¡Hola! Esta es una prueba de notificaciones de Telegram 🚀');

  useEffect(() => {
    loadTelegramConfig();
  }, []);

  const loadTelegramConfig = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/telegram/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setConfig({
        telegram_id: data.telegram_id || '',
        telegram_preferences: data.telegram_preferences
      });
    } catch (error: any) {
      console.error('Error loading Telegram config:', error);
      setError('Error al cargar la configuración de Telegram');
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramConfig = async () => {
    if (!config.telegram_id && config.telegram_preferences.enabled) {
      setError('Debe proporcionar un ID de Telegram para habilitar las notificaciones');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/telegram/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegram_id: config.telegram_id,
          preferences: config.telegram_preferences
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setSuccess(result.message || 'Configuración guardada exitosamente');
    } catch (error: any) {
      console.error('Error saving Telegram config:', error);
      setError(error.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const testTelegramNotification = async () => {
    if (!config.telegram_id) {
      setError('Debe configurar un ID de Telegram primero');
      return;
    }

    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testMessage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || `HTTP ${response.status}`);
      }

      if (result.success) {
        setSuccess('✅ Mensaje de prueba enviado exitosamente! Revisa tu Telegram');
      } else {
        setError(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error testing Telegram:', error);
      setError(error.message || 'Error al enviar mensaje de prueba');
    } finally {
      setTesting(false);
    }
  };

  const handlePreferenceChange = (key: keyof TelegramPreferences, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      telegram_preferences: {
        ...prev.telegram_preferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="telegram-settings">
        <div className="loading">Cargando configuración de Telegram...</div>
      </div>
    );
  }

  return (
    <div className="telegram-settings">
      <div className="settings-header">
        <h3>🤖 Configuración de Telegram</h3>
        <p>Configure las notificaciones automáticas de Telegram para recibir alertas importantes.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess(null)} className="close-btn">×</button>
        </div>
      )}

      <div className="settings-section">
        <h4>📱 Configuración Básica</h4>

        <div className="form-group">
          <label htmlFor="telegram-id">
            <strong>ID de Telegram</strong>
            <span className="help-text">Su ID único de Telegram (número)</span>
          </label>
          <input
            type="text"
            id="telegram-id"
            value={config.telegram_id}
            onChange={(e) => setConfig(prev => ({...prev, telegram_id: e.target.value}))}
            placeholder="123456789"
            className="form-input"
          />
          <div className="help-section">
            <p><strong>¿Cómo obtener mi ID de Telegram?</strong></p>
            <ol>
              <li>Busca <code>@getmyid_bot</code> en Telegram</li>
              <li>Envía el comando <code>/start</code></li>
              <li>Copia el número que te devuelve</li>
              <li>Pégalo en el campo de arriba</li>
            </ol>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.telegram_preferences.enabled}
              onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
            />
            <span className="checkmark"></span>
            <strong>Habilitar notificaciones de Telegram</strong>
          </label>
        </div>
      </div>

      {config.telegram_preferences.enabled && (
        <div className="settings-section">
          <h4>🔔 Tipos de Notificaciones</h4>

          <div className="preferences-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.telegram_preferences.login_notifications}
                onChange={(e) => handlePreferenceChange('login_notifications', e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="preference-info">
                <span className="preference-name">🔐 Notificaciones de Login</span>
                <span className="preference-desc">Alerta cuando alguien accede a su cuenta</span>
              </div>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.telegram_preferences.new_posts}
                onChange={(e) => handlePreferenceChange('new_posts', e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="preference-info">
                <span className="preference-name">📝 Nuevos Posts</span>
                <span className="preference-desc">Notifica cuando se publique un nuevo artículo</span>
              </div>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.telegram_preferences.comment_replies}
                onChange={(e) => handlePreferenceChange('comment_replies', e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="preference-info">
                <span className="preference-name">💬 Respuestas a Comentarios</span>
                <span className="preference-desc">Alerta cuando respondan a sus comentarios</span>
              </div>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.telegram_preferences.admin_notifications}
                onChange={(e) => handlePreferenceChange('admin_notifications', e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="preference-info">
                <span className="preference-name">📢 Notificaciones Administrativas</span>
                <span className="preference-desc">Mensajes importantes de los administradores</span>
              </div>
            </label>
          </div>
        </div>
      )}

      <div className="settings-section">
        <h4>🧪 Probar Configuración</h4>
        <p>Envíe un mensaje de prueba para verificar que todo funciona correctamente.</p>

        <div className="form-group">
          <label htmlFor="test-message">Mensaje de prueba:</label>
          <textarea
            id="test-message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="form-textarea"
            rows={3}
            disabled={!config.telegram_id}
          />
        </div>

        <button
          onClick={testTelegramNotification}
          disabled={testing || !config.telegram_id}
          className="btn btn-secondary"
        >
          {testing ? '📤 Enviando...' : '🧪 Enviar Prueba'}
        </button>
      </div>

      <div className="settings-actions">
        <button
          onClick={saveTelegramConfig}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? '💾 Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default TelegramSettings;