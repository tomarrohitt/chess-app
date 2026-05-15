import postgres from "postgres";
import "dotenv/config";
import { env } from "../config/env";
import fs from "fs";
import crypto from "crypto";

const sql = postgres(env.DATABASE_URL!);

async function main() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
    console.log("Extension 'pg_trgm' created or already exists.");

    const migrationSQL = fs.readFileSync(
      "./drizzle/0000_rainy_hedge_knight.sql",
      "utf8",
    );
    const hash = crypto.createHash("sha256").update(migrationSQL).digest("hex");

    await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${Date.now()})
    ON CONFLICT DO NOTHING
  `;

    console.log("✅ Migration marked as applied");
    await sql.end();
  } catch (error) {
    console.error("Failed to create extension:", error);
  } finally {
    process.exit(0);
  }
}

main();
