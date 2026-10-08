import axios from 'axios';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const CHART_CACHE_TTL_MS = 60_000;
const RATE_LIMIT_COOLDOWN_MS = 60_000;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const rand = (min, max) => min + Math.random() * (max - min);
const isCanceled = (err) => axios.isCancel(err) || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED';

/**
 * CoinGecko often answers 429 without CORS headers, so browsers surface it as a
 * plain network error (no `response`). We therefore treat 429, 5xx and
 * response-less failures as "use fallback data" conditions.
 */
const shouldFallback = (err) => {
  const status = err?.response?.status;
  return status === 429 || status >= 500 || !err?.response;
};

let rateLimitedUntil = 0;
const isCoolingDown = () => Date.now() < rateLimitedUntil;
const markRateLimited = (err) => {
  const retryAfter = Number(err?.response?.headers?.['retry-after']);
  const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_COOLDOWN_MS;
  rateLimitedUntil = Date.now() + wait;
};

const chartCache = new Map();
const getCachedChart = (key) => {
  const hit = chartCache.get(key);
  if (hit && Date.now() - hit.ts < CHART_CACHE_TTL_MS) return hit.value;
  chartCache.delete(key);
  return null;
};
const setCachedChart = (key, value) => chartCache.set(key, { ts: Date.now(), value });

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

// [id, symbol, name, price, circulatingSupply, maxSupply, volatility(per hour)]
const SEED = [
  ['bitcoin', 'btc', 'Bitcoin', 67450, 19.75e6, 21e6, 0.004],
  ['ethereum', 'eth', 'Ethereum', 3520, 120.2e6, null, 0.005],
  ['tether', 'usdt', 'Tether', 1.0, 118e9, null, 0.00004],
  ['binancecoin', 'bnb', 'BNB', 598, 145.9e6, 200e6, 0.005],
  ['solana', 'sol', 'Solana', 172, 463e6, null, 0.008],
  ['staked-ether', 'steth', 'Lido Staked Ether', 3515, 9.4e6, null, 0.005],
  ['usd-coin', 'usdc', 'USDC', 1.0, 34e9, null, 0.00004],
  ['ripple', 'xrp', 'XRP', 0.52, 56.6e9, 100e9, 0.007],
  ['dogecoin', 'doge', 'Dogecoin', 0.158, 145e9, null, 0.01],
  ['the-open-network', 'ton', 'Toncoin', 6.9, 2.5e9, null, 0.008],
  ['cardano', 'ada', 'Cardano', 0.46, 35.7e9, 45e9, 0.008],
  ['tron', 'trx', 'TRON', 0.121, 87e9, null, 0.006],
  ['avalanche-2', 'avax', 'Avalanche', 35.4, 394e6, 720e6, 0.009],
  ['shiba-inu', 'shib', 'Shiba Inu', 0.0000178, 589e12, null, 0.011],
  ['chainlink', 'link', 'Chainlink', 14.2, 608e6, 1e9, 0.009],
  ['polkadot', 'dot', 'Polkadot', 6.8, 1.43e9, null, 0.009],
  ['bitcoin-cash', 'bch', 'Bitcoin Cash', 480, 19.7e6, 21e6, 0.008],
  ['near', 'near', 'NEAR Protocol', 6.9, 1.1e9, null, 0.011],
  ['litecoin', 'ltc', 'Litecoin', 83, 74.7e6, 84e6, 0.007],
  ['uniswap', 'uni', 'Uniswap', 9.4, 600e6, 1e9, 0.01],
  ['internet-computer', 'icp', 'Internet Computer', 12.1, 465e6, null, 0.011],
  ['ethereum-classic', 'etc', 'Ethereum Classic', 27.5, 147e6, 210.7e6, 0.008],
  ['stellar', 'xlm', 'Stellar', 0.115, 29e9, 50e9, 0.008],
  ['monero', 'xmr', 'Monero', 160, 18.4e6, null, 0.006],
].map(([id, symbol, name, price, supply, max, vol], i) => ({ id, symbol, name, price, supply, max, vol, hue: (i * 47) % 360 }));

