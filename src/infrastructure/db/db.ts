import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";
import { env } from "../../config/env";

dotenv.config();

const connectionString = env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
