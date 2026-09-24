import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  securities,
  transactions,
} from "@/db/schema";

export async function getAccountTransactionsForList(
  accountId: string,
) {
  return db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      securityId: transactions.securityId,

      symbol: securities.symbol,
      securityName: securities.name,

      type: transactions.type,

      quantity: transactions.quantity,
      price: transactions.price,
      grossAmount: transactions.grossAmount,
      fee: transactions.fee,

      currency: transactions.currency,
      transactionAt: transactions.transactionAt,

      notes: transactions.notes,
    })
    .from(transactions)
    .innerJoin(
      securities,
      eq(transactions.securityId, securities.id),
    )
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.transactionAt));
}

export async function getSecurityById(
  securityId: string,
) {
  const [security] = await db
    .select({
      id: securities.id,
      symbol: securities.symbol,
      name: securities.name,
      currency: securities.currency,
    })
    .from(securities)
    .where(eq(securities.id, securityId))
    .limit(1);

  return security ?? null;
}