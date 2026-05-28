import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup,
  Polyline, Marker, useMapEvents, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth';
import { getTrafficData, getAccidentsData, getWeatherData } from '../../services/api';
import { computeRoutes, reverseGeocode, geocodeAddress } from '../../services/routing';
import { getCongestionLevel, getRiskLevel, getMarkerColor } from '../../utils/helpers';
import '../../styles/navigator.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MEDELLIN = [6.2442, -75.5812];

// Custom SVG markers
const makeIcon = (color, label) => L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid #fff;
    box-shadow:0 3px 14px rgba(0,0,0,0.25);
    transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:13px;">${label}</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const originIcon = makeIcon('#0066FF', '📍');
const destIcon   = makeIcon('#00DCB4', '🎯');

// ─── Cloud icon factory for rain zones ─────────────────────────
const makeCloudIcon = (nivel, activo) => {
  const color = nivel === 'crítico' ? '#FF4757' : nivel === 'alto' ? '#FF9500' : '#64B5F6';
  const glow  = activo ? `drop-shadow(0 0 8px ${color})` : 'none';
  const anim  = activo ? 'cloud-float 3s ease-in-out infinite' : 'none';
  return L.divIcon({
    className: '',
    html: `<div style="animation:${anim};filter:${glow};">
      <svg width="64" height="44" viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="28" rx="26" ry="16" fill="${color}" opacity="0.85"/>
        <ellipse cx="22" cy="24" rx="14" ry="12" fill="${color}" opacity="0.9"/>
        <ellipse cx="40" cy="25" rx="12" ry="10" fill="${color}" opacity="0.9"/>
        <ellipse cx="32" cy="20" rx="16" ry="13" fill="${color}"/>
        ${activo ? `
        <line x1="22" y1="38" x2="19" y2="46" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <line x1="30" y1="40" x2="27" y2="50" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <line x1="38" y1="38" x2="35" y2="48" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        ` : ''}
      </svg>
    </div>`,
    iconSize:    [64, 56],
    iconAnchor:  [32, 44],
    popupAnchor: [0, -48],
  });
};

// ─── Map click handler component ───────────────────────────────
const MapClickHandler = ({ selectMode, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (selectMode) onMapClick(e.latlng);
    },
  });
  return null;
};

// ─── Fly-to helper ──────────────────────────────────────────────
const FlyTo = ({ point }) => {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 15, { duration: 1.2 });
  }, [point, map]);
  return null;
};

