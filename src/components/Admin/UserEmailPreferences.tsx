import React, { useState, useEffect } from 'react';
import { notificationApi, EmailPreferences } from '../../services/notificationApi';
import { useAuthStore } from '../../stores/authStore';

interface UserWithPreferences {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: EmailPreferences;
}

const UserEmailPreferences: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserWithPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkPreferences, setBulkPreferences] = useState<Partial<EmailPreferences>>({});

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="user-email-preferences">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden gestionar las preferencias de email de los usuarios.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationApi.getAllUserPreferences();
      setUsers(data.users);
    } catch (err: any) {
      console.error('Error loading user preferences:', err);
      setError(err.response?.data?.detail || 'Error al cargar las preferencias de los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePreference = async (
    userId: string, 
    preferenceKey: keyof EmailPreferences, 
    currentValue: boolean
  ) => {
    const newValue = !currentValue;
    setUpdating(prev => new Set(prev).add(userId));
    setError(null);
    setSuccess(null);

    // Optimistically update UI
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId 
          ? { ...u, preferences: { ...u.preferences, [preferenceKey]: newValue } }
          : u
      )
    );

    try {
      const result = await notificationApi.updateUserPreferencesAdmin(userId, {
        [preferenceKey]: newValue
      });
      
      setSuccess(`✅ Preferencia actualizada para ${result.user_name}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating user preference:', err);
      setError(err.response?.data?.detail || 'Error al actualizar la preferencia');
      
      // Revert optimistic update
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, preferences: { ...u.preferences, [preferenceKey]: currentValue } }
            : u
        )
      );
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.size === 0) {
      setError('Selecciona al menos un usuario');
      return;
    }

    if (Object.keys(bulkPreferences).length === 0) {
      setError('Selecciona al menos una preferencia para actualizar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await notificationApi.bulkUpdatePreferences(
        Array.from(selectedUsers),
        bulkPreferences
      );

      setSuccess(`✅ Preferencias actualizadas para ${result.updated_count} usuarios`);
      setBulkPreferences({});
      setSelectedUsers(new Set());
      setShowBulkPanel(false);
      
      // Reload user preferences
      await loadUserPreferences();
    } catch (err: any) {
      console.error('Error bulk updating preferences:', err);
      setError(err.response?.data?.detail || 'Error al actualizar las preferencias masivamente');
    } finally {
      setLoading(false);
    }
  };

  const getPreferenceIcon = (key: keyof EmailPreferences): string => {
    const icons = {
      new_posts: '📝',
      admin_notifications: '📢',
      comment_replies: '💬',
      new_comments: '🗨️',
      weekly_digest: '📊'
    };
    return icons[key];
  };

  const getPreferenceLabel = (key: keyof EmailPreferences): string => {
    const labels = {
      new_posts: 'Nuevos Posts',
      admin_notifications: 'Admin',
      comment_replies: 'Comentarios',
      new_comments: 'Nuevos Comentarios',
      weekly_digest: 'Resumen'
    };
    return labels[key];
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-email-preferences">
        <div className="loading">Cargando preferencias de usuarios...</div>
      </div>
    );
  }

  return (
    <div className="user-email-preferences">
      <div className="admin-preferences-header">
        <h1>👥 Preferencias de Email - Usuarios</h1>
        <p>Gestiona las preferencias de notificaciones por email de todos los usuarios.</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="bulk-controls">
        <div className="bulk-controls-header">
          <button
            onClick={() => setShowBulkPanel(!showBulkPanel)}
            className="btn btn-outline"
          >
            🔧 Operaciones Masivas ({selectedUsers.size} seleccionados)
          </button>
          <button
            onClick={handleSelectAll}
            className="btn btn-secondary"
          >
            {selectedUsers.size === users.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </button>
        </div>

        {showBulkPanel && (
          <div className="bulk-panel">
            <h3>Actualización Masiva</h3>
            <p>Cambiar estas preferencias para {selectedUsers.size} usuarios seleccionados:</p>
            
            <div className="bulk-preferences">
              {(['new_posts', 'admin_notifications', 'comment_replies', 'weekly_digest'] as const).map(key => (
                <label key={key} className="bulk-preference-item">
                  <input
                    type="checkbox"
                    checked={key in bulkPreferences}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkPreferences(prev => ({ ...prev, [key]: true }));
                      } else {
                        setBulkPreferences(prev => {
                          const { [key]: removed, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                  />
                  {getPreferenceIcon(key)} {getPreferenceLabel(key)}
                  {key in bulkPreferences && (
                    <select
                      value={bulkPreferences[key] ? 'true' : 'false'}
                      onChange={(e) => setBulkPreferences(prev => ({ 
                        ...prev, 
                        [key]: e.target.value === 'true' 
                      }))}
                      className="bulk-preference-select"
                    >
                      <option value="true">Activar</option>
                      <option value="false">Desactivar</option>
                    </select>
                  )}
                </label>
              ))}
            </div>

            <div className="bulk-actions">
              <button
                onClick={handleBulkUpdate}
                className="btn btn-primary"
                disabled={selectedUsers.size === 0 || Object.keys(bulkPreferences).length === 0}
              >
                Actualizar {selectedUsers.size} Usuarios
              </button>
              <button
                onClick={() => setShowBulkPanel(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="users-preferences-table">
        <div className="table-header">
          <div className="user-column">Usuario</div>
          <div className="preferences-columns">
            <div className="preference-header">📝 Posts</div>
            <div className="preference-header">📢 Admin</div>
            <div className="preference-header">💬 Coment</div>
            <div className="preference-header">📊 Resum</div>
          </div>
        </div>

        <div className="table-body">
          {users.map(user => (
            <div key={user.id} className="table-row">
              <div className="user-info">
                <label className="select-user">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </label>
                <div className="user-details">
                  <div className="user-name">
                    {user.name}
                    {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                  </div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>

              <div className="preferences-toggles">
                {(['new_posts', 'admin_notifications', 'comment_replies', 'weekly_digest'] as const).map(key => (
                  <div key={key} className="preference-toggle-cell">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={user.preferences[key]}
                        onChange={() => handleTogglePreference(user.id, key, user.preferences[key])}
                        disabled={updating.has(user.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    {updating.has(user.id) && <div className="updating-spinner">⏳</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="preferences-summary">
        <h3>📊 Resumen</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total Usuarios</span>
          </div>
          <div className="stat">
            <span className="stat-number">{users.filter(u => u.preferences.new_posts).length}</span>
            <span className="stat-label">Suscritos a Posts</span>
          </div>
          <div className="stat">
            <span className="stat-number">{users.filter(u => u.preferences.admin_notifications).length}</span>
            <span className="stat-label">Suscritos a Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEmailPreferences;