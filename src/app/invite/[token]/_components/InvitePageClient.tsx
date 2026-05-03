'use client'

import type { WeddingEvent, RSVP, Invitation } from '@/types'
import { createRSVP, updateInvitationStatus } from '@/lib/firestore'
import { sendRSVPNotification } from '@/lib/emailjs'
import { getTemplateComponent } from '@/templates/registry'

interface Props {
  invitation: Invitation
  event: WeddingEvent
  ownerEmail: string
  isExpired: boolean
}

export default function InvitePageClient({ invitation, event, ownerEmail, isExpired }: Props) {
  const Template = getTemplateComponent(event.componentKey)

  async function handleRSVPSubmit(data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>[]) {
    const payloads = data.map(d => {
      const p: Omit<RSVP, 'id' | 'createdAt'> = { ...d, eventId: event.id }
      if (invitation.side) p.side = invitation.side
      return p
    })
    await Promise.all([
      ...payloads.map(p => createRSVP(p)),
      updateInvitationStatus(invitation.id, 'accepted'),
    ])
    const names = data.filter(d => d.attending === 'yes').map(d => d.name)
    try {
      await sendRSVPNotification({
        toEmail: ownerEmail,
        eventName: `${event.data.brideName} & ${event.data.groomName}`,
        guestName: names.length > 0 ? names.join(', ') : data[0]?.name ?? invitation.guestName,
        attending: names.length > 0 ? 'yes' : 'no',
      })
    } catch { /* best-effort */ }
  }

  return (
    <Template
      event={event}
      onRSVPSubmit={handleRSVPSubmit}
      isExpired={isExpired}
      guestName={invitation.guestName}
      guestNames={invitation.guestNames}
    />
  )
}
