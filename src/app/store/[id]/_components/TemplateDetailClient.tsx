'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Template } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { generateSlug, createEvent, orderExistsForTemplate } from '@/lib/firestore'

export default function TemplateDetailClient({ template }: { template: Template }) {
  const { user, appUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = appUser?.role === 'admin'

  async function handlePurchase() {
    if (!user) {
      router.push('/auth')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (template.price === 0 || template.isFree || isAdmin) {
        // Free template or admin bypass — skip Stripe, create event directly
        const alreadyOwns = await orderExistsForTemplate(user.uid, template.id)
        if (alreadyOwns) {
          router.push('/dashboard')
          return
        }

        const slug = generateSlug('bride', 'groom')
        await createEvent({
          userId: user.uid,
          ownerId: user.uid,
          templateId: template.id,
          componentKey: template.componentKey || 'phone-card',
          slug,
          eventDate: '',
          data: {
            brideName: '',
            groomName: '',
            location: '',
            fonts: { serif: 'Playfair Display', sans: 'Montserrat', script: 'Great Vibes' },
          },
        })
        router.push('/dashboard')
      } else {
        // Paid template — initiate Stripe checkout
        const idToken = await user.getIdToken()
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            templateId: template.id,
            templateName: template.name,
            price: template.price,
          }),
        })

        if (!res.ok) throw new Error('Failed to create checkout session')

        const { url } = await res.json()
        window.location.href = url
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Preview */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
            <div className="aspect-[4/3] relative bg-gradient-to-br from-rose-50 to-amber-50">
              {template.previewImage ? (
                <Image src={template.previewImage} alt={template.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <svg className="h-24 w-24 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            {template.isFree && (
              <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-4 self-start">
                Free Template
              </span>
            )}

            <h1 className="font-serif text-3xl sm:text-4xl text-stone-800 mb-3">{template.name}</h1>
            {template.description && (
              <p className="text-stone-500 mb-6 leading-relaxed">{template.description}</p>
            )}

            <div className="text-4xl font-bold text-stone-800 mb-6">
              {template.price === 0 ? 'Free' : `$${template.price}`}
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-sm font-medium text-stone-600">Includes:</p>
              {['Bride & groom names', 'Wedding date & location', 'Cover photo upload', 'Gallery images', 'RSVP form', 'Shareable link'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-stone-600">
                  <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {isAdmin && template.price > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <span className="text-amber-600 text-xs font-medium">Admin — payment bypassed</span>
              </div>
            )}

            <Button size="lg" loading={loading} onClick={handlePurchase} className="w-full">
              {isAdmin && template.price > 0
                ? 'Add to Dashboard (Admin)'
                : template.price === 0
                ? 'Use This Template — Free'
                : `Purchase for $${template.price}`}
            </Button>

            {!user && (
              <p className="text-xs text-stone-400 text-center mt-3">You'll be asked to sign in first</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
