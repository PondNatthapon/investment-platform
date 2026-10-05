import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { accountWallets, accounts, brokers } from "@/db/schema";

export async function getUserAccounts(userId: string) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      broker: brokers.displayName,
      baseCurrency: accounts.baseCurrency,
      accountType: accounts.accountType,
      isActive: accounts.isActive,
    })
    .from(accounts)
    .innerJoin(brokers, eq(accounts.brokerId, brokers.id))
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
      broker: brokers.displayName,
      baseCurrency: accounts.baseCurrency,
      accountType: accounts.accountType,
      isActive: accounts.isActive,
    })
    .from(accounts)
    .innerJoin(brokers, eq(accounts.brokerId, brokers.id))
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

export async function getAccountWalletsForAccount(
  accountId: string,
) {
  return db
    .select({
      id: accountWallets.id,
      accountId: accountWallets.accountId,
      walletKey: accountWallets.walletKey,
      label: accountWallets.label,
      currency: accountWallets.currency,
      externalRef: accountWallets.externalRef,
      isActive: accountWallets.isActive,
    })
    .from(accountWallets)
    .where(
      and(
        eq(accountWallets.accountId, accountId),
        eq(accountWallets.isActive, true),
      ),
    )
    .orderBy(asc(accountWallets.label));
}

export async function getAccountWalletForAccount(
  accountId: string,
  walletId: string,
) {
  const [wallet] = await db
    .select({
      id: accountWallets.id,
      accountId: accountWallets.accountId,
      walletKey: accountWallets.walletKey,
      label: accountWallets.label,
      currency: accountWallets.currency,
      externalRef: accountWallets.externalRef,
      isActive: accountWallets.isActive,
    })
    .from(accountWallets)
    .where(
      and(
        eq(accountWallets.accountId, accountId),
        eq(accountWallets.id, walletId),
      ),
    )
    .limit(1);

  return wallet ?? null;
}
