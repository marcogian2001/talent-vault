'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { resubmitChef } from '@/lib/chef-review'
import { getActiveQuestions, getChefStage } from '@/lib/onboarding'
import { clearAnswer, saveAnswer } from '@/lib/onboarding-answers'
import { buildAnswerSchema } from '@/lib/onboarding-schema'
import { isFileType, type AnswerValue } from '@/lib/onboarding-types'

export async function updateProfileAnswersAction(values: Record<string, AnswerValue | null>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'student') {
    return { error: 'You must be signed in as a chef.' }
  }

  // Questions are re-read here: the form may have been open while an admin edited them.
  const questions = await getActiveQuestions()

  for (const question of questions) {
    if (isFileType(question.type)) continue
    if (!(question.id in values)) continue

    const next = values[question.id] ?? null

    if (next === null) {
      if (question.required) {
        return { error: `"${question.label}" is required and cannot be left empty.` }
      }
      await clearAnswer(session.user.id, question.id)
      continue
    }

    const parsed = buildAnswerSchema(question).safeParse(next)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? `Invalid answer for "${question.label}"` }
    }

    const result = await saveAnswer(session.user.id, question, next)
    if (result.error) return { error: result.error }
  }

  revalidatePath('/profile')
  revalidatePath('/opportunities')
  return { success: true }
}

/** Sends a rejected application back to the admins once the chef has fixed what was asked. */
export async function resubmitApplicationAction() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'student') {
    return { error: 'You must be signed in as a chef.' }
  }

  const { stage } = await getChefStage(session.user.id)
  if (stage === 'incomplete') {
    return { error: 'Answer every required question before sending your application again.' }
  }
  if (stage !== 'rejected') {
    return { error: 'Your application is not waiting for changes.' }
  }

  await resubmitChef(session.user.id)

  revalidatePath('/profile')
  revalidatePath('/review')
  revalidatePath('/admin')
  revalidatePath('/admin/chefs')
  revalidatePath(`/admin/chefs/${session.user.id}`)
  return { success: true }
}
