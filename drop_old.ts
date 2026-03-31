import { config } from "dotenv";
config();
import { pool } from "./server/db";

async function dropOldCols() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE events DROP COLUMN IF EXISTS pre_event_works, DROP COLUMN IF EXISTS post_event_works;');
    console.log("Dropped old columns");
  } catch(e) { 
    console.error(e); 
  } finally {
    client.release();
    await pool.end();
  }
}
dropOldCols();
