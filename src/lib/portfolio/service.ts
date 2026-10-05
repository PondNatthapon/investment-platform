import "server-only";

import { normalizeCurrencyCode } from "@/lib/currency/currency";
import { requireAccountAccess } from "@/lib/account/access";
import type { FxPair, FxQuote, FxRateProvider } from "@/lib/fx/types";
import { getFxRateProvider } from "@/lib/fx/provider";
import { getMarketDataProvider } from "@/lib/market-data/provider";
import type { MarketDataProvider } from "@/lib/market-data/types";

import { getAccountTransactions } from "./repository";
import { calculatePositions } from "./engine";
import {
  calculateValuation,
  convertValuationToBaseCurrency,
} from "./valuation";

export type PortfolioPositionDTO = {
  securityId: string;
  symbol: string;
  currency: string;
  quantity: string;
  costBasis: string;
  averageCost: string;
  realizedPnl: string;
};

export type PortfolioValuationDTO = PortfolioPositionDTO & {
  nativeCurrency: string;
  nativeMarketValue: string;
  nativeCostBasis: string;
  nativeUnrealizedPnl: string;
  baseCurrency: string;
  baseMarketValue: string | null;
  conversionStatus: "NOT_REQUIRED" | "CONVERTED" | "UNAVAILABLE";
  conversionStatusReason?: "MISSING_RATE" | "INVALID_RATE" | "INVALID_CURRENCY";
  fxQuote: {
    baseCurrency: string;
    quoteCurrency: string;
    rate: string;
    source: string;
    asOf: string;
    direction: "direct" | "inverse";
  } | null;
  currentPrice: string;
  currentValue: string;
  unrealizedPnl: string;
  returnPct: string | null;
  priceAsOf: string;
};

export async function getPortfolio(
  userId: string,
  accountId: string,
): Promise<PortfolioPositionDTO[]> {
  await requireAccountAccess(userId, accountId);
  const transactions =
    await getAccountTransactions(accountId);

  const positions = calculatePositions(transactions);

  return positions.map((position) => ({
    securityId: position.securityId,
    symbol: position.symbol,
    currency: position.currency,
    quantity: position.quantity.toFixed(10),
    costBasis: position.costBasis.toFixed(2),
    averageCost: position.averageCost.toFixed(2),
    realizedPnl: position.realizedPnl.toFixed(2),
  }));
}

export async function getPortfolioValuation(
  userId: string,
  accountId: string,
  provider: MarketDataProvider = getMarketDataProvider(),
  fxProvider: FxRateProvider = getFxRateProvider(),
): Promise<PortfolioValuationDTO[]> {
  const account = await requireAccountAccess(userId, accountId);
  const transactions =
    await getAccountTransactions(accountId);

  const positions = calculatePositions(transactions);

  if (positions.length === 0) {
    return [];
  }

  const symbols = [
    ...new Set(positions.map((position) => position.symbol)),
  ];

  const prices = await provider.getPrices(symbols);

  const valuedPositions = calculateValuation(
    positions,
    prices,
  );

  const fxPairs: FxPair[] = [];
  const pairKeys = new Set<string>();

  for (const position of valuedPositions) {
    try {
      const nativeCurrency = normalizeCurrencyCode(position.currency);
      const baseCurrency = normalizeCurrencyCode(account.baseCurrency);

      if (nativeCurrency === baseCurrency) {
        continue;
      }

      const key = `${nativeCurrency}/${baseCurrency}`;

      if (!pairKeys.has(key)) {
        pairKeys.add(key);
        fxPairs.push({
          baseCurrency: nativeCurrency,
          quoteCurrency: baseCurrency,
        });
      }
    } catch {
      // Invalid currencies are reported per position by the conversion helper.
    }
  }

  let fxQuotes: FxQuote[] = [];

  if (fxPairs.length > 0) {
    try {
      fxQuotes = await fxProvider.getQuotes(fxPairs);
    } catch (error) {
      console.error("Failed to load FX quotes for portfolio:", error);
    }
  }

  return valuedPositions.map((position) => {
    const baseValuation = convertValuationToBaseCurrency(
      position,
      account.baseCurrency,
      fxQuotes,
    );

    return {
      securityId: position.securityId,
      symbol: position.symbol,
      currency: position.currency,
      nativeCurrency: baseValuation.nativeCurrency,
      nativeMarketValue: baseValuation.nativeMarketValue.toFixed(2),
      nativeCostBasis: baseValuation.nativeCostBasis.toFixed(2),
      nativeUnrealizedPnl: baseValuation.nativeUnrealizedPnl.toFixed(2),
      baseCurrency: baseValuation.baseCurrency,
      baseMarketValue: baseValuation.baseMarketValue?.toFixed(2) ?? null,
      conversionStatus: baseValuation.conversionStatus,
      ...(baseValuation.conversionStatusReason
        ? { conversionStatusReason: baseValuation.conversionStatusReason }
        : {}),
      fxQuote: baseValuation.fxQuote
        ? {
            ...baseValuation.fxQuote,
            asOf: baseValuation.fxQuote.asOf.toISOString(),
          }
        : null,

      quantity: position.quantity.toFixed(10),
      costBasis: position.costBasis.toFixed(2),
      averageCost: position.averageCost.toFixed(2),

      realizedPnl: position.realizedPnl.toFixed(2),

      currentPrice: position.currentPrice.toFixed(2),
      currentValue: position.currentValue.toFixed(2),
      unrealizedPnl: position.unrealizedPnl.toFixed(2),

      returnPct: position.returnPct?.toFixed(4) ?? null,

      priceAsOf: position.priceAsOf.toISOString(),
    };
  });
}
