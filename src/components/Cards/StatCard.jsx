import React from 'react';

/**
 * Reusable stat card for KPI metrics
 */
const StatCard = ({ icon, value, label, delta, deltaType = 'neutral', color, bgColor, style }) => (
  <div className="stat-card animate-in" style={style}>
    <div
      className="stat-icon"
      style={{ background: bgColor || 'rgba(0,212,170,0.1)', color: color || 'var(--primary)' }}
    >
      {icon}
    </div>
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {delta && (
        <div className={`stat-delta ${deltaType}`}>
          {deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : '→'} {delta}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
