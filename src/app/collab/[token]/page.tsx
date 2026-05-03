import { getEventInviteByTokenAdmin, getEventByIdAdmin, getUserEmailAdmin } from '@/lib/firestore-admin'
import { deepSerialize } from '@/lib/serialize'
import { notFound } from 'next/navigation'
import CollabAcceptClient from './_components/CollabAcceptClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CollabPage({ params }: Props) {
  const { token } = await params

  let invite = null
  let event = null
  let ownerEmail = ''
  try {
    invite = await getEventInviteByTokenAdmin(token)
    if (invite) {
      event = await getEventByIdAdmin(invite.eventId)
      if (event) ownerEmail = await getUserEmailAdmin(event.ownerId)
    }
  } catch { /* Firebase not configured */ }

  if (!invite || !event) notFound()

  return <CollabAcceptClient invite={deepSerialize(invite)} event={deepSerialize(event)} ownerEmail={ownerEmail} />
}