// ─── Format helpers ─────────────────────────────────────────────
const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
const fmtTime = (s) => {
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

// ─── Main Navigator Component ───────────────────────────────────
const Navigator = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // ── Datasets ──────────────────────────────────────────────────
  const [trafficData,   setTrafficData]   = useState(null);
  const [accidentsData, setAccidentsData] = useState(null);
  const [weatherData,   setWeatherData]   = useState(null);

  // ── Location state ────────────────────────────────────────────
  const [origin, setOrigin]   = useState(null); // { lat, lng, label }
  const [dest,   setDest]     = useState(null);
  const [originText, setOriginText] = useState('');
  const [destText,   setDestText]   = useState('');

  // ── Autocomplete ──────────────────────────────────────────────
  const [originSuggs, setOriginSuggs] = useState([]);
  const [destSuggs,   setDestSuggs]   = useState([]);
  const originTimer = useRef(null);
  const destTimer   = useRef(null);

  // ── Map selection mode ────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(null); // 'origin' | 'dest' | null

  // ── Routing ───────────────────────────────────────────────────
  const [routes,       setRoutes]       = useState([]);
  const [activeRoute,  setActiveRoute]  = useState(0);
  const [computing,    setComputing]    = useState(false);
  const [routeError,   setRouteError]   = useState('');

  // ── Layer toggles ─────────────────────────────────────────────
  const [showTraffic,   setShowTraffic]   = useState(true);
  const [showAccidents, setShowAccidents] = useState(true);
  const [showRain,      setShowRain]      = useState(true);

  // ── Fly-to point ──────────────────────────────────────────────
  const [flyTarget, setFlyTarget] = useState(null);

  // ── Load all datasets on mount ────────────────────────────────
  useEffect(() => {
    getTrafficData().then(setTrafficData).catch(console.warn);
    getAccidentsData().then(setAccidentsData).catch(console.warn);
    getWeatherData().then(setWeatherData).catch(console.warn);
  }, []);

  // ── Geolocation ───────────────────────────────────────────────
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const label = await reverseGeocode(pt.lat, pt.lng);
        setOrigin({ ...pt, label });
        setOriginText(label);
        setFlyTarget(pt);
      },
      () => alert('No se pudo obtener tu ubicación. Activa el GPS o ingrésala manualmente.'),
      { enableHighAccuracy: true }
    );
  };

  // ── Autocomplete: origin ──────────────────────────────────────
  const handleOriginInput = (val) => {
    setOriginText(val);
    setOrigin(null);
    clearTimeout(originTimer.current);
    if (val.length < 3) { setOriginSuggs([]); return; }
    originTimer.current = setTimeout(async () => {
      const results = await geocodeAddress(val);
      setOriginSuggs(results);
    }, 500);
  };

  const selectOriginSugg = (s) => {
    setOrigin({ lat: s.lat, lng: s.lng, label: s.label });
    setOriginText(s.label);
    setOriginSuggs([]);
    setFlyTarget({ lat: s.lat, lng: s.lng });
  };

  // ── Autocomplete: dest ────────────────────────────────────────
  const handleDestInput = (val) => {
    setDestText(val);
    setDest(null);
    clearTimeout(destTimer.current);
    if (val.length < 3) { setDestSuggs([]); return; }
    destTimer.current = setTimeout(async () => {
      const results = await geocodeAddress(val);
      setDestSuggs(results);
    }, 500);
  };

  const selectDestSugg = (s) => {
    setDest({ lat: s.lat, lng: s.lng, label: s.label });
    setDestText(s.label);
    setDestSuggs([]);
    setFlyTarget({ lat: s.lat, lng: s.lng });
  };

  // ── Map click to select origin/dest ──────────────────────────
  const handleMapClick = useCallback(async ({ lat, lng }) => {
    const label = await reverseGeocode(lat, lng);
    if (selectMode === 'origin') {
      setOrigin({ lat, lng, label });
      setOriginText(label);
    } else if (selectMode === 'dest') {
      setDest({ lat, lng, label });
      setDestText(label);
    }
    setSelectMode(null);
  }, [selectMode]);

  // ── Compute route ─────────────────────────────────────────────
  const handleComputeRoute = async () => {
    if (!origin || !dest) {
      setRouteError('Ingresa el origen y el destino antes de calcular la ruta.');
      return;
    }
    setRouteError('');
    setComputing(true);
    setRoutes([]);
    try {
      const result = await computeRoutes(origin, dest, trafficData, accidentsData, weatherData);
      setRoutes(result);
      setActiveRoute(0);
    } catch (err) {
      setRouteError('No se pudo calcular la ruta. Verifica los puntos seleccionados.');
    } finally {
      setComputing(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // ── Route colors ──────────────────────────────────────────────
  const routeColors = ['#0066FF', '#00DCB4', '#FF9500'];
  const best = routes[activeRoute];
  const initials = profile?.name ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="navigator-page">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="nav-topbar">

        {/* Logo */}
        <a href="/" className="nav-logo-pill" style={{ textDecoration: 'none' }}>
          <img src="/previmed.png" alt="PREVIMED" />
          <span>PREVIMED</span>
        </a>

        {/* Input fields */}
        <div className="nav-inputs">

          {/* Origin row */}
          <div className="nav-input-row" style={{ position: 'relative' }}>
            <div className="nav-dot origin" />
            <input
              className="nav-input"
              placeholder="📍 Ingresa tu origen o haz clic en el mapa…"
              value={originText}
              onChange={(e) => handleOriginInput(e.target.value)}
              onFocus={() => setSelectMode(null)}
              id="nav-origin-input"
            />
            <button
              className="nav-input-btn"
              title="Usar mi ubicación actual"
              onClick={handleGeolocate}
            >📡</button>
            <button
              className="nav-input-btn"
              title="Seleccionar en el mapa"
              style={{ color: selectMode === 'origin' ? 'var(--primary)' : undefined }}
              onClick={() => setSelectMode(m => m === 'origin' ? null : 'origin')}
            >🗺️</button>
            {originSuggs.length > 0 && (
              <div className="nav-autocomplete">
                {originSuggs.map((s, i) => (
                  <div key={i} className="nav-autocomplete-item" onClick={() => selectOriginSugg(s)}>
                    <span>📍</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destination row */}
          <div className="nav-input-row dest" style={{ position: 'relative' }}>
            <div className="nav-dot dest" />
            <input
              className="nav-input"
              placeholder="🎯 Ingresa tu destino o haz clic en el mapa…"
              value={destText}
              onChange={(e) => handleDestInput(e.target.value)}
              onFocus={() => setSelectMode(null)}
              id="nav-dest-input"
            />
            <button
              className="nav-input-btn"
              title="Seleccionar en el mapa"
              style={{ color: selectMode === 'dest' ? 'var(--secondary)' : undefined }}
              onClick={() => setSelectMode(m => m === 'dest' ? null : 'dest')}
            >🗺️</button>
            {destSuggs.length > 0 && (
              <div className="nav-autocomplete">
                {destSuggs.map((s, i) => (
                  <div key={i} className="nav-autocomplete-item" onClick={() => selectDestSugg(s)}>
                    <span>🎯</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Compute button */}
        <button
          className="nav-route-btn"
          onClick={handleComputeRoute}
          disabled={computing || !origin || !dest}
          id="nav-compute-btn"
        >
          {computing
            ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Calculando...</>
            : <>🧠 Calcular ruta</>
          }
        </button>

        {/* User menu */}
        <div className="nav-user-menu">
          <div className="nav-avatar" title={profile?.name || user?.email}>
            {initials}
          </div>
          <button className="nav-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            Salir
          </button>
        </div>
      </div>

      {/* ── Map select mode hint ─────────────────────────────── */}
      {selectMode && (
        <div className="nav-map-select-hint">
          {selectMode === 'origin'
            ? '📍 Haz clic en el mapa para establecer el ORIGEN'
            : '🎯 Haz clic en el mapa para establecer el DESTINO'}
        </div>
      )}

      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="nav-map-wrap">
        <MapContainer
          center={MEDELLIN}
          zoom={13}
          style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap | PREVIMED"
          />

          {/* ── TomTom Real-Time Traffic Layer (draws ON actual roads) ── */}
          {showTraffic && import.meta.env.VITE_TOMTOM_API_KEY && (
            <TileLayer
              url={`/tomtom/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${import.meta.env.VITE_TOMTOM_API_KEY}&thickness=3`}
              opacity={0.8}
              maxZoom={22}
              tileSize={256}
              attribution="© TomTom"
            />
          )}

          <MapClickHandler selectMode={selectMode} onMapClick={handleMapClick} />
          {flyTarget && <FlyTo point={flyTarget} />}


          {/* ── Accident Incidents ── */}
          {showAccidents && accidentsData?.incidents?.map((incident) => (
            <CircleMarker
              key={`inc-${incident.id}`}
              center={[incident.lat, incident.lng]}
              radius={incident.gravedad === 'fatal' ? 14 : incident.gravedad === 'grave' ? 10 : 7}
              fillColor={getMarkerColor(incident.gravedad)}
              color={getMarkerColor(incident.gravedad)}
              weight={2}
              opacity={0.9}
              fillOpacity={0.6}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: getMarkerColor(incident.gravedad) }}>
                    {incident.tipo} — {incident.gravedad.toUpperCase()}
                  </strong>
                  <br />
                  <span>📍 {incident.zona}</span><br />
                  <span>📅 {incident.fecha} · {incident.hora}</span><br />
                  <span>🤕 Víctimas: {incident.victimas}</span><br />
                  {incident.lluvia && <span>🌧️ Con lluvia activa</span>}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* ── Rain zones as animated cloud icons ── */}
          {showRain && weatherData?.zonasRiesgo?.map((z, i) => (
            <Marker
              key={`r-${i}`}
              position={[z.lat, z.lng]}
              icon={makeCloudIcon(z.nivel, z.activo)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>🌧️ {z.zona}</strong><br />
                  <span>⚠️ Riesgo: {z.riesgo}</span><br />
                  <span>Nivel: <strong style={{
                    color: z.nivel === 'crítico' ? '#FF4757' : z.nivel === 'alto' ? '#FF9500' : '#FFD32A'
                  }}>{z.nivel.toUpperCase()}</strong></span><br />
                  <span>Estado: {z.activo ? '🔴 ACTIVO' : '⚪ Inactivo'}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Routes polylines ── */}
          {routes.map((route, i) => (
            <Polyline
              key={`route-${i}`}
              positions={route.coords}
              pathOptions={{
                color: i === activeRoute ? routeColors[0] : '#9AA5B4',
                weight: i === activeRoute ? 6 : 3,
                opacity: i === activeRoute ? 0.92 : 0.45,
                dashArray: i === activeRoute ? undefined : '8 6',
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{ click: () => setActiveRoute(i) }}
            />
          ))}

          {/* ── Origin marker ── */}
          {origin && (
            <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
              <Popup>
                <strong>📍 Origen</strong><br />
                <span style={{ fontSize: 11 }}>{origin.label}</span>
              </Popup>
            </Marker>
          )}

          {/* ── Destination marker ── */}
          {dest && (
            <Marker position={[dest.lat, dest.lng]} icon={destIcon}>
              <Popup>
                <strong>🎯 Destino</strong><br />
                <span style={{ fontSize: 11 }}>{dest.label}</span>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* ── Loading overlay ── */}
        {computing && (
          <div className="nav-loading-overlay">
            <div className="nav-loading-pill">
              <div className="spinner" />
              Analizando rutas con IA PREVIMED…
            </div>
          </div>
        )}

        {/* ── Layer toggles panel ── */}
        <div className="nav-layers-panel">
          <div className="nav-layers-title">Capas del mapa</div>
          {[
            { key: 'traffic',   label: '🚦 Tráfico',     val: showTraffic,   set: setShowTraffic,   cls: '' },
            { key: 'accidents', label: '⚠️ Accidentes',  val: showAccidents, set: setShowAccidents, cls: '' },
            { key: 'rain',      label: '🌧️ Lluvia',      val: showRain,      set: setShowRain,      cls: 'orange' },
          ].map(({ key, label, val, set, cls }) => (
            <div key={key} className="nav-layer-toggle" onClick={() => set(v => !v)}>
              <div className={`nav-toggle-switch ${val ? `on ${cls}` : ''}`} />
              <span className="nav-layer-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Route error ── */}
        {routeError && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,71,87,0.95)', color: '#fff', borderRadius: 10,
            padding: '10px 20px', fontSize: 13, fontWeight: 600, zIndex: 600,
            boxShadow: '0 4px 20px rgba(255,71,87,0.35)', whiteSpace: 'nowrap',
          }}>
            ⚠️ {routeError}
          </div>
        )}

        {/* ── Route info strip ── */}
        {routes.length > 0 && best && (
          <div className="nav-route-strip">
            <div className="nav-strip-header">
              <div className="nav-strip-title">
                🧠 Ruta PREVIMED IA
                {routes.length > 1 && (
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                    · {routes.length} alternativas
                  </span>
                )}
              </div>
              <div className="nav-score-badge">
                🏆 {best.safetyScore}/100
              </div>
            </div>

            <div className="nav-strip-stats">
              <div className="nav-stat-item">
                <span className="nav-stat-label">Tiempo</span>
                <span className="nav-stat-value">{fmtTime(best.duration)}</span>
              </div>
              <div className="nav-stat-item">
                <span className="nav-stat-label">Distancia</span>
                <span className="nav-stat-value">{fmtDist(best.distance)}</span>
              </div>
              <div className="nav-stat-item">
                <span className="nav-stat-label">Tráfico</span>
                <span className="nav-stat-value" style={{ color: best.trafficPenalty > 50 ? 'var(--warning)' : 'var(--success)' }}>
                  {best.trafficPenalty > 50 ? 'Alto' : best.trafficPenalty > 25 ? 'Medio' : 'Bajo'}
                </span>
              </div>
              <div className="nav-stat-item">
                <span className="nav-stat-label">Seguridad</span>
                <span className="nav-stat-value" style={{ color: best.safetyScore >= 70 ? 'var(--success)' : best.safetyScore >= 45 ? 'var(--warning)' : 'var(--danger)' }}>
                  {best.safetyScore >= 70 ? '✅ Alta' : best.safetyScore >= 45 ? '⚠️ Media' : '🔴 Baja'}
                </span>
              </div>
            </div>

            {best.hazards?.length > 0 && (
              <div className="nav-hazards">
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, alignSelf: 'center' }}>Peligros:</span>
                {best.hazards.slice(0, 4).map((h, i) => (
                  <div key={i} className={`nav-hazard-chip ${h.type}`}>
                    {h.type === 'traffic' ? '🚦' : h.type === 'accident' ? '⚠️' : '🌧️'}
                    {h.name}
                  </div>
                ))}
              </div>
            )}

            {routes.length > 1 && (
              <div className="nav-alt-routes">
                {routes.map((r, i) => (
                  <button
                    key={i}
                    className={`nav-alt-btn ${activeRoute === i ? 'active' : ''}`}
                    onClick={() => setActiveRoute(i)}
                  >
                    {i === 0 ? '🏆 Óptima' : `Ruta ${i + 1}`}
                    <br />
                    <span style={{ opacity: 0.75 }}>{fmtTime(r.duration)} · {r.safetyScore}pts</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navigator;
