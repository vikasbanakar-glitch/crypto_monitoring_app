import { memo, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import { useCoinChart } from '../../hooks/useCoinChart';
import { toPoints } from '../../utils/chartTransformers';
import { buildChartOptions, getAxisStyle, getThemeTokens } from '../../utils/chartTheme';
import { formatCompactUSD, formatPrice } from '../../utils/formatters';

// Module interop fix for Vite/ESM
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

const VP_RANGES = [
  { key: '7D', days: 7 },
  { key: '30D', days: 30 },
  { key: '90D', days: 90 },
];

function VolumePriceChart({ coinId, coinName, theme, height = 380 }) {
  const [rangeKey, setRangeKey] = useState('30D');
  const days = VP_RANGES.find((r) => r.key === rangeKey)?.days ?? 30;
  const { data, loading, error, isMock } = useCoinChart(coinId, days);

  const { prices, volumes } = useMemo(
    () => ({
      prices: toPoints(data?.prices || []),
      volumes: toPoints(data?.total_volumes || []),
    }),
    [data]
  );

  const options = useMemo(() => {
    const t = getThemeTokens(theme);
    const axes = getAxisStyle(theme);
    const maxVolume = volumes.reduce((m, p) => Math.max(m, p[1] || 0), 1);

    return buildChartOptions(theme, {
      chart: { height, zoomType: 'x' },
      xAxis: { type: 'datetime' },
      yAxis: [
        Highcharts.merge(axes.yAxis, {
          title: { text: 'Price (USD)' },
          startOnTick: false,
          endOnTick: false,
          labels: {
            formatter() {
              return formatPrice(this.value);
            },
          },
        }),
        Highcharts.merge(axes.yAxis, {
          title: { text: 'Volume' },
          opposite: true,
          gridLineWidth: 0,
          min: 0,
          max: maxVolume * 3, // keeps columns in the lower third
          labels: {
            formatter() {
              return formatCompactUSD(this.value, 0);
            },
          },
        }),
      ],
      legend: { enabled: true },
      tooltip: {
        shared: true,
        formatter() {
          const header = `<div style="font-size:11px;opacity:.7;margin-bottom:4px">${Highcharts.dateFormat(
            '%b %e, %Y %H:%M',
            this.x
          )}</div>`;
          const rows = (this.points || [])
            .map(
              (p) =>
                `<div><span style="color:${p.color}">●</span> ${p.series.name}: <b>${
                  p.series.name === 'Price' ? formatPrice(p.y) : formatCompactUSD(p.y)
                }</b></div>`
            )
            .join('');
          return header + rows;
        },
      },
      series: [
        {
          type: 'column',
          name: 'Volume',
          yAxis: 1,
          data: volumes,
          color: 'rgba(99,102,241,0.45)',
          borderWidth: 0,
          pointPadding: 0,
          groupPadding: 0,
          zIndex: 0,
        },
        {
          type: 'line',
          name: 'Price',
          yAxis: 0,
          data: prices,
          color: '#f59e0b',
          lineWidth: 2,
          marker: { enabled: false },
          zIndex: 2,
        },
      ],
    });
  }, [theme, height, prices, volumes]);

  return (
    <div className="price-chart">
      <div className="chart-toolbar">
        <div className="chart-meta">
          <strong>{coinName}</strong>
          <span className="muted">Price vs. 24h volume</span>
          {isMock && <span className="badge badge-demo">Demo data</span>}
        </div>
        <div className="range-buttons" role="group" aria-label="Select time range">
          {VP_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`range-btn ${r.key === rangeKey ? 'is-active' : ''}`}
              aria-pressed={r.key === rangeKey}
              onClick={() => setRangeKey(r.key)}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrap" style={{ minHeight: height }}>
        <HighchartsReact highcharts={Highcharts} options={options} />
        {loading && <div className="chart-overlay">Loading chart…</div>}
        {error && !loading && <div className="chart-overlay chart-error">{error}</div>}
      </div>
    </div>
  );
}

export default memo(VolumePriceChart);