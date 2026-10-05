import Decimal from "decimal.js";

import { normalizeCurrencyCode } from "@/lib/currency/currency";
import type { FxQuote } from "./types";

const PreciseDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export class MissingFxRateError extends Error {
  constructor(fromCurrency: string, toCurrency: string) {
    super(`Missing FX rate for ${fromCurrency}/${toCurrency}.`);
    this.name = "MissingFxRateError";
  }
}

export class InvalidFxRateError extends Error {
  constructor(rate: unknown, source: string) {
    super(`Invalid FX rate from ${source}: ${String(rate)}`);
    this.name = "InvalidFxRateError";
  }
}

function parsePositiveRate(quote: FxQuote): Decimal {
  let rate: Decimal;

  try {
    rate = new PreciseDecimal(quote.rate);
  } catch {
    throw new InvalidFxRateError(quote.rate, quote.source);
  }

  if (!rate.isFinite() || !rate.greaterThan(0)) {
    throw new InvalidFxRateError(quote.rate, quote.source);
  }

  return rate;
}

/** Converts an amount using a direct quote or the inverse of a quote. */
export function convertCurrency(
  amount: string | Decimal,
  fromCurrency: string,
  toCurrency: string,
  quotes: FxQuote[],
): Decimal {
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  let decimalAmount: Decimal;

  try {
    decimalAmount = new PreciseDecimal(amount);
  } catch {
    throw new TypeError(`Invalid monetary amount: ${String(amount)}`);
  }

  if (!decimalAmount.isFinite()) {
    throw new TypeError(`Invalid monetary amount: ${String(amount)}`);
  }

  if (from === to) {
    return decimalAmount;
  }

  const directQuote = quotes.find(
    (quote) =>
      normalizeCurrencyCode(quote.baseCurrency) === from &&
      normalizeCurrencyCode(quote.quoteCurrency) === to,
  );

  if (directQuote) {
    return decimalAmount.times(parsePositiveRate(directQuote));
  }

  const inverseQuote = quotes.find(
    (quote) =>
      normalizeCurrencyCode(quote.baseCurrency) === to &&
      normalizeCurrencyCode(quote.quoteCurrency) === from,
  );

  if (inverseQuote) {
    return decimalAmount.dividedBy(parsePositiveRate(inverseQuote));
  }

  throw new MissingFxRateError(from, to);
}
