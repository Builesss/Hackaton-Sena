import { useState, useEffect, useRef } from 'react';
import { addNoise } from '../utils/helpers';

/**
 * Polls a data-fetching function at a given interval and
 * returns the current value, loading state, and error.
 */
export const useRealTime = (fetcher, interval = 5000, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchNow = async () => {
    try {
      const result = await fetcher();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNow();
    timerRef.current = setInterval(fetchNow, interval);
    return () => clearInterval(timerRef.current);
  }, [interval]);

  return { data, loading, error, lastUpdated, refetch: fetchNow };
};

/**
 * Simulates real-time traffic by adding random noise to
 * congestion / velocity values every `interval` ms.
 */
export const useSimulatedTraffic = (zones, interval = 4000) => {
  const [liveZones, setLiveZones] = useState(zones);

  useEffect(() => {
    if (!zones) return;
    setLiveZones(zones);
    const timer = setInterval(() => {
      setLiveZones((prev) =>
        prev.map((z) => ({
          ...z,
          congestion: addNoise(z.congestion, 4),
          velocidad: Math.max(5, addNoise(z.velocidad, 3)),
          flujo: Math.max(100, z.flujo + Math.round((Math.random() - 0.5) * 200)),
        }))
      );
    }, interval);
    return () => clearInterval(timer);
  }, [zones, interval]);

  return liveZones;
};

/**
 * Tracks current time and increments every second.
 */
export const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
};
