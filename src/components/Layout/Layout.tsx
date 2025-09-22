import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2025 Yskandar. Todos los derechos reservados.</p>
          <div className="footer-links">
            <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;