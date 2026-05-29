import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { AdminRoute, UserRoute } from './components/Guards/PrivateRoute';

import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Copilot from './components/Copilot/Copilot';

import './styles/main.css';

// Lazy-loaded routes for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Accidentalidad = lazy(() => import('./pages/Accidentalidad/Accidentalidad'));
const Trafico = lazy(() => import('./pages/Trafico/Trafico'));
const Prediccion = lazy(() => import('./pages/Prediccion/Prediccion'));
const RutasLluvias = lazy(() => import('./pages/RutasLluvias/RutasLluvias'));
const Navigator = lazy(() => import('./pages/Navigator/Navigator'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));

// Global Fallback Loader
const PageLoader = () => (
  <div className="loading-container" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4F7FA' }}>
    <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(0, 102, 255, 0.2)', borderTopColor: '#0066FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <p style={{ marginTop: 16, fontSize: 14, color: '#636e72', fontWeight: 500 }}>Cargando módulo...</p>
  </div>
);

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen((o) => !o)}
          alertCount={3}
        />

        <main className="page-wrapper">
          {children}
        </main>
      </div>

      {/* Global AI Copilot for Admin */}
      <Copilot />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Navigator Route */}
            <Route
              path="/mapa"
              element={
                <UserRoute>
                  <Navigator />
                </UserRoute>
              }
            />

            {/* Admin Routes wrapped in AdminRoute and AdminLayout */}
            <Route
              path="/"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/accidentalidad"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Accidentalidad />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/trafico"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Trafico />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/prediccion"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Prediccion />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/lluvias"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <RutasLluvias />
                  </AdminLayout>
                </AdminRoute>
              }
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#182040',
            color: '#F0F4FF',
            border: '1px solid rgba(255,255,255,0.07)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#2ED573', secondary: '#182040' } },
          error:   { iconTheme: { primary: '#FF4757', secondary: '#182040' } },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
