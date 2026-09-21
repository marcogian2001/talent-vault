'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { user } from '@/db/schema'
import { approveChef, rejectChef } from '@/lib/chef-review'
import { sendChefReviewEmail } from '@/lib/email'
import { getActiveQuestions, getOnboardingStatus } from '@/lib/onboarding'

const rejectionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Explain what the chef needs to fix (at least 10 characters).')
    .max(1500, 'The note must be at most 1500 characters.'),
  questionIds: z.array(z.string()).max(200),
})

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') return null
  return session
}

/** The chef must exist and have finished the questionnaire: there is nothing to judge before that. */
async function loadReviewableChef(chefId: string) {
  const [chef] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, chefId))
    .limit(1)

  if (!chef || chef.role !== 'student') return { error: 'Chef not found.' as const }

  const status = await getOnboardingStatus(chef.id)
  if (!status.isComplete) {
    return { error: 'This chef has not finished the questionnaire yet.' as const }
  }

  return { chef }
}

function revalidateReview(chefId: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/chefs')
  revalidatePath(`/admin/chefs/${chefId}`)
}

export async function approveChefAction(chefId: string) {
  const session = await requireAdmin()
  if (!session) return { error: 'Unauthorized' }

  const loaded = await loadReviewableChef(chefId)
  if ('error' in loaded) return { error: loaded.error }

  await approveChef(chefId, session.user.id)

  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  const emailSent = await sendChefReviewEmail({
    to: loaded.chef.email,
    name: loaded.chef.name,
    outcome: 'approved',
    url: `${baseUrl}/opportunities`,
  })

  revalidateReview(chefId)
  return { success: true, emailSent }
}

export async function rejectChefAction(chefId: string, reason: string, questionIds: string[]) {
  const session = await requireAdmin()
  if (!session) return { error: 'Unauthorized' }

  const parsed = rejectionSchema.safeParse({ reason, questionIds })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid rejection.' }
  }

  const loaded = await loadReviewableChef(chefId)
  if ('error' in loaded) return { error: loaded.error }

  // Only questions the chef can actually see and answer can be pointed at.
  const activeIds = new Set((await getActiveQuestions()).map((question) => question.id))
  const flagged = [...new Set(parsed.data.questionIds)].filter((id) => activeIds.has(id))

  await rejectChef(chefId, session.user.id, parsed.data.reason, flagged)

  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  const emailSent = await sendChefReviewEmail({
    to: loaded.chef.email,
    name: loaded.chef.name,
    outcome: 'rejected',
    reason: parsed.data.reason,
    url: `${baseUrl}/profile`,
  })

  revalidateReview(chefId)
  return { success: true, emailSent }
}
