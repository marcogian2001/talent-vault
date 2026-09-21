'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { adminInvites } from '@/db/schema'
import { sendAdminInviteEmail } from '@/lib/email'

export async function inviteAdminAction(email: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !session.user.isSuperAdmin) {
    return { error: 'Unauthorized' }
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { error: 'Email is required' }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(adminInvites).values({
    id: crypto.randomUUID(),
    email: normalizedEmail,
    token,
    invitedByUserId: session.user.id,
    expiresAt,
  })

  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/accept-invite/${token}`

  try {
    await sendAdminInviteEmail({ to: normalizedEmail, inviteUrl, invitedByName: session.user.name })
  } catch {
    return { error: 'Invite created, but the email could not be sent. Check your Resend configuration.' }
  }

  revalidatePath('/admin/team')
  return { success: true }
}
