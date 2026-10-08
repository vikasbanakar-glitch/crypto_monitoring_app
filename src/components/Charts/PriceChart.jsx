import { memo, useEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import accessibility from 'highcharts/modules/accessibility';
import { useCoinChart } from '../../hooks/useCoinChart';
import { RANGES, sliceWindow, toPoints } from '../../utils/chartTransformers';
import { DOWN, UP, buildChartOptions, getThemeTokens } from '../../utils/chartTheme';
import { formatPercent, formatPrice, percentClass } from '../../utils/formatters';

// Safe module initialization for ESM/Vite interop
const initAccessibility = accessibility?.default || accessibility;
if (typeof initAccessibility === 'function') {
  initAccessibility(Highcharts);
}

// Module interop fix for Vite/ESM
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

function PriceChart({ coinId, coinName, symbol, currentPrice, theme, defaultRange = '24H', height = 380 }) {
  const chartRef = useRef(null);
  const [rangeKey, setRangeKey] = useState(defaultRange);
  const range = useMemo(() => RANGES.find((r) => r.key === rangeKey) ?? RANGES[1], [rangeKey]);

  const { data, loading, error, isMock } = useCoinChart(coinId, range.days);

  const points = useMemo(() => (data ? sliceWindow(toPoints(data.prices), range.windowMs) : []), [data, range]);

  const rangeChange = points.length > 1 ? (points[points.length - 1][1] / points[0][1] - 1) * 100 : null;
  const color = rangeChange == null || rangeChange >= 0 ? UP : DOWN;

  const options = useMemo(() => {
    const t = getThemeTokens(theme);
    const fill = (alpha) => Highcharts.color(color).setOpacity(alpha).get('rgba');

    return buildChartOptions(theme, {
      chart: { type: 'area', height, zoomType: 'x' },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: undefined },
        opposite: true,
        startOnTick: false,
        endOnTick: false,
        crosshair: { color: t.crosshair, width: 1, dashStyle: 'ShortDash' },
        labels: {
          formatter() {
            return formatPrice(this.value);
          },
        },
      },
      legend: { enabled: false },
      tooltip: {
        shared: false,
        formatter() {
          return `<div style="font-size:11px;opacity:.7;margin-bottom:2px">${Highcharts.dateFormat(
            '%b %e, %Y %H:%M',
            this.x
          )}</div><div style="font-size:15px;font-weight:600">${formatPrice(this.y)}</div>`;
        },
      },
      plotOptions: {
        area: {
          threshold: null,
          lineWidth: 2,
          marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, fill(0.35)],
              [1, fill(0)],
            ],
          },
        },
      },
      series: [{ type: 'area', name: (symbol || coinName || 'Price').toUpperCase(), data: points, color }],
    });
  }, [theme, height, points, color, symbol, coinName]);

  // Current-price plot line is managed imperatively
  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart || !points.length || currentPrice == null) return;
    const t = getThemeTokens(theme);
    const axis = chart.yAxis[0];
    axis.removePlotLine('current-price');
    axis.addPlotLine({
      id: 'current-price',
      value: currentPrice,
      color,
      width: 1,
      dashStyle: 'Dash',
      zIndex: 5,
      label: {
        text: formatPrice(currentPrice),
        align: 'left',
        x: 6,
        y: -4,
        style: { color: t.text, fontSize: '11px', fontWeight: '600' },
      },
    });
  }, [currentPrice, points, theme, color]);

  return (
    <div className="price-chart">
      <div className="chart-toolbar">
        <div className="chart-meta">
          <strong>{coinName}</strong>
          {currentPrice != null && <span className="mono">{formatPrice(currentPrice)}</span>}
          {rangeChange != null && (
            <span className={`pill ${percentClass(rangeChange)}`}>
              {formatPercent(rangeChange)} <small>{rangeKey}</small>
            </span>
          )}
          {isMock && <span className="badge badge-demo">Demo data</span>}
        </div>

        <div className="range-buttons" role="group" aria-label="Select time range">
          {RANGES.map((r) => (
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
        <HighchartsReact ref={chartRef} highcharts={Highcharts} options={options} />
        {loading && <div className="chart-overlay">Loading chart…</div>}
        {error && !loading && <div className="chart-overlay chart-error">{error}</div>}
      </div>
    </div>
  );
}

export default memo(PriceChart);