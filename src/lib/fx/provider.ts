import { DemoFxRateProvider } from "./demo-provider";
import type { FxRateProvider } from "./types";

export function getFxRateProvider(): FxRateProvider {
  const provider = process.env.FX_RATE_PROVIDER ?? "demo";

  switch (provider) {
    case "demo":
      return new DemoFxRateProvider();

    default:
      throw new Error(`Unsupported FX rate provider: ${provider}`);
  }
}
