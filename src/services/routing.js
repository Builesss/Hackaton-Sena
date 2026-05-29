// ─── OSRM-based Route Engine + AI Safety Scoring ─────────────────
// Uses free public OSRM API for road geometry, then scores each
// alternative route based on traffic / accident / rain datasets.

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ─── Point-in-circle helper ───────────────────────────────────────
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Decode Google-style encoded polyline (OSRM uses it)
const decodePolyline = (encoded) => {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
};

// ─── Score a route polyline against a hazard zone set ────────────
const scoreRoute = (coords, trafficZones, accidentZones, rainZones) => {
  let trafficPenalty = 0;
  let accidentPenalty = 0;
  let rainPenalty = 0;
  const hazards = [];

  // Sample every 5th coordinate to keep it fast
  const sample = coords.filter((_, i) => i % 5 === 0);

  sample.forEach(([lat, lng]) => {
    // Traffic congestion check
    trafficZones?.forEach((z) => {
      const d = distanceKm(lat, lng, z.lat, z.lng);
      if (d < 0.6) {
        const weight = z.congestion / 100;
        trafficPenalty += weight;
        if (z.congestion >= 80 && !hazards.find(h => h.id === z.id)) {
          hazards.push({ id: z.id, type: 'traffic', name: z.nombre, severity: z.congestion });
        }
      }
    });

    // Accident risk check
    accidentZones?.forEach((z) => {
      const d = distanceKm(lat, lng, z.lat, z.lng);
      if (d < 0.5) {
        const weight = z.riesgo / 100;
        accidentPenalty += weight;
        if (z.riesgo >= 70 && !hazards.find(h => h.id === `acc-${z.zona}`)) {
          hazards.push({ id: `acc-${z.zona}`, type: 'accident', name: z.zona, severity: z.riesgo });
        }
      }
    });

    // Rain / flood check
    rainZones?.forEach((z) => {
      if (!z.lat || !z.lng) return;
      const d = distanceKm(lat, lng, z.lat, z.lng);
      if (d < 0.8) {
        const weight = (z.lluvia_mm || 0) / 50;
        rainPenalty += weight;
        if ((z.lluvia_mm || 0) >= 20 && !hazards.find(h => h.id === `rain-${z.nombre}`)) {
          hazards.push({ id: `rain-${z.nombre}`, type: 'rain', name: z.nombre, severity: z.lluvia_mm });
        }
      }
    });
  });

  // Normalize penalties
  const normalize = (v) => Math.min(100, (v / Math.max(sample.length, 1)) * 100);
  const totalPenalty = normalize(trafficPenalty) * 0.4 + normalize(accidentPenalty) * 0.35 + normalize(rainPenalty) * 0.25;
  const safetyScore = Math.max(0, Math.round(100 - totalPenalty));

  return { safetyScore, trafficPenalty: Math.round(normalize(trafficPenalty)), accidentPenalty: Math.round(normalize(accidentPenalty)), rainPenalty: Math.round(normalize(rainPenalty)), hazards };
};

// ─── Main Route Compute Function (TomTom + AI Safety Scoring) ─────
export const computeRoutes = async (origin, destination, trafficData, accidentsData, weatherData) => {
  const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!tomtomKey) throw new Error("API Key de TomTom no configurada");

  // Usamos la API de TomTom calculando ruta con consideraciones de tráfico en tiempo real
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json?key=${tomtomKey}&traffic=true&maxAlternatives=2`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo obtener la ruta desde TomTom');
  const json = await response.json();

  if (!json.routes || json.routes.length === 0) throw new Error('No se encontraron rutas');

  const trafficZones = trafficData?.zonas || [];
  const accidentZones = accidentsData?.zonasCriticas || [];
  const rainZones = weatherData?.zonasRiesgo || []; // Using the dynamic weather risk zones

  const scored = json.routes.map((route, index) => {
    // TomTom returns coordinates directly under legs[0].points
    const points = route.legs[0].points;
    const coords = points.map(p => [p.latitude, p.longitude]);
    
    const summary = route.summary;
    const scoring = scoreRoute(coords, trafficZones, accidentZones, rainZones);
    
    return {
      index,
      coords,
      distance: summary.lengthInMeters, // meters
      duration: summary.travelTimeInSeconds, // seconds
      ...scoring,
    };
  });

  // Sort by safety score descending (best = safest)
  scored.sort((a, b) => b.safetyScore - a.safetyScore);

  return scored;
};

// ─── Reverse Geocode (Nominatim) ──────────────────────────────────
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

// ─── Forward Geocode (Nominatim, Medellín bias) ───────────────────
export const geocodeAddress = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Medellín, Colombia')}&format=json&limit=5&accept-language=es`
    );
    const data = await res.json();
    return data.map((r) => ({
      label: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
};
