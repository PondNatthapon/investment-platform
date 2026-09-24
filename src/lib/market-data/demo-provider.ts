import type {
  MarketDataProvider,
  MarketPrice,
} from "./types";

const DEMO_PRICES: Record<
  string,
  { price: string; currency: string }
> = {
  VOO: {
    price: "510.00",
    currency: "USD",
  },
  OKLO: {
    price: "42.00",
    currency: "USD",
  },
};

export class DemoMarketDataProvider implements MarketDataProvider {
  async getPrices(symbols: string[]): Promise<MarketPrice[]> {
    const asOf = new Date();

    return symbols.flatMap((symbol) => {
      const data = DEMO_PRICES[symbol];

      if (!data) {
        return [];
      }

      return [
        {
          symbol,
          price: data.price,
          currency: data.currency,
          asOf,
        },
      ];
    });
  }
}
