'use client'

import { useState } from 'react'
import type { WeddingEvent, RSVP } from '@/types'

interface EnvelopeTemplateProps {
  event: WeddingEvent
  onRSVPSubmit?: (data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>[]) => Promise<void>
  isExpired?: boolean
  guestName?: string
  guestNames?: string[]
}

export default function EnvelopeTemplate({ event, onRSVPSubmit, isExpired, guestName, guestNames }: EnvelopeTemplateProps) {
  const isGroup = guestNames && guestNames.length > 1
  const [opened, setOpened] = useState(false)
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [rsvpForm, setRsvpForm] = useState({ name: guestName ?? '', email: '', attending: 'yes' as 'yes' | 'no', message: '' })
  const [checkedNames, setCheckedNames] = useState<Record<string, boolean>>(
    () => Object.fromEntries((guestNames ?? []).map(n => [n, true]))
  )

  const { brideName, groomName, location, message, coverImage } = event.data

  const formattedDate = event.eventDate
    ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  async function handleRSVP(e: React.FormEvent) {
    e.preventDefault()
    if (!onRSVPSubmit) return
    setRsvpLoading(true)
    try {
      let entries: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>[]
      if (isGroup) {
        entries = (guestNames ?? []).map(name => ({
          name,
          email: rsvpForm.email,
          attending: checkedNames[name] ? 'yes' : 'no',
          message: rsvpForm.message,
        }))
      } else {
        entries = [rsvpForm]
      }
      await onRSVPSubmit(entries)
      setRsvpSubmitted(true)
    } finally {
      setRsvpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!opened ? (
          // Closed envelope
          <div
            className="cursor-pointer select-none"
            onClick={() => setOpened(true)}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-rose-100"
              style={{ aspectRatio: '7/5' }}>

              {/* Envelope back flap (triangle) */}
              <div
                className="absolute top-0 left-0 right-0 h-0 border-l-[220px] border-r-[220px] border-t-[150px] border-l-transparent border-r-transparent border-t-rose-100"
                style={{ borderLeftWidth: '50%', borderRightWidth: '50%' }}
              />

              {/* Envelope body */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-16">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💌</span>
                </div>
                <h2 className="font-serif text-xl text-stone-700 text-center mb-1">
                  {brideName} & {groomName}
                </h2>
                <p className="text-sm text-stone-400 text-center">
                  Tap to open your invitation
                </p>
              </div>

              {/* Bottom triangle */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: 0,
                  borderLeft: '50vw solid transparent',
                  borderRight: '50vw solid transparent',
                  borderBottom: '8rem solid #fdf2f8',
                }}
              />
            </div>

            <p className="text-center text-xs text-stone-400 mt-4 animate-pulse">
              ✉ Tap the envelope to open
            </p>
          </div>
        ) : (
          // Opened invitation
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-rose-100 animate-[fadeInUp_0.5s_ease-out]">
            {/* Cover image or header */}
            {coverImage ? (
              <div className="relative h-48 overflow-hidden">
                <img src={coverImage} alt="Wedding cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ) : (
              <div className="h-24 bg-gradient-to-r from-rose-400 to-pink-400 flex items-center justify-center">
                <span className="text-white text-4xl">💍</span>
              </div>
            )}

            <div className="p-8">
              {/* Names */}
              <div className="text-center mb-8">
                <p className="text-xs font-medium text-rose-400 tracking-widest uppercase mb-2">
                  You are invited to celebrate the wedding of
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-stone-800 mb-1">
                  {brideName}
                </h1>
                <p className="text-rose-400 font-serif text-xl">&</p>
                <h1 className="font-serif text-3xl sm:text-4xl text-stone-800">
                  {groomName}
                </h1>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-rose-100" />
                <span className="text-rose-300">❦</span>
                <div className="flex-1 h-px bg-rose-100" />
              </div>

              {/* Details */}
              <div className="space-y-4 mb-8 text-center">
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-stone-700 font-medium">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-stone-700 font-medium">{location}</p>
                </div>
                {message && (
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Message</p>
                    <p className="text-stone-600 italic text-sm leading-relaxed">{message}</p>
                  </div>
                )}
              </div>

              {/* RSVP Section */}
              {isExpired ? (
                <div className="bg-stone-50 rounded-xl p-5 text-center">
                  <p className="text-stone-500 text-sm">This event has passed. Thank you for celebrating with us!</p>
                </div>
              ) : rsvpSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-semibold text-green-700">Thank you for your RSVP!</p>
                  <p className="text-sm text-green-600 mt-1">We look forward to celebrating with you.</p>
                </div>
              ) : (
                <div className="bg-rose-50 rounded-xl p-5">
                  <h3 className="font-semibold text-stone-700 mb-4 text-center">RSVP</h3>
                  <form onSubmit={handleRSVP} className="space-y-3">
                    {isGroup ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Who is attending?</p>
                        {(guestNames ?? []).map(name => (
                          <label key={name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-rose-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checkedNames[name] ?? true}
                              onChange={e => setCheckedNames(prev => ({ ...prev, [name]: e.target.checked }))}
                              className="accent-rose-500 w-4 h-4 shrink-0"
                            />
                            <span className="text-sm text-stone-800">{name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        required
                        placeholder="Your full name"
                        value={rsvpForm.name}
                        onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-rose-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                      />
                    )}
                    <input
                      required
                      type="email"
                      placeholder="Your email"
                      value={rsvpForm.email}
                      onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-rose-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                    />
                    {!isGroup && (
                      <div className="flex gap-3">
                        {(['yes', 'no'] as const).map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRsvpForm({ ...rsvpForm, attending: val })}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                              rsvpForm.attending === val
                                ? 'bg-rose-500 border-rose-500 text-white'
                                : 'border-rose-200 text-stone-600 hover:border-rose-400'
                            }`}
                          >
                            {val === 'yes' ? '✓ Attending' : '✗ Decline'}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea
                      placeholder="Optional message..."
                      value={rsvpForm.message}
                      onChange={e => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-rose-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"
                    />
                    <button
                      type="submit"
                      disabled={rsvpLoading}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {rsvpLoading && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      Send RSVP
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
