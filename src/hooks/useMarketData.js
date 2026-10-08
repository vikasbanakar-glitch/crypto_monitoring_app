import { useCallback, useEffect, useRef, useState } from 'react';
import { deriveGlobalStats, fetchGlobalStats, fetchMarkets } from '../services/marketApi';

const DEFAULTS = {
  perPage: 100,
  pollIntervalMs: 60_000, // network refresh cadence
  liveTickMs: 3_000, // local simulated price tick (0 disables)
  liveVolatility: 0.0004,
};

const STABLE_SYMBOLS = new Set(['usdt', 'usdc', 'dai', 'usds', 'fdusd', 'tusd', 'usde']);

/**
 * Central market data hook with fallback resilience for rate limits (429/CORS).
 *  - `snapshot`: last fetched data (stable between polls; ideal for charts)
 *  - `coins`: same data with locally simulated live price updates (ideal for grid/KPIs)
 */
export function useMarketData(options = {}) {
  const { perPage, pollIntervalMs, liveTickMs, liveVolatility } = { ...DEFAULTS, ...options };

  const [coins, setCoins] = useState([]);
  const [snapshot, setSnapshot] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const abortRef = useRef(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (hasDataRef.current) setRefreshing(true);
    else setLoading(true);

    try {
      const [markets, global] = await Promise.all([
        fetchMarkets({ perPage, signal: controller.signal }),
        fetchGlobalStats(controller.signal).catch((err) => {
          console.warn('Global stats endpoint failed/rate-limited:', err?.message);
          return null;
        }),
      ]);

      if (controller.signal.aborted) return;

      const marketData = markets?.data || [];
      const isMockData = Boolean(markets?.isMock);

      hasDataRef.current = true;
      setSnapshot(marketData);
      setCoins(marketData);
      setGlobalStats(!isMockData && global ? global : deriveGlobalStats(marketData));
      setIsMock(isMockData);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED' || controller.signal.aborted) {
        return;
      }

      console.warn('Market fetch error (rate-limit/CORS/network):', err?.message);

      // Gracefully handle rate-limits/network errors by preserving existing state if available
      if (!hasDataRef.current) {
        setError(err?.message || 'Failed to load market data');
      } else {
        console.warn('Preserving previously loaded snapshot due to API error.');
      }
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [perPage]);

  // Initial load + cleanup of in-flight request.
  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Interval polling (paused when the tab is hidden or auto-refresh is off).
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, pollIntervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, pollIntervalMs, load]);

  // Local live price simulation between network refreshes.
  useEffect(() => {
    if (!liveTickMs || liveTickMs <= 0) return undefined;
    const id = setInterval(() => {
      if (document.hidden) return;
      setCoins((prev) =>
        prev.length
          ? prev.map((c) => {
              const vol = STABLE_SYMBOLS.has(c.symbol) ? liveVolatility * 0.02 : liveVolatility;
              const factor = 1 + (Math.random() - 0.5) * 2 * vol;
              const price = c.current_price * factor;
              return {
                ...c,
                current_price: price,
                market_cap: c.market_cap * factor,
                change24h: c.open24h ? (price / c.open24h - 1) * 100 : c.change24h,
                high_24h: Math.max(c.high_24h ?? price, price),
                low_24h: Math.min(c.low_24h ?? price, price),
              };
            })
          : prev
      );
    }, liveTickMs);
    return () => clearInterval(id);
  }, [liveTickMs, liveVolatility]);

  return {
    coins,
    snapshot,
    globalStats,
    loading,
    refreshing,
    error,
    isMock,
    lastUpdated,
    refresh: load,
    autoRefresh,
    setAutoRefresh,
  };
}

export default useMarketData;