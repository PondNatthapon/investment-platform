import "dotenv/config";
import { db, pool } from "@/db";

import { getAccountTransactions } from "./repository";
import { calculatePositions } from "./engine";

import { and, asc, eq } from "drizzle-orm";

import { accounts, users } from "@/db/schema";

async function main() {
  const email = process.env.LOCAL_USER_EMAIL;

  if (!email) {
    throw new Error("LOCAL_USER_EMAIL is not configured.");
  }

  const [user] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`Local user not found: ${email}`);
  }

  const [account] = await db
    .select({
      id: accounts.id,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, user.id),
        eq(accounts.isActive, true),
      ),
    )
    .orderBy(asc(accounts.name))
    .limit(1);

  if (!account) {
    throw new Error(`No active investment account found for ${email}`);
  }

  const accountId = account.id;

  const transactions = await getAccountTransactions(accountId);

  const positions = calculatePositions(transactions);

  console.log("Portfolio positions:");

  for (const position of positions) {
    console.log({
      symbol: position.symbol,
      quantity: position.quantity.toFixed(10),
      averageCost: position.averageCost.toFixed(2),
      costBasis: position.costBasis.toFixed(2),
      realizedPnl: position.realizedPnl.toFixed(2),
    });
  }
}

main()
  .catch((error) => {
    console.error("Portfolio calculation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