const avatar = (symbol, hue) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="hsl(${hue},65%,50%)"/><text x="32" y="40" font-family="Arial" font-size="22" font-weight="700" text-anchor="middle" fill="#fff">${symbol
      .slice(0, 3)
      .toUpperCase()}</text></svg>`
  )}`;

/** Random walk ending exactly at `endPrice`. */
function randomWalk(endPrice, points, stepVol, drift = 0) {
  const walk = [1];
  for (let i = 1; i < points; i += 1) {
    walk.push(walk[i - 1] * (1 + drift + rand(-1, 1) * stepVol));
  }
  const k = endPrice / walk[points - 1];
  return walk.map((v) => v * k);
}

export function generateMockCoins(count = 100) {
  const nowIso = new Date().toISOString();
  const pct = (a, b) => (a / b - 1) * 100;

  return SEED.slice(0, count)
    .map((s) => {
      const price = s.price * (1 + rand(-0.02, 0.02));
      const spark = randomWalk(price, 168, s.vol, rand(-0.0008, 0.0008) * Math.min(1, s.vol * 100));
      const n = spark.length;
      const marketCap = price * s.supply;
      const stable = s.vol < 0.001;
      const last24 = spark.slice(-24);
      const ath = price * (stable ? 1.1 : rand(1.05, 2.4));
      const atl = price * (stable ? 0.88 : rand(0.002, 0.3));
      const change1h = pct(price, spark[n - 2]);
      const change24h = pct(price, spark[n - 25]);
      const change7d = pct(price, spark[0]);

      return {
        id: s.id,
        symbol: s.symbol,
        name: s.name,
        image: avatar(s.symbol, s.hue),
        current_price: price,
        market_cap: marketCap,
        market_cap_rank: 0,
        fully_diluted_valuation: s.max ? price * s.max : null,
        total_volume: marketCap * (stable ? rand(0.05, 0.25) : rand(0.02, 0.09)),
        high_24h: Math.max(...last24),
        low_24h: Math.min(...last24),
        price_change_24h: price - spark[n - 25],
        price_change_percentage_24h: change24h,
        price_change_percentage_1h_in_currency: change1h,
        price_change_percentage_24h_in_currency: change24h,
        price_change_percentage_7d_in_currency: change7d,
        circulating_supply: s.supply,
        total_supply: s.max ?? s.supply,
        max_supply: s.max,
        ath,
        ath_change_percentage: pct(price, ath),
        atl,
        atl_change_percentage: pct(price, atl),
        last_updated: nowIso,
        sparkline_in_7d: { price: spark },
      };
    })
    .sort((a, b) => b.market_cap - a.market_cap)
    .map((c, i) => ({ ...c, market_cap_rank: i + 1 }));
}

