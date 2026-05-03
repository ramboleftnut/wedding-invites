'use client'

import { useState, useEffect } from 'react'
import type { WeddingEvent, RSVP } from '@/types'
import { fontsToGoogleUrl, defaultFonts } from '@/lib/fonts'

interface Props {
  event: WeddingEvent
  onRSVPSubmit?: (data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>[]) => Promise<void>
  isExpired?: boolean
  guestName?: string
  guestNames?: string[]
}

export default function PhoneCardTemplate({ event, onRSVPSubmit, isExpired, guestName, guestNames }: Props) {
  const isGroup = guestNames && guestNames.length > 1
  const [phase, setPhase] = useState<'closed' | 'flipping' | 'open'>('closed')
  const [name, setName] = useState(guestName ?? '')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkedNames, setCheckedNames] = useState<Record<string, boolean>>(
    () => Object.fromEntries((guestNames ?? []).map(n => [n, true]))
  )

  const { brideName, groomName, location, eventName, fonts } = event.data
  const activeFont = {
    serif:  fonts?.serif  ?? defaultFonts.serif,
    sans:   fonts?.sans   ?? defaultFonts.sans,
    script: fonts?.script ?? defaultFonts.script,
  }

  // Load selected Google Fonts
  useEffect(() => {
    const url = fontsToGoogleUrl(activeFont)
    if (!url) return
    const existing = document.querySelector(`link[data-gf-template]`)
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.setAttribute('data-gf-template', '1')
    document.head.appendChild(link)
    return () => { link.remove() }
  }, [activeFont.serif, activeFont.sans, activeFont.script])

  const formattedDate = event.eventDate
    ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  function handleOpen() {
    if (phase !== 'closed') return
    setPhase('flipping')
    setTimeout(() => setPhase('open'), 420)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!onRSVPSubmit) return
    setLoading(true)
    try {
      let entries: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>[]
      if (isGroup) {
        entries = (guestNames ?? []).map(n => ({
          name: n,
          email,
          attending: checkedNames[n] ? 'yes' : 'no',
          message: '',
        }))
      } else {
        entries = [{ name, email, attending: 'yes', message: '' }]
      }
      await onRSVPSubmit(entries)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  // Derived styles from font selection
  const scriptStyle = { fontFamily: `'${activeFont.script}', cursive` }
  const serifStyle  = { fontFamily: `'${activeFont.serif}', serif` }
  const sansStyle   = { fontFamily: `'${activeFont.sans}', sans-serif` }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'linear-gradient(160deg, #fff1f2 0%, #fdf2f8 55%, #fff7ed 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      boxSizing: 'border-box',
      ...sansStyle,
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── ENVELOPE ── */}
        {phase !== 'open' && (
          <div
            onClick={handleOpen}
            style={{
              cursor: phase === 'closed' ? 'pointer' : 'default',
              userSelect: 'none',
              animation: phase === 'flipping' ? 'flipOut 0.42s ease-in forwards' : undefined,
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                background: '#fff',
                borderRadius: '22px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.07)',
                overflow: 'hidden',
              }}>
                {/* Flap */}
                <div style={{
                  height: '150px',
                  background: 'linear-gradient(140deg, #fecdd3 0%, #fda4af 100%)',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }} />

                <div style={{
                  padding: '44px 28px 36px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ ...scriptStyle, fontSize: '28px', color: '#1c1917', lineHeight: 1.3 }}>
                      {brideName || 'Bride'} & {groomName || 'Groom'}
                    </div>
                    {eventName && (
                      <div style={{ ...serifStyle, fontSize: '13px', color: '#b8a8ac', marginTop: '4px' }}>
                        {eventName}
                      </div>
                    )}
                    <div style={{ ...sansStyle, fontSize: '11px', color: '#b8a8ac', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px' }}>
                      Wedding Invitation
                    </div>
                  </div>
                  <div style={{ width: '36px', height: '1px', background: '#fecdd3', margin: '4px 0' }} />
                  <div style={{ ...sansStyle, fontSize: '13px', color: '#c4a0a7', display: 'flex', alignItems: 'center', gap: '6px', animation: 'blink 2.2s ease-in-out infinite' }}>
                    <span>✉</span><span>Tap to open</span>
                  </div>
                </div>
              </div>

              {/* Wax seal */}
              <div style={{
                position: 'absolute', top: '110px', left: '50%',
                transform: 'translateX(-50%)',
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(145deg, #f43f5e, #be123c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(244,63,94,0.38), 0 0 0 4px #fff',
                fontSize: '30px', zIndex: 2,
              }}>
                💍
              </div>
            </div>
          </div>
        )}

        {/* ── INVITATION CARD ── */}
        {phase === 'open' && (
          <div style={{
            background: '#fff',
            borderRadius: '22px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.07)',
            overflow: 'hidden',
            animation: 'flipIn 0.42s ease-out forwards',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(140deg, #f43f5e 0%, #fb7185 100%)',
              padding: '36px 28px 30px',
              textAlign: 'center',
              color: '#fff',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>

              <div style={{ ...sansStyle, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, marginBottom: '16px', marginTop: '10px' }}>
                You are cordially invited
              </div>
              {eventName && (
                <div style={{ ...serifStyle, fontSize: '13px', opacity: 0.75, marginBottom: '10px' }}>{eventName}</div>
              )}
              <div style={{ ...scriptStyle, fontSize: '36px', fontWeight: 'normal', lineHeight: 1.2 }}>
                {brideName || 'Bride'}
              </div>
              <div style={{ ...scriptStyle, fontSize: '24px', fontWeight: 'normal', opacity: 0.65, margin: '4px 0' }}>
                &amp;
              </div>
              <div style={{ ...scriptStyle, fontSize: '36px', fontWeight: 'normal', lineHeight: 1.2 }}>
                {groomName || 'Groom'}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '28px 28px 32px' }}>

              {/* Date */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ ...sansStyle, fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f43f5e', marginBottom: '6px' }}>
                  Date
                </div>
                <div style={{ ...serifStyle, fontSize: '17px', color: '#1c1917' }}>
                  {formattedDate}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#ffe4e6' }} />
                <span style={{ color: '#fda4af', fontSize: '13px' }}>♥</span>
                <div style={{ flex: 1, height: '1px', background: '#ffe4e6' }} />
              </div>

              {/* Location */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ ...sansStyle, fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f43f5e', marginBottom: '6px' }}>
                  Location
                </div>
                <div style={{ ...serifStyle, fontSize: '17px', color: '#1c1917' }}>
                  {location}
                </div>
              </div>

              {/* RSVP */}
              {isExpired ? (
                <div style={{ background: '#f5f5f4', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                  <p style={{ ...sansStyle, color: '#78716c', fontSize: '14px', margin: 0 }}>This event has passed. Thank you!</p>
                </div>
              ) : submitted ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '28px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                  <div style={{ ...scriptStyle, fontSize: '22px', color: '#15803d', marginBottom: '4px' }}>You&apos;re on the list!</div>
                  <div style={{ ...sansStyle, fontSize: '13px', color: '#16a34a' }}>We can&apos;t wait to celebrate with you.</div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{ ...sansStyle, fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f43f5e' }}>RSVP</span>
                  </div>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isGroup ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ ...sansStyle, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f43f5e' }}>
                          Who is attending?
                        </div>
                        {(guestNames ?? []).map(n => (
                          <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '11px', border: '1.5px solid #fecdd3', background: '#fff', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checkedNames[n] ?? true}
                              onChange={e => setCheckedNames(prev => ({ ...prev, [n]: e.target.checked }))}
                              style={{ accentColor: '#f43f5e', width: '16px', height: '16px', flexShrink: 0 }}
                            />
                            <span style={{ ...sansStyle, fontSize: '15px', color: '#1c1917' }}>{n}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        required type="text" placeholder="Your full name"
                        value={name} onChange={e => setName(e.target.value)}
                        style={{ ...sansStyle, width: '100%', padding: '13px 16px', borderRadius: '11px', border: '1.5px solid #fecdd3', fontSize: '15px', color: '#1c1917', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                      />
                    )}
                    <input
                      required type="email" placeholder="Your email address"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{ ...sansStyle, width: '100%', padding: '13px 16px', borderRadius: '11px', border: '1.5px solid #fecdd3', fontSize: '15px', color: '#1c1917', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    />
                    <button
                      type="submit" disabled={loading}
                      style={{ ...sansStyle, width: '100%', padding: '15px', borderRadius: '11px', background: loading ? '#fda4af' : 'linear-gradient(135deg,#f43f5e 0%,#fb7185 100%)', color: '#fff', fontSize: '15px', fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer', marginTop: '2px', letterSpacing: '0.03em', boxShadow: loading ? 'none' : '0 4px 14px rgba(244,63,94,0.35)' }}
                    >
                      {loading ? 'Sending…' : 'Send RSVP ✉'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flipOut {
          0%   { opacity:1; transform:perspective(700px) rotateY(0deg)   scale(1);    }
          100% { opacity:0; transform:perspective(700px) rotateY(90deg)  scale(0.95); }
        }
        @keyframes flipIn {
          0%   { opacity:0; transform:perspective(700px) rotateY(-90deg) scale(0.95); }
          100% { opacity:1; transform:perspective(700px) rotateY(0deg)   scale(1);    }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.35; }
        }
      `}</style>
    </div>
  )
}
