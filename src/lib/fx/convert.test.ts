import test from "node:test";
import assert from "node:assert/strict";

import Decimal from "decimal.js";

import { normalizeCurrencyCode } from "@/lib/currency/currency";
import {
  convertCurrency,
  InvalidFxRateError,
  MissingFxRateError,
} from "./convert";
import type { FxQuote } from "./types";

function quote(rate: string): FxQuote {
  return {
    baseCurrency: normalizeCurrencyCode("USD"),
    quoteCurrency: normalizeCurrencyCode("THB"),
    rate,
    source: "test",
    asOf: new Date("2026-01-01T00:00:00.000Z"),
  };
}

test("same-currency conversion does not require an FX quote", () => {
  assert.equal(
    convertCurrency("12.345", "USD", "USD", []).toString(),
    "12.345",
  );
});

test("converts USD to another currency using the direct pair", () => {
  assert.equal(
    convertCurrency("10", "USD", "THB", [quote("35")]).toString(),
    "350",
  );
});

test("converts using the inverse of a quoted pair", () => {
  assert.equal(
    convertCurrency("350", "THB", "USD", [quote("35")]).toString(),
    "10",
  );
});

test("reports a missing FX rate", () => {
  assert.throws(
    () => convertCurrency("10", "USD", "JPY", [quote("35")]),
    MissingFxRateError,
  );
});

test("rejects zero, negative, and invalid rates", () => {
  for (const rate of ["0", "-1", "not-a-rate", "Infinity"]) {
    assert.throws(
      () => convertCurrency("10", "USD", "THB", [quote(rate)]),
      InvalidFxRateError,
    );
  }
});

test("preserves decimal precision without converting through Number", () => {
  const converted = convertCurrency(
    "9007199254740993.01",
    "USD",
    "THB",
    [quote("3")],
  );

  assert.ok(converted instanceof Decimal);
  assert.equal(converted.toString(), "27021597764222979.03");
});

test("rejects invalid currency codes", () => {
  assert.throws(
    () => convertCurrency("1", "ZZZ", "THB", [quote("35")]),
  );
});
