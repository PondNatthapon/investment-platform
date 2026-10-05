import test from "node:test";
import assert from "node:assert/strict";

import { authorizeWallet } from "./wallet";

const activeWallet = {
  id: "wallet-1",
  accountId: "account-1",
  walletKey: "demo-usd",
  label: "Demo USD",
  currency: "USD",
  externalRef: "ext-123",
  isActive: true,
};

test("authorizes a wallet that belongs to the active account", () => {
  assert.equal(
    authorizeWallet(activeWallet, "account-1", "wallet-1"),
    activeWallet,
  );
});

test("rejects a wallet from a different account", () => {
  assert.equal(
    authorizeWallet(
      { ...activeWallet, accountId: "account-2" },
      "account-1",
      "wallet-1",
    ),
    null,
  );
});

test("rejects missing or inactive wallet records", () => {
  assert.equal(authorizeWallet(null, "account-1", "wallet-1"), null);
  assert.equal(
    authorizeWallet(
      { ...activeWallet, id: "wallet-2", isActive: false },
      "account-1",
      "wallet-2",
    ),
    null,
  );
});
