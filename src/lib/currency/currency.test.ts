import test from "node:test";
import assert from "node:assert/strict";

import {
  InvalidCurrencyCodeError,
  normalizeCurrencyCode,
} from "./currency";

test("normalizes supported ISO currency codes", () => {
  assert.equal(normalizeCurrencyCode(" usd "), "USD");
  assert.equal(normalizeCurrencyCode("THB"), "THB");
});

test("rejects malformed and unsupported currency codes", () => {
  for (const value of ["US", "USDT", "ZZZ", "", null, 123]) {
    assert.throws(
      () => normalizeCurrencyCode(value),
      InvalidCurrencyCodeError,
    );
  }
});
