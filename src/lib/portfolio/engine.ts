import Decimal from "decimal.js";

export type PortfolioTransaction = {
  securityId: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: string;
  price: string;
  grossAmount: string;
  fee: string;
  currency: string;
  transactionAt: Date;
};

export type Position = {
  securityId: string;
  symbol: string;
  currency: string;
  quantity: Decimal;
  costBasis: Decimal;
  averageCost: Decimal;
  realizedPnl: Decimal;
};

export function calculatePositions(
  transactions: PortfolioTransaction[],
): Position[] {
  const positions = new Map<string, Position>();

  const sortedTransactions = [...transactions].sort(
    (a, b) => a.transactionAt.getTime() - b.transactionAt.getTime(),
  );

  for (const transaction of sortedTransactions) {
    const quantity = new Decimal(transaction.quantity);
    const grossAmount = new Decimal(transaction.grossAmount);
    const fee = new Decimal(transaction.fee);

    let position = positions.get(transaction.securityId);

    if (!position) {
      position = {
        securityId: transaction.securityId,
        symbol: transaction.symbol,
        currency: transaction.currency,
        quantity: new Decimal(0),
        costBasis: new Decimal(0),
        averageCost: new Decimal(0),
        realizedPnl: new Decimal(0),
      };

      positions.set(transaction.securityId, position);
    }

    if (transaction.type === "BUY") {
      const totalBuyCost = grossAmount.plus(fee);
      const newQuantity = position.quantity.plus(quantity);

      position.costBasis = position.costBasis.plus(totalBuyCost);
      position.quantity = newQuantity;

      position.averageCost = position.costBasis.dividedBy(newQuantity);
    }

    if (transaction.type === "SELL") {
      if (quantity.greaterThan(position.quantity)) {
        throw new Error(
          `Cannot sell ${quantity.toString()} shares of ${transaction.symbol}. ` +
            `Current position is only ${position.quantity.toString()} shares.`,
        );
      }

      const costOfSharesSold = quantity.times(position.averageCost);
      const netProceeds = grossAmount.minus(fee);

      const realizedPnl = netProceeds.minus(costOfSharesSold);

      position.realizedPnl = position.realizedPnl.plus(realizedPnl);

      position.quantity = position.quantity.minus(quantity);
      position.costBasis = position.costBasis.minus(costOfSharesSold);

      if (position.quantity.isZero()) {
        position.costBasis = new Decimal(0);
        position.averageCost = new Decimal(0);
      } else {
        position.averageCost = position.costBasis.dividedBy(
          position.quantity,
        );
      }
    }
  }

  return Array.from(positions.values());
}
