export type MarketPrice = {
  symbol: string;
  price: string;
  currency: string;
  asOf: Date;
};

export interface MarketDataProvider {
  getPrices(symbols: string[]): Promise<MarketPrice[]>;
}
