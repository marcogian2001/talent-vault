import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { onboardingAnswerFiles, onboardingAnswers } from '@/db/schema'

/**
 * Serves a chef document to its owner or to an admin.
 *
 * Blob URLs are unguessable but unauthenticated: a leaked link to a passport scan would
 * stay valid forever. The raw URL is therefore never rendered — the file is streamed
 * through here instead.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [row] = await db
    .select({
      url: onboardingAnswerFiles.url,
      originalName: onboardingAnswerFiles.originalName,
      contentType: onboardingAnswerFiles.contentType,
      ownerId: onboardingAnswers.userId,
    })
    .from(onboardingAnswerFiles)
    .innerJoin(onboardingAnswers, eq(onboardingAnswerFiles.answerId, onboardingAnswers.id))
    .where(eq(onboardingAnswerFiles.id, id))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isOwner = row.ownerId === session.user.id
  if (!isOwner && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const upstream = await fetch(row.url)
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'The file could not be retrieved.' }, { status: 502 })
  }

  // Quoted and escaped: original names come from the chef's own filesystem.
  const filename = row.originalName.replace(/["\\]/g, '')

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': row.contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
