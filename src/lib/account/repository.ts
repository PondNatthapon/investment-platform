import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { accounts } from "@/db/schema";

export async function getUserAccounts(userId: string) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      broker: accounts.broker,
      baseCurrency: accounts.baseCurrency,
      accountType: accounts.accountType,
      isActive: accounts.isActive,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.name));
}

export async function getAccountForUser(
  accountId: string,
  userId: string,
) {
  const [account] = await db
    .select({
      id: accounts.id,
      userId: accounts.userId,
      name: accounts.name,
      broker: accounts.broker,
      baseCurrency: accounts.baseCurrency,
      accountType: accounts.accountType,
      isActive: accounts.isActive,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.id, accountId),
        eq(accounts.userId, userId),
        eq(accounts.isActive, true),
      ),
    )
    .limit(1);

  return account ?? null;
}
