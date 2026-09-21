'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteAdminAction } from './actions'

export default function InviteForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setIsPending(true)

    const result = await inviteAdminAction(email)

    setIsPending(false)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: `Invite sent to ${email}.` })
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Invite a new admin</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sending...' : 'Send Invite'}
        </Button>
      </div>
      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-primary'}`}>{message.text}</p>
      )}
    </form>
  )
}
