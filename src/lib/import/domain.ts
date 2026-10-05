import { createHash } from "node:crypto";

import { z } from "zod";

import { requireAccountAccess } from "@/lib/account/access";

export const UNKNOWN_VALUE = "UNKNOWN" as const;
export const UNAVAILABLE_VALUE = "UNAVAILABLE" as const;

export type UnknownValue = typeof UNKNOWN_VALUE | typeof UNAVAILABLE_VALUE;

export const importSourceTypeSchema = z.enum([
  "PDF",
  "CSV",
  "SCREENSHOT",
  "MANUAL",
]);

export const importBatchStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "PARTIAL",
]);

export const normalizedDraftTypeSchema = z.enum([
  "TRADE",
  "DEPOSIT",
  "WITHDRAWAL",
  "ACTUAL_FX",
  "DIVIDEND",
  "FEE",
  "TAX",
  "PORTFOLIO_SNAPSHOT",
  "PORTFOLIO_VALUE_SNAPSHOT",
  "CASH_BALANCE_SNAPSHOT",
  "INTERNAL_TRANSFER",
]);

export const normalizedDraftStatusSchema = z.enum([
  "NEEDS_REVIEW",
  "CONFIRMED",
  "REJECTED",
  "NEEDS_RECONCILIATION",
]);

export const financialEventStatusSchema = z.enum([
  "CONFIRMED",
  "REJECTED",
]);

export type ImportSourceType = z.infer<typeof importSourceTypeSchema>;
export type ImportBatchStatus = z.infer<typeof importBatchStatusSchema>;
export type NormalizedDraftType = z.infer<typeof normalizedDraftTypeSchema>;
export type NormalizedDraftStatus = z.infer<typeof normalizedDraftStatusSchema>;
export type FinancialEventStatus = z.infer<typeof financialEventStatusSchema>;

export type Provenance = {
  documentId?: string | null;
  pageNumber?: number | null;
  csvRow?: number | null;
  screenshotRef?: string | null;
  sourceRegion?: string | null;
  externalId?: string | null;
  parserName?: string | null;
  parserVersion?: string | null;
  importedAt: string;
};

export type ImportBatch = {
  id: string;
  accountId: string;
  brokerId: string;
  sourceType: ImportSourceType;
  sourceDocumentId?: string | null;
  sourceReference?: string | null;
  parserName?: string | null;
  parserVersion?: string | null;
  importStartedAt: string;
  importCompletedAt?: string | null;
  status: ImportBatchStatus;
  statusMessage?: string | null;
  sourceChecksumSha256?: string | null;
};

export type NormalizedDraft = {
  id: string;
  accountId: string;
  brokerId: string;
  batchId: string;
  documentId?: string | null;
  eventType: NormalizedDraftType;
  externalId?: string | null;
  sourceLocator?: string | null;
  sourcePage?: number | null;
  sourceRow?: number | null;
  sourceRegion?: string | null;
  sourceImageRef?: string | null;
  parserName?: string | null;
  parserVersion?: string | null;
  importedAt: string;
  eventAt?: string | null;
  currency?: string | null;
  amount?: string | null;
  quantity?: string | null;
  unitPrice?: string | null;
  securitySymbol?: string | null;
  status: NormalizedDraftStatus;
  reviewReason?: string | null;
  rawPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  idempotencyKey: string;
  duplicateOfDraftId?: string | null;
};

export type FinalFinancialEvent = {
  id: string;
  accountId: string;
  brokerId: string;
  draftId: string;
  eventType: NormalizedDraftType;
  status: FinancialEventStatus;
  finalizedAt: string;
  finalPayload: Record<string, unknown>;
  provenance: Provenance;
};

export function isUnknownValue(
  value: unknown,
): value is UnknownValue {
  return value === UNKNOWN_VALUE || value === UNAVAILABLE_VALUE;
}

