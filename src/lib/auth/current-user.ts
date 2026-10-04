import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export async function getCurrentUser() {
  const email = process.env.LOCAL_USER_EMAIL;

  if (!email) {
    throw new Error(
      "LOCAL_USER_EMAIL is not configured.",
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(
      `Local user not found: ${email}`,
    );
  }

  return user;
}