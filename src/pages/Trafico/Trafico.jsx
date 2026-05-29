import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { trafficIcon } from '../../utils/mapIcons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { getTrafficData } from '../../services/api';
import { useSimulatedTraffic } from '../../hooks/useRealTime';
import { getCongestionLevel, formatNumber, formatKmH } from '../../utils/helpers';
import { MAP_CONFIG, CHART_DEFAULTS } from '../../config/config';
import StatCard from '../../components/Cards/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const Trafico = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daySelected, setDaySelected] = useState('viernes');

  useEffect(() => {
    getTrafficData().then((d) => { setData(d); setLoading(false); });
  }, []);

  const liveZones = useSimulatedTraffic(data?.zonas, 3500);

  if (loading) return (
    <div className="loading-container"><div className="spinner" /><p>Cargando tráfico en tiempo real...</p></div>
  );

  const sorted = [...(liveZones || [])].sort((a, b) => b.congestion - a.congestion);
  const criticas = sorted.filter((z) => z.congestion >= 80);
  const avgCong = Math.round(sorted.reduce((s, z) => s + z.congestion, 0) / sorted.length);
  const avgVel = Math.round(sorted.reduce((s, z) => s + z.velocidad, 0) / sorted.length);
  const totalFlow = formatNumber(sorted.reduce((s, z) => s + z.flujo, 0));

  const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom' };

  const lineData = {
    labels: data.seriesTemporal.labels,
    datasets: [{
      label: `Congestión — ${dayLabels[daySelected]}`,
      data: data.seriesTemporal[daySelected],
      borderColor: '#00DCB4',
      backgroundColor: 'rgba(0, 220, 180, 0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#00DCB4',
      borderWidth: 2,
    }],
  };

  const lineOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: false },
    },
    scales: {
      ...CHART_DEFAULTS.scales,
      y: {
        ...CHART_DEFAULTS.scales.y,
        min: 0,
        max: 100,
        ticks: {
          ...CHART_DEFAULTS.scales.y.ticks,
          callback: (v) => `${v}%`,
        },
      },
    },
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🚦 Tráfico en Tiempo Real</h1>
          <p>Flujo vehicular actualizado · Detección automática de congestión con umbrales dinámicos</p>
        </div>
        <div className="page-header-actions">
          <div className="live-indicator"><div className="live-dot" /> ACTUALIZANDO CADA 5s</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="📊" value={`${avgCong}%`} label="Congestión Promedio"
          delta={criticas.length > 0 ? `${criticas.length} zonas críticas` : 'Sin zonas críticas'}
          deltaType={criticas.length > 2 ? 'up' : 'neutral'} color="#FF9500" bgColor="rgba(255,149,0,0.12)" />
        <StatCard icon="🚗" value={formatKmH(avgVel)} label="Velocidad Promedio"
          delta={avgVel < 20 ? 'Muy lento' : avgVel < 35 ? 'Moderado' : 'Fluido'}
          deltaType={avgVel < 20 ? 'up' : 'down'} color="#6C63FF" bgColor="rgba(108,99,255,0.12)" />
        <StatCard icon="🔢" value={totalFlow} label="Vehículos/hora total"
          color="#00DCB4" bgColor="rgba(0,220,180,0.12)" />
        <StatCard icon="🔴" value={criticas.length} label="Zonas en estado crítico"
          deltaType={criticas.length > 2 ? 'up' : 'neutral'} color="#FF4757" bgColor="rgba(255,71,87,0.12)" />
      </div>

      {/* Alert if critical */}
      {criticas.length > 0 && (
        <div className="alert-strip danger" style={{ marginBottom: 20 }}>
          🚨 <strong>CONGESTIÓN CRÍTICA:</strong> {criticas.map((z) => z.nombre).join(' · ')} —
          Se recomienda usar rutas alternas inmediatamente.
        </div>
      )}

      {/* Map + Zone list */}
      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🗺️ Mapa de Tráfico en Vivo</div>
            <div className="live-indicator"><div className="live-dot" /> LIVE</div>
          </div>
          <div className="map-container map-container-lg">
            <MapContainer center={MAP_CONFIG.center} zoom={MAP_CONFIG.zoom}
              style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap | Movilidata OS" />
              {/* TomTom live traffic flow layer */}
              {import.meta.env.VITE_TOMTOM_API_KEY && (
                <TileLayer
                  url={`/tomtom/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${import.meta.env.VITE_TOMTOM_API_KEY}&thickness=3`}
                  opacity={0.8}
                  maxZoom={22}
                  tileSize={256}
                />
              )}
              {liveZones?.map((z) => {
                const level = getCongestionLevel(z.congestion);
                return (
                  <Marker
                    key={z.id}
                    position={[z.lat, z.lng]}
                    icon={trafficIcon(z)}
                  >
                    <Popup>
                      <div style={{ minWidth: 175 }}>
                        <strong style={{ fontSize: 13 }}>{z.nombre}</strong><br />
                        <div style={{ margin: '6px 0 4px', display:'flex', gap: 8, alignItems:'center' }}>
                          <span style={{
                            background: level.color,
                            color: '#fff',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 700
                          }}>{level.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Congestión: <strong style={{ color: level.color }}>{z.congestion}%</strong></span>
                        </div>
                        <span style={{ fontSize: 12 }}>🚗 Velocidad: <strong>{z.velocidad} km/h</strong></span><br />
                        <span style={{ fontSize: 12 }}>🔢 Flujo: {formatNumber(z.flujo)} veh/h</span>
                        {z.live && <div style={{ fontSize: 10, color: '#00DCB4', marginTop: 4, fontWeight: 600 }}>✦ Dato en tiempo real (TomTom)</div>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12 }}>
            <span><span style={{ color: 'var(--danger)' }}>●</span> Crítico</span>
            <span><span style={{ color: 'var(--warning)' }}>●</span> Alto</span>
            <span><span style={{ color: 'var(--yellow)' }}>●</span> Moderado</span>
            <span><span style={{ color: 'var(--success)' }}>●</span> Normal</span>
            <span style={{ color: 'var(--text-muted)' }}>Pulso animado = Congestión alta</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Estado por Vía</div>
            <div className="live-indicator"><div className="live-dot" /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', maxHeight: 440 }}>
            {sorted.map((z) => {
              const level = getCongestionLevel(z.congestion);
              return (
                <div key={z.id} className="zone-item" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{z.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {z.velocidad} km/h · {formatNumber(z.flujo)} veh/h
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: level.color }}>{z.congestion}%</div>
                    <div style={{ fontSize: 10, color: level.color }}>{level.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time series chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📈 Patrón de Congestión por Hora del Día</div>
            <div className="card-subtitle">Serie temporal histórica — porcentaje de congestión cada hora</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {days.map((d) => (
              <button key={d}
                onClick={() => setDaySelected(d)}
                className={`btn btn-sm ${daySelected === d ? 'btn-primary' : 'btn-outline'}`}
              >
                {dayLabels[d]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 260 }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>
    </div>
  );
};

export default Trafico;
