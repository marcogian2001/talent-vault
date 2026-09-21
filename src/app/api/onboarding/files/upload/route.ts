import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { onboardingQuestions } from '@/db/schema'
import { isFileType } from '@/lib/onboarding-types'
import {
  ONBOARDING_ACCEPTED_TYPES,
  ONBOARDING_MAX_BYTES,
  isOwnedOnboardingPath,
} from '@/lib/onboarding-upload'

/**
 * Issues a short-lived client-upload token. Chef documents go straight from the browser
 * to Blob storage: a CV or a passport scan easily exceeds the 4.5 MB request-body cap
 * that limits the admin image route.
 *
 * src/proxy.ts lets /api/* through untouched, so this route gates itself.
 */
export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // handleUpload checks its own configuration before it ever calls
  // onBeforeGenerateToken, so an anonymous caller would otherwise get a 400 describing
  // the server's env. Answer the token request only for a signed-in chef.
  // The blob.upload-completed callback carries no session — handleUpload verifies that
  // one itself — so it is left to fall through.
  if (body.type === 'blob.generate-client-token') {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Uploads are not configured. Check that BLOB_READ_WRITE_TOKEN is set.' },
        { status: 500 },
      )
    }
  }

  try {
    const result = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session || session.user.role !== 'student') {
          throw new Error('Unauthorized')
        }

        let questionId: unknown
        try {
          questionId = JSON.parse(clientPayload ?? '{}')?.questionId
        } catch {
          throw new Error('Invalid upload payload')
        }
        if (typeof questionId !== 'string' || !questionId) {
          throw new Error('Invalid upload payload')
        }

        const [question] = await db
          .select({
            id: onboardingQuestions.id,
            type: onboardingQuestions.type,
            status: onboardingQuestions.status,
          })
          .from(onboardingQuestions)
          .where(eq(onboardingQuestions.id, questionId))
          .limit(1)

        if (!question || question.status !== 'active' || !isFileType(question.type)) {
          throw new Error('This question does not accept uploads')
        }

        // handleUpload cannot rewrite the pathname — the client picks it and the server
        // can only accept or reject. Without this check a chef could write into another
        // chef's folder, or overwrite an opportunity image.
        if (!isOwnedOnboardingPath(pathname, session.user.id, question.id)) {
          throw new Error('Forbidden upload path')
        }

        return {
          allowedContentTypes: Object.keys(ONBOARDING_ACCEPTED_TYPES),
          maximumSizeInBytes: ONBOARDING_MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ userId: session.user.id, questionId: question.id }),
        }
      },
      onUploadCompleted: async () => {
        // Deliberately empty: this webhook never fires on localhost, so the answer row is
        // written by attachOnboardingFileAction once upload() resolves in the browser.
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload could not be authorized.'
    const status = message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
