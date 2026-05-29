/**
 * mapIcons.js — Biblioteca de íconos SVG premium para todos los mapas de PREVIMED
 * Todos los íconos usan L.divIcon con SVG inline + animaciones CSS.
 */
import L from 'leaflet';

// ── Paleta semántica ─────────────────────────────────────────────
export const PALETTE = {
  critical: '#FF4757',
  high:     '#FF9500',
  medium:   '#FFD32A',
  low:      '#00DCB4',
  info:     '#0066FF',
  neutral:  '#636e72',
  metro:    '#e74c3c',
};

// ── Helper: color de congestión ──────────────────────────────────
export const congestionColor = (pct) => {
  if (pct >= 90) return PALETTE.critical;
  if (pct >= 70) return PALETTE.high;
  if (pct >= 45) return PALETTE.medium;
  return PALETTE.low;
};

// ── Helper: color PM2.5 ──────────────────────────────────────────
export const airColor = (val) => {
  if (val > 55) return PALETTE.critical;
  if (val > 35) return PALETTE.high;
  if (val > 12) return PALETTE.medium;
  return PALETTE.low;
};

// ── Helper: color lluvia ─────────────────────────────────────────
export const rainColor = (nivel) => {
  if (nivel === 'crítico') return PALETTE.critical;
  if (nivel === 'alto')    return PALETTE.high;
  return PALETTE.medium;
};

