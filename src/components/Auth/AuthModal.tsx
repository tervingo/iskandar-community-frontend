import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Trigger form reset when modal opens
  useEffect(() => {
    if (isOpen) {
      const timestamp = Date.now();
      setResetTrigger(timestamp);
    }
  }, [isOpen]);

  const handleLoginSuccess = () => {
    onClose();
  };

  const handleRegisterSuccess = () => {
    setMode('login');
    // Show success message or automatically log in
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        
        {mode === 'login' ? (
          <Login
            onLoginSuccess={handleLoginSuccess}
            shouldReset={resetTrigger > 0}
          />
        ) : (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;