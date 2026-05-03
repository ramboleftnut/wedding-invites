'use client'

import { useState } from 'react'
import type { WeddingEvent, RSVP } from '@/types'

interface Props {
  event: WeddingEvent
  onRSVPSubmit?: (data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>) => Promise<void>
  isExpired?: boolean
}

export default function PhoneCardTemplate({ event, onRSVPSubmit, isExpired }: Props) {
  const [phase, setPhase] = useState<'closed' | 'flipping' | 'open'>('closed')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const { brideName, groomName, location } = event.data

  const formattedDate = event.eventDate
    ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
      await onRSVPSubmit({ name, email, attending: 'yes', message: '' })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

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
    }}>

      {/* Phone-width container — looks narrow on desktop, full-width on phones */}
      <div style={{ width: '100%', maxWidth: '420px', minWidth: '0' }}>

        {/* ── ENVELOPE (closed + flip-out) ── */}
        {phase !== 'open' && (
          <div
            onClick={handleOpen}
            style={{
              cursor: phase === 'closed' ? 'pointer' : 'default',
              userSelect: 'none',
              animation: phase === 'flipping' ? 'flipOut 0.42s ease-in forwards' : undefined,
            }}
          >
            {/* Outer wrapper — needed so the seal can sit outside overflow:hidden */}
            <div style={{ position: 'relative' }}>

              {/* Envelope card */}
              <div style={{
                background: '#fff',
                borderRadius: '22px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.07)',
                overflow: 'hidden',
              }}>

                {/* Flap — downward-pointing triangle via clip-path */}
                <div style={{
                  height: '150px',
                  background: 'linear-gradient(140deg, #fecdd3 0%, #fda4af 100%)',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }} />

                {/* Space for seal overlap + content */}
                <div style={{
                  padding: '44px 28px 36px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}>

                  {/* Names */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '24px',
                      color: '#1c1917',
                      lineHeight: 1.35,
                    }}>
                      {brideName}
                      <span style={{ color: '#f43f5e', margin: '0 8px' }}>&</span>
                      {groomName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#b8a8ac',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginTop: '8px',
                    }}>
                      Wedding Invitation
                    </div>
                  </div>

                  {/* Thin rose rule */}
                  <div style={{ width: '36px', height: '1px', background: '#fecdd3', margin: '4px 0' }} />

                  {/* Tap hint */}
                  <div style={{
                    fontSize: '13px',
                    color: '#c4a0a7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    animation: 'blink 2.2s ease-in-out infinite',
                  }}>
                    <span>✉</span>
                    <span>Tap to open</span>
                  </div>
                </div>
              </div>

              {/* Wax seal — sits on top of the flap/body seam */}
              <div style={{
                position: 'absolute',
                top: '110px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #f43f5e, #be123c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(244, 63, 94, 0.38), 0 0 0 4px #fff',
                fontSize: '30px',
                zIndex: 2,
              }}>
                💍
              </div>
            </div>
          </div>
        )}

        {/* ── INVITATION CARD (open) ── */}
        {phase === 'open' && (
          <div style={{
            background: '#fff',
            borderRadius: '22px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.07)',
            overflow: 'hidden',
            animation: 'flipIn 0.42s ease-out forwards',
          }}>

            {/* Card header */}
            <div style={{
              background: 'linear-gradient(140deg, #f43f5e 0%, #fb7185 100%)',
              padding: '36px 28px 30px',
              textAlign: 'center',
              color: '#fff',
              position: 'relative',
            }}>
              {/* Five decorative dots */}
              <div style={{
                position: 'absolute',
                top: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '5px',
              }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.35)',
                  }} />
                ))}
              </div>

              <div style={{
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                opacity: 0.8,
                marginBottom: '18px',
                marginTop: '10px',
              }}>
                You are cordially invited
              </div>

              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '32px',
                fontWeight: 'normal',
                lineHeight: 1.2,
              }}>
                {brideName}
              </div>
              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '22px',
                fontWeight: 'normal',
                opacity: 0.65,
                margin: '6px 0',
              }}>
                &
              </div>
              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '32px',
                fontWeight: 'normal',
                lineHeight: 1.2,
              }}>
                {groomName}
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '28px 28px 32px' }}>

              {/* Date */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#f43f5e',
                  marginBottom: '6px',
                }}>
                  Date
                </div>
                <div style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '17px',
                  color: '#1c1917',
                }}>
                  {formattedDate}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '16px 0',
              }}>
                <div style={{ flex: 1, height: '1px', background: '#ffe4e6' }} />
                <span style={{ color: '#fda4af', fontSize: '13px' }}>♥</span>
                <div style={{ flex: 1, height: '1px', background: '#ffe4e6' }} />
              </div>

              {/* Location */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#f43f5e',
                  marginBottom: '6px',
                }}>
                  Location
                </div>
                <div style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '17px',
                  color: '#1c1917',
                }}>
                  {location}
                </div>
              </div>

              {/* RSVP section */}
              {isExpired ? (
                <div style={{
                  background: '#f5f5f4',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>
                    This event has passed. Thank you!
                  </p>
                </div>
              ) : submitted ? (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '28px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#15803d',
                    marginBottom: '4px',
                  }}>
                    You&apos;re on the list!
                  </div>
                  <div style={{ fontSize: '13px', color: '#16a34a' }}>
                    We can&apos;t wait to celebrate with you.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#f43f5e',
                    }}>
                      RSVP
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      required
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: '11px',
                        border: '1.5px solid #fecdd3',
                        fontSize: '15px',
                        color: '#1c1917',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#fff',
                        fontFamily: 'inherit',
                      }}
                    />
                    <input
                      required
                      type="email"
                      placeholder="Your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: '11px',
                        border: '1.5px solid #fecdd3',
                        fontSize: '15px',
                        color: '#1c1917',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#fff',
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '11px',
                        background: loading
                          ? '#fda4af'
                          : 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: loading ? 'default' : 'pointer',
                        marginTop: '2px',
                        letterSpacing: '0.03em',
                        boxShadow: loading ? 'none' : '0 4px 14px rgba(244, 63, 94, 0.35)',
                      }}
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
          0%   { opacity: 1; transform: perspective(700px) rotateY(0deg)   scale(1);    }
          100% { opacity: 0; transform: perspective(700px) rotateY(90deg)  scale(0.95); }
        }
        @keyframes flipIn {
          0%   { opacity: 0; transform: perspective(700px) rotateY(-90deg) scale(0.95); }
          100% { opacity: 1; transform: perspective(700px) rotateY(0deg)   scale(1);    }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
