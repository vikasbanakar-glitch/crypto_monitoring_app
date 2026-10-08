import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import KPICards from '../components/Dashboard/KPICards';
import PriceChart from '../components/Charts/PriceChart';
import VolumePriceChart from '../components/Charts/VolumePriceChart';
import MarketCapChart from '../components/Charts/MarketCapChart';
import DistributionChart from '../components/Charts/DistributionChart';
import GainersLosersBarChart from '../components/Charts/GainersLosersBarChart';
import AssetComparisonChart from '../components/Charts/AssetComparisonChart';
import CryptoGrid from '../components/CryptoGrid/CryptoGrid';
import AssetDetailsDrawer from '../components/AssetDetails/AssetDetailsDrawer';
import { useMarketData } from '../hooks/useMarketData';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../context/ThemeContext';

const WATCHLIST_KEY = 'crypto-dashboard-watchlist';

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function Card({ title, actions, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
        {actions && <div className="card-actions">{actions}</div>}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

export default function MarketDashboard() {
  const { theme, toggleTheme } = useTheme();
  const {
    coins,
    snapshot,
    globalStats,
    loading,
    refreshing,
    error,
    isMock,
    lastUpdated,
    refresh,
    autoRefresh,
    setAutoRefresh,
  } = useMarketData();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [watchOnly, setWatchOnly] = useState(false);
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chartCoinId, setChartCoinId] = useState('bitcoin');

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...watchlist]));
    } catch {
      /* ignore */
    }
  }, [watchlist]);

  /* ---------------------------- derived data ---------------------------- */

  // Charts use `snapshot` (changes only on network refresh) to avoid redrawing every live tick.
  const topGainers = useMemo(() => [...snapshot].sort((a, b) => b.change24h - a.change24h).slice(0, 5), [snapshot]);
  const topLosers = useMemo(() => [...snapshot].sort((a, b) => a.change24h - b.change24h).slice(0, 5), [snapshot]);
  const topByCap = useMemo(() => snapshot.slice(0, 10), [snapshot]);
  const chartOptionsList = useMemo(() => snapshot.slice(0, 20), [snapshot]);

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return coins.filter(
      (c) =>
        (!watchOnly || watchlist.has(c.id)) &&
        (!q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
    );
  }, [coins, debouncedSearch, watchOnly, watchlist]);

  const selectedCoin = useMemo(() => coins.find((c) => c.id === selectedId) ?? null, [coins, selectedId]);
  const chartCoin = useMemo(() => coins.find((c) => c.id === chartCoinId) ?? coins[0] ?? null, [coins, chartCoinId]);

  /* ------------------------------ handlers ------------------------------ */

  const handleToggleWatchlist = useCallback((id) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectCoin = useCallback((coin) => {
    setSelectedId(coin.id);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);
  const handleChartCoinChange = useCallback((id) => setChartCoinId(id), []);
  const handleAutoRefresh = useCallback((value) => setAutoRefresh(value), [setAutoRefresh]);

  /* -------------------------------- render ------------------------------- */

  const coinSelect = (
    <select
      className="select"
      aria-label="Select asset for charts"
      value={chartCoin?.id ?? ''}
      onChange={(e) => handleChartCoinChange(e.target.value)}
    >
      {chartOptionsList.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.symbol.toUpperCase()})
        </option>
      ))}
    </select>
  );

  return (
    <div className="container">
      <DashboardHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={refresh}
        refreshing={refreshing}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={handleAutoRefresh}
        lastUpdated={lastUpdated}
        isMock={isMock}
      />

      {isMock && (
        <div className="banner banner-warn" role="status">
          CoinGecko is rate-limiting or unreachable, so simulated demo data is being shown. Live data resumes automatically.
        </div>
      )}
      {error && (
        <div className="banner banner-error" role="alert">
          Failed to load market data: {error}
          <button type="button" className="btn btn-sm" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      )}

      <KPICards stats={globalStats} loading={loading} />

      <div className="layout">
        <Card title="Price" className="col-8" actions={coinSelect}>
          {chartCoin ? (
            <PriceChart
              key={chartCoin.id}
              coinId={chartCoin.id}
              coinName={chartCoin.name}
              symbol={chartCoin.symbol}
              currentPrice={chartCoin.current_price}
              theme={theme}
            />
          ) : (
            <div className="placeholder">Loading…</div>
          )}
        </Card>

        <Card title="Market Share" className="col-4">
          <DistributionChart coins={snapshot} totalMarketCap={globalStats?.totalMarketCap} theme={theme} />
        </Card>

        <Card title="Price & Volume" className="col-8" actions={coinSelect}>
          {chartCoin ? (
            <VolumePriceChart key={chartCoin.id} coinId={chartCoin.id} coinName={chartCoin.name} theme={theme} />
          ) : (
            <div className="placeholder">Loading…</div>
          )}
        </Card>

        <Card title="Top Market Caps" className="col-4">
          <MarketCapChart coins={topByCap} theme={theme} onCoinClick={handleChartCoinChange} />
        </Card>

        <Card title="Top Movers" className="col-6">
          <GainersLosersBarChart gainers={topGainers} losers={topLosers} theme={theme} />
        </Card>

        <Card title="Asset Performance (7D)" className="col-6">
          <AssetComparisonChart coins={snapshot} theme={theme} />
        </Card>

        <Card title="Markets" className="col-12">
          <CryptoGrid
            rowData={filteredRows}
            loading={loading}
            theme={theme}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onRowSelected={handleSelectCoin}
            searchValue={search}
            onSearchChange={setSearch}
            watchOnly={watchOnly}
            onWatchOnlyChange={setWatchOnly}
          />
        </Card>
      </div>

      <footer className="footer">Market data provided by CoinGecko. Not financial advice.</footer>

      <AssetDetailsDrawer
        coin={selectedCoin}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        theme={theme}
        watched={selectedCoin ? watchlist.has(selectedCoin.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
      />
    </div>
  );
}