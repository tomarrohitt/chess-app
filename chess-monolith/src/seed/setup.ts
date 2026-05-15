import postgres from "postgres";
import "dotenv/config";
import { env } from "../config/env";

const sql = postgres(env.DATABASE_URL!);

async function main() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
    console.log("Extension 'pg_trgm' created or already exists.");
  } catch (error) {
    console.error("Failed to create extension:", error);
  } finally {
    process.exit(0);
  }
}

main();
