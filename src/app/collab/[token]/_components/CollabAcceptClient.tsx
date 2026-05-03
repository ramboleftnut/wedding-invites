'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type { WeddingEvent, EventInvite } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  invite: EventInvite
  event: WeddingEvent
  ownerEmail: string
}

export default function CollabAcceptClient({ invite, event, ownerEmail }: Props) {
  const { user, loading, signIn, signUp } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState(invite.email)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [locallyAccepted, setLocallyAccepted] = useState(false)

  const alreadyMember = !!user && !!event.members?.[user.uid]
  const isRevoked = invite.status === 'revoked'
  const isAccepted = invite.status === 'accepted'
  const accepted = locallyAccepted || alreadyMember

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleAccept() {
    if (!user) return
    setError('')
    setBusy(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/collab/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token: invite.token }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to accept invite')
      }
      setLocallyAccepted(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    )
  }

  const eventTitle =
    event.data.brideName && event.data.groomName
      ? `${event.data.brideName} & ${event.data.groomName}`
      : 'a wedding event'

  const sideLabel = invite.side === 'both' ? 'both sides' : `the ${invite.side}'s side`
  const roleLabel = invite.role === 'admin' ? 'admin' : 'editor'

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="font-serif text-2xl text-stone-800 mb-1">{"You're invited to help plan"}</h1>
          <p className="text-stone-500 text-sm">
            {ownerEmail && <span className="font-medium">{ownerEmail}</span>}
            {ownerEmail ? ' invited you to ' : "You've been invited to "}
            <span className="font-medium text-stone-700">{eventTitle}</span>
          </p>
          <p className="text-xs text-stone-400 mt-3">
            Role: <span className="font-medium text-stone-600">{roleLabel}</span>
            {' • '}Scope: <span className="font-medium text-stone-600">{sideLabel}</span>
            {invite.canViewBothSides && invite.side !== 'both' && ' (can view the other side)'}
          </p>
        </div>

        {isRevoked && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-sm text-red-700">
            This invite has been revoked.
          </div>
        )}

        {!isRevoked && accepted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700 font-medium">{"You're in!"}</p>
            <p className="text-xs text-green-600 mt-1">Redirecting to your dashboard…</p>
          </div>
        )}

        {!isRevoked && !accepted && !user && (
          <>
            <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-5">
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'signup' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'
                }`}
              >
                Create account
              </button>
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'signin' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'
                }`}
              >
                Sign in
              </button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={busy} className="w-full">
                {mode === 'signup' ? 'Create account & continue' : 'Sign in & continue'}
              </Button>
            </form>
          </>
        )}

        {!isRevoked && !accepted && user && !alreadyMember && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 text-center">
              Signed in as <span className="font-medium">{user.email}</span>.
            </p>
            {isAccepted && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                This invite was already accepted by another account, but you can still join this event.
              </p>
            )}
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button onClick={handleAccept} loading={busy} className="w-full">
              Accept invitation
            </Button>
            <Link href="/dashboard" className="block text-center text-xs text-stone-400 hover:text-stone-600">
              Cancel
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
