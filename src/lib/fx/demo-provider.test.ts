import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCurrencyCode } from "@/lib/currency/currency";
import { DemoFxRateProvider } from "./demo-provider";

test("provides deterministic development quotes for supported pairs", async () => {
  const provider = new DemoFxRateProvider();
  const [quote] = await provider.getQuotes([
    {
      baseCurrency: normalizeCurrencyCode("THB"),
      quoteCurrency: normalizeCurrencyCode("USD"),
    },
  ]);

  assert.equal(quote.baseCurrency, "USD");
  assert.equal(quote.quoteCurrency, "THB");
  assert.equal(quote.rate, "35.00");
  assert.equal(quote.source, "demo-fixed");
  assert.equal(quote.asOf.toISOString(), "2026-01-01T00:00:00.000Z");
});

test("returns no quote for unsupported pairs", async () => {
  const provider = new DemoFxRateProvider();
  const quotes = await provider.getQuotes([
    {
      baseCurrency: normalizeCurrencyCode("USD"),
      quoteCurrency: normalizeCurrencyCode("JPY"),
    },
  ]);

  assert.deepEqual(quotes, []);
});
