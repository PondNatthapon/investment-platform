export function formatCurrency(
  value: string,
  currency: string,
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatNumber(
  value: string,
  maximumFractionDigits = 2,
) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(Number(value));
}

export function formatPercent(value: string | null) {
  if (value === null) {
    return "—";
  }

  return `${Number(value).toFixed(2)}%`;
}
