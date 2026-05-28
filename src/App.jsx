import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { AdminRoute, UserRoute } from './components/Guards/PrivateRoute';

import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Accidentalidad from './pages/Accidentalidad/Accidentalidad';
import Trafico from './pages/Trafico/Trafico';
import Prediccion from './pages/Prediccion/Prediccion';
import RutasLluvias from './pages/RutasLluvias/RutasLluvias';
import Navigator from './pages/Navigator/Navigator';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

import './styles/main.css';

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
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
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
