import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler
} from 'chart.js';
import { getWeatherData } from '../../services/api';
import { MAP_CONFIG, CHART_DEFAULTS } from '../../config/config';
import { getRainRisk, formatNumber } from '../../utils/helpers';
import StatCard from '../../components/Cards/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const RutasLluvias = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherData().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="loading-container"><div className="spinner" /><p>Cargando datos climáticos...</p></div>
  );

  const { actual, pronostico, zonasRiesgo, rutasSeguras, correlacion } = data;
  const riskLevel = getRainRisk(actual.precipitacion);
  const activeZones = zonasRiesgo.filter((z) => z.activo);

  // Correlation chart — lluvia vs accidentes
  const corrData = {
    labels: correlacion.labels,
    datasets: [
      {
        label: 'Precipitación (mm)',
        data: correlacion.lluvia_mm,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108,99,255,0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: 'Accidentes',
        data: correlacion.accidentes,
        borderColor: '#FF4757',
        backgroundColor: 'rgba(255,71,87,0.08)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
        borderWidth: 2,
        borderDash: [5, 3],
      },
    ],
  };

  const corrOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } },
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: {
        ...CHART_DEFAULTS.scales.y,
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Lluvia (mm)', color: '#6C63FF', font: { size: 11 } },
      },
      y1: {
        ...CHART_DEFAULTS.scales.y,
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Accidentes', color: '#FF4757', font: { size: 11 } },
      },
    },
  };

  // Forecast bar chart
  const forecastData = {
    labels: pronostico.map((p) => p.hora),
    datasets: [{
      label: 'Precipitación mm/h',
      data: pronostico.map((p) => p.lluvia),
      backgroundColor: pronostico.map((p) =>
        p.riesgo >= 85 ? 'rgba(255,71,87,0.8)' :
        p.riesgo >= 70 ? 'rgba(255,165,2,0.8)' :
        p.riesgo >= 50 ? 'rgba(255,211,42,0.8)' :
        'rgba(0,212,170,0.6)'
      ),
      borderRadius: 5,
      borderWidth: 0,
    }],
  };

  const forecastOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true },
    },
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🌧️ Rutas Seguras en Temporada de Lluvias</h1>
          <p>Correlación estadística lluvia ↔ accidentalidad ↔ inundaciones · Rutas alternativas en tiempo real</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fuente: SIATA · Google Maps Platform</span>
        </div>
      </div>

      {/* Alert banner */}
      {actual.alerta && (
        <div className="alert-strip danger" style={{ marginBottom: 20 }}>
          ⛈️ <strong>ALERTA METEOROLÓGICA ACTIVA:</strong> {actual.estado.toUpperCase()} —
          Visibilidad {actual.visibilidad}. Nivel de riesgo: <strong>{riskLevel.label}</strong>.
          Se recomienda evitar {activeZones.map((z) => z.zona).join(', ')}.
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="🌧️" value={`${actual.precipitacion} mm`} label="Precipitación actual"
          delta={actual.estado} deltaType={actual.alerta ? 'up' : 'neutral'}
          color={riskLevel.color} bgColor={`${riskLevel.color}15`} />
        <StatCard icon="💨" value={`${actual.viento} km/h`} label="Velocidad del viento"
          color="#6C63FF" bgColor="rgba(108,99,255,0.12)" />
        <StatCard icon="🌡️" value={`${actual.temperatura}°C`} label="Temperatura"
          delta={`Humedad ${actual.humedad}%`} color="#00D4AA" bgColor="rgba(0,212,170,0.12)" />
        <StatCard icon="⚠️" value={activeZones.length} label="Zonas de riesgo activas"
          delta={`${zonasRiesgo.length} zonas monitoreadas`} deltaType={activeZones.length > 2 ? 'up' : 'neutral'}
          color="#FF4757" bgColor="rgba(255,71,87,0.12)" />
      </div>

      {/* Map + Routes */}
      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🗺️ Mapa de Riesgo Climático — Medellín</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="chip">🔴 Inundación</span>
              <span className="chip">🟠 Deslizamiento</span>
            </div>
          </div>
          <div className="map-container map-container-lg">
            <MapContainer center={MAP_CONFIG.center} zoom={MAP_CONFIG.zoom}
              style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap | Movilidata OS" />
              {zonasRiesgo.map((z, i) => (
                <CircleMarker
                  key={i}
                  center={[z.lat, z.lng]}
                  radius={z.nivel === 'crítico' ? 22 : z.nivel === 'alto' ? 16 : 12}
                  fillColor={
                    z.nivel === 'crítico' ? '#FF4757' :
                    z.nivel === 'alto' ? '#FFA502' : '#FFD32A'
                  }
                  color={z.activo ? '#FF4757' : '#4A5568'}
                  weight={2}
                  opacity={0.9}
                  fillOpacity={z.activo ? 0.55 : 0.25}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <strong>{z.zona}</strong><br />
                      <span>⚠️ Riesgo: {z.riesgo}</span><br />
                      <span>Nivel: <strong style={{
                        color: z.nivel === 'crítico' ? '#FF4757' : z.nivel === 'alto' ? '#FFA502' : '#FFD32A'
                      }}>{z.nivel.toUpperCase()}</strong></span><br />
                      <span>Estado: {z.activo ? '🔴 ACTIVO' : '⚪ Inactivo'}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12 }}>
            <span><span style={{ color: 'var(--danger)' }}>●</span> Crítico · activo</span>
            <span><span style={{ color: 'var(--warning)' }}>●</span> Alto</span>
            <span><span style={{ color: 'var(--yellow)' }}>●</span> Moderado</span>
            <span style={{ color: 'var(--text-muted)' }}>⚪ Inactivo</span>
          </div>
        </div>

        {/* Routes */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🛣️ Rutas Recomendadas</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rutasSeguras.map((ruta, i) => (
              <div key={i} style={{
                border: `1px solid ${ruta.estado === 'bloqueada' ? 'rgba(255,71,87,0.3)' : ruta.recomendada ? 'rgba(0,212,170,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: 14,
                background: ruta.estado === 'bloqueada' ? 'rgba(255,71,87,0.05)' : ruta.recomendada ? 'rgba(0,212,170,0.05)' : 'transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ruta.nombre}</div>
                  <span className={`badge ${ruta.estado === 'bloqueada' ? 'badge-danger' : ruta.recomendada ? 'badge-success' : 'badge-info'}`}>
                    {ruta.estado === 'bloqueada' ? '🚫 Bloqueada' : ruta.recomendada ? '✅ Recomendada' : '✔ Disponible'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{ruta.descripcion}</div>
                {ruta.estado !== 'bloqueada' && (
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
                    <span>⏱️ {ruta.tiempo}</span>
                    <span>📏 {ruta.distancia}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="divider" />

          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Pronóstico próximas 3h:
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {pronostico.slice(0, 5).map((p, i) => (
              <div key={i} style={{
                background: p.riesgo >= 80 ? 'rgba(255,71,87,0.1)' : 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 10px', textAlign: 'center', flex: 1,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.hora}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.riesgo >= 80 ? 'var(--danger)' : p.riesgo >= 60 ? 'var(--warning)' : 'var(--success)' }}>
                  {p.lluvia}mm
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>📊 Correlación Lluvia ↔ Accidentes (Anual)</div>
          <div style={{ height: 260 }}>
            <Line data={corrData} options={corrOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🌂 Pronóstico de Precipitación — Hoy</div>
          <div style={{ height: 260 }}>
            <Bar data={forecastData} options={{ ...forecastOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RutasLluvias;
