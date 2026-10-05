const supportedCurrencies = new Set(
  Intl.supportedValuesOf("currency"),
);

declare const currencyCodeBrand: unique symbol;

export type CurrencyCode = string & {
  readonly [currencyCodeBrand]: true;
};

export class InvalidCurrencyCodeError extends Error {
  constructor(value: unknown) {
    super(`Unsupported currency code: ${String(value)}`);
    this.name = "InvalidCurrencyCodeError";
  }
}

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  if (typeof value !== "string") {
    throw new InvalidCurrencyCodeError(value);
  }

  const normalized = value.trim().toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(normalized) ||
    !supportedCurrencies.has(normalized)
  ) {
    throw new InvalidCurrencyCodeError(value);
  }

  return normalized as CurrencyCode;
}
