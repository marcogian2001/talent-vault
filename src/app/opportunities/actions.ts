'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { applications } from '@/db/schema'
import { getChefStage } from '@/lib/onboarding'

export async function submitApplicationAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { error: 'You must be signed in to apply.' }
  }

  // Re-checked here and not only at the gate: an admin can add a required question, or
  // withdraw an approval, while a chef still has an opportunities page open. A chef awaiting
  // review could also call this action directly, so the page gate alone is not enough.
  if (session.user.role === 'student') {
    const { stage } = await getChefStage(session.user.id)
    if (stage === 'incomplete') {
      return { error: 'Complete your chef profile before applying.' }
    }
    if (stage !== 'approved') {
      return { error: 'Your application must be approved before you can apply.' }
    }
  }

  const opportunityId = formData.get('opportunityId') as string | null
  const type = formData.get('type') as string | null
  const name = formData.get('name') as string | null
  const email = formData.get('email') as string | null
  const phone = (formData.get('phone') as string | null) || null
  const notes = (formData.get('notes') as string | null) || null
  const proposedCompensation = (formData.get('proposedCompensation') as string | null) || null
  const availabilityWindow = (formData.get('availabilityWindow') as string | null) || null

  if (!opportunityId || !type || !name || !email) {
    return { error: 'Please fill in all required fields.' }
  }

  await db.insert(applications).values({
    id: crypto.randomUUID(),
    opportunityId,
    studentUserId: session.user.id,
    type,
    name,
    email,
    phone,
    notes,
    proposedCompensation,
    availabilityWindow,
    status: 'pending',
  })

  revalidatePath('/applications')
  revalidatePath('/admin/applications')

  return { success: true }
}
