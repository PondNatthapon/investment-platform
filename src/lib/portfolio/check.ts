import "dotenv/config";
import { pool } from "@/db";

import { getAccountTransactions } from "./repository";
import { calculatePositions } from "./engine";

async function main() {
  const accountId = "31e0cddc-5ef8-4c28-9c4a-8bf236bc41c7";

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
