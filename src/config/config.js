// ============================================================
//  Medellín Movilidata OS — Global Configuration
// ============================================================

export const APP_CONFIG = {
  name: 'PREVIMED Movilidata OS',
  version: '1.0.0',
  description: 'Plataforma Unificada de Movilidad Inteligente',
  hackathon: 'HackData CTGI SENA 2026',
};

// Medellín center coordinates
export const MAP_CONFIG = {
  center: [6.2442, -75.5812],
  zoom: 13,
  minZoom: 11,
  maxZoom: 18,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors | Movilidata OS',
};

// API endpoints (mock/real)
export const API_ENDPOINTS = {
  accidents: '/data/accidents.json',
  traffic: '/data/traffic.json',
  weather: '/data/weather.json',
  // Real endpoints (reference):
  observatorioMovilidad: 'https://www.medellin.gov.co/es/secretaria-de-movilidad/observatorio-de-movilidad/',
  sim: 'https://www.medellin.gov.co/es/secretaria-de-movilidad/sistema-inteligente-de-movilidad-de-medellin/',
  medata: 'https://medata.gov.co/search/#',
  siata: 'https://siata.gov.co/siata_nuevo/',
  datosGov: 'https://www.datos.gov.co/',
};

// Real-time update intervals (ms)
export const INTERVALS = {
  trafficUpdate: 5000,   // 5 seconds (simulated, real = 5 min)
  weatherUpdate: 10000,  // 10 seconds
  alertsUpdate: 8000,
};

// Risk thresholds
export const THRESHOLDS = {
  congestion: { low: 40, medium: 65, high: 80, critical: 90 },
  rain: { low: 5, medium: 15, high: 25, critical: 40 },
  accident_risk: { low: 30, medium: 55, high: 75, critical: 85 },
};

// Color palette — design system tokens
export const COLORS = {
  primary: '#0066FF',
  primaryDark: '#0052CC',
  secondary: '#00DCB4',
  accentRed: '#FF4757',
  accentOrange: '#FF9500',
  accentBlue: '#0066FF',
  accentYellow: '#FF9500',
  bgBase: '#151A24',
  bgSurface: '#1E2430',
  bgCard: '#2D3440',
  textPrimary: '#F5F7FA',
  textSecondary: '#A0AEC0',
  success: '#00DCB4',
  warning: '#FF9500',
  danger: '#FF4757',
  info: '#0066FF',
};

// Chart.js global defaults
export const CHART_DEFAULTS = {
  animation: { duration: 800, easing: 'easeInOutQuart' },
  plugins: {
    legend: {
      labels: { color: '#8B9ABB', font: { family: 'Inter', size: 12 } },
    },
  },
  scales: {
    x: {
      ticks: { color: '#8B9ABB', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: '#8B9ABB', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
};

// Navigation items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏙️', path: '/' },
  { id: 'accidentalidad', label: 'Zonas Críticas', icon: '⚠️', path: '/accidentalidad' },
  { id: 'trafico', label: 'Tráfico en Vivo', icon: '🚦', path: '/trafico' },
  { id: 'prediccion', label: 'Predicción IA', icon: '🧠', path: '/prediccion' },
  { id: 'lluvias', label: 'Rutas Seguras', icon: '🌧️', path: '/lluvias' },
];
