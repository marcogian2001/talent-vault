'use client'

import { useTransition } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { moveQuestionAction } from './actions'

export default function ReorderButtons({
  id,
  isFirst,
  isLast,
}: {
  id: string
  isFirst: boolean
  isLast: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function move(direction: 'up' | 'down') {
    startTransition(async () => {
      await moveQuestionAction(id, direction)
    })
  }

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Move question up"
        disabled={isFirst || isPending}
        onClick={() => move('up')}
      >
        <ChevronUp />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Move question down"
        disabled={isLast || isPending}
        onClick={() => move('down')}
      >
        <ChevronDown />
      </Button>
    </div>
  )
}
