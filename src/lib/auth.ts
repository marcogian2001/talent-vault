import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'student', input: false },
      isSuperAdmin: { type: 'boolean', required: false, defaultValue: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Runs on every sign-up: bootstrap super admins from env immediately.
        before: async (userData) => {
          const email = String(userData.email).toLowerCase();
          if (SUPER_ADMIN_EMAILS.includes(email)) {
            return { data: { ...userData, role: 'admin', isSuperAdmin: true } };
          }
        },
      },
    },
    session: {
      create: {
        // Runs on every sign-in: promotes an existing account if its email
        // was added to SUPER_ADMIN_EMAILS after it had already registered.
        before: async (sessionData) => {
          const [existingUser] = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, sessionData.userId))
            .limit(1);

          if (!existingUser) return;

          const email = existingUser.email.toLowerCase();
          const shouldBeSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
          if (shouldBeSuperAdmin && (existingUser.role !== 'admin' || !existingUser.isSuperAdmin)) {
            await db
              .update(schema.user)
              .set({ role: 'admin', isSuperAdmin: true })
              .where(eq(schema.user.id, existingUser.id));
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
