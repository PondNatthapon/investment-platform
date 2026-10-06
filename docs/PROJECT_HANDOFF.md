# Project Handoff: Investment Platform

Last updated: October 5, 2026

This document summarizes the current architecture, financial data rules, completed work, and proposed next steps so another coding agent can continue without needing the full conversation history.

## Current status

- The project uses Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, and `decimal.js`.
- It is an investment portfolio platform being prepared for Webull Thailand and Dime.
- Account authorization, currency/FX primitives, and account-base-currency position valuation are implemented.
- The Broker / Account / Wallet schema and migration have been added, but **the migration has not been applied to a database**.
- The Broker / Account / Wallet changes are uncommitted in the shared working tree as of this handoff. Always inspect `git status` before working and do not overwrite, reset, or discard those changes.
- The VOO/OKLO demo data remains. Do not delete it or treat it as real financial history.

## Collaboration protocol for the shared workspace

Claude Code and other agents may share the same checkout. Before editing:

1. Run `git status --short` and inspect the relevant diff. Treat all existing modifications, including untracked files, as intentional until confirmed otherwise.
2. Do not use `git reset`, `git checkout --`, `git clean`, or broad formatting/code-generation commands that could overwrite another agent’s work.
3. Keep work scoped to the requested checkpoint. If another task is modifying the same files, coordinate before editing them.
4. Do not modify, move, or commit broker source statements and screenshots under `data/import_sources/`.
5. Do not run a database migration until the target `DATABASE_URL` and migration effects have been reviewed. Never assume the configured database is disposable.
6. Before editing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` as required by `AGENTS.md`; this project’s Next.js version may differ from familiar APIs.
7. Report which files changed, which checks ran, and any check that could not run. Do not claim the migration is applied unless it was actually applied.

## Code structure

- `app/` — Next.js pages, route handlers, and server actions
- `src/db/schema.ts` — current database schema
- `src/db/seed.ts` — demo user, account, and VOO/OKLO transactions
- `src/lib/account/` — account lookup and authorization
- `src/lib/transaction/` — transaction validation, service, and repository
- `src/lib/portfolio/` — portfolio engine, valuation, and repository
- `src/lib/currency/` — currency code validation and normalization
- `src/lib/fx/` — FX pair/quote types, provider, and Decimal conversion
- `drizzle/` — migrations and schema snapshots
- `data/import_sources/` — broker source files; ignored by Git and must not be committed

Useful commands are in `package.json`: `npm run dev`, `npm run build`, `npm test`, `npx tsc --noEmit`, `npm run db:generate`, `npm run db:migrate`, and `npm run db:check`.

## Current and recently added data model

The approved hierarchy is:

```text
User
└── Broker
    └── Account / Product
        ├── Wallet(s)
        └── Securities (through account transactions)
```

Main schema tables are `users`, `brokers`, `accounts`, `account_wallets`, `securities`, `transactions`, `dividends`, `fx_transactions`, and `documents`.

- `brokers`: unique `code`, `displayName`, and JSON `metadata` for future adapter capabilities
- `accounts`: belongs to one user and one broker; retains base/reporting currency, product/name, `accountNumber`, active status, and `isDemo`
- `account_wallets`: belongs to an account; has `walletKey`, broker-facing label, currency, optional external reference, and active status
- Wallet key and non-null external reference are unique within an account. Currency is intentionally not unique; an account may have multiple wallets in the same currency.
- `transactions.settlementWalletId` is nullable structural preparation for identifying a future trade’s cash settlement wallet.
- `fx_transactions.fromWalletId` and `toWalletId` are nullable structural preparation for source/destination wallets.
- Composite foreign keys ensure referenced wallets belong to the same account as their trade or FX record.
- New wallet references on historical records remain null. Do not infer them from `transactions.currency` or `fx_transactions.fromCurrency/toCurrency`.

### Dime and Webull representation

Dime is a single broker, not two brokers:

```text
DIME
└── Account / Product
    ├── Dime! Save — THB wallet
    └── Dime! USD  — USD wallet