// ─────────────────────────────────────────────────────────────────
// TRÁFICO — Marcador circular con % de congestión + pulso
// ─────────────────────────────────────────────────────────────────
export const trafficIcon = (zona) => {
  const pct   = zona.congestion;
  const color = congestionColor(pct);
  const pulse = pct >= 80;
  const size  = pct >= 80 ? 56 : pct >= 50 ? 48 : 42;

  const pulseRing = pulse
    ? `<div style="
        position:absolute;inset:-8px;border-radius:50%;
        border:2px solid ${color};opacity:0.6;
        animation:trafficPulse 1.4s ease-out infinite;
      "></div>`
    : '';

  const speedLabel = zona.velocidad
    ? `<div style="font-size:9px;font-weight:700;color:${color};line-height:1;margin-top:1px">${zona.velocidad}<span style="font-size:7px;font-weight:400">km/h</span></div>`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes trafficPulse {
          0%   { transform: scale(1); opacity: .6; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulseRing}
        <div style="
          position:absolute;inset:0;
          border-radius:50%;
          background:radial-gradient(circle at 35% 35%, ${color}dd, ${color}88);
          border:3px solid ${color};
          box-shadow:0 4px 16px ${color}55, inset 0 1px 3px rgba(255,255,255,0.2);
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
        ">
          <div style="font-size:13px;font-weight:800;color:#fff;line-height:1">${pct}%</div>
          ${speedLabel}
        </div>
      </div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
};

// ─────────────────────────────────────────────────────────────────
// ACCIDENTES — Triángulo de advertencia SVG
// ─────────────────────────────────────────────────────────────────
export const accidentIcon = (gravedad) => {
  const color = gravedad === 'fatal'
    ? PALETTE.critical
    : gravedad === 'grave'
      ? PALETTE.high
      : PALETTE.medium;

  const size = gravedad === 'fatal' ? 28 : gravedad === 'grave' ? 24 : 20;
  const emoji = gravedad === 'fatal' ? '💀' : gravedad === 'grave' ? '🚨' : '⚠️';
  const glow  = gravedad === 'fatal'
    ? `filter:drop-shadow(0 0 6px ${color});`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size + 8}px;height:${size + 8}px;${glow}">
        <svg width="${size + 8}" height="${size + 8}" viewBox="0 0 48 48" fill="none">
          <polygon points="24,4 46,44 2,44"
            fill="${color}" fill-opacity="0.85"
            stroke="white" stroke-width="3" stroke-linejoin="round"/>
          <text x="24" y="38" font-size="18" text-anchor="middle">${emoji}</text>
        </svg>
      </div>`,
    iconSize:    [size + 8, size + 8],
    iconAnchor:  [(size + 8) / 2, size + 8],
    popupAnchor: [0, -(size + 10)],
  });
};

// ─────────────────────────────────────────────────────────────────
// LLUVIA / ZONAS DE RIESGO — Gota de agua animada
// ─────────────────────────────────────────────────────────────────
export const rainZoneIcon = (zona) => {
  const color  = rainColor(zona.nivel);
  const activo = zona.activo;
  const size   = zona.nivel === 'crítico' ? 52 : zona.nivel === 'alto' ? 44 : 38;
  const anim   = activo
    ? `animation:dropFloat 2.5s ease-in-out infinite;`
    : '';
  const glow   = activo
    ? `filter:drop-shadow(0 0 8px ${color});`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes dropFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      </style>
      <div style="position:relative;width:${size}px;height:${size + 8}px;${glow}">
        <div style="${anim}">
          <svg width="${size}" height="${size + 8}" viewBox="0 0 50 58" fill="none">
            <!-- Gota de agua -->
            <path d="M25 2 C25 2 6 26 6 38 A19 19 0 0 0 44 38 C44 26 25 2 25 2Z"
              fill="${color}" fill-opacity="${activo ? 0.9 : 0.5}"
              stroke="white" stroke-width="2.5"/>
            <!-- Reflejo interior -->
            <ellipse cx="18" cy="32" rx="4" ry="7" fill="white" fill-opacity="0.25" transform="rotate(-20 18 32)"/>
            <!-- Símbolo central -->
            <text x="25" y="40" font-size="14" text-anchor="middle" fill="white" font-weight="bold">
              ${activo ? '🌊' : '💧'}
            </text>
          </svg>
        </div>
        ${activo ? `<div style="
          position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);
          width:${size * 0.6}px;height:6px;
          border-radius:50%;background:${color};opacity:0.3;
          animation:dropFloat 2.5s ease-in-out infinite;
        "></div>` : ''}
      </div>`,
    iconSize:    [size, size + 8],
    iconAnchor:  [size / 2, size + 8],
    popupAnchor: [0, -(size + 12)],
  });
};

// ─────────────────────────────────────────────────────────────────
// CALIDAD DEL AIRE — Gauge circular con valor PM2.5
// ─────────────────────────────────────────────────────────────────
export const airQualityIcon = (estacion) => {
  const val   = estacion.valor;
  const displayVal = Math.round(val);
  const color = airColor(val);
  const label = val > 55 ? 'MUY MALO' : val > 35 ? 'MALO' : val > 12 ? 'MOD.' : 'BUENO';
  const size  = 52;

  // Arc SVG path for gauge
  const pct    = Math.min(100, (val / 70) * 100);
  const angle  = (pct / 100) * 220 - 110; // -110 to +110 degrees
  const rad    = (angle * Math.PI) / 180;
  const cx = 26; const cy = 32; const r = 18;
  const x = cx + r * Math.sin(rad);
  const y = cy - r * Math.cos(rad);

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:rgba(21,26,36,0.95);
        border:2px solid ${color};
        border-radius:12px;
        box-shadow:0 4px 20px ${color}44, 0 0 0 1px rgba(255,255,255,0.05);
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:2px;
      ">
        <div style="font-size:9px;font-weight:600;color:${color};letter-spacing:0.5px">${label}</div>
        <div style="font-size:16px;font-weight:800;color:#fff;line-height:1">${displayVal}</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.5)">µg/m³</div>
        <div style="width:36px;height:3px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;margin-top:2px">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;transition:width 0.5s"></div>
        </div>
      </div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
};

// ─────────────────────────────────────────────────────────────────
// FOTOMULTAS — Cámara de radar premium
// ─────────────────────────────────────────────────────────────────
export const cameraIcon = (activa = true) => {
  const color = activa ? PALETTE.critical : PALETTE.neutral;
  const glow  = activa ? `box-shadow:0 0 12px ${color}66, 0 4px 12px rgba(0,0,0,0.4);` : '';
  const pulse = activa
    ? `<div style="
        position:absolute;inset:-4px;border-radius:10px;
        border:1.5px solid ${color};opacity:0.5;
        animation:camPulse 2s ease-out infinite;
      "></div>`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes camPulse {
          0%   { transform:scale(1); opacity:.5; }
          70%  { transform:scale(1.4); opacity:0; }
          100% { transform:scale(1.4); opacity:0; }
        }
      </style>
      <div style="position:relative;width:38px;height:38px;">
        ${pulse}
        <div style="
          position:absolute;inset:0;
          background:${activa ? `linear-gradient(135deg, #2d3436, #1a1a2e)` : '#636e72'};
          border:2px solid ${color};
          border-radius:10px;
          ${glow}
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:1px;
        ">
          <svg width="20" height="14" viewBox="0 0 24 16" fill="none">
            <rect x="1" y="3" width="15" height="11" rx="2" fill="${color}" opacity="0.9"/>
            <polygon points="16,6 23,2 23,14 16,10" fill="${color}" opacity="0.75"/>
            <circle cx="8.5" cy="8.5" r="3" fill="white" opacity="0.9"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="${color}"/>
          </svg>
          ${activa ? `<div style="width:6px;height:6px;border-radius:50%;background:${color};animation:camPulse 1.5s ease-out infinite;margin-top:-1px"></div>` : ''}
        </div>
      </div>`,
    iconSize:    [38, 38],
    iconAnchor:  [19, 19],
    popupAnchor: [0, -22],
  });
};

// ─────────────────────────────────────────────────────────────────
// METRO — Pin de estación premium
// ─────────────────────────────────────────────────────────────────
export const metroIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:32px;height:38px;
      display:flex;flex-direction:column;align-items:center;
    ">
      <div style="
        width:32px;height:32px;
        background:linear-gradient(135deg,#c0392b,#e74c3c);
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 3px 12px rgba(231,76,60,0.5);
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:800;color:white;
        font-family:'Inter',sans-serif;
      ">M</div>
      <div style="
        width:2px;height:6px;
        background:white;
        box-shadow:0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>`,
  iconSize:    [32, 38],
  iconAnchor:  [16, 38],
  popupAnchor: [0, -40],
});

