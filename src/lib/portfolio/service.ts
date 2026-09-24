import "server-only";

import { getAccountTransactions } from "./repository";
import { calculatePositions } from "./engine";
import { calculateValuation } from "./valuation";

import { getMarketDataProvider } from "@/lib/market-data/provider";
import type { MarketDataProvider } from "@/lib/market-data/types";

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
  currentPrice: string;
  currentValue: string;
  unrealizedPnl: string;
  returnPct: string | null;
  priceAsOf: string;
};

export async function getPortfolio(
  accountId: string,
): Promise<PortfolioPositionDTO[]> {
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
  accountId: string,
  provider: MarketDataProvider = getMarketDataProvider(),
): Promise<PortfolioValuationDTO[]> {
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

  return valuedPositions.map((position) => ({
    securityId: position.securityId,
    symbol: position.symbol,
    currency: position.currency,

    quantity: position.quantity.toFixed(10),
    costBasis: position.costBasis.toFixed(2),
    averageCost: position.averageCost.toFixed(2),

    realizedPnl: position.realizedPnl.toFixed(2),

    currentPrice: position.currentPrice.toFixed(2),
    currentValue: position.currentValue.toFixed(2),
    unrealizedPnl: position.unrealizedPnl.toFixed(2),

    returnPct: position.returnPct?.toFixed(4) ?? null,

    priceAsOf: position.priceAsOf.toISOString(),
  }));
}