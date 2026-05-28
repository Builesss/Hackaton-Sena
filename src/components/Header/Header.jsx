import React from 'react';
import { useLocation } from 'react-router-dom';
import { useClock } from '../../hooks/useRealTime';
import { NAV_ITEMS } from '../../config/config';

const Header = ({ onMenuClick, alertCount = 3 }) => {
  const location = useLocation();
  const time = useClock();

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
      </div>
    </header>
  );
};

export default Header;
