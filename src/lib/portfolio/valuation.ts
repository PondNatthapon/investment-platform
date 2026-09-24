import Decimal from "decimal.js";

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
