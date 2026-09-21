'use client'

import { useState, useTransition } from 'react'
import { Archive, ArchiveRestore, Loader2, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { archiveQuestionAction, deleteQuestionAction, restoreQuestionAction } from './actions'

type Mode = 'archive' | 'delete'

interface Props {
  id: string
  label: string
  mode: Mode
  answerCount: number
}

const COPY: Record<Mode, { trigger: string; title: string; confirm: string; busy: string }> = {
  archive: {
    trigger: 'Archive',
    title: 'Archive this question?',
    confirm: 'Archive',
    busy: 'Archiving...',
  },
  delete: {
    trigger: 'Delete',
    title: 'Delete this question?',
    confirm: 'Delete',
    busy: 'Deleting...',
  },
}

/** Archive (reversible, keeps answers) and Delete (only when nothing answered it). */
export function QuestionDangerAction({ id, label, mode, answerCount }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const copy = COPY[mode]

  function handleOpenChange(next: boolean) {
    if (isPending) return
    setOpen(next)
    if (!next) setError(null)
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = mode === 'archive' ? await archiveQuestionAction(id) : await deleteQuestionAction(id)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            mode === 'delete'
              ? 'border-red-900/50 bg-transparent text-xs uppercase tracking-wider text-red-400 hover:border-red-900/70 hover:bg-red-950/40 hover:text-red-300'
              : 'bg-transparent text-xs uppercase tracking-wider text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
          }
        >
          {mode === 'delete' ? <Trash2 /> : <Archive />}
          {copy.trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-border/50 bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-light">{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{label}</span>{' '}
            {mode === 'archive' ? (
              <>
                will stop appearing in the onboarding and the chef profile. The{' '}
                {answerCount} answer{answerCount === 1 ? '' : 's'} already given{' '}
                {answerCount === 1 ? 'is' : 'are'} kept and stay visible in the chef detail page.
                You can restore it at any time.
              </>
            ) : (
              <>will be permanently removed. This cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant={mode === 'delete' ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={(e) => {
              // Keep the dialog open until the server action has finished.
              e.preventDefault()
              handleConfirm()
            }}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? copy.busy : copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function RestoreQuestionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      className="bg-transparent text-xs uppercase tracking-wider text-foreground/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      onClick={() => startTransition(async () => void (await restoreQuestionAction(id)))}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <ArchiveRestore />}
      Restore
    </Button>
  )
}
