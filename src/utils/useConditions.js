import { useAsync } from './useAsync.js';
import { getForecast } from '../services/weather.js';
import { getRiverGauges } from '../services/usgs.js';
import { moonPhase } from '../services/moon.js';

export function useForecast(location) {
  return useAsync(() => getForecast(location.center, location.timezone), [location.id]);
}
export function useGauges(location) {
  return useAsync(() => getRiverGauges(location), [location.id]);
}
export function useMoon() {
  return moonPhase(new Date());
}
