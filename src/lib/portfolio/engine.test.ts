import test from "node:test";
import assert from "node:assert/strict";

import {
  calculatePositions,
  type PortfolioTransaction,
} from "./engine";

function tx(
  overrides: Partial<PortfolioTransaction>,
): PortfolioTransaction {
  return {
    securityId: "security-1",
    symbol: "VOO",
    type: "BUY",
    quantity: "2",
    price: "500",
    grossAmount: "1000",
    fee: "1",
    currency: "USD",
    transactionAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

test("calculates average cost including buy fee", () => {
  const positions = calculatePositions([
    tx({
      quantity: "2",
      price: "500",
      grossAmount: "1000",
      fee: "1",
    }),
  ]);

  assert.equal(positions.length, 1);
  assert.equal(positions[0].quantity.toFixed(2), "2.00");
  assert.equal(positions[0].costBasis.toFixed(2), "1001.00");
  assert.equal(positions[0].averageCost.toFixed(2), "500.50");
  assert.equal(positions[0].realizedPnl.toFixed(2), "0.00");
});

test("recalculates weighted average after multiple buys", () => {
  const positions = calculatePositions([
    tx({
      transactionAt: new Date("2026-01-01T00:00:00Z"),
      quantity: "2",
      price: "500",
      grossAmount: "1000",
      fee: "1",
    }),
    tx({
      transactionAt: new Date("2026-02-01T00:00:00Z"),
      quantity: "1",
      price: "600",
      grossAmount: "600",
      fee: "1",
    }),
  ]);

  assert.equal(positions[0].quantity.toFixed(2), "3.00");
  assert.equal(positions[0].costBasis.toFixed(2), "1602.00");
  assert.equal(positions[0].averageCost.toFixed(2), "534.00");
});

test("calculates realized pnl on sell", () => {
  const positions = calculatePositions([
    tx({
      transactionAt: new Date("2026-01-01T00:00:00Z"),
      quantity: "2",
      price: "500",
      grossAmount: "1000",
      fee: "1",
    }),
    tx({
      transactionAt: new Date("2026-02-01T00:00:00Z"),
      type: "SELL",
      quantity: "1",
      price: "600",
      grossAmount: "600",
      fee: "1",
    }),
  ]);

  assert.equal(positions[0].quantity.toFixed(2), "1.00");
  assert.equal(positions[0].costBasis.toFixed(2), "500.50");
  assert.equal(positions[0].realizedPnl.toFixed(2), "98.50");
});

test("rejects selling more shares than owned", () => {
  assert.throws(
    () =>
      calculatePositions([
        tx({
          type: "SELL",
          quantity: "3",
          price: "600",
          grossAmount: "1800",
          fee: "1",
        }),
      ]),
    /Current position is only 0/,
  );
});

test("returns zero position values after selling all shares", () => {
  const positions = calculatePositions([
    tx({
      transactionAt: new Date("2026-01-01T00:00:00Z"),
      quantity: "2",
      price: "500",
      grossAmount: "1000",
      fee: "1",
    }),
    tx({
      transactionAt: new Date("2026-02-01T00:00:00Z"),
      type: "SELL",
      quantity: "2",
      price: "600",
      grossAmount: "1200",
      fee: "1",
    }),
  ]);

  assert.equal(positions[0].quantity.toFixed(2), "0.00");
  assert.equal(positions[0].costBasis.toFixed(2), "0.00");
  assert.equal(positions[0].averageCost.toFixed(2), "0.00");
  assert.equal(positions[0].realizedPnl.toFixed(2), "198.00");
});
