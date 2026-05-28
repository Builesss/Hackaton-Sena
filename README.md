# 🚦 Medellín Movilidata OS

## Plataforma Unificada de Movilidad Inteligente para Medellín

> Desarrollado para **HackData CTGI SENA 2026** · Solución fullstack con analítica predictiva, IA y monitoreo en tiempo real.

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-00D4AA?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8?style=for-the-badge)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge)

</div>

---

## 📌 Descripción

**Medellín Movilidata OS** es una plataforma full stack unificada que integra analítica predictiva, monitoreo en tiempo real e inteligencia artificial para transformar la movilidad urbana de Medellín. Responde a cuatro problemáticas interconectadas:

| Problema | Solución |
|---|---|
| Alta accidentalidad vial | Módulo de detección de zonas críticas con heatmap geoespacial |
| Congestión vehicular crónica (+40% tiempos) | Dashboard de tráfico en tiempo real cada 5 min |
| Sin predicción de congestión | Agente LLM + modelos ARIMA/XGBoost con 2–4h de anticipación |
| Rutas inseguras en lluvias | Correlación lluvia-accidentalidad-inundaciones con rutas alternativas |

---

## 🎯 Objetivo

Proveer a la Alcaldía de Medellín, conductores y planificadores urbanos una herramienta centralizada de inteligencia vial que permita **anticipar, monitorear y responder** a los retos de movilidad de la ciudad en tiempo real.

---

## 🚀 Tecnologías

### Frontend y App
| Tecnología | Uso |
|---|---|
| **React 18** | SPA modular con hooks |
| **Vite 5** | Build tool y dev server ultrarrápido |
| **React Router DOM 6** | Navegación client-side |
| **Leaflet + React-Leaflet** | Mapas interactivos geoespaciales |
| **Chart.js + React-ChartJS-2** | Gráficas (línea, barra, doughnut) |
| **React Hot Toast** | Notificaciones en tiempo real |
| **CSS Variables** | Design system con tokens |
| **PWA** | manifest.json + service-worker.js |

### Datos y IA
| Tecnología | Uso |
|---|---|
| **Python / Pandas** | Procesamiento de datasets |
| **scikit-learn / ARIMA** | Modelos predictivos de congestión |
| **XGBoost** | Corrección de predicciones |
| **Agentes LLM** | Consola de IA interactiva |

---

## 🗺️ Módulos del Sistema

### 1. Dashboard Central
Vista unificada con KPIs de todos los módulos, acceso rápido, zonas críticas en tiempo real y panel de alertas activas.

### 2. Zonas Críticas de Accidentalidad
- Heatmap geoespacial de incidentes sobre Leaflet
- Filtros por gravedad (fatal / grave / leve)
- Índice de riesgo por zona con ML
- Gráficas históricas (barras + doughnut)

### 3. Tráfico en Tiempo Real
- Mapa de congestión con actualización cada 5s (real: 5 min)
- Umbrales dinámicos de congestión crítica
- Serie temporal por día de la semana
- Lista de estado por vía

### 4. Predicción de Congestión con IA
- Agente LLM con consola interactiva animada
- Modelos ARIMA + XGBoost
- Heatmap de probabilidad por zona
- Histórico vs predicción solapados

### 5. Rutas Seguras en Lluvias
- Mapa de riesgo climático (SIATA)
- Correlación lluvia - accidentalidad
- Rutas recomendadas / bloqueadas
- Pronóstico de precipitación por hora

---

## 📊 Fuentes de Datos

| Fuente | URL | Módulo |
|---|---|---|
| **MeData Medellín** | https://medata.gov.co/search/# | Accidentalidad, Tráfico |
| **Observatorio de Movilidad** | https://www.medellin.gov.co/es/secretaria-de-movilidad/observatorio-de-movilidad/ | Accidentalidad |
| **SIM Medellín** | https://www.medellin.gov.co/es/secretaria-de-movilidad/sistema-inteligente-de-movilidad-de-medellin/ | Tráfico, Predicción |
| **SIATA** | https://siata.gov.co/siata_nuevo/ | Lluvias, Rutas |
| **datos.gov.co** | https://www.datos.gov.co/ | General |
| **Google Maps Platform** | https://cloud.google.com/maps-platform | Rutas |
| **OpenStreetMap** | https://www.openstreetmap.org | Tiles base de mapas |

---

## 📁 Estructura del Proyecto

```
Hackaton-Sena/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── data/
│       ├── accidents.json
│       ├── traffic.json
│       └── weather.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── config/config.js
│   ├── components/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── Cards/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Accidentalidad/
│   │   ├── Trafico/
│   │   ├── Prediccion/
│   │   └── RutasLluvias/
│   ├── services/api.js
│   ├── hooks/useRealTime.js
│   ├── utils/helpers.js
│   └── styles/main.css
├── docs/
│   ├── manual-tecnico.md
│   └── manual-usuario.md
├── vite.config.js
└── README.md
```

---

## ⚙️ Instalación y Ejecución

```bash
# Clonar
git clone https://github.com/tu-usuario/medellin-movilidata-os.git
cd medellin-movilidata-os

# Instalar dependencias
npm install

# Desarrollo
npm run dev
# Abre http://localhost:5173

# Build producción
npm run build

# Preview
npm run preview
```

---

## 📱 PWA — App Móvil

1. Abre `http://localhost:5173` en Chrome móvil
2. Toca **"Agregar a pantalla de inicio"**
3. La app se instala como aplicación nativa
4. Funciona **offline** con datos cacheados

---

## 🎨 Branding

| Elemento | Valor |
|---|---|
| **Nombre** | Medellín Movilidata OS |
| **Tagline** | Inteligencia Vial en Tiempo Real |
| **Color primario** | `#00D4AA` Teal |
| **Color secundario** | `#6C63FF` Violeta |
| **Fondo** | `#080C1A` Dark Navy |
| **Tipografía** | Space Grotesk + Inter |

---

## 🧠 Funcionalidades

✅ Dashboard inteligente unificado
✅ Heatmap geoespacial de accidentalidad
✅ Tráfico en tiempo real (live)
✅ Predicción IA con agente LLM interactivo
✅ Correlación lluvia-accidentes
✅ Rutas seguras con recomendación
✅ Series temporales por hora/día
✅ Alertas predictivas automáticas
✅ PWA instalable (web + móvil)
✅ Modo offline (Service Worker)
✅ Responsive design (mobile-first)
✅ Dark mode premium

---

## 👥 Integrantes y Roles

| Nombre | Rol |
|---|---|
| TBD | Lead Developer — Frontend React |
| TBD | Data Analyst — Datasets y ML |
| TBD | UX/UI Designer — Design System |
| TBD | Backend and APIs |

---

HackData CTGI SENA 2026 — MIT License
