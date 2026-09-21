'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { upload } from '@vercel/blob/client'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  ONBOARDING_ACCEPT_ATTRIBUTE,
  ONBOARDING_MAX_LABEL,
  ONBOARDING_SERVER_UPLOAD_MAX_BYTES,
  ONBOARDING_SERVER_UPLOAD_MAX_LABEL,
  extensionFor,
  formatFileSize,
  onboardingBlobPrefix,
  validateOnboardingFile,
} from '@/lib/onboarding-upload'
import { cn } from '@/lib/utils'
import {
  attachOnboardingFileAction,
  removeOnboardingFileAction,
} from '@/app/onboarding/file-actions'

const FILE_REJECTION_KEYS = {
  type: 'fileTypeNotAllowed',
  size: 'fileTooLarge',
  empty: 'fileEmpty',
} as const

// The Blob SDK silently retries network errors with exponential backoff (10 attempts,
// ~17 minutes), so an unreachable upload service looks like a bar frozen at 0%.
// Give up when no byte has moved for this long and say so.
const UPLOAD_STALL_MS = 15_000
const SERVER_UPLOAD_TIMEOUT_MS = 60_000

class UploadStalledError extends Error {}

interface StoredFile {
  url: string
  pathname: string
}

// Flips once a direct upload has stalled, so the rest of this page visit goes straight
// through our server instead of waiting out the watchdog on every file.
let directUploadUnreachable = false

function createStallGuard(onStall: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let rejectStalled: (error: Error) => void = () => {}
  // Raced against upload(): the SDK does not cut its backoff short on abort, so its own
  // rejection can arrive tens of seconds late.
  const stalled = new Promise<never>((_, reject) => {
    rejectStalled = reject
  })

  return {
    stalled,
    // (Re)start the countdown; call it whenever the upload makes progress.
    poke() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        rejectStalled(new UploadStalledError())
        onStall()
      }, UPLOAD_STALL_MS)
    },
    clear() {
      clearTimeout(timer)
    },
  }
}

export interface UploadedFile {
  id: string
  originalName: string
  contentType: string
  size: number
}

interface Props {
  questionId: string
  userId: string
  maxFiles: number
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  onBusyChange?: (busy: boolean) => void
}

