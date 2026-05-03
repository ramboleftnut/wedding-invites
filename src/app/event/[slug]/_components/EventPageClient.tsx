'use client'

import PhoneCardTemplate from '@/templates/PhoneCardTemplate'
import type { WeddingEvent, RSVP } from '@/types'
import { createRSVP } from '@/lib/firestore'
import { sendRSVPNotification } from '@/lib/emailjs'

interface Props {
  event: WeddingEvent
  isExpired: boolean
}

export default function EventPageClient({ event, isExpired }: Props) {
  async function handleRSVPSubmit(data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>) {
    await createRSVP({ ...data, eventId: event.id })
    try {
      await sendRSVPNotification({
        toEmail: '', // Could store owner email in event; for now skip
        eventName: `${event.data.brideName} & ${event.data.groomName}`,
        guestName: data.name,
        attending: data.attending,
      })
    } catch {
      // Email notification is best-effort
    }
  }

  return <PhoneCardTemplate event={event} onRSVPSubmit={handleRSVPSubmit} isExpired={isExpired} />
}
