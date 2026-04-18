import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updatePassword() {
  try {
    const newPasswordHash = await hashPassword('admin123');
    await db.update(users)
      .set({ password: newPasswordHash })
      .where(eq(users.username, 'admin'));
    console.log('Admin password updated to admin123');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updatePassword();
