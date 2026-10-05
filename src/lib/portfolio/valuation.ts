import Decimal from "decimal.js";

import {
  InvalidCurrencyCodeError,
  normalizeCurrencyCode,
} from "@/lib/currency/currency";
import {
  convertCurrencyWithQuote,
  InvalidFxRateError,
  MissingFxRateError,
} from "@/lib/fx/convert";
import type { FxQuote } from "@/lib/fx/types";
import type { MarketPrice } from "@/lib/market-data/types";
import type { Position } from "./engine";

export type ValuedPosition = {
  securityId: string;
  symbol: string;
  currency: string;

  quantity: Decimal;
  costBasis: Decimal;
  averageCost: Decimal;

  currentPrice: Decimal;
  currentValue: Decimal;

  realizedPnl: Decimal;
  unrealizedPnl: Decimal;
  returnPct: Decimal | null;

  priceAsOf: Date;
};

export type BaseCurrencyValuation = {
  nativeCurrency: string;
  nativeMarketValue: Decimal;
  nativeCostBasis: Decimal;
  nativeUnrealizedPnl: Decimal;
  baseCurrency: string;
  baseMarketValue: Decimal | null;
  conversionStatus: "NOT_REQUIRED" | "CONVERTED" | "UNAVAILABLE";
  conversionStatusReason?: "MISSING_RATE" | "INVALID_RATE" | "INVALID_CURRENCY";
  fxQuote: {
    baseCurrency: string;
    quoteCurrency: string;
    rate: string;
    source: string;
    asOf: Date;
    direction: "direct" | "inverse";
  } | null;
};

export function convertValuationToBaseCurrency(
  position: ValuedPosition,
  baseCurrency: string,
  quotes: FxQuote[],
): BaseCurrencyValuation {
  const nativeValues = {
    nativeCurrency: position.currency,
    nativeMarketValue: position.currentValue,
    nativeCostBasis: position.costBasis,
    nativeUnrealizedPnl: position.unrealizedPnl,
    baseCurrency,
  };

  try {
    const nativeCode = normalizeCurrencyCode(position.currency);
    const baseCode = normalizeCurrencyCode(baseCurrency);
    const conversion = convertCurrencyWithQuote(
      position.currentValue,
      nativeCode,
      baseCode,
      quotes,
    );

    return {
      ...nativeValues,
      nativeCurrency: nativeCode,
      baseCurrency: baseCode,
      baseMarketValue: conversion.amount,
      conversionStatus:
        conversion.direction === "same" ? "NOT_REQUIRED" : "CONVERTED",
      fxQuote: conversion.quote && conversion.direction !== "same"
        ? {
            baseCurrency: conversion.quote.baseCurrency,
            quoteCurrency: conversion.quote.quoteCurrency,
            rate: conversion.quote.rate,
            source: conversion.quote.source,
            asOf: conversion.quote.asOf,
            direction: conversion.direction,
          }
        : null,
    };
  } catch (error) {
    if (
      !(error instanceof MissingFxRateError) &&
      !(error instanceof InvalidFxRateError) &&
      !(error instanceof InvalidCurrencyCodeError)
    ) {
      throw error;
    }

    const reason =
      error instanceof MissingFxRateError
        ? "MISSING_RATE"
        : error instanceof InvalidFxRateError
          ? "INVALID_RATE"
          : "INVALID_CURRENCY";

    return {
      ...nativeValues,
      baseMarketValue: null,
      conversionStatus: "UNAVAILABLE",
      conversionStatusReason: reason,
      fxQuote: null,
    };
  }
}

export function calculateValuation(
  positions: Position[],
  prices: MarketPrice[],
): ValuedPosition[] {
  const priceMap = new Map(
    prices.map((price) => [price.symbol, price]),
  );

  return positions.map((position) => {
    const marketPrice = priceMap.get(position.symbol);

    if (!marketPrice) {
      throw new Error(
        `Missing market price for ${position.symbol}`,
      );
    }

    if (marketPrice.currency !== position.currency) {
      throw new Error(
        `Currency mismatch for ${position.symbol}: ` +
          `position=${position.currency}, ` +
          `price=${marketPrice.currency}`,
      );
    }

    const currentPrice = new Decimal(marketPrice.price);

    const currentValue = position.quantity.times(
      currentPrice,
    );

    const unrealizedPnl = currentValue.minus(
      position.costBasis,
    );

    const returnPct = position.costBasis.isZero()
      ? null
      : unrealizedPnl
          .dividedBy(position.costBasis)
          .times(100);

    return {
      securityId: position.securityId,
      symbol: position.symbol,
      currency: position.currency,

      quantity: position.quantity,
      costBasis: position.costBasis,
      averageCost: position.averageCost,

      currentPrice,
      currentValue,

      realizedPnl: position.realizedPnl,
      unrealizedPnl,
      returnPct,

      priceAsOf: marketPrice.asOf,
    };
  });
}
