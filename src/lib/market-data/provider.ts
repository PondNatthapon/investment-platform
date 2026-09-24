import { DemoMarketDataProvider } from "./demo-provider";
import type { MarketDataProvider } from "./types";

export function getMarketDataProvider(): MarketDataProvider {
  const provider = process.env.MARKET_DATA_PROVIDER ?? "demo";

  switch (provider) {
    case "demo":
      return new DemoMarketDataProvider();

    default:
      throw new Error(
        `Unsupported market data provider: ${provider}`,
      );
  }
}
