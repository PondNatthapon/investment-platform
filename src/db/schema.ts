import {
  boolean,
  check,
  date,
  decimal,
  index,
  integer,
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

    broker: varchar("broker", { length: 100 }).notNull(),

    accountType: accountTypeEnum("account_type")
      .notNull()
      .default("BROKERAGE"),

    baseCurrency: varchar("base_currency", { length: 3 }).notNull(),

    accountNumber: varchar("account_number", { length: 100 }),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
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
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_security_id_idx").on(table.securityId),
    index("transactions_transaction_at_idx").on(table.transactionAt),

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
    index("fx_transactions_account_id_idx").on(table.accountId),
    index("fx_transactions_transaction_at_idx").on(table.transactionAt),

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
