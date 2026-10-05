import "server-only";

import Decimal from "decimal.js";

import { db } from "@/db";
import { transactions } from "@/db/schema";

import { requireAccountAccess } from "@/lib/account/access";
import { getAccountTransactions } from "@/lib/portfolio/repository";
import { calculatePositions } from "@/lib/portfolio/engine";

import {
  getSecurityById,
  getAccountTransactionsForList,
} from "./repository";

import type { CreateTransactionInput } from "./schema";

export async function getTransactions(
  userId: string,
  accountId: string,
) {
  await requireAccountAccess(userId, accountId);
  return getAccountTransactionsForList(accountId);
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
) {
  await requireAccountAccess(userId, input.accountId);

  const security = await getSecurityById(input.securityId);

  if (!security) {
    throw new Error("Security not found.");
  }

  const quantity = new Decimal(input.quantity);
  const price = new Decimal(input.price);
  const fee = new Decimal(input.fee);

  if (!quantity.isPositive()) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (price.isNegative()) {
    throw new Error("Price cannot be negative.");
  }

  if (fee.isNegative()) {
    throw new Error("Fee cannot be negative.");
  }

  const transactionDate = new Date(
    `${input.transactionAt}:00+07:00`,
  );

  if (Number.isNaN(transactionDate.getTime())) {
    throw new Error("Invalid transaction date.");
  }

  const grossAmount = quantity.times(price);

  if (input.type === "SELL") {
    const existingTransactions =
      await getAccountTransactions(input.accountId);

    const positions = calculatePositions(
      existingTransactions,
    );

    const position = positions.find(
      (item) => item.securityId === input.securityId,
    );

    const availableQuantity =
      position?.quantity ?? new Decimal(0);

    if (quantity.greaterThan(availableQuantity)) {
      throw new Error(
        `Cannot sell ${quantity.toString()} shares of ` +
          `${security.symbol}. Current position is ` +
          `${availableQuantity.toString()} shares.`,
      );
    }
  }

  const [created] = await db
    .insert(transactions)
    .values({
      accountId: input.accountId,
      securityId: input.securityId,

      type: input.type,

      quantity: quantity.toFixed(10),
      price: price.toFixed(10),
      grossAmount: grossAmount.toFixed(10),
      fee: fee.toFixed(10),

      currency: security.currency,

      transactionAt: transactionDate,

      notes: input.notes || null,
    })
    .returning({
      id: transactions.id,
    });

  return created;
}
