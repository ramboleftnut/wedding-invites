'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, appUser, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-serif text-2xl text-rose-500 font-semibold">
            Vows & Co
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Home</Link>
            <Link href="/store" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Templates</Link>
            {user && (
              <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Dashboard</Link>
            )}
            {appUser?.role === 'admin' && (
              <Link href="/admin" className="text-sm text-rose-500 hover:text-rose-600 transition-colors font-medium">Admin</Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-stone-500">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
              </>
            ) : (
              <>
                <Link href="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href="/auth?tab=register"><Button size="sm">Get Started</Button></Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-stone-600" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-stone-100 py-3 flex flex-col gap-3">
            <Link href="/" className="text-sm text-stone-600 py-1" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/store" className="text-sm text-stone-600 py-1" onClick={() => setMobileOpen(false)}>Templates</Link>
            {user && <Link href="/dashboard" className="text-sm text-stone-600 py-1" onClick={() => setMobileOpen(false)}>Dashboard</Link>}
            {appUser?.role === 'admin' && <Link href="/admin" className="text-sm text-rose-500 py-1" onClick={() => setMobileOpen(false)}>Admin</Link>}
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start">Sign out</Button>
            ) : (
              <Link href="/auth" onClick={() => setMobileOpen(false)}><Button size="sm" className="w-full">Sign in / Register</Button></Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
