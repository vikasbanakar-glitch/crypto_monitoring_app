import { memo, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import { sparklineToPoints, toPercentSeries } from '../../utils/chartTransformers';
import { CHART_COLORS, buildChartOptions, getThemeTokens } from '../../utils/chartTheme';
import { formatPercent } from '../../utils/formatters';

// Module interop fix for Vite/ESM
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

// Flat stablecoins and wrapped/staked duplicates make for boring comparison lines.
const EXCLUDED = new Set(['usdt', 'usdc', 'dai', 'usds', 'fdusd', 'tusd', 'usde', 'steth', 'wsteth']);

function AssetComparisonChart({ coins = [], theme, height = 340 }) {
  const candidates = useMemo(() => {
    if (!Array.isArray(coins)) return [];
    return coins.filter((c) => c?.symbol && !EXCLUDED.has(c.symbol.toLowerCase())).slice(0, 8);
  }, [coins]);

  const defaultIds = useMemo(() => candidates.slice(0, 5).map((c) => c.id), [candidates]);
  const [customIds, setCustomIds] = useState(null);
  const activeIds = customIds ?? defaultIds;

  const toggle = (id) => {
    const current = customIds ?? defaultIds;
    setCustomIds(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const series = useMemo(() => {
    const endTime = Date.now();
    return candidates
      .map((c, i) => ({ coin: c, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .filter(({ coin }) => activeIds.includes(coin.id))
      .map(({ coin, color }) => ({
        type: 'line',
        name: (coin.symbol || coin.name || '').toUpperCase(),
        color,
        data: toPercentSeries(sparklineToPoints(coin.sparkline, { endTime })),
        lineWidth: 2,
        marker: { enabled: false },
      }));
  }, [candidates, activeIds]);

  const options = useMemo(() => {
    const t = getThemeTokens(theme);
    return buildChartOptions(theme, {
      accessibility: { enabled: false },
      chart: { type: 'line', height, zoomType: 'x' },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: 'Change over 7 days (%)' },
        labels: {
          formatter() {
            return `${this.value}%`;
          },
        },
        plotLines: [{ value: 0, color: t.muted, width: 1, dashStyle: 'Dash', zIndex: 3 }],
      },
      legend: { enabled: true },
      tooltip: {
        shared: true,
        formatter() {
          const header = `<div style="font-size:11px;opacity:.7;margin-bottom:4px">${Highcharts.dateFormat(
            '%b %e, %H:%M',
            this.x
          )}</div>`;
          const rows = (this.points || [])
            .slice()
            .sort((a, b) => b.y - a.y)
            .map((p) => `<div><span style="color:${p.color}">●</span> ${p.series.name}: <b>${formatPercent(p.y)}</b></div>`)
            .join('');
          return header + rows;
        },
      },
      series,
    });
  }, [theme, height, series]);

  return (
    <div>
      <div className="chips" role="group" aria-label="Select assets to compare">
        {candidates.map((c, i) => {
          const on = activeIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`chip ${on ? 'is-active' : ''}`}
              aria-pressed={on}
              onClick={() => toggle(c.id)}
            >
              <span className="dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              {(c.symbol || '').toUpperCase()}
            </button>
          );
        })}
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export default memo(AssetComparisonChart);