```

Represent this with two wallet rows under one Dime account, for example `walletKey=dime-save-thb`, `label=Dime! Save`, `currency=THB`, and `walletKey=dime-usd-usd`, `label=Dime! USD`, `currency=USD`. There is no real Dime account in the current seed, so no fake account or wallet rows were created.

Use the same model for Webull: one Webull account can have wallet rows for each currency supported by that account and proven by source data. Multiple wallets of the same currency are allowed. Do not create a broker or top-level account for each currency.

### Migration and demo data

- `drizzle/0001_broker_account_wallet_foundation.sql` creates brokers, migrates existing broker labels to broker rows, adds wallets, and adds nullable wallet references.
- The migration creates `DIME` and `WEBULL_TH` broker catalog entries. Other legacy broker labels receive deterministic `LEGACY_<hash>` codes to support repeatable backfill.
- The migration marks the demo account when its name, broker label, and demo user email match the existing seed. The seed script maintains `isDemo=true`.
- Existing account number/base currency and transaction/security history are not converted.
- The migration was generated and `npm run db:check` passed, but it has not been applied. Review the migration and verify the environment/backup before running `npm run db:migrate`.

## Authorization boundary to preserve

`LOCAL_USER_EMAIL` remains the local-user authentication model. The shared guard is `requireAccountAccess(userId, accountId)` in `src/lib/account/access.ts`. It rejects malformed UUIDs, missing accounts, accounts owned by another user, and inactive accounts with a safe not-found error.

Portfolio and transaction services call `requireAccountAccess` before reading or writing account data. The account repository joins `brokers` to return the display name while still filtering by user ID and active status. Any future wallet service, route, or action must authorize the account before querying wallet data and must verify the wallet belongs to the authorized account. Do not expose a repository that accepts a request-provided account ID and returns wallet data without a service authorization check.

Database composite foreign keys prevent cross-account wallet references; they do not replace user authorization.

## Currency, FX, and financial data rules

- Keep money and FX calculations in `Decimal`; convert to strings/numbers only at presentation boundaries.
- Position valuation preserves native currency/value and reports account-base-currency valuation. Same-currency conversion does not need an FX quote.
- When an FX quote is missing or invalid, preserve native values and report conversion as unavailable. Never substitute `1.0` for a missing rate.
- Actual FX transactions, market FX quotes, historical FX snapshots, and regulatory/reference rates are separate concepts and must not be substituted for one another.
- Account base currency is a reporting currency; it does not establish wallet, trade, or security currency.
- Keep THB and USD wallet balances visible separately. Aggregate only after explicit conversion with a valid valuation quote.
- A future actual internal FX event debits the source wallet and credits the destination wallet. It is not an external deposit/withdrawal and must not be counted again on top of wallet balances.
- If the source does not prove an amount, currency, rate, timestamp, balance, cost, or quantity, preserve it as UNKNOWN / UNAVAILABLE / NEEDS_RECONCILIATION. Never estimate or fabricate it.
- Portfolio and cash snapshots are reconciliation evidence; they do not automatically create transactions.

Known limitation: dashboard summary values are currently added as plain numbers and displayed with `$`, which can mix currencies. The portfolio engine is still primarily trade-based and has no cash wallet ledger or cash balances.

## Completed checkpoints

1. **Account authorization:** central `requireAccountAccess` is used by portfolio and transaction services. Tests cover own, foreign, missing, invalid, and inactive accounts.
2. **Currency/timezone design:** business rules were approved, but timezone behavior has not changed. Transaction input still constructs timestamps using a fixed `+07:00` offset; address this separately using a defined user/account timezone.
3. **FX primitives (Step 2A):** currency validation/normalization, Decimal conversion helpers, pair/quote types, provider interface, and development provider.
4. **Valuation FX (Step 2B):** native and base-currency valuation DTOs use the FX provider and report missing/invalid quotes without substituting a rate of 1.
5. **Broker / Account / Wallet foundation (Checkpoint 2):** schema and migration are added; wallet CRUD, wallet ledger, broker importers, and broker UI are not implemented.

Latest foundation checks: `npx tsc --noEmit`, `npm run db:check`, `git diff --check`, and all six test files passed. In this environment, the `npm test` wrapper hit `EPERM` while tsx created an IPC pipe; the same test files passed when run with `node --import tsx --test ...`.

## Broker sources already reviewed

Private source files are under `data/import_sources/`; do not commit them.

- **Webull:** monthly statement PDFs and CSVs from Dec 2025 through Aug 2026, a 2025 annual summary, and one withholding-tax PDF. Statements contain trades, holdings/cash snapshots, and some deposit/refund entries; the June 2026 statement contains two FX entries. The available evidence does not establish complete deposit, withdrawal, FX, or dividend history. Treat those histories as partial, not complete.
- **Dime:** five trade-confirmation PDFs and four screenshots. Screenshots show cash activity, currency exchange, one FX detail screen with an order reference, and a VOO order detail. Screenshot extraction may contain actual FX amount/rate/order ID evidence, but it requires user review and confirmation before finalization.
- Dime trade confirmations show THB equivalents calculated using a BOT reference rate. That is not an actual customer FX transaction. FX rates on Dime app exchange screens are separate evidence of actual exchanges.
- Overlapping statement, CSV, and screenshot data must be deduplicated. Some Webull CSV period labels do not match their filenames; use the statement/event content and retain source provenance.

## Proposed next checkpoints

### Checkpoint A — finish preparing the schema foundation

1. Inspect `git status` and preserve the current uncommitted changes.
2. Review the migration against the intended development database and verify its backfill before applying it. Do not run it without understanding `DATABASE_URL`.
3. Re-run account authorization tests after migration.
4. Add an account-authorized wallet query/service only when there is a caller; always call `requireAccountAccess`.

### Checkpoint B — normalized imports and provenance

1. Design common import drafts for Trade, Deposit, Withdrawal, FX, Dividend, Portfolio Snapshot, and Cash Snapshot.
2. Retain broker, account, source type/document, external order/record ID, import time, original/raw values, normalized values, and review status.
3. Support PDF, CSV, Screenshot, and Manual entry through broker-specific adapters; do not make the database depend on one file format.
4. For idempotency, use account + source document/hash + external record/order ID. Without an ID, use a deterministic content fingerprint and flag ambiguous duplicates for review.
5. Screenshot/OCR/vision output must be `NEEDS_CONFIRMATION`; require Confirm/Edit/Reject before creating finalized financial records.

### Checkpoint C — actual cash and FX ledger

1. Keep cash movements, actual FX, trades/dividends, and market valuation data distinct.
2. Actual FX records identify source and destination wallets, source/destination amount and currency, actual rate, timestamp, and provenance.
3. Link FX as a paired internal wallet debit/credit; do not count it as external funding.
4. Do not assign wallets to old rows without evidence.

### Checkpoint D — broker adapters and reconciliation

1. Build a Webull PDF/CSV parser using statements as primary evidence and CSV as a cross-check, with idempotency.
2. Build Dime trade-confirmation import and screenshot review.
3. Store cash/portfolio snapshots as reconciliation evidence.
4. Compare transaction-derived quantity/cost/cash/value with snapshots and report discrepancies. Do not silently adjust transactions.

### Checkpoint E — portfolio and UI

1. Aggregate account → broker → combined portfolio from normalized data; keep broker logic out of the portfolio engine.
2. Show wallet balances by currency and aggregate only with a valid market FX quote.
3. Build a unified dashboard, broker-specific views, transaction/history pages, and import workflows.
4. Fix dashboard currency display/mixing after the data flow and valuation model support it.

### Separate timezone work

Define a rule from the user/account timezone and update transaction date parsing/display without assuming `+07:00`. Keep this separate from wallet/import migrations.

## Final reminders

- `AGENTS.md` says this Next.js version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before changing Next.js code.
- Do not delete or disguise VOO/OKLO demo data; use `accounts.isDemo` to classify it.
- Do not manufacture financial history from snapshots, current FX quotes, BOT/reference rates, or unexplained differences.
- Preserve the account authorization boundary and Decimal precision.
- Before generating a migration, inspect the current snapshots/journal and carefully review generated SQL. Drizzle may propose renames/drops that do not preserve existing data.
