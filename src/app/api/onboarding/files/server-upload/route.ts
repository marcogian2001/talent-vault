import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { getQuestionById } from '@/lib/onboarding'
import { isFileType } from '@/lib/onboarding-types'
import {
  ONBOARDING_SERVER_UPLOAD_MAX_BYTES,
  ONBOARDING_SERVER_UPLOAD_MAX_LABEL,
  extensionFor,
  fileRejectionMessage,
  onboardingBlobPrefix,
  validateOnboardingFile,
} from '@/lib/onboarding-upload'

/**
 * Fallback for chefs whose browser cannot finish a Blob client upload (see
 * /api/onboarding/files/upload): the file goes through this server instead. The caller
 * records it afterwards with attachOnboardingFileAction, exactly like a direct upload.
 *
 * src/proxy.ts lets /api/* through untouched, so this route gates itself.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  }

  const file = form.get('file')
  const questionId = form.get('questionId')
  if (!(file instanceof File) || typeof questionId !== 'string' || !questionId) {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  }

  const rejection = validateOnboardingFile(file)
  if (rejection) {
    return NextResponse.json({ error: fileRejectionMessage(rejection) }, { status: 400 })
  }
  if (file.size > ONBOARDING_SERVER_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `The file is too large for this upload route (max ${ONBOARDING_SERVER_UPLOAD_MAX_LABEL}).` },
      { status: 413 },
    )
  }

  const question = await getQuestionById(questionId)
  if (!question || question.status !== 'active' || !isFileType(question.type)) {
    return NextResponse.json({ error: 'This question does not accept uploads.' }, { status: 400 })
  }

  // The chef's own folder, picked here rather than by the client. The extension comes from
  // the validated MIME type, never from the user-supplied name.
  const pathname = `${onboardingBlobPrefix(session.user.id, question.id)}${crypto.randomUUID()}.${extensionFor(file.type)}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
      allowOverwrite: false,
    })
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (error) {
    console.error('[onboarding server-upload] put failed:', error)
    return NextResponse.json(
      { error: 'Upload failed. Check that BLOB_READ_WRITE_TOKEN is configured.' },
      { status: 502 },
    )
  }
}
