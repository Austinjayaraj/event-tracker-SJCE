import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function check() {
  const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
  console.log('Admin Users:', adminUsers);
  process.exit(0);
}

check().catch(console.error);
