import { requireAccountAccess } from "./access";
import {
  getAccountWalletForAccount,
  getAccountWalletsForAccount,
} from "./repository";

export type AccountWallet = {
  id: string;
  accountId: string;
  walletKey: string;
  label: string;
  currency: string;
  externalRef: string | null;
  isActive: boolean;
};

export function authorizeWallet(
  wallet: AccountWallet | null,
  accountId: string,
  walletId: string,
): AccountWallet | null {
  if (
    !wallet ||
    wallet.accountId !== accountId ||
    wallet.id !== walletId ||
    !wallet.isActive
  ) {
    return null;
  }

  return wallet;
}

export async function getWalletsForAccount(
  userId: string,
  accountId: string,
): Promise<AccountWallet[]> {
  await requireAccountAccess(userId, accountId);

  return getAccountWalletsForAccount(accountId);
}

export async function getWalletForAccount(
  userId: string,
  accountId: string,
  walletId: string,
): Promise<AccountWallet | null> {
  await requireAccountAccess(userId, accountId);

  const wallet = await getAccountWalletForAccount(accountId, walletId);

  return authorizeWallet(wallet, accountId, walletId);
}
