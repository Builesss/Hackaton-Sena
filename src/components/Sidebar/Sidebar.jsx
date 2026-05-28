import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/config';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : '?');

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
          <div className="sidebar-logo-container" style={{
            width: 38,
            height: 38,
            background: 'linear-gradient(90deg, rgb(0, 102, 255), rgb(0, 220, 180))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            boxShadow: '0 0 16px var(--primary-glow)',
            flexShrink: 0
          }}>
            <img 
              src="/previmed.png" 
              alt="PREVIMED Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', background: '#2D3440' }} 
            />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">PREVIMED OS</span>
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
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'rgba(15, 23, 42, 0.02)' }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 16, background: 'rgba(45, 52, 64, 0.03)',
              border: '1px solid rgba(45, 52, 64, 0.08)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 12, color: '#fff',
                boxShadow: '0 0 10px rgba(0, 102, 255, 0.2)'
              }}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.name || user.email.split('@')[0]}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: 'var(--primary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: 'rgba(0, 102, 255, 0.08)', width: 'fit-content',
                  padding: '1px 5px', borderRadius: '4px', marginTop: 2
                }}>
                  {profile?.role || 'Admin'}
                </span>
              </div>
            </div>
          )}

          <div className="sidebar-status">
            <div className="sidebar-status-inner" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-dot" />
              <span>Sistema operativo</span>
            </div>
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
