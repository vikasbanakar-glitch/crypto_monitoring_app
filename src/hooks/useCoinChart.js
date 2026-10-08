import { useEffect, useState } from 'react';
import { fetchMarketChart } from '../services/marketApi';

/** Fetches `market_chart` for a coin; result is keyed so stale data is never shown for a new coin/range. */
export function useCoinChart(coinId, days) {
  const key = `${coinId}:${days}`;
  const [state, setState] = useState({ key: null, data: null, error: null, isMock: false });

  useEffect(() => {
    if (!coinId) return undefined;
    const controller = new AbortController();

    fetchMarketChart(coinId, days, { signal: controller.signal })
      .then(({ data, isMock }) => setState({ key, data, error: null, isMock }))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setState({ key, data: null, error: err?.message || 'Failed to load chart', isMock: false });
      });

    return () => controller.abort();
  }, [coinId, days, key]);

  const ready = state.key === key;
  return {
    data: ready ? state.data : null,
    error: ready ? state.error : null,
    isMock: ready && state.isMock,
    loading: Boolean(coinId) && !ready,
  };
}

export default useCoinChart;