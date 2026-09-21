'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { opportunities } from '@/db/schema'
import { isBlobUrl } from '@/lib/opportunity-image'
import { opportunityFormSchema } from './schema'

async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    return null
  }
  return session
}

// Only uploads live in Blob; static /photos/* files are left alone. A failed cleanup
// just leaves an orphan behind, so it must never fail the save/delete that triggered it.
async function deleteBlobImage(imagePath: string | undefined) {
  if (!imagePath || !isBlobUrl(imagePath)) return
  try {
    await del(imagePath)
  } catch {}
}

export async function createOpportunityAction(values: unknown) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const parsed = opportunityFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  await db.insert(opportunities).values({
    id: crypto.randomUUID(),
    ...parsed.data,
    createdByUserId: session.user.id,
  })

  revalidatePath('/admin/opportunities')
  revalidatePath('/opportunities')
  redirect('/admin/opportunities')
}

export async function updateOpportunityAction(id: string, values: unknown) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const parsed = opportunityFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const [existing] = await db
    .select({ imagePath: opportunities.imagePath })
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1)

  await db.update(opportunities).set(parsed.data).where(eq(opportunities.id, id))

  if (existing && existing.imagePath !== parsed.data.imagePath) {
    await deleteBlobImage(existing.imagePath)
  }

  revalidatePath('/admin/opportunities')
  revalidatePath('/opportunities')
  redirect('/admin/opportunities')
}

export async function deleteOpportunityAction(id: string) {
  const session = await requireAdminSession()
  if (!session) return { error: 'Unauthorized' }

  const [existing] = await db
    .select({ imagePath: opportunities.imagePath })
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1)

  try {
    await db.delete(opportunities).where(eq(opportunities.id, id))
  } catch {
    return { error: 'Cannot delete: this opportunity has existing applications.' }
  }

  await deleteBlobImage(existing?.imagePath)

  revalidatePath('/admin/opportunities')
  revalidatePath('/opportunities')
  return { success: true }
}
