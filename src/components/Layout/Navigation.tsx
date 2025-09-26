import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>Yskandar</h1>
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
        <NavLink
          to="/news"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          📰 Noticias
        </NavLink>
        <NavLink
          to="/video-calls"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          📹 Video Calls
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;