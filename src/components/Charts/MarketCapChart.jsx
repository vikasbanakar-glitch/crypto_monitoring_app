import { memo, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import { CHART_COLORS, buildChartOptions } from '../../utils/chartTheme';
import { formatCompactUSD } from '../../utils/formatters';

// ESM/Vite interop handling for HighchartsReact
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

function MarketCapChart({ coins = [], theme, limit = 10, height = 340, onCoinClick }) {
  const data = useMemo(() => {
    const list = Array.isArray(coins) ? coins : [];
    return list.slice(0, limit).map((c, i) => ({
      name: (c?.symbol || c?.name || '').toUpperCase(),
      y: c?.market_cap ?? c?.marketCap ?? 0,
      coinId: c?.id,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [coins, limit]);

  const options = useMemo(
    () =>
      buildChartOptions(theme, {
        accessibility: { enabled: false },
        chart: { type: 'column', height },
        xAxis: { type: 'category' },
        yAxis: {
          title: { text: undefined },
          labels: {
            formatter() {
              return formatCompactUSD(this.value, 0);
            },
          },
        },
        legend: { enabled: false },
        tooltip: {
          formatter() {
            return `<b>${this.point.name}</b><br/>Market cap: <b>${formatCompactUSD(this.y)}</b>`;
          },
        },
        plotOptions: {
          column: {
            borderWidth: 0,
            borderRadius: 4,
            pointPadding: 0.08,
            groupPadding: 0.05,
            cursor: onCoinClick ? 'pointer' : undefined,
            point: {
              events: {
                click() {
                  if (this.options.coinId) {
                    onCoinClick?.(this.options.coinId);
                  }
                },
              },
            },
          },
        },
        series: [{ type: 'column', name: 'Market cap', data }],
      }),
    [theme, height, data, onCoinClick]
  );

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export default memo(MarketCapChart);