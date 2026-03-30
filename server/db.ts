import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Log connection status
pool.connect()
  .then(client => {
    console.log("[Postgres] Connected successfully.");
    client.release();
  })
  .catch(err => {
    console.error("[Postgres] Connection error:", err);
    console.error("[Postgres] Connection error details:", {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  });

export const db = drizzle(pool, { schema });