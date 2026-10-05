import test from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";

import { normalizeCurrencyCode } from "@/lib/currency/currency";
import type { FxQuote } from "@/lib/fx/types";
import {
  calculateValuation,
  convertValuationToBaseCurrency,
  type ValuedPosition,
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

function makeValuedPosition(
  currency = "USD",
  marketPrice = "510",
  quantity = "2",
): ValuedPosition {
  return calculateValuation(
    [
      makePosition({
        currency,
        quantity: new Decimal(quantity),
      }),
    ],
    [
      {
        symbol: "VOO",
        price: marketPrice,
        currency,
        asOf: new Date("2026-09-24T00:00:00Z"),
      },
    ],
  )[0];
}

function fxQuote(
  baseCurrency: string,
  quoteCurrency: string,
  rate: string,
): FxQuote {
  return {
    baseCurrency: normalizeCurrencyCode(baseCurrency),
    quoteCurrency: normalizeCurrencyCode(quoteCurrency),
    rate,
    source: "test",
    asOf: new Date("2026-09-24T00:00:00Z"),
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

test("does not require an FX quote when native and base currencies match", () => {
  const result = convertValuationToBaseCurrency(
    makeValuedPosition("USD", "510"),
    "USD",
    [],
  );

  assert.equal(result.conversionStatus, "NOT_REQUIRED");
  assert.equal(result.baseCurrency, "USD");
  assert.equal(result.baseMarketValue?.toFixed(2), "1020.00");
  assert.equal(result.fxQuote, null);
});

test("converts native market value using a direct FX quote", () => {
  const result = convertValuationToBaseCurrency(
    makeValuedPosition("USD", "510"),
    "THB",
    [fxQuote("USD", "THB", "35")],
  );

  assert.equal(result.conversionStatus, "CONVERTED");
  assert.equal(result.baseCurrency, "THB");
  assert.equal(result.baseMarketValue?.toFixed(2), "35700.00");
  assert.equal(result.fxQuote?.direction, "direct");
});

test("converts native market value using an inverse FX quote", () => {
  const result = convertValuationToBaseCurrency(
    makeValuedPosition("THB", "350", "2"),
    "USD",
    [fxQuote("USD", "THB", "35")],
  );

  assert.equal(result.conversionStatus, "CONVERTED");
  assert.equal(result.baseCurrency, "USD");
  assert.equal(result.baseMarketValue?.toFixed(2), "20.00");
  assert.equal(result.fxQuote?.direction, "inverse");
});

test("preserves native values and reports unavailable conversion without a rate", () => {
  const position = makeValuedPosition("USD", "510");
  const result = convertValuationToBaseCurrency(
    position,
    "JPY",
    [],
  );

  assert.equal(result.conversionStatus, "UNAVAILABLE");
  assert.equal(result.conversionStatusReason, "MISSING_RATE");
  assert.equal(result.baseCurrency, "JPY");
  assert.equal(result.baseMarketValue, null);
  assert.equal(result.nativeCurrency, "USD");
  assert.equal(result.nativeMarketValue.toFixed(2), "1020.00");
  assert.equal(result.nativeCostBasis.toFixed(2), "1001.00");
  assert.equal(result.nativeUnrealizedPnl.toFixed(2), "19.00");
});

test("uses the account base currency for conversion", () => {
  const result = convertValuationToBaseCurrency(
    makeValuedPosition("USD", "510"),
    "EUR",
    [
      fxQuote("USD", "THB", "35"),
      fxQuote("USD", "EUR", "0.9"),
    ],
  );

  assert.equal(result.baseCurrency, "EUR");
  assert.equal(result.baseMarketValue?.toFixed(2), "918.00");
  assert.equal(result.fxQuote?.quoteCurrency, "EUR");
});

test("preserves decimal precision in converted market values", () => {
  const result = convertValuationToBaseCurrency(
    makeValuedPosition("USD", "1", "9007199254740993.01"),
    "THB",
    [fxQuote("USD", "THB", "3")],
  );

  assert.equal(
    result.baseMarketValue?.toString(),
    "27021597764222979.03",
  );
});
