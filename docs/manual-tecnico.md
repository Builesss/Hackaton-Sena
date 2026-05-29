# 📖 Manual Técnico — Medellín Movilidata OS

**Versión:** 1.0.0  
**Fecha:** Mayo 2026  
**Proyecto:** HackData CTGI SENA 2026  

---

## 1. Visión General de la Arquitectura

Medellín Movilidata OS es una **Single Page Application (SPA)** construida con React + Vite, con capacidad PWA para instalación en dispositivos móviles y soporte offline mediante Service Worker.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser / PWA)                  │
│                                                             │
│  ┌─────────────┐  ┌──────────────────────────────────────┐ │
│  │   Sidebar   │  │           Main Content               │ │
│  │  (Router)   │  │                                      │ │
│  │             │  │  Dashboard │ Accidentalidad           │ │
│  │  Dashboard  │  │  Tráfico   │ Predicción               │ │
│  │  Accident.  │  │  Lluvias                             │ │
│  │  Tráfico    │  │  Navigator (Vista Ciudadano)         │ │
│  │  Predicc.   │  │                                      │ │
│  │  Lluvias    │  │  Leaflet Maps + Chart.js             │ │
│  │             │  │  AI Copilot (Asistente LLM)          │ │
│  └─────────────┘  └──────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Capa de Servicios (services/)              │   │
│  │  api.js → fetch + caché en memoria                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────────────────┐   │
│  │  Service Worker  │   │   Custom Hooks (hooks/)      │   │
│  │  (PWA Offline)   │   │  useRealTime, useSimulated   │   │
│  └──────────────────┘   │  Traffic, useClock           │   │
│                         └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   /public/data/    │
                    │  accidents.json    │
                    │  traffic.json      │
                    │  weather.json      │
                    └────────────────────┘
```

---

## 2. Stack Tecnológico Detallado

### 2.1 Core Frontend

| Paquete | Versión | Rol |
|---|---|---|
| `react` | 18.x | UI declarativa con hooks |
| `react-dom` | 18.x | Renderizado en DOM |
| `react-router-dom` | 6.x | Enrutamiento client-side |
| `vite` | 5.x | Build tool + HMR |
| `@vitejs/plugin-react` | — | Soporte JSX + Fast Refresh |

### 2.2 Visualización

| Paquete | Rol |
|---|---|
| `leaflet` + `react-leaflet` | Mapas interactivos con OpenStreetMap |
| `chart.js` + `react-chartjs-2` | Gráficas: Line, Bar, Doughnut |
| CSS Variables custom | Design system con tokens |

### 2.3 UX/Utilities

| Paquete | Rol |
|---|---|
| `react-hot-toast` | Sistema de notificaciones toast |
| `html2pdf.js` | Generación de reportes PDF en cliente |
| `lucide-react` | Sistema de iconografía SVG |
| React.lazy + Suspense | Lazy loading de componentes (Code Splitting) |

---

## 3. Estructura de Directorios

```
src/
├── main.jsx              # Entry point — monta React + registra SW
├── App.jsx               # Router principal, layout global
├── index.css             # Reset CSS mínimo
│
├── config/
│   └── config.js         # Constantes: API endpoints, colores, mapa,
│                         # umbrales de congestión, ítems de nav
│
├── components/           # Componentes reutilizables
│   ├── Sidebar/
│   │   └── Sidebar.jsx   # Navegación lateral + overlay móvil
│   ├── Header/
│   │   └── Header.jsx    # Header fijo + reloj en vivo + alertas
│   └── Cards/
│       └── StatCard.jsx  # Tarjeta KPI reutilizable
│
├── pages/                # Páginas/módulos del sistema
│   ├── Dashboard/        # Vista general unificada
│   ├── Accidentalidad/   # Módulo 1 — zonas críticas
│   ├── Trafico/          # Módulo 2 — tráfico en tiempo real
│   ├── Prediccion/       # Módulo 3 — predicción IA
│   ├── RutasLluvias/     # Módulo 4 — rutas en lluvias
│   └── Navigator/        # Módulo 5 — vista interactiva ciudadano
│
├── services/
│   └── api.js            # Fetching de datos + caché en memoria
│
├── hooks/
│   └── useRealTime.js    # useRealTime, useSimulatedTraffic, useClock
│
├── utils/
│   ├── helpers.js        # Funciones puras: colores, formatos, PWA
│   └── mapIcons.js       # Biblioteca de marcadores SVG premium para Leaflet
│
└── styles/
    └── main.css          # Design system completo (variables, layout,
                          # componentes, animaciones, responsive)
