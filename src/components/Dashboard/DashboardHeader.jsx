import { memo } from 'react';

function DashboardHeader({
  theme,
  onToggleTheme,
  onRefresh,
  refreshing,
  autoRefresh,
  onAutoRefreshChange,
  lastUpdated,
  isMock,
}) {
  return (
    <header className="dash-header">
      <div>
        <h1 className="dash-title">Crypto Market Monitor</h1>
        <p className="dash-subtitle">
          {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading market data…'}
          {isMock && <span className="badge badge-demo">Demo data</span>}
        </p>
      </div>

      <div className="header-actions">
        <label className="toggle">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => onAutoRefreshChange(e.target.checked)} />
          Auto-refresh
        </label>

        <button type="button" className="btn" onClick={() => onRefresh()} disabled={refreshing}>
          <span className={refreshing ? 'spin' : ''} aria-hidden="true">
            ↻
          </span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        <button
          type="button"
          className="btn"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="Toggle dark theme"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
        </button>
      </div>
    </header>
  );
}

export default memo(DashboardHeader);