import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import AuthModal from '../Auth/AuthModal';
import OnlineUsers from './OnlineUsers';
import bibliotecaImage from '../../assets/images/iskandariya.jpg';


const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Link to="/">Yskandar</Link>
          </div>

          <div className="header-nav-image">
            <img 
              src={bibliotecaImage} 
              alt="Biblioteca" 
              className="nav-image"
            />
          </div>
          
          <nav className="nav">
            <Link to="/home">Inicio</Link>
            {isAuthenticated ? (
              <>
                <Link to="/blog">Blog</Link>
                <Link to="/news">Noticias</Link>
                <Link to="/chat">Chat</Link>
                <Link to="/files">Archivo</Link>
                {isAdmin && <Link to="/admin">Admin</Link>}
              </>
            ) : (
              <>
                <span className="nav-link-disabled" title="Inicio de sesión requerido">Blog</span>
                <span className="nav-link-disabled" title="Inicio de sesión requerido">Noticias</span>
                <span className="nav-link-disabled" title="Inicio de sesión requerido">Chat</span>
                <span className="nav-link-disabled" title="Inicio de sesión requerido">Archivo</span>
              </>
            )}
          </nav>
          
          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <OnlineUsers />
                </div>
                <span className="user-info">
                  Bienvenida/o, {user?.name}
                  {isAdmin && <span className="admin-badge"> (Admin)</span>}
                </span>
                <Link 
                  to="/account"
                  className="btn btn-sm btn-outline"
                >
                  ⚙️ Administrar cuenta
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  onClick={handleLogin}
                  className="btn btn-primary"
                >
                  Iniciar Sesión
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