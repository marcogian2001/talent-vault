'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, X } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { ChefStage } from '@/lib/chef-review'
import StageBadge from '../StageBadge'
import { approveChefAction, rejectChefAction } from './actions'

const REASON_MAX = 1500

export interface ReviewQuestion {
  id: string
  label: string
}

interface Props {
  chefId: string
  chefName: string
  stage: ChefStage
  reason: string | null
  /** Labels of the questions flagged by the last rejection. */
  flaggedLabels: string[]
  /** Already formatted by the page: a locale-dependent format would not hydrate cleanly here. */
  reviewedAt: string | null
  resubmittedAt: string | null
  questions: ReviewQuestion[]
}

export default function ReviewPanel({
  chefId,
  chefName,
  stage,
  reason,
  flaggedLabels,
  reviewedAt,
  resubmittedAt,
  questions,
}: Props) {
  const [notice, setNotice] = useState<string | null>(null)

  const showLastRejection = Boolean(reason) && (stage === 'rejected' || stage === 'pending')

  return (
    <Card className="gap-5 rounded-2xl border-border/50 bg-card/20 py-6 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm font-medium tracking-wide">Application review</CardTitle>
          <StageBadge stage={stage} />
        </div>

        {stage !== 'incomplete' && (
          <div className="flex items-center gap-2">
            {stage !== 'rejected' && (
              <RejectDialog chefId={chefId} chefName={chefName} questions={questions} onDone={setNotice} />
            )}
            {stage !== 'approved' && (
              <ApproveDialog chefId={chefId} chefName={chefName} onDone={setNotice} />
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {stage === 'incomplete' &&
            'The chef has not finished the questionnaire yet, so there is nothing to review.'}
          {stage === 'pending' &&
            (resubmittedAt
              ? `Sent again on ${resubmittedAt} after a rejection. Check what changed against the note below.`
              : 'Waiting for your decision. The chef sees an “under review” screen until then.')}
          {stage === 'approved' &&
            `Approved${reviewedAt ? ` on ${reviewedAt}` : ''}. The chef can browse and apply to opportunities.`}
          {stage === 'rejected' &&
            `Rejected${reviewedAt ? ` on ${reviewedAt}` : ''}. Waiting for the chef to fix the points below and send the application again.`}
        </p>

        {showLastRejection && (
          <div className="space-y-3 rounded-xl border border-border/50 bg-background/40 p-4">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Note sent to the chef
              </p>
              <p className="whitespace-pre-line text-sm text-foreground/90">{reason}</p>
            </div>
            {flaggedLabels.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Flagged questions
                </p>
                <ul className="list-inside list-disc text-sm text-foreground/90">
                  {flaggedLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function ApproveDialog({
  chefId,
  chefName,
  onDone,
}: {
  chefId: string
  chefName: string
  onDone: (notice: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    if (isPending) return
    setOpen(next)
    if (!next) setError(null)
  }

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveChefAction(chefId)
      if (result?.error) {
        setError(result.error)
        return
      }
      onDone(
        result.emailSent ? null : 'Approved, but the notification email could not be sent.',
      )
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="text-xs uppercase tracking-wider">
          <Check />
          Approve
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-border/50 bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-light">Approve this application?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{chefName}</span> will be able to browse
            the opportunities and apply, and will get an email.
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
            disabled={isPending}
            onClick={(e) => {
              // Keep the dialog open until the server action has finished.
              e.preventDefault()
              handleApprove()
            }}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Approving...' : 'Approve'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RejectDialog({
  chefId,
  chefName,
  questions,
  onDone,
}: {
  chefId: string
  chefName: string
  questions: ReviewQuestion[]
  onDone: (notice: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    if (isPending) return
    setOpen(next)
    if (!next) {
      setError(null)
      setReason('')
      setFlagged(new Set())
    }
  }

  function toggle(questionId: string, checked: boolean) {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (checked) next.add(questionId)
      else next.delete(questionId)
      return next
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectChefAction(chefId, reason, [...flagged])
      if (result?.error) {
        setError(result.error)
        return
      }
      onDone(
        result.emailSent ? null : 'Rejected, but the notification email could not be sent.',
      )
      handleOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-red-900/50 bg-transparent text-xs uppercase tracking-wider text-red-400 hover:border-red-900/70 hover:bg-red-950/40 hover:text-red-300"
        >
          <X />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border/50 bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light">Reject this application?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{chefName}</span> will see your note,
            can correct their answers and documents, and send the application again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="rejection-reason" className="text-sm font-medium">
            What needs to change?
          </label>
          <Textarea
            id="rejection-reason"
            value={reason}
            maxLength={REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. The passport scan is not readable. Please upload a clearer photo of the photo page."
            className="min-h-28"
          />
          <p className="text-right text-xs text-muted-foreground">
            {reason.length}/{REASON_MAX}
          </p>
        </div>

        {questions.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Questions to correct <span className="text-muted-foreground">(optional)</span>
            </legend>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/50 p-2">
              {questions.map((question) => (
                <label
                  key={question.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/30"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={flagged.has(question.id)}
                    onCheckedChange={(checked) => toggle(question.id, checked === true)}
                  />
                  <span>{question.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isPending}
              className="hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={handleReject}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
