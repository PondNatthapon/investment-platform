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

export type FxConversion = {
  amount: Decimal;
  quote: FxQuote | null;
  direction: "same" | "direct" | "inverse";
};

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

/** Converts an amount and returns the quote and direction used. */
export function convertCurrencyWithQuote(
  amount: string | Decimal,
  fromCurrency: string,
  toCurrency: string,
  quotes: FxQuote[],
): FxConversion {
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
    return {
      amount: decimalAmount,
      quote: null,
      direction: "same",
    };
  }

  const directQuote = quotes.find(
    (quote) =>
      normalizeCurrencyCode(quote.baseCurrency) === from &&
      normalizeCurrencyCode(quote.quoteCurrency) === to,
  );

  if (directQuote) {
    return {
      amount: decimalAmount.times(parsePositiveRate(directQuote)),
      quote: directQuote,
      direction: "direct",
    };
  }

  const inverseQuote = quotes.find(
    (quote) =>
      normalizeCurrencyCode(quote.baseCurrency) === to &&
      normalizeCurrencyCode(quote.quoteCurrency) === from,
  );

  if (inverseQuote) {
    return {
      amount: decimalAmount.dividedBy(parsePositiveRate(inverseQuote)),
      quote: inverseQuote,
      direction: "inverse",
    };
  }

  throw new MissingFxRateError(from, to);
}

/** Converts an amount using a direct quote or the inverse of a quote. */
export function convertCurrency(
  amount: string | Decimal,
  fromCurrency: string,
  toCurrency: string,
  quotes: FxQuote[],
): Decimal {
  return convertCurrencyWithQuote(
    amount,
    fromCurrency,
    toCurrency,
    quotes,
  ).amount;
}
