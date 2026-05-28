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
export const getTrafficData     = () => fetchData(API_ENDPOINTS.traffic);
export const getWeatherData     = () => fetchData(API_ENDPOINTS.weather);

// Simulate live polling — invalidates cache after each call
export const getLiveTraffic = async () => {
  delete cache[API_ENDPOINTS.traffic];
  return fetchData(API_ENDPOINTS.traffic);
};

export const getLiveWeather = async () => {
  delete cache[API_ENDPOINTS.weather];
  return fetchData(API_ENDPOINTS.weather);
};
