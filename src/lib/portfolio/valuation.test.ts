import test from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";

import {
  calculateValuation,
} from "./valuation";

import type { Position } from "./engine";

function makePosition(
  overrides: Partial<Position> = {},
): Position {
  return {
    securityId: "security-1",
    symbol: "VOO",
    currency: "USD",
    quantity: new Decimal("2"),
    costBasis: new Decimal("1001"),
    averageCost: new Decimal("500.50"),
    realizedPnl: new Decimal("0"),
    ...overrides,
  };
}

test("calculates current value and unrealized pnl", () => {
  const valuation = calculateValuation(
    [makePosition()],
    [
      {
        symbol: "VOO",
        price: "510",
        currency: "USD",
        asOf: new Date("2026-09-24T00:00:00Z"),
      },
    ],
  );

  assert.equal(
    valuation[0].currentValue.toFixed(2),
    "1020.00",
  );

  assert.equal(
    valuation[0].unrealizedPnl.toFixed(2),
    "19.00",
  );

  assert.equal(
    valuation[0].returnPct?.toFixed(4),
    "1.8981",
  );
});

test("rejects currency mismatch", () => {
  assert.throws(
    () =>
      calculateValuation(
        [makePosition()],
        [
          {
            symbol: "VOO",
            price: "510",
            currency: "THB",
            asOf: new Date(),
          },
        ],
      ),
    /Currency mismatch/,
  );
});

test("rejects missing market price", () => {
  assert.throws(
    () =>
      calculateValuation(
        [makePosition()],
        [],
      ),
    /Missing market price/,
  );
});
