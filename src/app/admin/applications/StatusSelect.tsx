'use client'

import { useState, useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateApplicationStatusAction } from './actions'

const STATUSES = ['pending', 'reviewing', 'accepted', 'rejected']

export default function StatusSelect({ applicationId, status }: { applicationId: string; status: string }) {
  const [value, setValue] = useState(status)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string) {
    const previous = value
    setValue(next)
    setError(null)
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, next)
      if (result?.error) {
        setError(result.error)
        setValue(previous)
      }
    })
  }

  return (
    <div>
      <Select value={value} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-[140px] capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}
