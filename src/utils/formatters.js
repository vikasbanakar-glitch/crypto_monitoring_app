const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

const usdFormatters = new Map();
const getUsdFormatter = (maxDigits) => {
  if (!usdFormatters.has(maxDigits)) {
    usdFormatters.set(
      maxDigits,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: maxDigits,
      })
    );
  }
  return usdFormatters.get(maxDigits);
};

const COMPACT_UNITS = [
  { v: 1e12, s: 'T', d: 2 },
  { v: 1e9, s: 'B', d: 1 },
  { v: 1e6, s: 'M', d: 1 },
  { v: 1e3, s: 'K', d: 1 },
];

/** 1.32e12 -> "$1.32T", 28.4e9 -> "$28.4B". `digits` overrides the decimals. */
export function formatCompactUSD(value, digits) {
  if (!isFiniteNumber(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const unit = COMPACT_UNITS.find((u) => abs >= u.v);
  if (!unit) return `${sign}${getUsdFormatter(2).format(abs)}`;
  return `${sign}$${(abs / unit.v).toFixed(digits ?? unit.d)}${unit.s}`;
}

/** 67450 -> "$67,450.00"; sub-dollar prices get extra precision. */
export function formatPrice(value) {
  if (!isFiniteNumber(value)) return '—';
  const abs = Math.abs(value);
  let max = 2;
  if (abs < 1) max = 4;
  if (abs < 0.01) max = 6;
  if (abs < 0.0001) max = 8;
  return getUsdFormatter(max).format(value);
}

/** 2.41 -> "+2.41%", -1.2 -> "-1.20%". */
export function formatPercent(value, digits = 2) {
  if (!isFiniteNumber(value)) return '—';
  const fixed = value.toFixed(digits);
  if (Number(fixed) === 0) return `${(0).toFixed(digits)}%`;
  return `${value > 0 ? '+' : ''}${fixed}%`;
}

export function formatNumber(value) {
  if (!isFiniteNumber(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

/** Compact non-currency number, e.g. supply: 19.75e6 -> "19.75M". */
export function formatCompactNumber(value, digits = 2) {
  if (!isFiniteNumber(value)) return '—';
  const abs = Math.abs(value);
  const unit = COMPACT_UNITS.find((u) => abs >= u.v);
  return unit ? `${(value / unit.v).toFixed(digits)}${unit.s}` : formatNumber(Number(value.toFixed(2)));
}

export function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function percentClass(value) {
  if (!isFiniteNumber(value) || Number(value.toFixed(2)) === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}