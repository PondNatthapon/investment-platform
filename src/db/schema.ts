import {
  boolean,
  check,
  date,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const accountTypeEnum = pgEnum("account_type", [
  "BROKERAGE",
  "CASH",
]);

export const assetClassEnum = pgEnum("asset_class", [
  "STOCK",
  "ETF",
  "BOND",
  "FUND",
  "REIT",
  "OTHER",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "BUY",
  "SELL",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "STATEMENT",
  "WITHHOLDING_TAX",
  "TRANSACTION_REPORT",
  "ANNUAL_SUMMARY",
  "OTHER",
]);

export const importSourceTypeEnum = pgEnum("import_source_type", [
  "PDF",
  "CSV",
  "SCREENSHOT",
  "MANUAL",
]);

export const importBatchStatusEnum = pgEnum("import_batch_status", [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "PARTIAL",
]);

export const normalizedDraftTypeEnum = pgEnum(
  "normalized_draft_type",
  [
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
  ],
);

export const normalizedDraftStatusEnum = pgEnum(
  "normalized_draft_status",
  [
    "NEEDS_REVIEW",
    "CONFIRMED",
    "REJECTED",
    "NEEDS_RECONCILIATION",
  ],
);

export const financialEventStatusEnum = pgEnum(
  "financial_event_status",
  ["CONFIRMED", "REJECTED"],
);

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */


export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 100 }).notNull(),

    email: varchar("email", { length: 255 }).notNull(),

    timezone: varchar("timezone", { length: 64 })
      .notNull()
      .default("Asia/Bangkok"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
  ],
);

/* -------------------------------------------------------------------------- */
/* Brokers                                                                    */
/* -------------------------------------------------------------------------- */

export const brokers = pgTable(
  "brokers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    code: varchar("code", { length: 64 }).notNull(),

    displayName: varchar("display_name", { length: 100 }).notNull(),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("brokers_code_unique").on(table.code),
  ],
);

