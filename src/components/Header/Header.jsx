import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClock } from '../../hooks/useRealTime';
import { NAV_ITEMS } from '../../config/config';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth';

const Header = ({ onMenuClick, alertCount = 3 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const time = useClock();
  const { user, profile } = useAuth();

  const current = NAV_ITEMS.find((n) => n.path === location.pathname) || NAV_ITEMS[0];

  const timeStr = time.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = time.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : '?');

  return (
    <header className="header">
      <div className="header-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            style={{
              display: 'none',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 16,
            }}
            className="menu-btn"
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div>
            <div className="header-title">
              {current.icon} {current.label}
            </div>
            <div className="header-subtitle">
              Medellín Movilidata OS · {dateStr}
            </div>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div
          className="live-indicator"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <div className="live-dot" />
          LIVE
        </div>

        <div className="header-clock">{timeStr}</div>

        <button className="header-alert-btn" title="Alertas activas">
          🔔
          {alertCount > 0 && (
            <span className="alert-count">{alertCount}</span>
          )}
        </button>

        {user && (
          <div className="header-user-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginLeft: 6,
            borderLeft: '1px solid var(--border)',
            paddingLeft: 12
          }}>
            <div className="header-avatar" style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifycontent: 'center',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 12, color: '#fff',
              boxShadow: '0 0 10px rgba(0, 102, 255, 0.25)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} title={profile?.name || user.email}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }} className="header-user-info-text">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {profile?.name || user.email.split('@')[0]}
              </span>
              <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {profile?.role || 'Admin'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 71, 87, 0.1)',
                border: '1px solid rgba(255, 71, 87, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                color: '#FF4757',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                marginLeft: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FF4757';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)';
                e.currentTarget.style.color = '#FF4757';
              }}
              title="Cerrar sesión"
            >
              🚪 Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
