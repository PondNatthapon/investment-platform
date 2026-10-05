import "server-only";

import { getUserAccounts } from "./repository";
import {
  getWalletForAccount,
  getWalletsForAccount,
} from "./wallet";

export type AccountDTO = {
  id: string;
  name: string;
  broker: string;
  baseCurrency: string;
  accountType: "BROKERAGE" | "CASH";
  isActive: boolean;
};

export type WalletDTO = {
  id: string;
  accountId: string;
  walletKey: string;
  label: string;
  currency: string;
  externalRef: string | null;
  isActive: boolean;
};

export async function getAccountsForUser(
  userId: string,
): Promise<AccountDTO[]> {
  return getUserAccounts(userId);
}

export async function getWalletsForUserAccount(
  userId: string,
  accountId: string,
): Promise<WalletDTO[]> {
  return getWalletsForAccount(userId, accountId);
}

export async function getWalletForUserAccount(
  userId: string,
  accountId: string,
  walletId: string,
): Promise<WalletDTO | null> {
  return getWalletForAccount(userId, accountId, walletId);
}
