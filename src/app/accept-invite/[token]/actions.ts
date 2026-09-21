'use server'

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { adminInvites, user } from '@/db/schema'

export async function acceptInviteAction(token: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'You must be signed in.' }

  const [invite] = await db
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.token, token))
    .limit(1)

  if (!invite) return { error: 'Invalid invite.' }
  if (invite.status !== 'pending') return { error: 'This invite has already been used or revoked.' }
  if (invite.expiresAt < new Date()) return { error: 'This invite has expired.' }
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: 'This invite was sent to a different email address.' }
  }

  await db.update(user).set({ role: 'admin' }).where(eq(user.id, session.user.id))
  await db
    .update(adminInvites)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(adminInvites.id, invite.id))

  return { success: true }
}
