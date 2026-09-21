import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query<{
      version: string;
      current_database: string;
    }>(`
      SELECT
        version(),
        current_database();
    `);

    console.log("Database connection successful.");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