```

---

## 4. APIs y Fuentes de Datos

### 4.1 Endpoints Locales (Mock)

Los datasets están en `public/data/` servidos estáticamente:

| Archivo | Contenido |
|---|---|
| `accidents.json` | 20 incidentes viales con lat/lng, gravedad, tipo, fecha |
| `traffic.json` | 10 zonas de tráfico con congestión %, velocidad, flujo |
| `weather.json` | Datos climáticos actuales, pronóstico 8h, rutas seguras |

### 4.2 APIs Externas Referenciadas

| API | URL | Uso planificado |
|---|---|---|
| MeData Medellín | `medata.gov.co/search/#` | Accidentalidad histórica real |
| SIM Medellín | API Secretaría de Movilidad | Tráfico en tiempo real |
| SIATA | `siata.gov.co` | Datos climáticos |
| Google Maps Platform | `cloud.google.com/maps-platform` | Rutas reales |
| OpenStreetMap | tiles estándar | Mapas base (activo) |

### 4.3 Capa de Servicios (`services/api.js`)

```javascript
// Patrón: fetch con caché en memoria
const cache = {};
const fetchData = async (url) => {
  if (cache[url]) return cache[url];   // Hit de caché
  const data = await fetch(url).then(r => r.json());
  cache[url] = data;                    // Guardar en caché
  return data;
};
```

---

## 5. Módulos Funcionales

### 5.1 Módulo Accidentalidad

**Componente:** `Accidentalidad.jsx`  
**Librerías:** `react-leaflet` (CircleMarker, Popup), `react-chartjs-2` (Bar, Doughnut)

Flujo:
1. `getAccidentsData()` → carga `accidents.json`
2. Renderiza `CircleMarker` para cada incidente en Leaflet
3. Radio del marcador ∝ gravedad (fatal=14px, grave=10px, leve=7px)
4. Color del marcador: rojo=fatal, naranja=grave, amarillo=leve
5. Filtro por gravedad actualiza `filtered` → re-renderiza mapa

### 5.2 Módulo Tráfico

**Componente:** `Trafico.jsx`  
**Hook:** `useSimulatedTraffic` — aplica ruido aleatorio (±4%) cada 3.5s

```javascript
// Simulación en tiempo real
setInterval(() => {
  setLiveZones(prev => prev.map(z => ({
    ...z,
    congestion: addNoise(z.congestion, 4),
    velocidad: addNoise(z.velocidad, 3),
  })));
}, 3500);
```

### 5.3 Módulo Predicción IA

**Componente:** `Prediccion.jsx`  
**Simulación del agente:**

```
1. Usuario presiona "Ejecutar Predicción IA"
2. Se ejecuta runAI() — loop de logs cada 600ms
3. Se genera predicción: histórico + noise aleatorio
4. Se renderiza en el gráfico Line (histórico vs predicción)
5. Confidence score: 85–95%
```

**Modelos referenciados:**
- ARIMA (series temporales)
- XGBoost (corrección de predicciones)
- Regresión espacial (correlación geográfica)

### 5.4 Módulo Rutas en Lluvias

**Componente:** `RutasLluvias.jsx`  
**Correlación implementada:** lluvia (mm) ↔ accidentes (dual Y-axis en Chart.js)

