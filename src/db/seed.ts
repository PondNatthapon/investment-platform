import "dotenv/config";
import { and, eq } from "drizzle-orm";

import { db, pool } from "./index";
import {
  accounts,
  brokers,
  securities,
  transactions,
  users,
} from "./schema";

async function main() {
  console.log("🌱 Starting database seed...");

  // -------------------------------------------------------------------------
  // User
  // -------------------------------------------------------------------------

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, "demo@investment.local"))
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: "Pond Demo",
        email: "demo@investment.local",
        timezone: "Asia/Bangkok",
      })
      .returning();
  }

  // -------------------------------------------------------------------------
  // Account
  // -------------------------------------------------------------------------

  let [demoBroker] = await db
    .select()
    .from(brokers)
    .where(eq(brokers.code, "DEMO"))
    .limit(1);

  if (!demoBroker) {
    [demoBroker] = await db
      .insert(brokers)
      .values({
        code: "DEMO",
        displayName: "Demo Broker",
        metadata: { adapter: null, isDemo: true },
      })
      .returning();
  }

  let [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, user.id),
        eq(accounts.name, "Demo Brokerage"),
      ),
    )
    .limit(1);

  if (!account) {
    [account] = await db
      .insert(accounts)
      .values({
        userId: user.id,
        name: "Demo Brokerage",
        brokerId: demoBroker.id,
        accountType: "BROKERAGE",
        baseCurrency: "USD",
        isDemo: true,
      })
      .returning();
  } else if (!account.isDemo || account.brokerId !== demoBroker.id) {
    [account] = await db
      .update(accounts)
      .set({ brokerId: demoBroker.id, isDemo: true })
      .where(eq(accounts.id, account.id))
      .returning();
  }

  // -------------------------------------------------------------------------
  // Securities
  // -------------------------------------------------------------------------

  let [voo] = await db
    .select()
    .from(securities)
    .where(
      and(
        eq(securities.symbol, "VOO"),
        eq(securities.exchange, "NYSE ARCA"),
      ),
    )
    .limit(1);

  if (!voo) {
    [voo] = await db
      .insert(securities)
      .values({
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        assetClass: "ETF",
        exchange: "NYSE ARCA",
        currency: "USD",
      })
      .returning();
  }

  let [oklo] = await db
    .select()
    .from(securities)
    .where(
      and(
        eq(securities.symbol, "OKLO"),
        eq(securities.exchange, "NASDAQ"),
      ),
    )
    .limit(1);

  if (!oklo) {
    [oklo] = await db
      .insert(securities)
      .values({
        symbol: "OKLO",
        name: "Oklo Inc.",
        assetClass: "STOCK",
        exchange: "NASDAQ",
        currency: "USD",
      })
      .returning();
  }

  // -------------------------------------------------------------------------
  // Transactions
  // -------------------------------------------------------------------------

  const transactionDate = new Date("2026-09-20T03:00:00.000Z");

  const existingTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, account.id),
        eq(transactions.transactionAt, transactionDate),
      ),
    );

  if (existingTransactions.length === 0) {
    await db.insert(transactions).values([
      {
        accountId: account.id,
        securityId: voo.id,
        type: "BUY",
        quantity: "2",
        price: "500",
        grossAmount: "1000",
        fee: "1",
        currency: "USD",
        transactionAt: transactionDate,
        notes: "Demo seed transaction",
      },
      {
        accountId: account.id,
        securityId: oklo.id,
        type: "BUY",
        quantity: "5",
        price: "40",
        grossAmount: "200",
        fee: "1",
        currency: "USD",
        transactionAt: transactionDate,
        notes: "Demo seed transaction",
      },
    ]);
  }

  console.log("✅ Seed completed");
  console.log({
    userId: user.id,
    accountId: account.id,
    securities: {
      voo: voo.id,
      oklo: oklo.id,
    },
  });
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
