'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  IMAGE_ACCEPTED_TYPES,
  IMAGE_MAX_LABEL,
  validateImageFile,
} from '@/lib/opportunity-image'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (url: string) => void
  onBusyChange?: (busy: boolean) => void
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

// Local preview of a file picked in this session, shown right away and kept afterwards
// so the freshly uploaded image doesn't have to be fetched back from the CDN.
interface PickedFile {
  previewUrl: string
  name: string
  size: number
}

const ACCEPT = Object.keys(IMAGE_ACCEPTED_TYPES).join(',')

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUploadField({
  value,
  onChange,
  onBusyChange,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<PickedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  // Object URLs aren't garbage collected until revoked.
  useEffect(() => {
    return () => {
      if (picked) URL.revokeObjectURL(picked.previewUrl)
    }
  }, [picked])

  const src = picked?.previewUrl ?? value
  const caption = picked
    ? `${picked.name} · ${formatSize(picked.size)}`
    : value.startsWith('/')
      ? value
      : null

  function openPicker() {
    if (!isUploading) inputRef.current?.click()
  }

  async function uploadFile(file: File) {
    if (isUploading) return

    const invalid = validateImageFile(file)
    if (invalid) {
      setError(invalid)
      return
    }

    setError(null)
    setPicked({ previewUrl: URL.createObjectURL(file), name: file.name, size: file.size })
    setIsUploading(true)
    onBusyChange?.(true)

    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/opportunities/image', { method: 'POST', body })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'Upload failed. Please try again.')
      }
      onChange(data.url)
    } catch (e) {
      // Nothing was committed to the form, so falling back to the previous value is safe.
      setPicked(null)
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      onBusyChange?.(false)
    }
  }

  function handleRemove() {
    setPicked(null)
    setError(null)
    onChange('')
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        className="sr-only"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so picking the same file again still fires a change event.
          e.target.value = ''
          if (file) void uploadFile(file)
        }}
      />

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
          if (file) void uploadFile(file)
        }}
        className={cn(
          'relative aspect-[16/10] w-full overflow-hidden rounded-xl border transition-colors',
          src ? 'border-border/50 bg-muted/30' : 'border-dashed border-border bg-background/40',
          ariaInvalid && !src && 'border-destructive/60',
          isDragging && 'border-primary bg-primary/5',
        )}
      >
        {src ? (
          <>
            {failedSrc === src ? (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
                Preview unavailable — the file could not be loaded.
              </div>
            ) : (
              <Image
                src={src}
                alt="Opportunity cover preview"
                fill
                sizes="(min-width: 1024px) 380px, 100vw"
                unoptimized={src.startsWith('blob:')}
                className="object-cover"
                onError={() => setFailedSrc(src)}
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/80 to-transparent" />

            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/60 text-sm backdrop-blur-[2px]">
                <Loader2 className="size-4 animate-spin text-primary" />
                Uploading…
              </div>
            ) : (
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-background/70 backdrop-blur-md"
                  onClick={openPicker}
                >
                  <RefreshCw />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-red-900/50 bg-background/70 text-red-400 backdrop-blur-md hover:border-red-900/70 hover:bg-red-950/40 hover:text-red-300"
                  onClick={handleRemove}
                >
                  <Trash2 />
                  Remove
                </Button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            aria-label="Upload an image"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl px-6 text-center outline-none transition-colors hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImagePlus className="size-5" />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-medium">Drag &amp; drop or click to upload</span>
              <span className="block text-xs text-muted-foreground">
                JPG, PNG or WebP · max {IMAGE_MAX_LABEL}
              </span>
            </span>
          </button>
        )}
      </div>

      {caption && (
        <p className="truncate text-xs text-muted-foreground" title={caption}>
          {caption}
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
