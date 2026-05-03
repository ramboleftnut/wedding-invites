'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase'
import { createUser, getUser } from '@/lib/firestore'
import type { AppUser } from '@/types'

interface AuthContextType {
  user: User | null
  appUser: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profile = await getUser(firebaseUser.uid)
        setAppUser(profile)
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(firebaseAuth(), email, password)
  }

  async function signUp(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(firebaseAuth(), email, password)
    await createUser(cred.user.uid, email)
    const profile = await getUser(cred.user.uid)
    setAppUser(profile)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(firebaseAuth(), provider)
    const existing = await getUser(cred.user.uid)
    if (!existing) {
      await createUser(cred.user.uid, cred.user.email!)
      const profile = await getUser(cred.user.uid)
      setAppUser(profile)
    } else {
      setAppUser(existing)
    }
  }

  async function signOut() {
    await firebaseSignOut(firebaseAuth())
    setAppUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
