import React, { useState } from 'react';
import EmailPreferences from './EmailPreferences';
import TelegramSettings from './TelegramSettings';
import ChangePassword from '../Auth/ChangePassword';
import './AccountManagement.css';

const AccountManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'telegram' | 'password'>('email');
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="account-management">
      <div className="account-header">
        <h1>Administrar Cuenta</h1>
        <p>Gestiona tus preferencias de email y configuración de cuenta</p>
      </div>

      <div className="account-tabs">
        <button
          className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Preferencias de Email
        </button>
        <button
          className={`tab-button ${activeTab === 'telegram' ? 'active' : ''}`}
          onClick={() => setActiveTab('telegram')}
        >
          🤖 Telegram
        </button>
        <button
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          🔐 Cambiar Contraseña
        </button>
      </div>

      <div className="account-content">
        {activeTab === 'email' && (
          <div className="tab-content">
            <EmailPreferences />
          </div>
        )}

        {activeTab === 'telegram' && (
          <div className="tab-content">
            <TelegramSettings />
          </div>
        )}

        {activeTab === 'password' && (
          <div className="tab-content">
            <div className="password-section">
              <h3>Cambiar Contraseña</h3>
              <p>Actualiza tu contraseña para mantener tu cuenta segura.</p>
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                Cambiar Contraseña
              </button>
            </div>
          </div>
        )}
      </div>

      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ChangePassword
              onClose={() => setShowChangePassword(false)}
              onSuccess={() => {
                setShowChangePassword(false);
                // Show success message
                console.log('Password changed successfully');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;