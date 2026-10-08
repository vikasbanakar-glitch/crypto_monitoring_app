import { memo, useEffect, useMemo, useRef } from 'react';
import PriceChart from '../Charts/PriceChart';
import {
  formatCompactNumber,
  formatCompactUSD,
  formatPercent,
  formatPrice,
  percentClass,
} from '../../utils/formatters';

function AssetDetailsDrawer({ coin, open, onClose, theme, watched, onToggleWatchlist }) {
  const closeRef = useRef(null);

  // Escape to close, body scroll lock and initial focus while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const stats = useMemo(() => {
    if (!coin) return [];
    const sym = coin.symbol.toUpperCase();
    return [
      ['Market Cap Rank', `#${coin.market_cap_rank}`],
      ['Market Cap', formatCompactUSD(coin.market_cap)],
      ['Fully Diluted Valuation', formatCompactUSD(coin.fully_diluted_valuation)],
      ['24h Volume', formatCompactUSD(coin.total_volume)],
      ['24h High', formatPrice(coin.high_24h)],
      ['24h Low', formatPrice(coin.low_24h)],
      ['Circulating Supply', `${formatCompactNumber(coin.circulating_supply)} ${sym}`],
      ['Total Supply', `${formatCompactNumber(coin.total_supply)} ${sym}`],
      ['Max Supply', coin.max_supply ? `${formatCompactNumber(coin.max_supply)} ${sym}` : '∞'],
      ['All-Time High', `${formatPrice(coin.ath)} (${formatPercent(coin.ath_change_percentage, 1)})`],
      ['All-Time Low', `${formatPrice(coin.atl)} (${formatPercent(coin.atl_change_percentage, 1)})`],
    ];
  }, [coin]);

  return (
    <>
      <div className={`drawer-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={coin ? `${coin.name} details` : 'Asset details'}
        aria-hidden={!open}
      >
        <div className="drawer-head">
          {coin && (
            <div className="coin-cell">
              <img src={coin.image} alt="" width="36" height="36" />
              <div className="coin-text">
                <span className="coin-name drawer-title">{coin.name}</span>
                <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
              </div>
            </div>
          )}
          <div className="drawer-head-actions">
            {coin && (
              <button
                type="button"
                className="icon-btn"
                aria-pressed={watched}
                aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                onClick={() => onToggleWatchlist(coin.id)}
              >
                {watched ? '★' : '☆'}
              </button>
            )}
            <button ref={closeRef} type="button" className="btn btn-sm" onClick={onClose} aria-label="Close details">
              ✕
            </button>
          </div>
        </div>

        {coin && (
          <div className="drawer-body">
            <div className="drawer-price">
              <span className="drawer-price-value mono">{formatPrice(coin.current_price)}</span>
              <span className={`pill ${percentClass(coin.change24h)}`}>{formatPercent(coin.change24h)} 24h</span>
            </div>

            <div className="drawer-changes">
              {[
                ['1h', coin.change1h],
                ['24h', coin.change24h],
                ['7d', coin.change7d],
              ].map(([label, value]) => (
                <div key={label} className="stat">
                  <span className="stat-label">{label}</span>
                  <span className={`stat-value ${percentClass(value)}`}>{formatPercent(value)}</span>
                </div>
              ))}
            </div>

            <PriceChart
              key={coin.id}
              coinId={coin.id}
              coinName={coin.name}
              symbol={coin.symbol}
              currentPrice={coin.current_price}
              theme={theme}
              defaultRange="7D"
              height={280}
            />

            <dl className="stats-grid">
              {stats.map(([label, value]) => (
                <div key={label} className="stat">
                  <dt className="stat-label">{label}</dt>
                  <dd className="stat-value">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </aside>
    </>
  );
}

export default memo(AssetDetailsDrawer);