import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import AuthModal from '../Auth/AuthModal';

const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
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
          
          <nav className="nav">
            <Link to="/blog">Blog</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/files">Files</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
          </nav>
          
          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-info">
                  Welcome, {user?.name}
                  {isAdmin && <span className="admin-badge"> (Admin)</span>}
                </span>
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
    </>
  );
};

export default Header;