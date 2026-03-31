import { config } from "dotenv";
config();
import { pool } from "./server/db";

async function fix() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE events ALTER COLUMN "date" TYPE timestamp USING "date"::timestamp;');
    console.log("Fixed date column");
  } catch(e) { 
    console.error(e); 
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