export function isValidCurrencyLike(value: unknown): boolean {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

export function buildProvenance(input: {
  documentId?: string | null;
  pageNumber?: number | null;
  csvRow?: number | null;
  screenshotRef?: string | null;
  sourceRegion?: string | null;
  externalId?: string | null;
  parserName?: string | null;
  parserVersion?: string | null;
  importedAt: string;
}): Provenance {
  return {
    documentId: input.documentId ?? null,
    pageNumber: input.pageNumber ?? null,
    csvRow: input.csvRow ?? null,
    screenshotRef: input.screenshotRef ?? null,
    sourceRegion: input.sourceRegion ?? null,
    externalId: input.externalId ?? null,
    parserName: input.parserName ?? null,
    parserVersion: input.parserVersion ?? null,
    importedAt: input.importedAt,
  };
}

export function createImportBatch(input: {
  id?: string;
  accountId: string;
  brokerId: string;
  sourceType: ImportSourceType;
  sourceDocumentId?: string | null;
  sourceReference?: string | null;
  parserName?: string | null;
  parserVersion?: string | null;
  importStartedAt?: string;
  importCompletedAt?: string | null;
  status?: ImportBatchStatus;
  statusMessage?: string | null;
  sourceChecksumSha256?: string | null;
}): ImportBatch {
  const sourceType = importSourceTypeSchema.parse(input.sourceType);

  return {
    id: input.id ?? cryptoId(),
    accountId: input.accountId,
    brokerId: input.brokerId,
    sourceType,
    sourceDocumentId: input.sourceDocumentId ?? null,
    sourceReference: input.sourceReference ?? null,
    parserName: input.parserName ?? null,
    parserVersion: input.parserVersion ?? null,
    importStartedAt: input.importStartedAt ?? new Date().toISOString(),
    importCompletedAt: input.importCompletedAt ?? null,
    status: input.status ?? "QUEUED",
    statusMessage: input.statusMessage ?? null,
    sourceChecksumSha256: input.sourceChecksumSha256 ?? null,
  };
}

export type AccountAccessGuard = (
  userId: string,
  accountId: string,
) => Promise<unknown>;

export async function createAuthorizedImportBatch(
  userId: string,
  input: {
    id?: string;
    accountId: string;
    brokerId: string;
    sourceType: ImportSourceType;
    sourceDocumentId?: string | null;
    sourceReference?: string | null;
    parserName?: string | null;
    parserVersion?: string | null;
    importStartedAt?: string;
    importCompletedAt?: string | null;
    status?: ImportBatchStatus;
    statusMessage?: string | null;
    sourceChecksumSha256?: string | null;
  },
  accessGuard: AccountAccessGuard = requireAccountAccess,
): Promise<ImportBatch> {
  await accessGuard(userId, input.accountId);
  return createImportBatch(input);
}

export function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nextValue]) => [key, sortJsonValue(nextValue)]),
    );
  }

  return value;
}

