import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { securities, transactions } from "@/db/schema";

export async function getAccountTransactions(accountId: string) {
  return db
    .select({
      securityId: transactions.securityId,
      symbol: securities.symbol,
      type: transactions.type,
      quantity: transactions.quantity,
      price: transactions.price,
      grossAmount: transactions.grossAmount,
      fee: transactions.fee,
      currency: transactions.currency,
      transactionAt: transactions.transactionAt,
    })
    .from(transactions)
    .innerJoin(
      securities,
      eq(transactions.securityId, securities.id),
    )
    .where(eq(transactions.accountId, accountId))
    .orderBy(asc(transactions.transactionAt));
}
