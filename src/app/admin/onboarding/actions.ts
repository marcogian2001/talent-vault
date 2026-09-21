'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { asc, count, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { onboardingAnswers, onboardingQuestions } from '@/db/schema'
import { isChoiceType } from '@/lib/onboarding-types'
import { questionFormSchema, toQuestionConfig, toQuestionOptions } from './schema'

async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    return null
  }
  return session
}

// Changing the questionnaire changes what every chef-facing page renders and who is
// allowed through the gate, so all three have to be revalidated together.
function revalidateOnboarding() {
  revalidatePath('/admin/onboarding')
  revalidatePath('/onboarding')
  revalidatePath('/profile')
  revalidatePath('/opportunities')
}

// A readable, stable slug derived from the question text. It never changes afterwards,
// so the seed script and any export keep pointing at the same question.
function uniqueKey(label: string, taken: Set<string>) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'question'

  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}_${suffix}`)) suffix += 1
  return `${base}_${suffix}`
}

async function countAnswers(questionId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.questionId, questionId))
  return Number(row?.total ?? 0)
}

export async function createQuestionAction(values: unknown) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const parsed = questionFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const existing = await db
    .select({ key: onboardingQuestions.key, sortOrder: onboardingQuestions.sortOrder })
    .from(onboardingQuestions)

  const nextOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 10

  await db.insert(onboardingQuestions).values({
    id: crypto.randomUUID(),
    key: uniqueKey(parsed.data.label, new Set(existing.map((row) => row.key))),
    type: parsed.data.type,
    label: parsed.data.label,
    helpText: parsed.data.helpText || null,
    placeholder: parsed.data.placeholder || null,
    labelIt: parsed.data.labelIt || null,
    helpTextIt: parsed.data.helpTextIt || null,
    placeholderIt: parsed.data.placeholderIt || null,
    required: parsed.data.required,
    options: toQuestionOptions(parsed.data),
    config: toQuestionConfig(parsed.data),
    sortOrder: nextOrder,
    status: 'active',
  })

  revalidateOnboarding()
  redirect('/admin/onboarding')
}

export async function updateQuestionAction(id: string, values: unknown) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const parsed = questionFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const [existing] = await db
    .select()
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.id, id))
    .limit(1)

  if (!existing) return { error: 'Question not found.' }

  const answerCount = await countAnswers(id)

  if (answerCount > 0) {
    // Stored answers carry the shape of the type they were given under: changing the
    // type, or dropping an option that is in use, would orphan them.
    if (existing.type !== parsed.data.type) {
      return {
        error: `This question already has ${answerCount} answer${answerCount > 1 ? 's' : ''}, so its type can no longer be changed. Archive it and create a new one instead.`,
      }
    }

    if (isChoiceType(existing.type)) {
      const nextValues = new Set((parsed.data.options ?? []).map((o) => o.value))
      const removed = (existing.options ?? []).filter((o) => !nextValues.has(o.value))
      if (removed.length) {
        return {
          error: `Options already chosen by chefs cannot be removed: ${removed.map((o) => o.label).join(', ')}. You can rename them instead.`,
        }
      }
    }
  }

  await db
    .update(onboardingQuestions)
    .set({
      type: parsed.data.type,
      label: parsed.data.label,
      helpText: parsed.data.helpText || null,
      placeholder: parsed.data.placeholder || null,
      labelIt: parsed.data.labelIt || null,
      helpTextIt: parsed.data.helpTextIt || null,
      placeholderIt: parsed.data.placeholderIt || null,
      required: parsed.data.required,
      options: toQuestionOptions(parsed.data),
      config: toQuestionConfig(parsed.data),
      updatedAt: new Date(),
    })
    .where(eq(onboardingQuestions.id, id))

  revalidateOnboarding()
  redirect('/admin/onboarding')
}

export async function archiveQuestionAction(id: string) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  await db
    .update(onboardingQuestions)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(onboardingQuestions.id, id))

  revalidateOnboarding()
  return { success: true }
}

export async function restoreQuestionAction(id: string) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const active = await db
    .select({ sortOrder: onboardingQuestions.sortOrder })
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.status, 'active'))

  const nextOrder = active.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 10

  await db
    .update(onboardingQuestions)
    .set({ status: 'active', sortOrder: nextOrder, updatedAt: new Date() })
    .where(eq(onboardingQuestions.id, id))

  revalidateOnboarding()
  return { success: true }
}

export async function deleteQuestionAction(id: string) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const answerCount = await countAnswers(id)
  if (answerCount > 0) {
    return {
      error: `This question has ${answerCount} answer${answerCount > 1 ? 's' : ''}. Archive it instead — archived questions stop blocking chefs but keep their answers.`,
    }
  }

  await db.delete(onboardingQuestions).where(eq(onboardingQuestions.id, id))

  revalidateOnboarding()
  return { success: true }
}

export async function moveQuestionAction(id: string, direction: 'up' | 'down') {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const active = await db
    .select({ id: onboardingQuestions.id, sortOrder: onboardingQuestions.sortOrder })
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.status, 'active'))
    .orderBy(asc(onboardingQuestions.sortOrder), asc(onboardingQuestions.createdAt), asc(onboardingQuestions.id))

  const index = active.findIndex((q) => q.id === id)
  if (index === -1) return { error: 'Question not found.' }

  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= active.length) return { success: true }

  const reordered = [...active]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  // Renumbering every row (rather than swapping two values) keeps the sequence free of
  // duplicates and makes two admins reordering at once converge on a sane order.
  const updates = reordered.map((question, position) =>
    db
      .update(onboardingQuestions)
      .set({ sortOrder: (position + 1) * 10 })
      .where(eq(onboardingQuestions.id, question.id)),
  )

  if (updates.length) {
    // neon-http has no transactions; batch is the closest atomic primitive it offers.
    await db.batch(updates as [(typeof updates)[number], ...typeof updates])
  }

  revalidateOnboarding()
  return { success: true }
}
