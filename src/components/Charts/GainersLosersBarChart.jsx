import { memo, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import { DOWN, UP, buildChartOptions, getThemeTokens } from '../../utils/chartTheme';
import { formatPercent } from '../../utils/formatters';

// Module interop fix for Vite/ESM
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

const MoversChart = memo(function MoversChart({ title, coins = [], theme }) {
  const options = useMemo(() => {
    const t = getThemeTokens(theme);
    const validCoins = Array.isArray(coins) ? coins : [];

    return buildChartOptions(theme, {
        accessibility: { enabled: false },
      chart: { type: 'bar', height: 270 },
      xAxis: {
        categories: validCoins.map((c) => (c?.symbol || '').toUpperCase()),
        labels: { style: { color: t.text, fontWeight: '600' } },
      },
      yAxis: {
        title: { text: undefined },
        labels: {
          formatter() {
            return `${this.value}%`;
          },
        },
        plotLines: [{ value: 0, color: t.muted, width: 1, zIndex: 3 }],
      },
      legend: { enabled: false },
      tooltip: {
        formatter() {
          return `<b>${this.point.name}</b><br/>24h: <b>${formatPercent(this.y)}</b>`;
        },
      },
      plotOptions: {
        bar: {
          borderWidth: 0,
          borderRadius: 3,
          pointPadding: 0.1,
          dataLabels: {
            enabled: true,
            formatter() {
              return formatPercent(this.y);
            },
            style: { color: t.text, textOutline: 'none', fontWeight: '600' },
          },
        },
      },
      series: [
        {
          type: 'bar',
          name: '24h change',
          data: validCoins.map((c) => {
            const val = c?.change24h ?? c?.price_change_percentage_24h ?? 0;
            return {
              name: c?.name || c?.symbol || '',
              y: val,
              color: val >= 0 ? UP : DOWN,
            };
          }),
        },
      ],
    });
  }, [coins, theme]);

  return (
    <div className="movers">
      <h3 className="movers-title">{title}</h3>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
});

function GainersLosersBarChart({ gainers = [], losers = [], theme }) {
  return (
    <div className="movers-grid">
      <MoversChart title="Top Gainers (24h)" coins={gainers} theme={theme} />
      <MoversChart title="Top Losers (24h)" coins={losers} theme={theme} />
    </div>
  );
}

export default memo(GainersLosersBarChart);