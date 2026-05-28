import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/config';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <NavLink to="/" className="sidebar-logo" onClick={onClose}>
          <div className="sidebar-logo-icon">🚦</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">Movilidata OS</span>
            <span className="sidebar-logo-sub">Medellín · HackData 2026</span>
          </div>
        </NavLink>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Módulos</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.id === 'trafico' && (
                <span className="nav-badge">LIVE</span>
              )}
            </NavLink>
          ))}

          <span className="nav-section-label" style={{ marginTop: 16 }}>Recursos</span>
          <a
            href="https://medata.gov.co/search/#"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
          >
            <span className="nav-icon">🗄️</span>
            <span className="nav-label">MeData</span>
          </a>
          <a
            href="https://siata.gov.co/siata_nuevo/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
          >
            <span className="nav-icon">🌧️</span>
            <span className="nav-label">SIATA</span>
          </a>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <div className="status-dot" />
            <span>Sistema operativo</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            v1.0.0 · CTGI SENA 2026
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
