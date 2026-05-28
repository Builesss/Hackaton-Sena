import { THRESHOLDS, COLORS } from '../config/config';

// ─── Risk helpers ───────────────────────────────────────────
export const getCongestionLevel = (value) => {
  if (value >= THRESHOLDS.congestion.critical) return { label: 'Crítico', color: COLORS.accentRed, bg: 'rgba(255,71,87,0.15)' };
  if (value >= THRESHOLDS.congestion.high)     return { label: 'Alto',    color: COLORS.accentOrange, bg: 'rgba(255,149,0,0.15)' };
  if (value >= THRESHOLDS.congestion.medium)   return { label: 'Moderado',color: COLORS.accentYellow, bg: 'rgba(255,211,42,0.15)' };
  return { label: 'Normal', color: COLORS.success, bg: 'rgba(46,213,115,0.15)' };
};

export const getRiskLevel = (value) => {
  if (value >= THRESHOLDS.accident_risk.critical) return { label: 'Crítico', color: COLORS.accentRed };
  if (value >= THRESHOLDS.accident_risk.high)     return { label: 'Alto',    color: COLORS.accentOrange };
  if (value >= THRESHOLDS.accident_risk.medium)   return { label: 'Moderado',color: COLORS.accentYellow };
  return { label: 'Bajo', color: COLORS.success };
};

export const getRainRisk = (mm) => {
  if (mm >= THRESHOLDS.rain.critical) return { label: 'Extremo', color: COLORS.accentRed };
  if (mm >= THRESHOLDS.rain.high)     return { label: 'Alto',    color: COLORS.accentOrange };
  if (mm >= THRESHOLDS.rain.medium)   return { label: 'Moderado',color: COLORS.accentYellow };
  return { label: 'Bajo', color: COLORS.success };
};

// ─── Map marker colors ───────────────────────────────────────
export const getMarkerColor = (gravedad) => {
  const map = {
    fatal: '#FF4757',
    grave: '#FF9500',
    leve: '#FFD32A',
  };
  return map[gravedad] || '#8B9ABB';
};

export const createSvgMarker = (color, size = 12) => `
  <svg width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="${color}" opacity="0.9" />
    <circle cx="12" cy="12" r="12" fill="${color}" opacity="0.25" />
  </svg>
`;

// ─── Number formatters ────────────────────────────────────────
export const formatNumber = (n) =>
  new Intl.NumberFormat('es-CO').format(n);

export const formatPercent = (n) =>
  `${Math.round(n)}%`;

export const formatKmH = (n) =>
  `${n} km/h`;

// ─── Time helpers ─────────────────────────────────────────────
export const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// ─── Simulate real-time variance ─────────────────────────────
export const addNoise = (value, range = 5) => {
  const noise = (Math.random() - 0.5) * range * 2;
  return Math.max(0, Math.min(100, Math.round(value + noise)));
};

export const addAbsoluteNoise = (value, range = 3) => {
  const noise = (Math.random() - 0.5) * range * 2;
  return Math.max(0, Math.round(value + noise));
};

// ─── Local storage helpers ────────────────────────────────────
export const storage = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(`movilidata_${key}`);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(`movilidata_${key}`, JSON.stringify(value)); }
    catch { /* silent */ }
  },
};

// ─── PWA registration ─────────────────────────────────────────
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PWA] Service Worker registrado:', reg.scope);
    } catch (err) {
      console.warn('[PWA] Error al registrar SW:', err);
    }
  }
};
