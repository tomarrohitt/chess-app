import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
    console.log("✅ Extension 'pg_trgm' created or already exists.");
  } catch (error) {
    console.error("❌ Failed to create extension:", error);
  } finally {
    process.exit(0);
  }
}

main();
