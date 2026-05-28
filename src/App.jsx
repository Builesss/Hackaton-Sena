import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Accidentalidad from './pages/Accidentalidad/Accidentalidad';
import Trafico from './pages/Trafico/Trafico';
import Prediccion from './pages/Prediccion/Prediccion';
import RutasLluvias from './pages/RutasLluvias/RutasLluvias';

import './styles/main.css';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
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
            <Routes>
              <Route path="/"              element={<Dashboard />} />
              <Route path="/accidentalidad" element={<Accidentalidad />} />
              <Route path="/trafico"        element={<Trafico />} />
              <Route path="/prediccion"     element={<Prediccion />} />
              <Route path="/lluvias"        element={<RutasLluvias />} />
            </Routes>
          </main>
        </div>
      </div>

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
