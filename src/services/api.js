import { API_ENDPOINTS } from '../config/config';

const cache = {};

const fetchData = async (url) => {
  if (cache[url]) return cache[url];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  cache[url] = data;
  return data;
};

export const getAccidentsData   = () => fetchData(API_ENDPOINTS.accidents);
export const getMetroplusRoutes = () => fetchData('/data/alimentadora_ruta.geojson');

export const getWeatherData = async () => {
  const data = await fetchData(API_ENDPOINTS.weather);
  const resultData = JSON.parse(JSON.stringify(data));

  const owmKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (owmKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=6.2442&lon=-75.5812&units=metric&lang=es&appid=${owmKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const live = await res.json();
        resultData.actual.temperatura = Math.round(live.main.temp);
        resultData.actual.humedad = live.main.humidity;
        resultData.actual.precipitacion = live.rain ? (live.rain['1h'] || 0) : 0;
        resultData.actual.viento = Math.round(live.wind.speed * 3.6);
        resultData.actual.estado = live.weather[0].description;
        resultData.actual.visibilidad = live.visibility < 3000 ? "reducida" : "buena";
        
        let rainLevel = 0;
        if (resultData.actual.precipitacion > 10) {
           resultData.actual.alerta = true;
           resultData.actual.nivelRiesgo = "crítico";
           rainLevel = 2;
        } else if (resultData.actual.precipitacion > 2) {
           resultData.actual.alerta = true;
           resultData.actual.nivelRiesgo = "alto";
           rainLevel = 1;
        } else {
           resultData.actual.alerta = false;
           resultData.actual.nivelRiesgo = "bajo";
           rainLevel = 0;
        }

        // --- DYNAMIC RISK ZONES: Live Weather + Real Historical CSV Accidents ---
        try {
          const accidentsReq = await fetchData(API_ENDPOINTS.accidents);
          if (accidentsReq && accidentsReq.zonasCriticas) {
            // Sort by risk, take top 5
            const topZonas = [...accidentsReq.zonasCriticas].sort((a, b) => b.riesgo - a.riesgo).slice(0, 5);
            
            resultData.zonasRiesgo = topZonas.map(z => {
               const isActivo = rainLevel > 0; // Only active if it's currently raining
               const finalNivel = rainLevel === 2 ? 'crítico' : (rainLevel === 1 ? 'alto' : 'moderado');
               
               return {
                 id: z.zona,
                 zona: `Vías en ${z.zona}`,
                 lat: z.lat,
                 lng: z.lng,
                 riesgo: Math.min(100, z.riesgo + (rainLevel * 15)), // Risk goes up if raining
                 nivel: finalNivel,
                 activo: isActivo,
                 tipo: "Alta probabilidad histórica de choques bajo lluvia"
               };
            });
          }
        } catch(e) {
          console.warn("Could not load accidents for dynamic weather zones");
        }
      }
    } catch (e) {
      console.warn("Error fetching OpenWeatherMap", e);
    }
  }

  return resultData;
};

export const getTrafficData = async () => {
  const data = await fetchData(API_ENDPOINTS.traffic);
  const resultData = JSON.parse(JSON.stringify(data)); // Clone to avoid cache mutation

  const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (tomtomKey) {
    try {
      const liveZones = await Promise.all(resultData.zonas.map(async (zona) => {
        try {
          const url = `/tomtom/traffic/services/4/flowSegmentData/absolute/10/json?key=${tomtomKey}&point=${zona.lat},${zona.lng}`;
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            const flow = json.flowSegmentData;
            if (flow) {
              const currentSpeed = flow.currentSpeed;
              const freeFlowSpeed = flow.freeFlowSpeed || (currentSpeed + 1);
              const congestionRatio = 1 - (currentSpeed / freeFlowSpeed);
              const congestion = Math.max(0, Math.min(100, Math.round(congestionRatio * 100)));
              
              let estado = 'normal';
              if (congestion >= 80) estado = 'crítico';
              else if (congestion >= 60) estado = 'alto';
              else if (congestion >= 35) estado = 'moderado';

              return { ...zona, velocidad: currentSpeed, congestion, estado, live: true };
            }
          }
        } catch (e) {
          console.warn('TomTom request failed for', zona.nombre, e);
        }
        return zona;
      }));
      resultData.zonas = liveZones;
    } catch (e) {
      console.warn('General TomTom error', e);
    }
  }

  return resultData;
};

// Simulate live polling — invalidates cache after each call
export const getLiveTraffic = async () => {
  delete cache[API_ENDPOINTS.traffic];
  return fetchData(API_ENDPOINTS.traffic);
};

export const getLiveWeather = async () => {
  delete cache[API_ENDPOINTS.weather];
  return fetchData(API_ENDPOINTS.weather);
};

export const getCamerasData = () => fetchData(API_ENDPOINTS.cameras);
export const getAirQualityData = async () => {
  const data = await fetchData(API_ENDPOINTS.airQuality);
  if (Array.isArray(data)) {
    let sum = 0;
    let count = 0;
    const stations = [];
    
    data.forEach(station => {
      if (station.datos && station.datos.length > 0) {
        // Encontrar el último valor válido (diferente a -9999)
        const validData = station.datos.filter(d => d.valor !== -9999);
        if (validData.length > 0) {
          const last = validData[validData.length - 1];
          sum += last.valor;
          count++;
          stations.push({
            lat: station.latitud,
            lng: station.longitud || station.latitud, // Fallback if missing
            valor: last.valor,
            calidad: last.calidad,
            nombre: `Estación ${station.codigoSerial}`
          });
        }
      }
    });
    
    const avg = count > 0 ? Math.round(sum / count) : 0;
    let estado = 'Bueno';
    if (avg > 55) estado = 'Dañino';
    else if (avg > 35) estado = 'Malo';
    else if (avg > 12) estado = 'Moderado';
    
    return {
      promedioCiudad: { pm25: avg, estado },
      estaciones: stations
    };
  }
  return data;
};
