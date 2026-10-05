import type { CurrencyCode } from "@/lib/currency/currency";

export type FxPair = {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
};

/** `rate` means quote-currency units for one base-currency unit. */
export type FxQuote = FxPair & {
  rate: string;
  source: string;
  asOf: Date;
};

export interface FxRateProvider {
  getQuotes(pairs: FxPair[]): Promise<FxQuote[]>;
}
