'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { attachFile, removeFile } from '@/lib/onboarding-answers'
import { getQuestionById } from '@/lib/onboarding'
import { isFileType } from '@/lib/onboarding-types'
import { isOwnedOnboardingPath, validateOnboardingFile } from '@/lib/onboarding-upload'
import type { OnboardingErrorCode } from '@/lib/onboarding-types'

export interface UploadedFileInput {
  url: string
  pathname: string
  originalName: string
  contentType: string
  size: number
}

const FILE_REJECTION_CODES = {
  type: 'fileTypeNotAllowed',
  size: 'fileTooLarge',
  empty: 'fileEmpty',
} as const

// Chef-facing failures are returned as codes the browser translates; the English text is
// only a fallback for anything that reads these without a dictionary.
function fail(code: OnboardingErrorCode) {
  return { code, error: code }
}

async function requireStudent() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'student') return null
  return session
}

/**
 * Records a file that the browser has already uploaded to Blob storage.
 *
 * Everything the client sends is re-checked here: the upload token route and this action
 * are two separate requests, and only the database write decides what the chef is
 * credited with.
 */
export async function attachOnboardingFileAction(questionId: string, file: UploadedFileInput) {
  const session = await requireStudent()
  if (!session) return fail('signedOutError')

  const question = await getQuestionById(questionId)
  if (!question || question.status !== 'active' || !isFileType(question.type)) {
    return fail('uploadNotAccepted')
  }

  if (!isOwnedOnboardingPath(file.pathname, session.user.id, question.id)) {
    return fail('fileNotYours')
  }

  const rejection = validateOnboardingFile({ type: file.contentType, size: file.size })
  if (rejection) return fail(FILE_REJECTION_CODES[rejection])

  const result = await attachFile(session.user.id, question, {
    url: file.url,
    pathname: file.pathname,
    originalName: file.originalName.slice(0, 200),
    contentType: file.contentType,
    size: file.size,
  })

  if (result.code) return fail(result.code)

  revalidatePath('/onboarding')
  revalidatePath('/profile')
  return { success: true, fileId: result.fileId, code: undefined }
}

export async function removeOnboardingFileAction(fileId: string) {
  const session = await requireStudent()
  if (!session) return fail('signedOutError')

  const result = await removeFile(session.user.id, fileId)
  if (result.code) return fail(result.code)

  revalidatePath('/onboarding')
  revalidatePath('/profile')
  return { success: true, code: undefined }
}
