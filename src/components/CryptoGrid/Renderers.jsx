import { useMemo } from 'react';
import { formatPercent, formatPrice, percentClass } from '../../utils/formatters';

/**
 * Cell renderers. Interactive elements carry `data-no-row-click` so the grid's
 * onRowClicked handler can ignore clicks on them.
 */

export function CoinCellRenderer({ data }) {
  if (!data) return null;
  return (
    <div className="coin-cell">
      <img
        src={data.image}
        alt=""
        width="28"
        height="28"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.visibility = 'hidden';
        }}
      />
      <div className="coin-text">
        <span className="coin-name">{data.name}</span>
        <span className="coin-symbol">{data.symbol.toUpperCase()}</span>
      </div>
    </div>
  );
}

export function PriceCellRenderer({ value }) {
  return <span className="mono">{formatPrice(value)}</span>;
}

export function PercentCellRenderer({ value }) {
  const cls = percentClass(value);
  const arrow = cls === 'positive' ? '▲' : cls === 'negative' ? '▼' : '';
  return (
    <span className={`pill ${cls}`}>
      {arrow && <span aria-hidden="true">{arrow} </span>}
      {formatPercent(value)}
    </span>
  );
}

export function SparklineCellRenderer({ value, data }) {
  const points = useMemo(() => {
    if (!value?.length) return '';
    const step = Math.max(1, Math.ceil(value.length / 56));
    const pts = value.filter((_, i) => i % step === 0);
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const last = Math.max(1, pts.length - 1);
    return pts.map((v, i) => `${((i / last) * 100).toFixed(1)},${(29 - ((v - min) / span) * 28).toFixed(1)}`).join(' ');
  }, [value]);

  const up = (data?.change7d ?? 0) >= 0;
  return (
    <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label="7 day price trend">
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--up)' : 'var(--down)'}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function WatchlistCellRenderer({ data, context }) {
  if (!data) return null;
  const watched = context.watchlist.has(data.id);
  return (
    <button
      type="button"
      className="icon-btn"
      data-no-row-click
      aria-pressed={watched}
      aria-label={watched ? `Remove ${data.name} from watchlist` : `Add ${data.name} to watchlist`}
      onClick={() => context.onToggleWatchlist(data.id)}
    >
      {watched ? '★' : '☆'}
    </button>
  );
}

export function ActionCellRenderer({ data, context }) {
  if (!data) return null;
  return (
    <button
      type="button"
      className="btn btn-sm"
      data-no-row-click
      aria-label={`View details for ${data.name}`}
      onClick={() => context.onViewDetails(data)}
    >
      Details
    </button>
  );
}