// ─────────────────────────────────────────────────────────────────
// BUSES (Live Tracking) — Ícono de bus en movimiento
// ─────────────────────────────────────────────────────────────────
export const busIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:40px;height:40px;
      background:linear-gradient(135deg, #27ae60, #2ecc71);
      border:3px solid white;
      border-radius:12px;
      box-shadow:0 6px 16px rgba(46,204,113,0.6);
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      transition: all 0.3s linear;
    ">🚌</div>`,
  iconSize:    [40, 40],
  iconAnchor:  [20, 20],
  popupAnchor: [0, -22],
});

// ─────────────────────────────────────────────────────────────────
// REPORTES CIUDADANOS (Waze style)
// ─────────────────────────────────────────────────────────────────
export const userReportIcon = (type) => {
  let bg = '#34495e';
  let emoji = '📍';
  
  if (type === 'Choque') { bg = PALETTE.critical; emoji = '💥'; }
  if (type === 'Inundación') { bg = PALETTE.info; emoji = '🌊'; }
  if (type === 'Peligro') { bg = PALETTE.high; emoji = '⚠️'; }

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:34px;height:34px;
        background:${bg};
        border:2px dashed white;
        border-radius:50%;
        box-shadow:0 4px 12px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;
        animation: pulseReport 2s infinite;
      ">
        ${emoji}
        <style>
          @keyframes pulseReport {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
          }
        </style>
      </div>`,
    iconSize:    [34, 34],
    iconAnchor:  [17, 17],
    popupAnchor: [0, -20],
  });
};