export function stableSerialize(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

export function computeNormalizedEventFingerprint(
  payload: Record<string, unknown>,
): string {
  return createHash("sha256")
    .update(stableSerialize(payload))
    .digest("hex");
}

export function buildDraftIdempotencyKey(input: {
  accountId: string;
  externalId?: string | null;
  documentId?: string | null;
  sourceLocator?: string | null;
  payload: Record<string, unknown>;
}): string {
  if (input.externalId) {
    return `account:${input.accountId}:external:${input.externalId}`;
  }

  if (input.documentId && input.sourceLocator) {
    return `account:${input.accountId}:document:${input.documentId}:locator:${input.sourceLocator}`;
  }

  return `account:${input.accountId}:fingerprint:${computeNormalizedEventFingerprint(input.payload)}`;
}

export function createNormalizedDraft(input: {
  id?: string;
  accountId: string;
  brokerId: string;
  batchId: string;
  documentId?: string | null;
  eventType: NormalizedDraftType;
  externalId?: string | null;
  sourceLocator?: string | null;
  sourcePage?: number | null;
  sourceRow?: number | null;
  sourceRegion?: string | null;
  sourceImageRef?: string | null;
  parserName?: string | null;
  parserVersion?: string | null;
  importedAt?: string;
  eventAt?: string | null;
  currency?: string | null;
  amount?: string | null;
  quantity?: string | null;
  unitPrice?: string | null;
  securitySymbol?: string | null;
  status?: NormalizedDraftStatus;
  reviewReason?: string | null;
  rawPayload?: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown>;
  idempotencyKey?: string;
  duplicateOfDraftId?: string | null;
}): NormalizedDraft {
  const eventType = normalizedDraftTypeSchema.parse(input.eventType);

  const normalizedPayload = input.normalizedPayload ?? {};
  const rawPayload = input.rawPayload ?? {};

  const idempotencyKey =
    input.idempotencyKey ??
    buildDraftIdempotencyKey({
      accountId: input.accountId,
      externalId: input.externalId ?? null,
      documentId: input.documentId ?? null,
      sourceLocator: input.sourceLocator ?? null,
      payload: normalizedPayload,
    });

  return {
    id: input.id ?? cryptoId(),
    accountId: input.accountId,
    brokerId: input.brokerId,
    batchId: input.batchId,
    documentId: input.documentId ?? null,
    eventType,
    externalId: input.externalId ?? null,
    sourceLocator: input.sourceLocator ?? null,
    sourcePage: input.sourcePage ?? null,
    sourceRow: input.sourceRow ?? null,
    sourceRegion: input.sourceRegion ?? null,
    sourceImageRef: input.sourceImageRef ?? null,
    parserName: input.parserName ?? null,
    parserVersion: input.parserVersion ?? null,
    importedAt: input.importedAt ?? new Date().toISOString(),
    eventAt: input.eventAt ?? null,
    currency: input.currency ?? null,
    amount: input.amount ?? null,
    quantity: input.quantity ?? null,
    unitPrice: input.unitPrice ?? null,
    securitySymbol: input.securitySymbol ?? null,
    status: input.status ?? "NEEDS_REVIEW",
    reviewReason: input.reviewReason ?? null,
    rawPayload,
    normalizedPayload,
    idempotencyKey,
    duplicateOfDraftId: input.duplicateOfDraftId ?? null,
  };
}

export function transitionDraftStatus(
  draft: NormalizedDraft,
  nextStatus: NormalizedDraftStatus,
): NormalizedDraft {
  const parsed = normalizedDraftStatusSchema.parse(nextStatus);

  if (
    draft.status === "CONFIRMED" &&
    parsed !== "REJECTED" &&
    parsed !== "CONFIRMED"
  ) {
    throw new Error("A confirmed draft cannot be moved to a different review state.");
  }

  return {
    ...draft,
    status: parsed,
  };
}

export function createDraftCollision(
  draft: NormalizedDraft,
  duplicateOfDraftId: string,
  reason?: string,
): NormalizedDraft {
  return {
    ...draft,
    status: "NEEDS_REVIEW",
    duplicateOfDraftId,
    reviewReason: reason ?? "Duplicate or colliding source record identified.",
  };
}

export function findDuplicateDraft(
  draft: NormalizedDraft,
  existingDrafts: NormalizedDraft[],
): NormalizedDraft | null {
  const sameExternalId = draft.externalId
    ? existingDrafts.find(
        (candidate) =>
          candidate.accountId === draft.accountId &&
          candidate.externalId === draft.externalId &&
          candidate.id !== draft.id,
      )
    : null;

  if (sameExternalId) {
    return sameExternalId;
  }

  const sameSourceLocator = draft.documentId && draft.sourceLocator
    ? existingDrafts.find(
        (candidate) =>
          candidate.accountId === draft.accountId &&
          candidate.documentId === draft.documentId &&
          candidate.sourceLocator === draft.sourceLocator &&
          candidate.id !== draft.id,
      )
    : null;

  if (sameSourceLocator) {
    return sameSourceLocator;
  }

  return (
    existingDrafts.find(
      (candidate) =>
        candidate.accountId === draft.accountId &&
        candidate.idempotencyKey === draft.idempotencyKey &&
        candidate.id !== draft.id,
    ) ?? null
  );
}

export async function createAuthorizedInternalTransferDraft(
  userId: string,
  input: {
    id?: string;
    fromAccountId: string;
    toAccountId: string;
    brokerId: string;
    batchId: string;
    sourceDocumentId?: string | null;
    eventAt?: string | null;
    currency?: string | null;
    amount?: string | null;
    rawPayload?: Record<string, unknown>;
    normalizedPayload?: Record<string, unknown>;
    externalId?: string | null;
    sourceLocator?: string | null;
  },
  accessGuard: AccountAccessGuard = requireAccountAccess,
): Promise<NormalizedDraft> {
  await accessGuard(userId, input.fromAccountId);
  await accessGuard(userId, input.toAccountId);

  const normalizedPayload = input.normalizedPayload ?? {
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    direction: "internal",
  };

  return createNormalizedDraft({
    id: input.id,
    accountId: input.fromAccountId,
    brokerId: input.brokerId,
    batchId: input.batchId,
    documentId: input.sourceDocumentId ?? null,
    eventType: "INTERNAL_TRANSFER",
    externalId: input.externalId ?? null,
    sourceLocator: input.sourceLocator ?? null,
    eventAt: input.eventAt ?? null,
    currency: input.currency ?? null,
    amount: input.amount ?? null,
    rawPayload: input.rawPayload ?? {
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
    },
    normalizedPayload,
  });
}

export function confirmDraftToEvent(
  draft: NormalizedDraft,
  finalPayload?: Record<string, unknown>,
): FinalFinancialEvent {
  if (draft.status === "REJECTED") {
    throw new Error("Rejected drafts cannot become final financial events.");
  }

  return {
    id: cryptoId(),
    accountId: draft.accountId,
    brokerId: draft.brokerId,
    draftId: draft.id,
    eventType: draft.eventType,
    status: "CONFIRMED",
    finalizedAt: new Date().toISOString(),
    finalPayload: finalPayload ?? draft.normalizedPayload,
    provenance: buildProvenance({
      documentId: draft.documentId ?? null,
      pageNumber: draft.sourcePage ?? null,
      csvRow: draft.sourceRow ?? null,
      screenshotRef: draft.sourceImageRef ?? null,
      sourceRegion: draft.sourceRegion ?? null,
      externalId: draft.externalId ?? null,
      parserName: draft.parserName ?? null,
      parserVersion: draft.parserVersion ?? null,
      importedAt: draft.importedAt,
    }),
  };
}

function cryptoId(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 32);
}