export function generateMockChart(coinId, days) {
  const seed = SEED.find((s) => s.id === coinId);
  const base = seed?.price ?? 100;
  const hourlyVol = seed?.vol ?? 0.006;
  const stepMs = days <= 1 ? 5 * 60_000 : days <= 90 ? 3_600_000 : 86_400_000;
  const count = Math.max(2, Math.round((days * 86_400_000) / stepMs));
  const stepVol = hourlyVol * Math.sqrt(stepMs / 3_600_000);
  const end = Date.now();
  const series = randomWalk(base, count, stepVol);
  const supply = seed?.supply ?? 1e8;

  const prices = series.map((p, i) => [end - (count - 1 - i) * stepMs, p]);
  const total_volumes = prices.map(([ts, p]) => [ts, p * supply * 0.05 * rand(0.6, 1.5)]);
  const market_caps = prices.map(([ts, p]) => [ts, p * supply]);
  return { prices, total_volumes, market_caps };
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                      */
/* ------------------------------------------------------------------ */

export function normalizeCoin(c) {
  const change24h = c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0;
  return {
    ...c,
    sparkline: c.sparkline_in_7d?.price ?? [],
    change1h: c.price_change_percentage_1h_in_currency ?? 0,
    change24h,
    change7d: c.price_change_percentage_7d_in_currency ?? 0,
    // Reference price used by the hook's local live ticks to recompute 24h change.
    open24h: c.current_price / (1 + change24h / 100),
  };
}

export function deriveGlobalStats(coins) {
  const totalMarketCap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
  const totalVolume24h = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
  const btc = coins.find((c) => c.id === 'bitcoin');
  const weighted = coins.reduce((s, c) => s + (c.change24h || 0) * (c.market_cap || 0), 0);
  return {
    totalMarketCap,
    totalVolume24h,
    btcDominance: totalMarketCap && btc ? (btc.market_cap / totalMarketCap) * 100 : 0,
    activeAssets: coins.length,
    marketCapChange24h: totalMarketCap ? weighted / totalMarketCap : 0,
  };
}

/* ------------------------------------------------------------------ */
/* API                                                                */
/* ------------------------------------------------------------------ */

/**
 * GET /coins/markets — resolves to `{ data: Coin[], isMock }`.
 * Falls back to generated data on HTTP 429 / network / 5xx errors.
 */
export async function fetchMarkets({ perPage = 100, page = 1, vsCurrency = 'usd', signal } = {}) {
  if (isCoolingDown()) {
    return { data: generateMockCoins(perPage).map(normalizeCoin), isMock: true };
  }
  try {
    const { data } = await api.get('/coins/markets', {
      params: {
        vs_currency: vsCurrency,
        order: 'market_cap_desc',
        per_page: perPage,
        page,
        sparkline: true,
        price_change_percentage: '1h,24h,7d',
      },
      signal,
    });
    return { data: data.map(normalizeCoin), isMock: false };
  } catch (err) {
    if (isCanceled(err)) return { data: generateMockCoins(perPage).map(normalizeCoin), isMock: true };
    if (shouldFallback(err)) {
      if (err?.response?.status === 429) markRateLimited(err);
      console.warn('[marketApi] CoinGecko unavailable, using mock market data.', err?.message);
      return { data: generateMockCoins(perPage).map(normalizeCoin), isMock: true };
    }
    throw err;
  }
}

/** GET /global — resolves to normalised stats or `null` (caller derives from coins). */
export async function fetchGlobalStats(signal) {
  if (isCoolingDown()) return null;
  try {
    const { data } = await api.get('/global', { signal });
    const g = data?.data;
    if (!g) return null;
    return {
      totalMarketCap: g.total_market_cap?.usd ?? 0,
      totalVolume24h: g.total_volume?.usd ?? 0,
      btcDominance: g.market_cap_percentage?.btc ?? 0,
      activeAssets: g.active_cryptocurrencies ?? 0,
      marketCapChange24h: g.market_cap_change_percentage_24h_usd ?? 0,
    };
  } catch (err) {
    if (isCanceled(err)) return null; // Silently resolve null on canceled requests
    if (err?.response?.status === 429) markRateLimited(err);
    return null;
  }
}

/**
 * GET /coins/{id}/market_chart — resolves to
 * `{ data: { prices, total_volumes, market_caps }, isMock }`. Cached for 60s.
 */
export async function fetchMarketChart(coinId, days = 7, { vsCurrency = 'usd', signal } = {}) {
  const key = `${coinId}:${vsCurrency}:${days}`;
  const cached = getCachedChart(key);
  if (cached) return cached;

  const mock = () => {
    const result = { data: generateMockChart(coinId, days), isMock: true };
    setCachedChart(key, result);
    return result;
  };

  if (isCoolingDown()) return mock();

  try {
    const { data } = await api.get(`/coins/${encodeURIComponent(coinId)}/market_chart`, {
      params: { vs_currency: vsCurrency, days },
      signal,
    });
    const result = { data, isMock: false };
    setCachedChart(key, result);
    return result;
  } catch (err) {
    if (isCanceled(err)) return mock(); // Fall back cleanly without raising unhandled rejection
    if (shouldFallback(err)) {
      if (err?.response?.status === 429) markRateLimited(err);
      return mock();
    }
    throw err;
  }
}