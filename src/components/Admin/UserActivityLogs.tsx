import React, { useState, useEffect } from 'react';
import { UserActivityLog, ActivityEventType, ActivityLogFilters, ActivityStats } from '../../types';
import { activityLogsApi } from '../../services/api';

const UserActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    limit: 50,
    offset: 0
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedLogs = await activityLogsApi.getAll(filters);
      setLogs(fetchedLogs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los logs de actividad');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const fetchedStats = await activityLogsApi.getStats(30);
      setStats(fetchedStats);
    } catch (err: any) {
      console.error('Error loading activity stats:', err);
    }
  };

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
  };

  const formatTimestamp = (timestamp: string): string => {
    // Ensure the timestamp is treated as UTC if it doesn't have timezone info
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    const date = new Date(utcTimestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getEventIcon = (eventType: ActivityEventType): string => {
    switch (eventType) {
      case ActivityEventType.LOGIN:
        return '🚪';
      case ActivityEventType.LOGOUT:
        return '🚪';
      case ActivityEventType.PASSWORD_CHANGE:
        return '🔑';
      case ActivityEventType.POST_VIEW:
        return '👁️';
      case ActivityEventType.ADMIN_ACTION:
        return '⚙️';
      default:
        return '📝';
    }
  };

  const getEventColor = (eventType: ActivityEventType, success: boolean): string => {
    if (!success) return '#e74c3c';

    switch (eventType) {
      case ActivityEventType.LOGIN:
        return '#27ae60';
      case ActivityEventType.LOGOUT:
        return '#f39c12';
      case ActivityEventType.PASSWORD_CHANGE:
        return '#3498db';
      case ActivityEventType.POST_VIEW:
        return '#9b59b6';
      case ActivityEventType.ADMIN_ACTION:
        return '#e67e22';
      default:
        return '#95a5a6';
    }
  };

  // Get unique usernames from current logs
  const getUniqueUsernames = (): string[] => {
    const usernames = logs.map(log => log.username);
    return Array.from(new Set(usernames)).sort();
  };

  const handleUserSelection = (username: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, username]);
    } else {
      setSelectedUsers(prev => prev.filter(user => user !== username));
    }
  };

  const handleSelectAllUsers = () => {
    const allUsernames = getUniqueUsernames();
    setSelectedUsers(allUsernames);
  };

  const handleDeselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert('Por favor selecciona al menos un usuario');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar TODOS los registros de actividad para los siguientes usuarios?\n\n${selectedUsers.join(', ')}\n\nEsta acción NO se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setDeletionLoading(true);
      setError(null);

      const result = await activityLogsApi.bulkDeleteUserLogs(selectedUsers);

      alert(`✅ Eliminación completada exitosamente:\n\n${result.message}\n\nRegistros eliminados: ${result.deleted_count}\n\nDetalles:\n${Object.entries(result.deletion_summary).map(([user, count]) => `• ${user}: ${count} registros`).join('\n')}`);

      // Refresh the logs and clear selections
      await fetchLogs();
      await fetchStats();
      setSelectedUsers([]);
      setShowBulkDelete(false);

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al eliminar los registros de actividad';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setDeletionLoading(false);
    }
  };

  const formatAdditionalInfo = (log: UserActivityLog): React.ReactNode => {
    if (!log.additional_info) return 'N/A';

    // Special formatting for POST_VIEW events
    if (log.event_type === ActivityEventType.POST_VIEW && log.additional_info.post_title) {
      return (
        <div>
          <strong>Entrada visitada:</strong> {log.additional_info.post_title}
          <details style={{ marginTop: '4px' }}>
            <summary style={{ cursor: 'pointer', fontSize: '12px' }}>Ver todos los detalles</summary>
            <pre style={{ fontSize: '11px', marginTop: '4px' }}>
              {JSON.stringify(log.additional_info, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    // Default formatting for other events
    return (
      <details>
        <summary>Ver detalles</summary>
        <pre>{JSON.stringify(log.additional_info, null, 2)}</pre>
      </details>
    );
  };

  return (
    <div className="user-activity-logs">
      <div className="admin-header">
        <h1>📊 Logs de Actividad de Usuarios</h1>
        <p>Registro de eventos de login, logout y cambios de contraseña</p>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="activity-stats">
          <h2>Estadísticas (últimos 30 días)</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total de Eventos</h3>
              <div className="stat-number">{stats.totals.total_events}</div>
            </div>
            <div className="stat-card">
              <h3>Eventos Exitosos</h3>
              <div className="stat-number success">{stats.totals.successful_events}</div>
            </div>
            <div className="stat-card">
              <h3>Eventos Fallidos</h3>
              <div className="stat-number error">{stats.totals.failed_events}</div>
            </div>
          </div>

          <div className="events-breakdown">
            <h3>Desglose por Tipo de Evento</h3>
            <div className="events-grid">
              {Object.entries(stats.events).map(([eventType, eventStats]) => (
                <div key={eventType} className="event-stat">
                  <span className="event-icon">{getEventIcon(eventType as ActivityEventType)}</span>
                  <span className="event-name">{eventType}</span>
                  <span className="event-count">
                    {eventStats.successful}/{eventStats.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filtros</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Usuario:</label>
            <input
              type="text"
              value={filters.username || ''}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              placeholder="Buscar por nombre de usuario"
            />
          </div>

          <div className="filter-group">
            <label>Tipo de Evento:</label>
            <select
              value={filters.event_type || ''}
              onChange={(e) => handleFilterChange('event_type', e.target.value || undefined)}
            >
              <option value="">Todos</option>
              <option value={ActivityEventType.LOGIN}>Login</option>
              <option value={ActivityEventType.LOGOUT}>Logout</option>
              <option value={ActivityEventType.PASSWORD_CHANGE}>Cambio de Contraseña</option>
              <option value={ActivityEventType.POST_VIEW}>Vista de Entrada</option>
              <option value={ActivityEventType.ADMIN_ACTION}>Acción de Admin</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filters.success?.toString() || ''}
              onChange={(e) => handleFilterChange('success', e.target.value ? e.target.value === 'true' : undefined)}
            >
              <option value="">Todos</option>
              <option value="true">Exitosos</option>
              <option value="false">Fallidos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Límite:</label>
            <select
              value={filters.limit || 50}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="btn btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Aplicar Filtros'}
          </button>
          <button onClick={clearFilters} className="btn btn-secondary">
            Limpiar Filtros
          </button>
          <button onClick={() => { fetchLogs(); fetchStats(); }} className="btn btn-outline" disabled={loading}>
            🔄 Refrescar
          </button>
          <button
            onClick={() => setShowBulkDelete(!showBulkDelete)}
            className="btn btn-danger"
          >
            🗑️ Eliminar por Usuario
          </button>
        </div>
      </div>

      {/* Bulk Delete Section */}
      {showBulkDelete && (
        <div className="bulk-delete-section">
          <h3>🗑️ Eliminación Masiva de Registros por Usuario</h3>
          <p className="warning-text">
            ⚠️ <strong>ATENCIÓN:</strong> Esta acción eliminará TODOS los registros de actividad de los usuarios seleccionados. Esta operación NO se puede deshacer.
          </p>

          <div className="user-selection">
            <div className="selection-header">
              <h4>Seleccionar Usuarios (de los registros actuales):</h4>
              <div className="selection-actions">
                <button onClick={handleSelectAllUsers} className="btn btn-sm btn-outline">
                  Seleccionar Todos
                </button>
                <button onClick={handleDeselectAllUsers} className="btn btn-sm btn-outline">
                  Deseleccionar Todos
                </button>
                <span className="selection-count">
                  {selectedUsers.length} de {getUniqueUsernames().length} usuarios seleccionados
                </span>
              </div>
            </div>

            <div className="users-grid">
              {getUniqueUsernames().map(username => (
                <label key={username} className="user-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(username)}
                    onChange={(e) => handleUserSelection(username, e.target.checked)}
                  />
                  <span className="username">{username}</span>
                  <span className="user-log-count">
                    ({logs.filter(log => log.username === username).length} registros visibles)
                  </span>
                </label>
              ))}
            </div>

            <div className="bulk-delete-actions">
              <button
                onClick={handleBulkDelete}
                disabled={selectedUsers.length === 0 || deletionLoading}
                className="btn btn-danger"
              >
                {deletionLoading ? 'Eliminando...' : `🗑️ Eliminar Registros de ${selectedUsers.length} Usuario(s)`}
              </button>
              <button
                onClick={() => setShowBulkDelete(false)}
                className="btn btn-secondary"
                disabled={deletionLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="logs-section">
        <h3>Registros de Actividad ({logs.length})</h3>

        {logs.length === 0 ? (
          <div className="no-logs">
            <p>📭 No se encontraron logs de actividad con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Evento</th>
                  <th>Estado</th>
                  <th>IP</th>
                  <th>Información Adicional</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={!log.success ? 'failed-event' : ''}>
                    <td>{formatTimestamp(log.timestamp)}</td>
                    <td className="username">{log.username}</td>
                    <td>
                      <span
                        className="event-badge"
                        style={{ backgroundColor: getEventColor(log.event_type, log.success) }}
                      >
                        {getEventIcon(log.event_type)} {log.event_type}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${log.success ? 'success' : 'failed'}`}>
                        {log.success ? '✅ Exitoso' : '❌ Fallido'}
                      </span>
                    </td>
                    <td className="ip-address">{log.ip_address || 'N/A'}</td>
                    <td className="additional-info">
                      {formatAdditionalInfo(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityLogs;