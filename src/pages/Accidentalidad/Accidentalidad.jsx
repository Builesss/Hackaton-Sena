import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Popup, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js';
import { getAccidentsData } from '../../services/api';
import { getMarkerColor, getRiskLevel, formatNumber } from '../../utils/helpers';
import { MAP_CONFIG, CHART_DEFAULTS, COLORS } from '../../config/config';
import StatCard from '../../components/Cards/StatCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const HeatmapLayer = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (!data || data.length === 0 || !L.heatLayer) return;
    const points = data.map(p => [
      p.lat, 
      p.lng, 
      p.gravedad === 'fatal' ? 1.0 : p.gravedad === 'grave' ? 0.7 : 0.4
    ]);
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 20,
      maxZoom: 16,
      gradient: { 0.4: 'yellow', 0.7: 'orange', 1: 'red' }
    }).addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [data, map]);
  return null;
};

const Accidentalidad = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    getAccidentsData().then((d) => { setData(d); setLoading(false); });
  }, []);

  useEffect(() => { setTimeout(() => setMapReady(true), 100); }, []);

  if (loading) return (
    <div className="loading-container"><div className="spinner" /><p>Cargando datos de accidentalidad...</p></div>
  );

  const filtered = filter === 'all'
    ? data.incidents
    : data.incidents.filter((i) => i.gravedad === filter);

  // Totales
  const totalAccidents = data.porMes.accidentes.reduce((s, v) => s + v, 0);
  const totalVictimas = data.porMes.victimas.reduce((s, v) => s + v, 0);
  const fatales = data.incidents.filter((i) => i.gravedad === 'fatal').length;
  const conLluvia = data.incidents.filter((i) => i.lluvia).length;

  // Chart — Accidentes por mes
  const barData = {
    labels: data.porMes.labels,
    datasets: [
      {
        label: 'Accidentes',
        data: data.porMes.accidentes,
        backgroundColor: 'rgba(255, 71, 87, 0.7)',
        borderColor: '#FF4757',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Víctimas',
        data: data.porMes.victimas,
        backgroundColor: 'rgba(255, 149, 0, 0.7)',
        borderColor: '#FF9500',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' },
      title: { display: false },
    },
    scales: {
      ...CHART_DEFAULTS.scales,
      y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true },
    },
  };

  // Doughnut — Tipo de accidente
  const donutData = {
    labels: data.porTipo.labels,
    datasets: [{
      data: data.porTipo.data,
      backgroundColor: ['#FF4757', '#FF9500', '#FFD32A', '#0066FF', '#8B9ABB'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const donutOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { ...CHART_DEFAULTS.plugins.legend, position: 'bottom' },
    },
    cutout: '65%',
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>⚠️ Zonas Críticas de Accidentalidad</h1>
          <p>Análisis histórico de incidentes viales · Modelos predictivos de riesgo geográfico</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Fuente: MeData · Observatorio de Movilidad Medellín
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="💥" value={formatNumber(totalAccidents)} label="Total Accidentes 2024"
          delta="+8.2% vs 2023" deltaType="up" color="#FF4757" bgColor="rgba(255,71,87,0.12)" />
        <StatCard icon="🤕" value={formatNumber(totalVictimas)} label="Víctimas Totales"
          delta="Incluye heridos y fatales" color="#FF9500" bgColor="rgba(255,149,0,0.12)" />
        <StatCard icon="💀" value={fatales} label="Accidentes Fatales"
          delta="Alta prioridad de intervención" deltaType="up" color="#FF4757" bgColor="rgba(255,71,87,0.08)" />
        <StatCard icon="🌧️" value={`${Math.round(conLluvia / data.incidents.length * 100)}%`}
          label="Con lluvia activa" delta="Correlación clima–accidente" color="#0066FF" bgColor="rgba(0,102,255,0.12)" />
      </div>

      {/* Map + Right Panel */}
      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        {/* Mapa */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🗺️ Mapa de Incidentes Viales</div>
              <div className="card-subtitle">Heatmap geoespacial de accidentalidad — Medellín</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'fatal', 'grave', 'leve'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                >
                  {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {mapReady && (
            <div className="map-container map-container-lg">
              <MapContainer
                center={MAP_CONFIG.center}
                zoom={MAP_CONFIG.zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap | Movilidata OS"
                />
                {/* TomTom live traffic for context */}
                {import.meta.env.VITE_TOMTOM_API_KEY && (
                  <TileLayer
                    url={`/tomtom/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${import.meta.env.VITE_TOMTOM_API_KEY}&thickness=3`}
                    opacity={0.5}
                    maxZoom={22}
                    tileSize={256}
                  />
                )}
                <HeatmapLayer data={filtered} />
              </MapContainer>
            </div>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12 }}>
            <span><span style={{ color: 'red' }}>●</span> Alta densidad (Fatal/Grave)</span>
            <span><span style={{ color: 'orange' }}>●</span> Densidad Media</span>
            <span><span style={{ color: 'yellow' }}>●</span> Densidad Baja (Leve)</span>
          </div>
        </div>

        {/* Zonas de riesgo */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 Índice de Riesgo por Zona</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.zonasCriticas
              .sort((a, b) => b.riesgo - a.riesgo)
              .map((zona) => {
                const risk = getRiskLevel(zona.riesgo);
                return (
                  <div key={zona.zona}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{zona.zona}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {zona.accidentes_2024} acc.
                        </span>
                        <span className="badge"
                          style={{ background: `${risk.color}20`, color: risk.color }}>
                          {risk.label}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill"
                        style={{ width: `${zona.riesgo}%`, background: risk.color }} />
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="divider" />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Índice calculado con ML sobre histórico 2020–2024
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>📊 Accidentes y Víctimas por Mes</div>
          <div className="chart-wrapper" style={{ height: 260 }}>
            <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="card-title" style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
            🥧 Distribución por Tipo de Accidente
          </div>
          <div className="chart-wrapper" style={{ height: 260, maxWidth: 300 }}>
            <Doughnut data={donutData} options={{ ...donutOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accidentalidad;
