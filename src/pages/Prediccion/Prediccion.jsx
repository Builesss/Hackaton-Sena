import React, { useEffect, useState, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler, Title
} from 'chart.js';
import { getTrafficData } from '../../services/api';
import { CHART_DEFAULTS, COLORS } from '../../config/config';
import StatCard from '../../components/Cards/StatCard';
import { addNoise } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler, Title);

// Simulated AI predictions
const generatePrediction = (base) =>
  base.map((v) => Math.min(100, Math.max(0, Math.round(v + (Math.random() - 0.4) * 15))));

const Prediccion = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  const logsRef = useRef(null);

  useEffect(() => {
    getTrafficData().then((d) => { setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [aiLogs]);

  const runAI = async () => {
    setAiRunning(true);
    setPrediction(null);
    setAiLogs([]);

    const logs = [
      '🔄 Iniciando agente LLM de predicción...',
      '📊 Cargando series temporales históricas 2020–2024...',
      '🧹 Preprocesando datos con Pandas...',
      '🔍 Analizando patrones por hora, día y estación...',
      '🌧️ Correlacionando con datos climáticos SIATA...',
      '🤖 Ejecutando modelo ARIMA + regresión espacial...',
      '⚡ Aplicando corrección con XGBoost...',
      '✅ Predicción generada con 91.3% de confianza.',
    ];

    for (const log of logs) {
      await new Promise((r) => setTimeout(r, 600));
      setAiLogs((prev) => [...prev, log]);
    }

    // Generate predictions
    const nextHours = data.seriesTemporal.viernes.slice(8, 16);
    setPrediction(generatePrediction(nextHours));
    setConfidence(Math.round(85 + Math.random() * 10));
    setAiRunning(false);
  };

  if (loading) return (
    <div className="loading-container"><div className="spinner" /><p>Cargando módulo de predicción...</p></div>
  );

  const heatmapZones = [
    { nombre: 'Av. Regional', prob: 95, hora: '11:00–13:00' },
    { nombre: 'Autopista Norte', prob: 88, hora: '07:30–09:30' },
    { nombre: 'Av. 33', prob: 82, hora: '17:30–19:30' },
    { nombre: 'Circular 1', prob: 71, hora: '12:00–14:00' },
    { nombre: 'Av. El Poblado', prob: 65, hora: '18:00–20:00' },
    { nombre: 'Variante Bello', prob: 58, hora: '07:00–09:00' },
  ];

  const predHours = ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h'];
  const historico = data.seriesTemporal.viernes.slice(8, 16);

  const lineData = {
    labels: predHours,
    datasets: [
      {
        label: 'Histórico (viernes típico)',
        data: historico,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108,99,255,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        borderDash: [5, 4],
      },
      ...(prediction ? [{
        label: 'Predicción IA — hoy',
        data: prediction,
        borderColor: '#00D4AA',
        backgroundColor: 'rgba(0,212,170,0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#00D4AA',
        pointHoverRadius: 8,
      }] : []),
    ],
  };

  const lineOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' },
    },
    scales: {
      ...CHART_DEFAULTS.scales,
      y: {
        ...CHART_DEFAULTS.scales.y,
        min: 0, max: 100,
        ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => `${v}%` },
      },
    },
  };

  const probData = {
    labels: heatmapZones.map((z) => z.nombre),
    datasets: [{
      label: 'Probabilidad de congestión crítica (%)',
      data: heatmapZones.map((z) => z.prob),
      backgroundColor: heatmapZones.map((z) =>
        z.prob >= 85 ? 'rgba(255,71,87,0.75)' :
        z.prob >= 70 ? 'rgba(255,165,2,0.75)' :
        'rgba(255,211,42,0.75)'
      ),
      borderRadius: 6,
      borderWidth: 0,
    }],
  };

  const probOptions = {
    ...CHART_DEFAULTS,
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x, min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
      y: { ...CHART_DEFAULTS.scales.y },
    },
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🧠 Predicción de Congestión con IA</h1>
          <p>Modelos estadísticos + LLM para anticipar congestión 2–4 horas antes</p>
        </div>
        <div className="page-header-actions">
          <button onClick={runAI} disabled={aiRunning} className="btn btn-primary">
            {aiRunning ? '⚡ Ejecutando IA...' : '🚀 Ejecutar Predicción IA'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="🧠" value="ARIMA + XGBoost" label="Modelos activos"
          color="#6C63FF" bgColor="rgba(108,99,255,0.12)" />
        <StatCard icon="🎯" value={confidence ? `${confidence}%` : '—'} label="Confianza del modelo"
          delta={confidence ? 'Resultado disponible' : 'Ejecuta la predicción'}
          color="#00D4AA" bgColor="rgba(0,212,170,0.12)" />
        <StatCard icon="⏱️" value="2–4h" label="Horizonte de predicción"
          delta="Anticipación máxima" color="#FFA502" bgColor="rgba(255,165,2,0.12)" />
        <StatCard icon="📍" value={heatmapZones.filter(z => z.prob >= 80).length} label="Zonas en alerta predictiva"
          deltaType="up" color="#FF4757" bgColor="rgba(255,71,87,0.12)" />
      </div>

      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        {/* Line chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📈 Histórico vs Predicción IA — Hoy</div>
              <div className="card-subtitle">
                {prediction ? `Predicción generada con ${confidence}% de confianza` : 'Ejecuta el agente IA para ver la predicción'}
              </div>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
          {!prediction && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
              ↑ Presiona "Ejecutar Predicción IA" para ver el modelo en acción
            </div>
          )}
        </div>

        {/* AI Agent logs */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🤖 Agente LLM — Consola</div>
            {aiRunning && <div className="live-indicator"><div className="live-dot" /> PROCESANDO</div>}
          </div>
          <div
            ref={logsRef}
            style={{
              background: '#05080F',
              borderRadius: 'var(--radius-sm)',
              padding: 14,
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#00D4AA',
              height: 240,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              lineHeight: 1.8,
            }}
          >
            {aiLogs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>
                &gt; Esperando instrucción..._
              </span>
            ) : (
              aiLogs.map((log, i) => (
                <div key={i} style={{ animation: 'fadeIn 0.3s ease' }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{String(i + 1).padStart(2, '0')}]</span> {log}
                </div>
              ))
            )}
            {aiRunning && <span style={{ animation: 'pulse-dot 0.8s infinite' }}>█</span>}
          </div>
        </div>
      </div>

      {/* Probability heatmap */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🔥 Heatmap — Probabilidad de Congestión Crítica por Zona</div>
            <div className="card-subtitle">Predicción para las próximas 4 horas</div>
          </div>
        </div>
        <div style={{ height: 260 }}>
          <Bar data={probData} options={{ ...probOptions, maintainAspectRatio: false }} />
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {heatmapZones.map((z) => (
            <div key={z.nombre} style={{
              background: z.prob >= 85 ? 'rgba(255,71,87,0.08)' : z.prob >= 70 ? 'rgba(255,165,2,0.08)' : 'rgba(255,211,42,0.08)',
              border: `1px solid ${z.prob >= 85 ? 'rgba(255,71,87,0.2)' : z.prob >= 70 ? 'rgba(255,165,2,0.2)' : 'rgba(255,211,42,0.2)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{z.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>⏰ {z.hora}</div>
              <div style={{
                fontSize: 20, fontWeight: 700, marginTop: 4,
                color: z.prob >= 85 ? 'var(--danger)' : z.prob >= 70 ? 'var(--warning)' : 'var(--yellow)'
              }}>
                {z.prob}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prediccion;
