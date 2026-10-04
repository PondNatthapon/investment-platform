import "server-only";

import {
  getAccountForUser,
  getUserAccounts,
} from "./repository";

export async function getCurrentAccount(
  userId: string,
  requestedAccountId?: string,
) {
  if (requestedAccountId) {
    const account = await getAccountForUser(
      requestedAccountId,
      userId,
    );

    if (!account) {
      throw new Error(
        "Requested investment account was not found.",
      );
    }

    return account;
  }

  const accounts = await getUserAccounts(userId);

  const activeAccount = accounts.find(
    (account) => account.isActive,
  );

  if (!activeAccount) {
    throw new Error(
      "No active investment account found.",
    );
  }

  return activeAccount;
}