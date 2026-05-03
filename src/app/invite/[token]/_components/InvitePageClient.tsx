'use client'

import type { WeddingEvent, RSVP, Invitation } from '@/types'
import { createRSVP, updateInvitationStatus } from '@/lib/firestore'
import { sendRSVPNotification } from '@/lib/emailjs'
import { getTemplateComponent } from '@/templates/registry'

interface Props {
  invitation: Invitation
  event: WeddingEvent
  isExpired: boolean
}

export default function InvitePageClient({ invitation, event, isExpired }: Props) {
  const Template = getTemplateComponent(event.componentKey)

  async function handleRSVPSubmit(data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>) {
    await Promise.all([
      createRSVP({ ...data, eventId: event.id }),
      updateInvitationStatus(invitation.id, 'accepted'),
    ])
    try {
      await sendRSVPNotification({
        toEmail: event.ownerEmail,
        eventName: `${event.data.brideName} & ${event.data.groomName}`,
        guestName: data.name,
        attending: data.attending,
      })
    } catch { /* best-effort */ }
  }

  return (
    <Template
      event={event}
      onRSVPSubmit={handleRSVPSubmit}
      isExpired={isExpired}
      guestName={invitation.guestName}
    />
  )
}
