const DAY = 86_400_000;

/** Time-range presets: `days` is the CoinGecko request size, `windowMs` the visible slice. */
export const RANGES = [
  { key: '1H', days: 1, windowMs: 60 * 60 * 1000 },
  { key: '24H', days: 1, windowMs: DAY },
  { key: '7D', days: 7, windowMs: 7 * DAY },
  { key: '30D', days: 30, windowMs: 30 * DAY },
  { key: '1Y', days: 365, windowMs: 365 * DAY },
];

/** CoinGecko `[[ts, value], ...]` -> clean, sorted Highcharts point pairs. */
export function toPoints(pairs = []) {
  return pairs
    .filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map(([ts, v]) => [ts, v])
    .sort((a, b) => a[0] - b[0]);
}

/**
 * Raw sparkline (evenly spaced values, no timestamps) -> `[timestamp, price]` pairs.
 * The last value is assumed to be "now".
 */
export function sparklineToPoints(values = [], { endTime = Date.now(), spanMs = 7 * DAY } = {}) {
  const n = values.length;
  if (!n) return [];
  const step = n > 1 ? spanMs / (n - 1) : 0;
  return values
    .map((v, i) => [Math.round(endTime - (n - 1 - i) * step), v])
    .filter((p) => Number.isFinite(p[1]));
}

/** Keep only points inside the trailing window. */
export function sliceWindow(points, windowMs) {
  if (!points.length || !windowMs) return points;
  const cutoff = points[points.length - 1][0] - windowMs;
  return points.filter((p) => p[0] >= cutoff);
}

/** Normalise to percentage change from the first point (for comparison charts). */
export function toPercentSeries(points) {
  if (!points.length || !points[0][1]) return [];
  const base = points[0][1];
  return points.map(([ts, v]) => [ts, (v / base - 1) * 100]);
}

/** Convenience: split a market_chart payload into windowed point arrays. */
export function transformMarketChart(raw, windowMs) {
  if (!raw) return { price: [], volume: [], marketCap: [] };
  return {
    price: sliceWindow(toPoints(raw.prices), windowMs),
    volume: sliceWindow(toPoints(raw.total_volumes), windowMs),
    marketCap: sliceWindow(toPoints(raw.market_caps), windowMs),
  };
}