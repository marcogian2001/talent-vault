'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { applications } from '@/db/schema'

const VALID_STATUSES = ['pending', 'reviewing', 'accepted', 'rejected'] as const

export async function updateApplicationStatusAction(applicationId: string, status: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: 'Invalid status' }
  }

  await db
    .update(applications)
    .set({ status, reviewedByUserId: session.user.id })
    .where(eq(applications.id, applicationId))

  revalidatePath('/admin/applications')
  revalidatePath('/applications')

  return { success: true }
}