export default function FileUploadField({
  questionId,
  userId,
  maxFiles,
  files,
  onFilesChange,
  onBusyChange,
}: Props) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showPercent, setShowPercent] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const isFull = maxFiles > 1 && files.length >= maxFiles
  const single = maxFiles === 1

  function openPicker() {
    if (!isUploading) inputRef.current?.click()
  }

  // Browser -> Blob, with a token from our server. Throws UploadStalledError when nothing
  // moves for UPLOAD_STALL_MS (the SDK would otherwise retry silently for ~17 minutes).
  async function uploadDirect(file: File): Promise<StoredFile> {
    const controller = new AbortController()
    const stallGuard = createStallGuard(() => controller.abort())
    let lastLoaded = 0

    try {
      // The server validates this path before issuing a token; it cannot rewrite it.
      const pathname = `${onboardingBlobPrefix(userId, questionId)}${crypto.randomUUID()}.${extensionFor(file.type)}`

      stallGuard.poke()
      return await Promise.race([
        upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/onboarding/files/upload',
          clientPayload: JSON.stringify({ questionId }),
          contentType: file.type,
          multipart: true,
          abortSignal: controller.signal,
          onUploadProgress: ({ loaded, percentage }) => {
            setProgress(percentage)
            if (loaded > lastLoaded) {
              lastLoaded = loaded
              stallGuard.poke()
            }
          },
        }),
        stallGuard.stalled,
      ])
    } finally {
      stallGuard.clear()
    }
  }

  // Browser -> our server -> Blob, for when the browser cannot complete a direct upload.
  // No byte-level progress here, so the bar goes indeterminate.
  async function uploadViaServer(file: File): Promise<StoredFile> {
    setShowPercent(false)

    const body = new FormData()
    body.append('file', file)
    body.append('questionId', questionId)

    let res: Response
    try {
      res = await fetch('/api/onboarding/files/server-upload', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(SERVER_UPLOAD_TIMEOUT_MS),
      })
    } catch {
      throw new Error(t('uploadFailed'))
    }
    if (!res.ok) {
      throw new Error(res.status === 401 ? t('signedOutError') : t('uploadFailed'))
    }
    return (await res.json()) as StoredFile
  }

  async function uploadOne(file: File) {
    if (isUploading) return

    const rejection = validateOnboardingFile(file)
    if (rejection) {
      setError(t(FILE_REJECTION_KEYS[rejection], { max: ONBOARDING_MAX_LABEL }))
      return
    }
    if (isFull) {
      setError(t('tooManyFiles', { max: maxFiles }))
      return
    }

    setError(null)
    setIsUploading(true)
    setProgress(0)
    setShowPercent(true)
    onBusyChange?.(true)

    try {
      const fitsServerRoute = file.size <= ONBOARDING_SERVER_UPLOAD_MAX_BYTES

      let stored: StoredFile
      if (directUploadUnreachable && fitsServerRoute) {
        stored = await uploadViaServer(file)
      } else {
        try {
          stored = await uploadDirect(file)
        } catch (e) {
          if (!(e instanceof UploadStalledError)) throw e
          directUploadUnreachable = true
          // Too big for the server route: nothing left to try, say so.
          if (!fitsServerRoute) throw e
          setProgress(0)
          stored = await uploadViaServer(file)
        }
      }

      const result = await attachOnboardingFileAction(questionId, {
        url: stored.url,
        pathname: stored.pathname,
        originalName: file.name,
        contentType: file.type,
        size: file.size,
      })

      if (result.code || !('fileId' in result) || !result.fileId) {
        setError(t(result.code ?? 'fileSaveFailed', { max: maxFiles }))
        return
      }

      const uploaded: UploadedFile = {
        id: result.fileId,
        originalName: file.name,
        contentType: file.type,
        size: file.size,
      }
      onFilesChange(single ? [uploaded] : [...files, uploaded])
    } catch (e) {
      setError(
        e instanceof UploadStalledError
          ? t('uploadUnreachable', { max: ONBOARDING_SERVER_UPLOAD_MAX_LABEL })
          : e instanceof Error
            ? e.message
            : t('uploadFailed'),
      )
    } finally {
      setIsUploading(false)
      setProgress(0)
      onBusyChange?.(false)
    }
  }

  async function handleRemove(fileId: string) {
    setError(null)
    setPendingId(fileId)
    const result = await removeOnboardingFileAction(fileId)
    setPendingId(null)

    if (result.code) {
      setError(t(result.code, { max: maxFiles }))
      return
    }
    onFilesChange(files.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ONBOARDING_ACCEPT_ATTRIBUTE}
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so picking the same file again still fires a change event.
          e.target.value = ''
          if (file) void uploadOne(file)
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-3"
            >
              {file.contentType.startsWith('image/') ? (
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted/40">
                  <Image
                    src={`/api/onboarding/files/${file.id}`}
                    alt=""
                    fill
                    sizes="40px"
                    unoptimized
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <a
                  href={`/api/onboarding/files/${file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm hover:text-primary"
                  title={file.originalName}
                >
                  {file.originalName}
                </a>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('removeFile', { name: file.originalName })}
                disabled={pendingId === file.id || isUploading}
                className="text-muted-foreground hover:text-red-400"
                onClick={() => void handleRemove(file.id)}
              >
                {pendingId === file.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isFull && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!isUploading) setIsDragging(true)
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) void uploadOne(file)
          }}
          className={cn(
            'relative overflow-hidden rounded-xl border border-dashed border-border bg-background/40 transition-colors',
            isDragging && 'border-primary bg-primary/5',
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-8">
              <Loader2 className="size-5 animate-spin text-primary" />
              <div className="w-full max-w-xs">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full bg-primary transition-[width]',
                      !showPercent && 'animate-pulse',
                    )}
                    style={{ width: showPercent ? `${Math.max(progress, 5)}%` : '100%' }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {showPercent ? `${t('uploading')} ${Math.round(progress)}%` : t('uploading')}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPicker}
              className="flex w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center outline-none transition-colors hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-5" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-medium">
                  {files.length > 0 && single ? t('replaceThisFile') : t('dragAndDrop')}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t('uploadHint', { max: ONBOARDING_MAX_LABEL })}
                  {maxFiles > 1 &&
                    ` · ${t('uploadedCount', { count: files.length, max: maxFiles })}`}
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {isFull && (
        <p className="text-xs text-muted-foreground">
          {t('maxFilesReached', { max: maxFiles })}
        </p>
      )}

      <div aria-live="polite">
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
