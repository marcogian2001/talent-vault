'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { acceptInviteAction } from './actions'

export default function AcceptInviteClient({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const { error: authError } =
      mode === 'register'
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password })

    if (authError) {
      setIsPending(false)
      setError(authError.message ?? 'Authentication failed')
      return
    }

    const acceptResult = await acceptInviteAction(token)
    setIsPending(false)

    if (acceptResult?.error) {
      setError(acceptResult.error)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl p-8 shadow-2xl">
      <div className="text-center space-y-2">
        <h1 className="text-xl font-medium text-white">Admin Invitation</h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'register' ? 'Create your account to accept this invite as ' : 'Sign in to accept this invite as '}
          <span className="text-primary">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Please wait...' : mode === 'register' ? 'Create Account & Accept' : 'Sign In & Accept'}
        </Button>
      </form>

      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          className="inline-block h-auto w-full p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          {mode === 'register' ? 'Already have an account? Sign in instead' : 'Need to create an account instead?'}
        </Button>
      </div>
    </Card>
  )
}
