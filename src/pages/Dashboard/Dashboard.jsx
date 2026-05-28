import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/Cards/StatCard';
import { getAccidentsData, getTrafficData, getWeatherData } from '../../services/api';
import { getCongestionLevel, formatNumber } from '../../utils/helpers';

const Dashboard = () => {
  const [accidents, setAccidents] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAccidentsData(), getTrafficData(), getWeatherData()]).then(
      ([a, t, w]) => { setAccidents(a); setTraffic(t); setWeather(w); setLoading(false); }
    );
  }, []);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Cargando datos de Medellín...</p>
    </div>
  );

  const criticalZones = traffic?.zonas?.filter((z) => z.congestion >= 80) || [];
  const avgCongestion = traffic?.zonas
    ? Math.round(traffic.zonas.reduce((s, z) => s + z.congestion, 0) / traffic.zonas.length)
    : 0;
  const totalAccidents = accidents?.porMes?.accidentes?.reduce((s, v) => s + v, 0) || 0;
  const activeAlerts = weather?.zonasRiesgo?.filter((z) => z.activo).length || 0;

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>🏙️ Dashboard Central</h1>
          <p>Vista unificada de movilidad urbana para Medellín en tiempo real</p>
        </div>
        <div className="page-header-actions">
          {weather?.actual?.alerta && (
            <div className="alert-strip danger" style={{ padding: '8px 14px' }}>
              <span>⛈️</span> Alerta Climática Activa
            </div>
          )}
          <div className="live-indicator">
            <div className="live-dot" />
            DATOS EN VIVO
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          icon="⚠️"
          value={formatNumber(totalAccidents)}
          label="Incidentes 2024"
          delta="+8.2% vs 2023"
          deltaType="up"
          color="#FF4757"
          bgColor="rgba(255,71,87,0.12)"
        />
        <StatCard
          icon="🚗"
          value={`${avgCongestion}%`}
          label="Congestión Promedio"
          delta={criticalZones.length > 0 ? `${criticalZones.length} zonas críticas` : 'Sin zonas críticas'}
          deltaType={criticalZones.length > 2 ? 'up' : 'neutral'}
          color="#FF9500"
          bgColor="rgba(255,149,0,0.12)"
        />
        <StatCard
          icon="🌧️"
          value={`${weather?.actual?.precipitacion || 0} mm`}
          label="Precipitación Actual"
          delta={weather?.actual?.estado || 'Normal'}
          deltaType={weather?.actual?.alerta ? 'up' : 'neutral'}
          color="#6C63FF"
          bgColor="rgba(108,99,255,0.12)"
        />
        <StatCard
          icon="🔴"
          value={activeAlerts}
          label="Alertas Activas"
          delta="Zonas de riesgo"
          deltaType={activeAlerts > 2 ? 'up' : 'neutral'}
          color="#0066FF"
          bgColor="rgba(0,102,255,0.12)"
        />
      </div>

      {/* Quick module access */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Módulos */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Módulos del Sistema</div>
              <div className="card-subtitle">Acceso rápido a cada módulo</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { path: '/accidentalidad', icon: '⚠️', label: 'Zonas Críticas de Accidentalidad', color: '#FF4757', desc: 'Heatmap + análisis histórico' },
              { path: '/trafico', icon: '🚦', label: 'Tráfico en Tiempo Real', color: '#FF9500', desc: 'Flujo vehicular cada 5 minutos', live: true },
              { path: '/prediccion', icon: '🧠', label: 'Predicción de Congestión IA', color: '#0066FF', desc: 'Modelos predictivos 2-4h' },
              { path: '/lluvias', icon: '🌧️', label: 'Rutas Seguras en Lluvias', color: '#00DCB4', desc: 'Correlación clima-accidentes' },
            ].map((m) => (
              <Link key={m.path} to={m.path} style={{ textDecoration: 'none' }}>
                <div className="zone-item" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, background: `${m.color}15`, flexShrink: 0
                  }}>
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {m.desc}
                    </div>
                  </div>
                  {m.live && <span className="badge badge-success">LIVE</span>}
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Zonas críticas de tráfico */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🚨 Zonas Críticas Ahora</div>
              <div className="card-subtitle">Mayor congestión en este momento</div>
            </div>
            <div className="live-indicator">
              <div className="live-dot" />
              LIVE
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {traffic?.zonas
              ?.sort((a, b) => b.congestion - a.congestion)
              .slice(0, 6)
              .map((z) => {
                const level = getCongestionLevel(z.congestion);
                return (
                  <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{z.nombre}</div>
                    <div style={{ width: 120 }}>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${z.congestion}%`, background: level.color }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: level.color, width: 32, textAlign: 'right' }}>
                      {z.congestion}%
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span><span style={{ color: 'var(--danger)' }}>●</span> Crítico ≥90%</span>
            <span><span style={{ color: 'var(--warning)' }}>●</span> Alto ≥80%</span>
            <span><span style={{ color: 'var(--yellow)' }}>●</span> Moderado ≥65%</span>
            <span><span style={{ color: 'var(--success)' }}>●</span> Normal</span>
          </div>
        </div>
      </div>

      {/* Alertas activas */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔔 Alertas y Notificaciones</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {weather?.actual?.alerta && (
            <div className="alert-strip danger">
              ⛈️ <strong>ALERTA CLIMÁTICA:</strong> Lluvia moderada activa en el Valle de Aburrá.
              Visibilidad reducida. Evite zonas de Robledo y Castilla.
            </div>
          )}
          {criticalZones.length > 0 && (
            <div className="alert-strip warning">
              🚦 <strong>CONGESTIÓN CRÍTICA:</strong> {criticalZones.map((z) => z.nombre).join(', ')} —
              Se recomienda rutas alternas.
            </div>
          )}
          <div className="alert-strip info">
            🧠 <strong>PREDICCIÓN IA:</strong> Alta probabilidad de congestión en Av. Regional entre
            11h–13h de hoy. Probabilidad: 91%.
          </div>
          <div className="alert-strip success">
            ✅ <strong>SISTEMA OPERATIVO:</strong> Todos los módulos funcionando correctamente.
            Última sincronización: hace unos segundos.
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 8 }}>
        <span>Fuentes: Alcaldía de Medellín · SIATA · MeData · Observatorio de Movilidad</span>
        <span>HackData CTGI SENA 2026 · Medellín Movilidata OS v1.0.0</span>
      </div>
    </div>
  );
};

export default Dashboard;
