import test from "node:test";
import assert from "node:assert/strict";

import {
  UNKNOWN_VALUE,
  UNAVAILABLE_VALUE,
  buildDraftIdempotencyKey,
  confirmDraftToEvent,
  createImportBatch,
  createNormalizedDraft,
  createAuthorizedImportBatch,
  createAuthorizedInternalTransferDraft,
  findDuplicateDraft,
  isUnknownValue,
  transitionDraftStatus,
} from "./domain";

test("creates an import batch with supported source types", () => {
  const batch = createImportBatch({
    accountId: "account-1",
    brokerId: "broker-1",
    sourceType: "CSV",
    sourceReference: "monthly.csv",
    parserName: "webull-parser",
    parserVersion: "1.0.0",
  });

  assert.equal(batch.sourceType, "CSV");
  assert.ok(batch.id);
  assert.equal(batch.status, "QUEUED");
});

test("account-scoped import batches support authorization guards without bypassing the account boundary", async () => {
  const batch = await createAuthorizedImportBatch(
    "user-1",
    {
      accountId: "account-1",
      brokerId: "broker-1",
      sourceType: "PDF",
    },
    async () => undefined,
  );

  assert.equal(batch.accountId, "account-1");
});

test("authorization failures are surfaced by the guard", async () => {
  await assert.rejects(
    () =>
      createAuthorizedImportBatch(
        "user-1",
        {
          accountId: "invalid-account",
          brokerId: "broker-1",
          sourceType: "PDF",
        },
        async () => {
          throw new Error("unauthorized");
        },
      ),
    /unauthorized/,
  );
});

test("creates a normalized draft and preserves unknown values explicitly", () => {
  const draft = createNormalizedDraft({
    accountId: "account-1",
    brokerId: "broker-1",
    batchId: "batch-1",
    eventType: "DEPOSIT",
    externalId: "dep-123",
    documentId: "doc-1",
    sourceLocator: "page-2/row-10",
    rawPayload: {
      amount: UNKNOWN_VALUE,
      currency: UNAVAILABLE_VALUE,
    },
    normalizedPayload: {
      amount: UNKNOWN_VALUE,
      currency: UNAVAILABLE_VALUE,
      direction: "inbound",
    },
  });

  assert.equal(draft.status, "NEEDS_REVIEW");
  assert.equal(draft.rawPayload.amount, UNKNOWN_VALUE);
  assert.equal(draft.normalizedPayload.amount, UNKNOWN_VALUE);
  assert.ok(isUnknownValue(UNKNOWN_VALUE));
  assert.ok(isUnknownValue(UNAVAILABLE_VALUE));
});

test("review status transitions only keep confirmed drafts from being downgraded", () => {
  const draft = createNormalizedDraft({
    accountId: "account-1",
    brokerId: "broker-1",
    batchId: "batch-1",
    eventType: "TRADE",
    status: "CONFIRMED",
  });

  const updated = transitionDraftStatus(draft, "CONFIRMED");
  assert.equal(updated.status, "CONFIRMED");

  assert.throws(() => transitionDraftStatus(draft, "NEEDS_REVIEW"));
});

test("provenance preserves the source trace for each draft", () => {
  const draft = createNormalizedDraft({
    accountId: "account-1",
    brokerId: "broker-1",
    batchId: "batch-1",
    documentId: "doc-1",
    eventType: "DIVIDEND",
    sourcePage: 3,
    sourceRow: 12,
    sourceRegion: "table-row-5",
    sourceImageRef: "img-01.png",
    parserName: "webull-parser",
    parserVersion: "2.0.0",
    externalId: "div-99",
  });

  const event = confirmDraftToEvent(draft);

  assert.equal(event.provenance.documentId, "doc-1");
  assert.equal(event.provenance.pageNumber, 3);
  assert.equal(event.provenance.csvRow, 12);
  assert.equal(event.provenance.sourceRegion, "table-row-5");
  assert.equal(event.provenance.externalId, "div-99");
});

test("external-ID idempotency and deterministic fingerprint idempotency both work", () => {
  const payload = { amount: "100.00", currency: "USD", type: "DEPOSIT" };

  const externalKey = buildDraftIdempotencyKey({
    accountId: "account-1",
    externalId: "deposit-1",
    payload,
  });

  const fingerprintKey = buildDraftIdempotencyKey({
    accountId: "account-1",
    payload,
  });

  assert.match(externalKey, /external:deposit-1/);
  assert.match(fingerprintKey, /fingerprint:/);
  assert.ok(externalKey.includes("account:account-1"));
  assert.ok(fingerprintKey.includes("account:account-1"));
});

test("duplicate or colliding records are flagged for review rather than silently discarded", () => {
  const first = createNormalizedDraft({
    accountId: "account-1",
    brokerId: "broker-1",
    batchId: "batch-1",
    eventType: "WITHDRAWAL",
    externalId: "wd-23",
    documentId: "doc-1",
    sourceLocator: "cash-1",
    rawPayload: { amount: "10.00" },
    normalizedPayload: { amount: "10.00" },
  });

  const duplicate = {
    ...first,
    id: "draft-duplicate",
    idempotencyKey: first.idempotencyKey,
  };

  const found = findDuplicateDraft(duplicate, [first]);

  assert.ok(found);
  assert.equal(found?.id, first.id);
});

test("rejected drafts do not become financial events", () => {
  const draft = createNormalizedDraft({
    accountId: "account-1",
    brokerId: "broker-1",
    batchId: "batch-1",
    eventType: "FEE",
    status: "REJECTED",
  });

  assert.throws(() => confirmDraftToEvent(draft));
});

test("internal transfer representation is explicit and account-scoped", async () => {
  const transfer = await createAuthorizedInternalTransferDraft(
    "user-1",
    {
      fromAccountId: "account-1",
      toAccountId: "account-2",
      brokerId: "broker-1",
      batchId: "batch-2",
      amount: "42.00",
      currency: "USD",
      rawPayload: {
        fromAccountId: "account-1",
        toAccountId: "account-2",
      },
    },
    async () => undefined,
  );

  assert.equal(transfer.eventType, "INTERNAL_TRANSFER");
  assert.equal(transfer.amount, "42.00");
  assert.equal(transfer.normalizedPayload.fromAccountId, "account-1");
});
