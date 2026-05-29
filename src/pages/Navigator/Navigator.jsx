import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, Popup,
  Polyline, Marker, useMapEvents, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth';
import { getTrafficData, getAccidentsData, getWeatherData, getCamerasData, getAirQualityData } from '../../services/api';
import { computeRoutes, reverseGeocode, geocodeAddress } from '../../services/routing';
import { getCongestionLevel, getRiskLevel, getMarkerColor } from '../../utils/helpers';
import { accidentIcon, cameraIcon, metroIcon, airQualityIcon, rainZoneIcon, busIcon, userReportIcon } from '../../utils/mapIcons';
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

// ─── Map click handler component ───────────────────────────────
const MapClickHandler = ({ selectMode, onMapClick, onContextMenu }) => {
  useMapEvents({
    click(e) {
      if (selectMode) onMapClick(e.latlng);
    },
    contextmenu(e) {
      if (!selectMode && onContextMenu) onContextMenu(e.latlng);
    }
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
  const [camerasData,   setCamerasData]   = useState(null);
  const [airData,       setAirData]       = useState(null);

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
  const [showCameras,   setShowCameras]   = useState(true);
  const [showAir,       setShowAir]       = useState(false);
  const [showBuses,     setShowBuses]     = useState(true);

  // ── Fly-to point ──────────────────────────────────────────────
  const [flyTarget, setFlyTarget] = useState(null);

  // ── User Reports & Buses ──────────────────────────────────────
  const [userReports, setUserReports] = useState([]);
  const [reportModal, setReportModal] = useState(null); // { lat, lng }
  const [buses, setBuses] = useState([
    { id: 1, route: [[6.2625, -75.5780], [6.2400, -75.5840]], t: 0, dir: 1, speed: 0.002 },
    { id: 2, route: [[6.2300, -75.5900], [6.2550, -75.5650]], t: 0.5, dir: -1, speed: 0.0015 },
    { id: 3, route: [[6.2450, -75.5800], [6.2700, -75.5500]], t: 0.2, dir: 1, speed: 0.0025 }
  ]);

  // ── Load all datasets on mount ────────────────────────────────
  useEffect(() => {
    getTrafficData().then(setTrafficData).catch(console.warn);
    getAccidentsData().then(setAccidentsData).catch(console.warn);
    getWeatherData().then(setWeatherData).catch(console.warn);
    getCamerasData().then(setCamerasData).catch(console.warn);
    getAirQualityData().then(setAirData).catch(console.warn);
  }, []);

  // ── Live Bus Tracking interval ────────────────────────────────
  useEffect(() => {
    if (!showBuses) return;
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        let nt = bus.t + bus.dir * bus.speed;
        let ndir = bus.dir;
        if (nt >= 1) { nt = 1; ndir = -1; }
        if (nt <= 0) { nt = 0; ndir = 1; }
        return { ...bus, t: nt, dir: ndir };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [showBuses]);

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
    if (selectMode === 'origin') {
      const label = await reverseGeocode(lat, lng);
      setOrigin({ lat, lng, label });
      setOriginText(label);
      setSelectMode(null);
    } else if (selectMode === 'dest') {
      const label = await reverseGeocode(lat, lng);
      setDest({ lat, lng, label });
      setDestText(label);
      setSelectMode(null);
    }
  }, [selectMode]);

  // ── Map contextmenu (long press) to report ───────────────────
  const handleMapContextMenu = useCallback(({ lat, lng }) => {
    setReportModal({ lat, lng });
  }, []);

  const submitReport = (type) => {
    setUserReports(prev => [...prev, { ...reportModal, type, id: Date.now() }]);
    setReportModal(null);
  };

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

          <MapClickHandler selectMode={selectMode} onMapClick={handleMapClick} onContextMenu={handleMapContextMenu} />
          {flyTarget && <FlyTo point={flyTarget} />}

          {/* ── User Reports ── */}
          {userReports.map(r => (
            <Marker key={`rep-${r.id}`} position={[r.lat, r.lng]} icon={userReportIcon(r.type)}>
              <Popup>
                <strong>Reporte Ciudadano</strong><br/>
                <span style={{color: 'var(--text-secondary)'}}>{r.type}</span>
              </Popup>
            </Marker>
          ))}

          {/* ── Live Tracking Buses ── */}
          {showBuses && buses.map(b => {
            const lat = b.route[0][0] + (b.route[1][0] - b.route[0][0]) * b.t;
            const lng = b.route[0][1] + (b.route[1][1] - b.route[0][1]) * b.t;
            return (
              <Marker key={`bus-${b.id}`} position={[lat, lng]} icon={busIcon}>
                <Popup>
                  <strong>Metroplús en Ruta</strong><br/>
                  Unidad: #{b.id * 1024}
                </Popup>
              </Marker>
            );
          })}


          {/* ── Accident Incidents — Warning Triangle Icons ── */}
          {showAccidents && accidentsData?.incidents?.map((incident) => (
            <Marker
              key={`inc-${incident.id}`}
              position={[incident.lat, incident.lng]}
              icon={accidentIcon(incident.gravedad)}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <strong style={{ color: getMarkerColor(incident.gravedad), fontSize: 13 }}>
                    {incident.tipo}
                  </strong>
                  <div style={{ margin: '5px 0 4px', display:'flex', gap:6 }}>
                    <span style={{
                      background: getMarkerColor(incident.gravedad),
                      color: '#fff', borderRadius: 6,
                      padding: '2px 8px', fontSize: 11, fontWeight: 700
                    }}>{incident.gravedad.toUpperCase()}</span>
                    {incident.lluvia && <span style={{ fontSize: 11, color: '#6C63FF' }}>🌧️ Lluvia</span>}
                  </div>
                  <span style={{ fontSize: 12 }}>📍 {incident.zona}</span><br />
                  <span style={{ fontSize: 12 }}>📅 {incident.fecha} · {incident.hora}</span><br />
                  <span style={{ fontSize: 12 }}>🤕 Víctimas: <strong>{incident.victimas}</strong></span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Cameras / Fotomultas — SVG Camera Icons ── */}
          {showCameras && camerasData?.cameras?.map((cam) => (
            <Marker
              key={cam.id}
              position={[cam.lat, cam.lng]}
              icon={cameraIcon(cam.activa !== false)}
            >
              <Popup>
                <div style={{ minWidth: 185 }}>
                  <strong style={{ color: cam.activa !== false ? '#FF4757' : '#636e72' }}>
                    📷 {cam.nombre}
                  </strong><br />
                  <span style={{ fontSize: 12 }}>{cam.tipo}</span><br />
                  {cam.limite && <span style={{ fontSize: 12 }}>🚗 Límite: <strong>{cam.limite} km/h</strong></span>}
                  {cam.limite && <br />}
                  {cam.zona && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📍 {cam.zona}</span>}
                  {cam.zona && <br />}
                  <span style={{
                    fontSize: 11,
                    color: cam.activa !== false ? '#00DCB4' : '#b2bec3',
                    fontWeight: 600
                  }}>
                    {cam.activa !== false ? '🟢 ACTIVA' : '⚫ Inactiva'}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Puntos Metro (from cameras.json) ── */}
          {showCameras && camerasData?.puntos_metro?.map((pt) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              icon={metroIcon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: '#e74c3c' }}>🚇 {pt.nombre}</strong><br />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pt.tipo}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Air Quality Stations — Gauge Card Icons ── */}
          {showAir && airData?.estaciones?.map((est, i) => (
            <Marker
              key={`aq-${i}`}
              position={[est.lat, est.lng]}
              icon={airQualityIcon(est)}
            >
              <Popup>
                <div style={{ minWidth: 175 }}>
                  <strong style={{ fontSize: 13 }}>💨 {est.nombre}</strong><br />
                  <div style={{ margin: '5px 0 4px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      background: est.valor > 55 ? '#FF4757' : est.valor > 35 ? '#FF9500' : est.valor > 12 ? '#FFD32A' : '#00DCB4',
                      color: est.valor <= 35 && est.valor > 12 ? '#1a1a2e' : '#fff',
                      borderRadius: 6, padding: '2px 8px',
                      fontSize: 11, fontWeight: 700
                    }}>
                      {est.valor > 55 ? 'MUY MALO' : est.valor > 35 ? 'MALO' : est.valor > 12 ? 'MODERADO' : 'BUENO'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12 }}>PM2.5: <strong>{est.valor} µg/m³</strong></span><br />
                  <div style={{ marginTop: 6, width: '100%', height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 99 }}>
                    <div style={{
                      width: `${Math.min(100, (est.valor / 70) * 100)}%`,
                      height: '100%',
                      background: est.valor > 55 ? '#FF4757' : est.valor > 35 ? '#FF9500' : est.valor > 12 ? '#FFD32A' : '#00DCB4',
                      borderRadius: 99
                    }} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Rain zones — Animated Water Drop Icons ── */}
          {showRain && weatherData?.zonasRiesgo?.map((z, i) => (
            <Marker
              key={`r-${i}`}
              position={[z.lat, z.lng]}
              icon={rainZoneIcon(z)}
            >
              <Popup>
                <div style={{ minWidth: 175 }}>
                  <strong style={{ fontSize: 13 }}>🌧️ {z.zona}</strong><br />
                  <div style={{ margin: '5px 0 4px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      background: z.nivel === 'crítico' ? '#FF4757' : z.nivel === 'alto' ? '#FF9500' : '#FFD32A',
                      color: '#fff', borderRadius: 6,
                      padding: '2px 8px', fontSize: 11, fontWeight: 700
                    }}>{z.nivel.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Riesgo: <strong>{z.riesgo}</strong></span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: z.activo ? '#FF4757' : '#b2bec3' }}>
                    {z.activo ? '🔴 ZONA ACTIVA' : '⚪ Inactiva'}
                  </span>
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

        {/* ── Report Modal (Waze style) ── */}
        {reportModal && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setReportModal(null)}>
            <div style={{
              background: '#fff', padding: 24, borderRadius: 16, width: 300, textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Crear Reporte Ciudadano</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>¿Qué acabas de ver en esta ubicación?</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => submitReport('Choque')} style={{ padding: '12px 16px', background: 'rgba(255,71,87,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 12, cursor: 'pointer', flex: 1 }}>💥 Choque</button>
                <button onClick={() => submitReport('Inundación')} style={{ padding: '12px 16px', background: 'rgba(0,102,255,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: 12, cursor: 'pointer', flex: 1 }}>🌊 Inundación</button>
                <button onClick={() => submitReport('Peligro')} style={{ padding: '12px 16px', background: 'rgba(255,149,0,0.1)', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: 12, cursor: 'pointer', flex: '1 1 100%' }}>⚠️ Otro Peligro</button>
              </div>
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
            { key: 'cameras',   label: '📷 Radares',     val: showCameras,   set: setShowCameras,   cls: '' },
            { key: 'air',       label: '💨 Aire',        val: showAir,       set: setShowAir,       cls: 'info' },
            { key: 'buses',     label: '🚌 Buses Live',  val: showBuses,     set: setShowBuses,     cls: 'green' },
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
