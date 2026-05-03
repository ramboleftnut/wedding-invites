'use client'

import type { WeddingEvent, RSVP } from '@/types'
import { createRSVP } from '@/lib/firestore'
import { sendRSVPNotification } from '@/lib/emailjs'
import { getTemplateComponent } from '@/templates/registry'

interface Props {
  event: WeddingEvent
  ownerEmail: string
  isExpired: boolean
}

export default function EventPageClient({ event, ownerEmail, isExpired }: Props) {
  const Template = getTemplateComponent(event.componentKey)

  async function handleRSVPSubmit(data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>) {
    await createRSVP({ ...data, eventId: event.id })
    try {
      await sendRSVPNotification({
        toEmail: ownerEmail,
        eventName: `${event.data.brideName} & ${event.data.groomName}`,
        guestName: data.name,
        attending: data.attending,
      })
    } catch { /* best-effort */ }
  }

  return <Template event={event} onRSVPSubmit={handleRSVPSubmit} isExpired={isExpired} />
}
