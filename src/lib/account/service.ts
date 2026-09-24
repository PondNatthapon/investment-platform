import "server-only";

import { getUserAccounts } from "./repository";

export type AccountDTO = {
  id: string;
  name: string;
  broker: string;
  baseCurrency: string;
  accountType: "BROKERAGE" | "CASH";
  isActive: boolean;
};

export async function getAccountsForUser(
  userId: string,
): Promise<AccountDTO[]> {
  return getUserAccounts(userId);
}
