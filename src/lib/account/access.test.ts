import test from "node:test";
import assert from "node:assert/strict";

import {
  AccountAccessError,
  accountIdSchema,
  assertValidAccountId,
  authorizeAccount,
} from "./access";

const ownActiveAccount = {
  id: "account-1",
  userId: "user-1",
  name: "Brokerage",
  broker: "Broker",
  baseCurrency: "USD",
  accountType: "BROKERAGE" as const,
  isActive: true,
};

test("allows the current user to access their own active account", () => {
  assert.equal(
    authorizeAccount(ownActiveAccount, "user-1", "account-1"),
    ownActiveAccount,
  );
});

test("denies access to another user's account", () => {
  assert.equal(
    authorizeAccount(
      { ...ownActiveAccount, userId: "user-2" },
      "user-1",
      "account-1",
    ),
    null,
  );
});

test("denies a missing or mismatched account", () => {
  assert.equal(authorizeAccount(null, "user-1", "account-1"), null);
  assert.equal(
    authorizeAccount(ownActiveAccount, "user-1", "account-2"),
    null,
  );
});

test("rejects missing and invalid account IDs", () => {
  assert.equal(accountIdSchema.safeParse(null).success, false);
  assert.equal(accountIdSchema.safeParse("not-a-uuid").success, false);
  assert.equal(
    accountIdSchema.safeParse("9bd8514b-f207-4ea7-bd53-cd4babc8c18a").success,
    true,
  );
});

test("maps malformed account IDs to the safe account-not-found error", () => {
  assert.throws(
    () => assertValidAccountId("not-a-uuid"),
    (error: unknown) =>
      error instanceof AccountAccessError &&
      error.message === "Investment account not found.",
  );
});

test("denies inactive accounts", () => {
  assert.equal(
    authorizeAccount(
      { ...ownActiveAccount, isActive: false },
      "user-1",
      "account-1",
    ),
    null,
  );
});
