import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface BackupStatus {
  service_enabled: boolean;
  mongodb_configured: boolean;
  dropbox_configured: boolean;
  configuration: {
    mongodb_uri_set: boolean;
    dropbox_token_set: boolean;
    database_name: string;
  };
  recommendations: string[];
}

interface BackupFile {
  name: string;
  path: string;
  size_mb: number;
  modified: string;
  id: string;
}

interface BackupListResponse {
  success: boolean;
  backups: BackupFile[];
  total_count: number;
  message?: string;
}

interface BackupResult {
  success: boolean;
  message: string;
  timestamp?: string;
  file_size_mb?: number;
  filename?: string;
  metadata?: any;
  dropbox_path?: string;
}

const BackupManagement: React.FC = () => {
  const { isAdmin} = useAuthStore();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null); // null = checking, true/false = result

  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!token);

    if (isAdmin && token) {
      fetchBackupStatus();
      fetchBackupList();
    }
  }, [isAdmin]); // Solo escuchar cambios en isAdmin

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch('/api/backup/status', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(`Error al obtener estado del backup: ${err.message}`);
    }
  };

  const fetchBackupList = async () => {
    try {
      const response = await fetch('/api/backup/list', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backup list error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BackupListResponse = await response.json();
      if (data.success) {
        setBackups(data.backups || []);
      } else {
        setError(data.message || 'Error al listar backups');
      }
    } catch (err: any) {
      console.error('Backup list fetch error:', err);
      if (err.message.includes('Unexpected token')) {
        setError('Endpoint no encontrado. El backend necesita reiniciarse después de agregar los endpoints de backup.');
      } else {
        setError(`Error al listar backups: ${err.message}`);
      }
    }
  };

  const createManualBackup = async () => {
    setCreatingBackup(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/backup/create?run_in_background=true', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: BackupResult = await response.json();

      if (result.success) {
        setSuccess('✅ Backup iniciado correctamente. El proceso se ejecuta en segundo plano.');
        // Refresh backup list after a delay
        setTimeout(() => {
          fetchBackupList();
        }, 5000);
      } else {
        setError(result.message || 'Error al crear backup');
      }
    } catch (err: any) {
      setError(`Error al crear backup: ${err.message}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  const cleanupOldBackups = async () => {
    if (!window.confirm('¿Eliminar backups antiguos? (Se mantendrán los 4 más recientes)')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/backup/cleanup', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(`✅ Limpieza completada. ${result.backups_deleted || 0} backups eliminados.`);
        fetchBackupList();
      } else {
        setError(result.message || 'Error al limpiar backups');
      }
    } catch (err: any) {
      setError(`Error al limpiar backups: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (sizeMb: number): string => {
    if (sizeMb < 1) {
      return `${Math.round(sizeMb * 1024)} KB`;
    }
    return `${sizeMb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('es-ES');
    } catch {
      return dateString;
    }
  };

  if (!isAdmin) {
    return <div className="access-denied">Se requiere acceso de administrador.</div>;
  }

  // Show loading while checking token
  if (hasToken === null) {
    return (
      <div className="backup-management">
        <div className="loading">Verificando autenticación...</div>
      </div>
    );
  }

  // Show error if no token
  if (hasToken === false) {
    return (
      <div className="backup-management">
        <div className="error-message">
          No se encontró token de autenticación. Por favor, cierra sesión y vuelve a iniciar sesión.
          <button onClick={() => window.location.href = '/home'}>Ir al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="backup-management">
      <div className="backup-header">
        <h1>🗄️ Gestión de Backups</h1>
        <div className="header-actions">
          <button
            onClick={createManualBackup}
            disabled={creatingBackup || !status?.service_enabled}
            className="btn btn-primary"
          >
            {creatingBackup ? '⏳ Creando...' : '📦 Crear Backup Manual'}
          </button>
          <button
            onClick={cleanupOldBackups}
            disabled={loading || backups.length === 0}
            className="btn btn-outline"
          >
            {loading ? '⏳ Limpiando...' : '🧹 Limpiar Antiguos'}
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Estado del servicio */}
      {status && (
        <div className="backup-status">
          <h3>Estado del Servicio</h3>
          <div className="status-grid">
            <div className={`status-item ${status.service_enabled ? 'enabled' : 'disabled'}`}>
              <span className="status-icon">
                {status.service_enabled ? '✅' : '❌'}
              </span>
              <div>
                <strong>Servicio de Backup</strong>
                <p>{status.service_enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              </div>
            </div>

            <div className={`status-item ${status.mongodb_configured ? 'enabled' : 'disabled'}`}>
              <span className="status-icon">
                {status.mongodb_configured ? '✅' : '❌'}
              </span>
              <div>
                <strong>MongoDB Atlas</strong>
                <p>{status.mongodb_configured ? `Conectado (${status.configuration.database_name})` : 'No configurado'}</p>
              </div>
            </div>

            <div className={`status-item ${status.dropbox_configured ? 'enabled' : 'disabled'}`}>
              <span className="status-icon">
                {status.dropbox_configured ? '✅' : '❌'}
              </span>
              <div>
                <strong>Dropbox</strong>
                <p>{status.dropbox_configured ? 'Configurado' : 'No configurado'}</p>
              </div>
            </div>
          </div>

          {status.recommendations && status.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>📋 Recomendaciones:</h4>
              <ul>
                {status.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Lista de backups */}
      <div className="backups-list">
        <div className="backups-header">
          <h3>📁 Backups Disponibles ({backups.length})</h3>
          <button
            onClick={fetchBackupList}
            className="btn btn-small"
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="no-backups">
            <p>No se encontraron backups.</p>
            <p>Crea tu primer backup usando el botón "Crear Backup Manual".</p>
          </div>
        ) : (
          <div className="backups-table">
            <table>
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Tamaño</th>
                  <th>Fecha de Creación</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>
                      <span className="backup-name">{backup.name}</span>
                    </td>
                    <td>{formatFileSize(backup.size_mb)}</td>
                    <td>{formatDate(backup.modified)}</td>
                    <td>
                      <span className="backup-location">Dropbox</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="backup-info">
        <h4>ℹ️ Información del Sistema de Backup</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>🔄 Backup Automático:</strong>
            <p>Se ejecuta semanalmente de forma automática</p>
          </div>
          <div className="info-item">
            <strong>🗃️ Retención:</strong>
            <p>Se mantienen los 4 backups más recientes (aprox. 1 mes)</p>
          </div>
          <div className="info-item">
            <strong>📦 Contenido:</strong>
            <p>Base de datos completa con todas las colecciones</p>
          </div>
          <div className="info-item">
            <strong>☁️ Almacenamiento:</strong>
            <p>Dropbox (/yskandar_backups/)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;