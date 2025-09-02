import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import AuthModal from '../Auth/AuthModal';
import ChangePassword from '../Auth/ChangePassword';
import bibliotecaImage from '../../assets/images/biblioteca.jpg';


const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Link to="/">Iskandar Community</Link>
          </div>

          <div className="header-nav-image">
            <img 
              src={bibliotecaImage} 
              alt="Biblioteca" 
              className="nav-image"
            />
          </div>
          
          <nav className="nav">
            <Link to="/home">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/blog">Blog</Link>
                <Link to="/chat">Chat</Link>
                <Link to="/files">Files</Link>
                {isAdmin && <Link to="/admin">Admin</Link>}
              </>
            ) : (
              <>
                <span className="nav-link-disabled" title="Login required">Blog</span>
                <span className="nav-link-disabled" title="Login required">Chat</span>
                <span className="nav-link-disabled" title="Login required">Files</span>
              </>
            )}
          </nav>
          
          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-info">
                  Welcome, {user?.name}
                  {isAdmin && <span className="admin-badge"> (Admin)</span>}
                </span>
                <button 
                  onClick={() => setShowPasswordChange(true)}
                  className="btn btn-sm btn-secondary"
                  style={{ marginRight: '0.5rem' }}
                >
                  Change Password
                </button>
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  onClick={handleLogin}
                  className="btn btn-primary"
                >
                  Login
                </button>
                <button 
                  onClick={handleRegister}
                  className="btn btn-secondary"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      
      {showPasswordChange && (
        <div className="modal-overlay" onClick={() => setShowPasswordChange(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ChangePassword
              onClose={() => setShowPasswordChange(false)}
              onSuccess={() => {
                // Password changed successfully
                console.log('Password changed successfully');
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;