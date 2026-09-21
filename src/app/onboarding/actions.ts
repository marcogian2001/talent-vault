'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { getOnboardingStatus, getQuestionById } from '@/lib/onboarding'
import { saveAnswer } from '@/lib/onboarding-answers'

async function requireStudent() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'student') return null
  return session
}

/**
 * Saves a single step. Validation is rebuilt from the stored question row, so a client
 * that lies about the type, the options or whether the question is required gets nowhere.
 */
export async function saveOnboardingAnswerAction(questionId: string, rawValue: unknown) {
  const session = await requireStudent()
  if (!session) return { code: 'signedOutError' as const, error: undefined }

  const question = await getQuestionById(questionId)
  if (!question || question.status !== 'active') {
    return { code: 'questionRemoved' as const, error: undefined }
  }

  // The browser has already validated with translated messages; anything that fails here
  // is a stale page or a tampered payload, so the English text is good enough.
  const result = await saveAnswer(session.user.id, question, rawValue)
  if (result.error) return { code: undefined, error: result.error }

  return { code: undefined, error: undefined }
}

/** Final check before the chef is let through to the opportunities. */
export async function completeOnboardingAction() {
  const session = await requireStudent()
  if (!session) return { error: 'You must be signed in as a chef.' }

  const status = await getOnboardingStatus(session.user.id)
  if (!status.isComplete) {
    return {
      error: `Still missing: ${status.missing.map((q) => q.label).join(', ')}`,
      missingIds: status.missing.map((q) => q.id),
    }
  }

  revalidatePath('/opportunities')
  revalidatePath('/profile')
  return { success: true }
}
