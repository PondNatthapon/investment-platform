import { normalizeCurrencyCode } from "@/lib/currency/currency";
import type { FxPair, FxQuote, FxRateProvider } from "./types";

const DEMO_AS_OF = new Date("2026-01-01T00:00:00.000Z");

const DEMO_QUOTES: FxQuote[] = [
  {
    baseCurrency: normalizeCurrencyCode("USD"),
    quoteCurrency: normalizeCurrencyCode("THB"),
    rate: "35.00",
    source: "demo-fixed",
    asOf: DEMO_AS_OF,
  },
  {
    baseCurrency: normalizeCurrencyCode("USD"),
    quoteCurrency: normalizeCurrencyCode("EUR"),
    rate: "0.90",
    source: "demo-fixed",
    asOf: DEMO_AS_OF,
  },
];

export class DemoFxRateProvider implements FxRateProvider {
  async getQuotes(pairs: FxPair[]): Promise<FxQuote[]> {
    return pairs.flatMap((pair) => {
      const baseCurrency = normalizeCurrencyCode(pair.baseCurrency);
      const quoteCurrency = normalizeCurrencyCode(pair.quoteCurrency);
      const quote = DEMO_QUOTES.find(
        (candidate) =>
          (candidate.baseCurrency === baseCurrency &&
            candidate.quoteCurrency === quoteCurrency) ||
          (candidate.baseCurrency === quoteCurrency &&
            candidate.quoteCurrency === baseCurrency),
      );

      return quote
        ? [{ ...quote, asOf: new Date(quote.asOf) }]
        : [];
    });
  }
}
