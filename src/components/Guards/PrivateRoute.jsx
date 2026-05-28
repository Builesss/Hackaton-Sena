import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Loading spinner ───────────────────────────────────────────
const AuthSpinner = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-base)',
    flexDirection: 'column', gap: 16,
  }}>
    <div className="spinner" />
    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Verificando sesión...</p>
  </div>
);

// ─── Requires any authenticated user ──────────────────────────
export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ─── Admin-only route ──────────────────────────────────────────
export const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'user') return <Navigate to="/mapa" replace />;
  return children;
};

// ─── User-only route ───────────────────────────────────────────
export const UserRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/" replace />;
  return children;
};