### 5.5 AI Copilot y Generación de Reportes

**Componente:** `Copilot.jsx` y `ai.js`  
**Uso de IA Avanzada:** 
- Un asistente de panel lateral persistente (Copilot) que permite hacer consultas en lenguaje natural (ej. "Resume los incidentes actuales").
- Generación de reportes PDF dinámicos interactuando con `html2pdf.js`, insertando análisis semántico automático del estado vial basado en los datos actuales de los mapas.

### 5.6 Vista Ciudadano (Navigator)

**Componente:** `Navigator.jsx`  
Una vista full-screen enfocada en el usuario final.
- Integra Fotomultas, Estaciones de Metro, Calidad del Aire (PM2.5), y control granular de capas.
- Utiliza **mapIcons.js**, una librería 100% nativa y custom de CSS/SVG para generar íconos dinámicos en el mapa (ej. pulsos CSS en zonas de congestión, medidores circulares para calidad del aire, y animación de lluvia).

---

## 6. Sistema de Diseño

### 6.1 Tokens de Diseño (CSS Variables)

```css
:root {
  --primary:     #0066FF;  /* Azul brillante — color de marca */
  --secondary:   #00DCB4;  /* Turquesa */
  --danger:      #FF4757;  /* Rojo — alertas críticas */
  --warning:     #FF9500;  /* Naranja — advertencias */
  --success:     #00DCB4;  /* Verde/Turquesa — estado OK */
  --bg-base:     #F5F7FA;  /* Blanco Neutro base */
  --bg-card:     #FFFFFF;  /* Fondo de tarjetas */
  --text-primary:#2D3440;  /* Gris Urbano (principal) */
}
```

### 6.2 Grid System

```css
.grid-5   /* 5 columnas → 3 en tablet → 1 en móvil */
.grid-4   /* 4 columnas → 2 en tablet → 1 en móvil */
.grid-2   /* 2 columnas → 1 en móvil */
.grid-2-1 /* 2/3 + 1/3 → 1 en móvil */
```

---

## 7. PWA — Progressive Web App

### 7.1 Manifest (`public/manifest.json`)
- `display: standalone` → sin barra del navegador
- `theme_color: #00D4AA` → barra de estado en el color de marca
- `background_color: #080C1A` → splash screen oscuro

### 7.2 Service Worker (`public/service-worker.js`)
- **Estrategia:** Network First con fallback a caché
- **Assets cacheados:** `index.html`, los 3 JSON de datos
- **Caché name:** `movilidata-v1.0.0`

### 7.3 Registro
```javascript
// src/utils/helpers.js
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/service-worker.js');
  }
};
// Llamado en src/main.jsx al arrancar la app
```

---

## 8. Responsive Design

| Breakpoint | Layout |
|---|---|
| > 900px | Sidebar visible, grid completo |
| 640–900px | Sidebar colapsado (hamburger), grids reducidos |
| < 640px | Single column, padding reducido, mapa 300px |

---

## 9. Rendimiento

- **Code Splitting (Lazy Loading)** en `App.jsx`: Componentes pesados (Páginas) se cargan bajo demanda con `React.lazy` y `<Suspense>`, reduciendo el tiempo de carga interactiva.
- **Renderizado vectorial de SVG (Leaflet)**: Uso de íconos en DivIcon con marcado SVG puro en lugar de imágenes pesadas, usando aceleración de hardware para animaciones.
- **Caché en servicios**: evita re-fetching de JSONs estáticos.
- **CSS transitions** aceleradas por GPU: `transform`, `opacity`.

---

## 10. Comandos Útiles

```bash
npm run dev       # Servidor desarrollo (HMR)
npm run build     # Build de producción
npm run preview   # Preview del build
npm run lint      # ESLint
```

---

*Manual Técnico v1.0.0 — Medellín Movilidata OS — HackData CTGI SENA 2026*
