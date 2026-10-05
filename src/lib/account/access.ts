import { z } from "zod";

import { getAccountForUser } from "./repository";

export const accountIdSchema = z.uuid();

export type AuthorizedAccount = {
  id: string;
  userId: string;
  name: string;
  broker: string;
  baseCurrency: string;
  accountType: "BROKERAGE" | "CASH";
  isActive: boolean;
};

export class AccountAccessError extends Error {
  constructor() {
    super("Investment account not found.");
    this.name = "AccountAccessError";
  }
}

export function assertValidAccountId(accountId: string): void {
  if (!accountIdSchema.safeParse(accountId).success) {
    throw new AccountAccessError();
  }
}

/** Returns null for missing, foreign, or inactive accounts. */
export function authorizeAccount(
  account: AuthorizedAccount | null,
  userId: string,
  accountId: string,
): AuthorizedAccount | null {
  if (
    !account ||
    account.id !== accountId ||
    account.userId !== userId ||
    !account.isActive
  ) {
    return null;
  }

  return account;
}

/** Resolves an account only when it is active and owned by this user. */
export async function requireAccountAccess(
  userId: string,
  accountId: string,
) {
  assertValidAccountId(accountId);

  const account = await getAccountForUser(accountId, userId);
  const authorized = authorizeAccount(account, userId, accountId);

  if (!authorized) {
    throw new AccountAccessError();
  }

  return authorized;
}
