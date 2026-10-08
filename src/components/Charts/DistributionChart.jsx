import { memo, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import { buildChartOptions } from '../../utils/chartTheme';
import { formatCompactUSD } from '../../utils/formatters';

// Handle ES module default import interop safely
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

function DistributionChart({ coins = [], totalMarketCap, theme, limit = 8, height = 340 }) {
  const data = useMemo(() => {
    if (!coins || !Array.isArray(coins)) return [];
    
    const top = coins.slice(0, limit);
    const topSum = top.reduce((s, c) => s + (c.market_cap || c.marketCap || 0), 0);
    const total = Math.max(totalMarketCap || 0, topSum);
    const slices = top.map((c) => ({
      name: (c.symbol || c.name || '').toUpperCase(),
      y: c.market_cap || c.marketCap || 0,
    }));
    
    if (total - topSum > 0) {
      slices.push({ name: 'Others', y: total - topSum, color: '#64748b' });
    }
    return slices;
  }, [coins, totalMarketCap, limit]);

  const options = useMemo(
    () =>
      buildChartOptions(theme, {
        accessibility: { enabled: false },
        chart: { type: 'pie', height },
        tooltip: {
          formatter() {
            return `<b>${this.point.name}</b><br/>${this.percentage.toFixed(1)}% · ${formatCompactUSD(this.y)}`;
          },
        },
        legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
        plotOptions: {
          pie: {
            innerSize: '62%',
            borderWidth: 2,
            borderColor: 'transparent',
            allowPointSelect: true,
            showInLegend: true,
            dataLabels: { enabled: false },
          },
        },
        series: [{ type: 'pie', name: 'Market share', data }],
      }),
    [theme, height, data]
  );

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export default memo(DistributionChart);