/* -------------------------------------------------------------------------- */
/* Accounts                                                                   */
/* -------------------------------------------------------------------------- */

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    name: varchar("name", { length: 100 }).notNull(),

    brokerId: uuid("broker_id")
      .notNull()
      .references(() => brokers.id, {
        onDelete: "restrict",
      }),

    accountType: accountTypeEnum("account_type")
      .notNull()
      .default("BROKERAGE"),

    baseCurrency: varchar("base_currency", { length: 3 }).notNull(),

    accountNumber: varchar("account_number", { length: 100 }),

    isActive: boolean("is_active").notNull().default(true),

    isDemo: boolean("is_demo").notNull().default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    index("accounts_broker_id_idx").on(table.brokerId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Account Wallets                                                            */
/* -------------------------------------------------------------------------- */

export const accountWallets = pgTable(
  "account_wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    walletKey: varchar("wallet_key", { length: 100 }).notNull(),

    label: varchar("label", { length: 100 }).notNull(),

    currency: varchar("currency", { length: 3 }).notNull(),

    externalRef: varchar("external_ref", { length: 100 }),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("account_wallets_account_wallet_key_unique").on(
      table.accountId,
      table.walletKey,
    ),
    uniqueIndex("account_wallets_account_id_id_unique").on(
      table.accountId,
      table.id,
    ),
    uniqueIndex("account_wallets_account_external_ref_unique")
      .on(table.accountId, table.externalRef)
      .where(sql`${table.externalRef} is not null`),
    index("account_wallets_account_id_idx").on(table.accountId),
    index("account_wallets_account_currency_idx").on(
      table.accountId,
      table.currency,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Securities                                                                 */
/* -------------------------------------------------------------------------- */

export const securities = pgTable(
  "securities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    symbol: varchar("symbol", { length: 32 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    assetClass: assetClassEnum("asset_class").notNull(),

    exchange: varchar("exchange", { length: 32 }),

    currency: varchar("currency", { length: 3 }).notNull(),

    isin: varchar("isin", { length: 12 }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("securities_symbol_exchange_unique").on(
      table.symbol,
      table.exchange,
    ),
    index("securities_symbol_idx").on(table.symbol),
  ],
);

/* -------------------------------------------------------------------------- */
/* Transactions                                                               */
/* -------------------------------------------------------------------------- */

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id, {
        onDelete: "restrict",
      }),

    settlementWalletId: uuid("settlement_wallet_id"),

    type: transactionTypeEnum("type").notNull(),

    quantity: decimal("quantity", {
      precision: 30,
      scale: 10,
    }).notNull(),

    price: decimal("price", {
      precision: 30,
      scale: 10,
    }).notNull(),

    grossAmount: decimal("gross_amount", {
      precision: 30,
      scale: 10,
    }).notNull(),

    fee: decimal("fee", {
      precision: 30,
      scale: 10,
    })
      .notNull()
      .default("0"),

    currency: varchar("currency", { length: 3 }).notNull(),

    transactionAt: timestamp("transaction_at", {
      withTimezone: true,
    }).notNull(),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "transactions_settlement_wallet_account_fk",
      columns: [table.accountId, table.settlementWalletId],
      foreignColumns: [accountWallets.accountId, accountWallets.id],
    }).onDelete("restrict"),
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_security_id_idx").on(table.securityId),
    index("transactions_transaction_at_idx").on(table.transactionAt),
    index("transactions_settlement_wallet_id_idx").on(
      table.settlementWalletId,
    ),

    check(
      "transactions_quantity_positive",
      sql`${table.quantity} > 0`,
    ),

    check(
      "transactions_price_non_negative",
      sql`${table.price} >= 0`,
    ),

    check(
      "transactions_gross_amount_non_negative",
      sql`${table.grossAmount} >= 0`,
    ),

    check(
      "transactions_fee_non_negative",
      sql`${table.fee} >= 0`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Dividends                                                                  */
/* -------------------------------------------------------------------------- */

export const dividends = pgTable(
  "dividends",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id, {
        onDelete: "restrict",
      }),

    paidAt: date("paid_at").notNull(),

    grossAmount: decimal("gross_amount", {
      precision: 30,
      scale: 10,
    }).notNull(),

    withholdingTax: decimal("withholding_tax", {
      precision: 30,
      scale: 10,
    })
      .notNull()
      .default("0"),

    netAmount: decimal("net_amount", {
      precision: 30,
      scale: 10,
    }).notNull(),

    currency: varchar("currency", { length: 3 }).notNull(),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("dividends_account_id_idx").on(table.accountId),
    index("dividends_security_id_idx").on(table.securityId),
    index("dividends_paid_at_idx").on(table.paidAt),

    check(
      "dividends_gross_non_negative",
      sql`${table.grossAmount} >= 0`,
    ),

    check(
      "dividends_withholding_non_negative",
      sql`${table.withholdingTax} >= 0`,
    ),

    check(
      "dividends_net_non_negative",
      sql`${table.netAmount} >= 0`,
    ),

    check(
      "dividends_withholding_not_above_gross",
      sql`${table.withholdingTax} <= ${table.grossAmount}`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* FX Transactions                                                            */
/* -------------------------------------------------------------------------- */

export const fxTransactions = pgTable(
  "fx_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    fromWalletId: uuid("from_wallet_id"),

    toWalletId: uuid("to_wallet_id"),

    fromCurrency: varchar("from_currency", {
      length: 3,
    }).notNull(),

    toCurrency: varchar("to_currency", {
      length: 3,
    }).notNull(),

    amountFrom: decimal("amount_from", {
      precision: 30,
      scale: 10,
    }).notNull(),

    amountTo: decimal("amount_to", {
      precision: 30,
      scale: 10,
    }).notNull(),

    exchangeRate: decimal("exchange_rate", {
      precision: 30,
      scale: 12,
    }).notNull(),

    fee: decimal("fee", {
      precision: 30,
      scale: 10,
    })
      .notNull()
      .default("0"),

    transactionAt: timestamp("transaction_at", {
      withTimezone: true,
    }).notNull(),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "fx_transactions_from_wallet_account_fk",
      columns: [table.accountId, table.fromWalletId],
      foreignColumns: [accountWallets.accountId, accountWallets.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "fx_transactions_to_wallet_account_fk",
      columns: [table.accountId, table.toWalletId],
      foreignColumns: [accountWallets.accountId, accountWallets.id],
    }).onDelete("restrict"),
    index("fx_transactions_account_id_idx").on(table.accountId),
    index("fx_transactions_transaction_at_idx").on(table.transactionAt),
    index("fx_transactions_from_wallet_id_idx").on(table.fromWalletId),
    index("fx_transactions_to_wallet_id_idx").on(table.toWalletId),

    check(
      "fx_amount_from_positive",
      sql`${table.amountFrom} > 0`,
    ),

    check(
      "fx_amount_to_positive",
      sql`${table.amountTo} > 0`,
    ),

    check(
      "fx_exchange_rate_positive",
      sql`${table.exchangeRate} > 0`,
    ),

    check(
      "fx_fee_non_negative",
      sql`${table.fee} >= 0`,
    ),

    check(
      "fx_currencies_different",
      sql`${table.fromCurrency} <> ${table.toCurrency}`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    type: documentTypeEnum("type").notNull(),

    fileName: varchar("file_name", { length: 255 }).notNull(),

    filePath: text("file_path").notNull(),

    mimeType: varchar("mime_type", { length: 100 }),

    fileSize: integer("file_size"),

    checksumSha256: varchar("checksum_sha256", {
      length: 64,
    }),

    documentDate: date("document_date"),

    uploadedAt: timestamp("uploaded_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("documents_file_path_unique").on(table.filePath),
    uniqueIndex("documents_checksum_unique").on(table.checksumSha256),
    index("documents_account_id_idx").on(table.accountId),
    index("documents_document_date_idx").on(table.documentDate),
  ],
);

/* -------------------------------------------------------------------------- */
/* Import batches / normalized drafts                                          */
/* -------------------------------------------------------------------------- */

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    brokerId: uuid("broker_id")
      .notNull()
      .references(() => brokers.id, {
        onDelete: "restrict",
      }),

    sourceType: importSourceTypeEnum("source_type").notNull(),

    sourceDocumentId: uuid("source_document_id").references(
      () => documents.id,
      {
        onDelete: "restrict",
      },
    ),

    sourceReference: varchar("source_reference", { length: 255 }),

    parserName: varchar("parser_name", { length: 100 }),

    parserVersion: varchar("parser_version", { length: 50 }),

    importStartedAt: timestamp("import_started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    importCompletedAt: timestamp("import_completed_at", {
      withTimezone: true,
    }),

    status: importBatchStatusEnum("status").notNull().default("QUEUED"),

    statusMessage: text("status_message"),

    sourceChecksumSha256: varchar("source_checksum_sha256", {
      length: 64,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("import_batches_account_document_unique").on(
      table.accountId,
      table.sourceDocumentId,
    ),
    index("import_batches_account_id_idx").on(table.accountId),
    index("import_batches_broker_id_idx").on(table.brokerId),
    index("import_batches_status_idx").on(table.status),
  ],
);

export const normalizedDrafts = pgTable(
  "normalized_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    brokerId: uuid("broker_id")
      .notNull()
      .references(() => brokers.id, {
        onDelete: "restrict",
      }),

    batchId: uuid("batch_id")
      .notNull()
      .references(() => importBatches.id, {
        onDelete: "restrict",
      }),

    documentId: uuid("document_id").references(() => documents.id, {
      onDelete: "restrict",
    }),

    eventType: normalizedDraftTypeEnum("event_type").notNull(),

    externalId: varchar("external_id", { length: 255 }),

    sourceLocator: varchar("source_locator", { length: 255 }),

    sourcePage: integer("source_page"),

    sourceRow: integer("source_row"),

    sourceRegion: varchar("source_region", { length: 255 }),

    sourceImageRef: text("source_image_ref"),

    parserName: varchar("parser_name", { length: 100 }),

    parserVersion: varchar("parser_version", { length: 50 }),

    importedAt: timestamp("imported_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    eventAt: timestamp("event_at", {
      withTimezone: true,
    }),

    currency: varchar("currency", { length: 3 }),

    amount: decimal("amount", {
      precision: 30,
      scale: 10,
    }),

    quantity: decimal("quantity", {
      precision: 30,
      scale: 10,
    }),

    unitPrice: decimal("unit_price", {
      precision: 30,
      scale: 10,
    }),

    securitySymbol: varchar("security_symbol", { length: 32 }),

    status: normalizedDraftStatusEnum("status").notNull().default("NEEDS_REVIEW"),

    reviewReason: text("review_reason"),

    rawPayload: jsonb("raw_payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    normalizedPayload: jsonb("normalized_payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    idempotencyKey: varchar("idempotency_key", { length: 255 }),

    duplicateOfDraftId: uuid("duplicate_of_draft_id"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("normalized_drafts_account_external_unique")
      .on(table.accountId, table.externalId)
      .where(sql`${table.externalId} is not null`),
    uniqueIndex("normalized_drafts_account_document_locator_unique")
      .on(table.accountId, table.documentId, table.sourceLocator)
      .where(sql`${table.documentId} is not null AND ${table.sourceLocator} is not null`),
    uniqueIndex("normalized_drafts_idempotency_unique")
      .on(table.accountId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    index("normalized_drafts_account_id_idx").on(table.accountId),
    index("normalized_drafts_broker_id_idx").on(table.brokerId),
    index("normalized_drafts_batch_id_idx").on(table.batchId),
    index("normalized_drafts_status_idx").on(table.status),
    index("normalized_drafts_document_id_idx").on(table.documentId),
  ],
);

export const finalFinancialEvents = pgTable(
  "final_financial_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    brokerId: uuid("broker_id")
      .notNull()
      .references(() => brokers.id, {
        onDelete: "restrict",
      }),

    draftId: uuid("draft_id")
      .notNull()
      .references(() => normalizedDrafts.id, {
        onDelete: "restrict",
      }),

    eventType: normalizedDraftTypeEnum("event_type").notNull(),

    status: financialEventStatusEnum("status").notNull().default("CONFIRMED"),

    finalizedAt: timestamp("finalized_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    finalPayload: jsonb("final_payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    provenance: jsonb("provenance")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("final_financial_events_account_id_idx").on(table.accountId),
    index("final_financial_events_draft_id_idx").on(table.draftId),
    index("final_financial_events_status_idx").on(table.status),
  ],
);
