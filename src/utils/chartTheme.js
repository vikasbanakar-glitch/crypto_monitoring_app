import Highcharts from 'highcharts';

export const UP = '#16c784';
export const DOWN = '#ea3943';
export const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];

const TOKENS = {
  dark: {
    text: '#e6eaf2',
    muted: '#8a96ad',
    grid: 'rgba(255,255,255,0.08)',
    crosshair: 'rgba(255,255,255,0.35)',
    tooltipBg: '#0f1522',
    tooltipBorder: '#2a3652',
    tooltipText: '#f1f5f9',
  },
  light: {
    text: '#0f172a',
    muted: '#64748b',
    grid: 'rgba(15,23,42,0.08)',
    crosshair: 'rgba(15,23,42,0.35)',
    tooltipBg: '#ffffff',
    tooltipBorder: '#dde3ee',
    tooltipText: '#0f172a',
  },
};

export const getThemeTokens = (theme) => TOKENS[theme] || TOKENS.dark;

/** Axis defaults, exported separately because array-valued axes aren't deep-merged. */
export function getAxisStyle(theme) {
  const t = getThemeTokens(theme);
  return {
    xAxis: {
      lineColor: t.grid,
      tickColor: t.grid,
      labels: { style: { color: t.muted } },
      crosshair: { color: t.crosshair, width: 1, dashStyle: 'ShortDash' },
    },
    yAxis: {
      gridLineColor: t.grid,
      labels: { style: { color: t.muted } },
      title: { style: { color: t.muted } },
    },
  };
}

/** Per-chart options (no global `Highcharts.setOptions`, so charts can't leak styles). */
export function buildChartOptions(theme, overrides = {}) {
  const t = getThemeTokens(theme);
  const axes = getAxisStyle(theme);
  const base = {
    colors: CHART_COLORS,
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      spacing: [10, 10, 10, 10],
      animation: { duration: 350 },
    },
    title: { text: undefined },
    credits: { enabled: false },
    time: { useUTC: false },
    legend: {
      itemStyle: { color: t.text, fontWeight: '500' },
      itemHoverStyle: { color: t.text },
    },
    xAxis: axes.xAxis,
    yAxis: axes.yAxis,
    tooltip: {
      useHTML: true,
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      style: { color: t.tooltipText },
      shadow: false,
    },
    plotOptions: { series: { animation: { duration: 350 } } },
    accessibility: { enabled: true },
  };
  return Highcharts.merge(base, overrides);
}