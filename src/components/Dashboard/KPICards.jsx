import { memo, useMemo } from 'react';
import { formatCompactUSD, formatNumber, formatPercent, percentClass } from '../../utils/formatters';

function KPICards({ stats, loading }) {
  const cards = useMemo(
    () => [
      {
        key: 'cap',
        label: 'Total Market Cap',
        value: formatCompactUSD(stats?.totalMarketCap),
        change: stats?.marketCapChange24h,
      },
      { key: 'vol', label: '24h Volume', value: formatCompactUSD(stats?.totalVolume24h) },
      {
        key: 'dom',
        label: 'BTC Dominance',
        value: stats ? `${stats.btcDominance.toFixed(1)}%` : '—',
      },
      { key: 'assets', label: 'Active Assets', value: formatNumber(stats?.activeAssets) },
    ],
    [stats]
  );

  const showSkeleton = loading && !stats;

  return (
    <section className="kpi-grid" aria-label="Key market indicators">
      {cards.map((card) => (
        <article key={card.key} className="kpi-card">
          <span className="kpi-label">{card.label}</span>
          {showSkeleton ? (
            <div className="skeleton" aria-hidden="true" />
          ) : (
            <>
              <span className="kpi-value">{card.value}</span>
              {card.change != null && (
                <span className={`pill ${percentClass(card.change)}`}>{formatPercent(card.change)} 24h</span>
              )}
            </>
          )}
        </article>
      ))}
    </section>
  );
}

export default memo(KPICards);