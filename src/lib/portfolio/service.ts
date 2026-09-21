import "server-only";

import { getAccountTransactions } from "./repository";
import { calculatePositions } from "./engine";

export type PortfolioPositionDTO = {
  securityId: string;
  symbol: string;
  currency: string;
  quantity: string;
  costBasis: string;
  averageCost: string;
  realizedPnl: string;
};

export async function getPortfolio(accountId: string) {
  const transactions = await getAccountTransactions(accountId);

  const positions = calculatePositions(transactions);

  return positions.map((position): PortfolioPositionDTO => ({
    securityId: position.securityId,
    symbol: position.symbol,
    currency: position.currency,
    quantity: position.quantity.toFixed(10),
    costBasis: position.costBasis.toFixed(2),
    averageCost: position.averageCost.toFixed(2),
    realizedPnl: position.realizedPnl.toFixed(2),
  }));
}
