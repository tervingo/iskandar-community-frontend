import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>Iskandar Community</h1>
      </div>
      
      <div className="nav-links">
        <NavLink 
          to="/blog" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          📝 Blog
        </NavLink>
        <NavLink 
          to="/chat" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          💬 Chat
        </NavLink>
        <NavLink 
          to="/files" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          📁 Files
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;