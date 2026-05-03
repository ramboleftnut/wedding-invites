import { getInvitationByTokenAdmin, getEventByIdAdmin, getUserEmailAdmin } from '@/lib/firestore-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import InvitePageClient from './_components/InvitePageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  let invitation = null
  let event = null
  try {
    invitation = await getInvitationByTokenAdmin(token)
    if (invitation) event = await getEventByIdAdmin(invitation.eventId)
  } catch { /* Firebase not configured */ }

  if (!invitation || !event) return { title: 'Wedding Invitation — Vows & Co' }

  const { brideName, groomName } = event.data
  return {
    title: `${brideName} & ${groomName}'s Wedding — Vows & Co`,
    description: `${invitation.guestName}, you're invited to celebrate the wedding of ${brideName} and ${groomName}.`,
  }
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  let invitation = null
  let event = null
  try {
    invitation = await getInvitationByTokenAdmin(token)
    if (invitation) event = await getEventByIdAdmin(invitation.eventId)
  } catch { /* Firebase not configured */ }

  if (!invitation || !event) notFound()

  const ownerEmail = await getUserEmailAdmin(event.ownerId)

  const isExpired = event.eventDate
    ? new Date(event.eventDate + 'T23:59:59') < new Date()
    : false

  return (
    <InvitePageClient
      invitation={invitation}
      event={event}
      ownerEmail={ownerEmail}
      isExpired={isExpired}
    />
  )
}
