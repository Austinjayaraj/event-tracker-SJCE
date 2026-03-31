import { config } from "dotenv";
config();
import { pool } from "./server/db";

async function addCols() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS pre_event_poster_path text,
      ADD COLUMN IF NOT EXISTS pre_event_guest_details text,
      ADD COLUMN IF NOT EXISTS pre_event_additional_details text,
      ADD COLUMN IF NOT EXISTS post_event_details text,
      ADD COLUMN IF NOT EXISTS post_event_winners text,
      ADD COLUMN IF NOT EXISTS post_event_students_benefited integer,
      ADD COLUMN IF NOT EXISTS post_event_photos_paths jsonb,
      ADD COLUMN IF NOT EXISTS post_event_video_path text,
      ADD COLUMN IF NOT EXISTS post_event_special_moments text;
    `);
    console.log("Added columns manually");
  } catch(e) { 
    console.error(e); 
  } finally {
    client.release();
    await pool.end();
  }
}
addCols();
