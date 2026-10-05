import "server-only";

import { requireAccountAccess } from "./access";
import { getUserAccounts } from "./repository";

export async function getCurrentAccount(
  userId: string,
  requestedAccountId?: string,
) {
  if (requestedAccountId) {
    return requireAccountAccess(userId, requestedAccountId);
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
