import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import AdminPanel from './AdminPanel';
import CategoryManagement from './CategoryManagement';
import AdminNotifications from './AdminNotifications';
import UserEmailPreferences from './UserEmailPreferences';
import UserActivityLogs from './UserActivityLogs';
import BackupManagement from './BackupManagement';

type AdminTab = 'users' | 'categories' | 'notifications' | 'preferences' | 'activity' | 'backup';

interface AdminTabConfig {
  id: AdminTab;
  label: string;
  icon: string;
  component: React.ComponentType;
}

const adminTabs: AdminTabConfig[] = [
  { id: 'users', label: 'Usuarios', icon: '👥', component: AdminPanel },
  { id: 'categories', label: 'Categorías', icon: '📁', component: CategoryManagement },
  { id: 'notifications', label: 'Notificaciones', icon: '📧', component: AdminNotifications },
  { id: 'preferences', label: 'Preferencias', icon: '⚙️', component: UserEmailPreferences },
  { id: 'activity', label: 'Actividad', icon: '📊', component: UserActivityLogs },
  { id: 'backup', label: 'Backups', icon: '🗄️', component: BackupManagement },
];

const UnifiedAdminPanel: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (!isAdmin) {
    return <div className="access-denied">Se requiere acceso de administrador.</div>;
  }

  const ActiveComponent = adminTabs.find(tab => tab.id === activeTab)?.component || AdminPanel;

  return (
    <div className="unified-admin-panel">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <div className="admin-tabs">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default UnifiedAdminPanel;