import { getEventBySlugAdmin, getUserEmailAdmin } from '@/lib/firestore-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import EventPageClient from './_components/EventPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  let event = null
  try {
    event = await getEventBySlugAdmin(slug)
  } catch { /* Firebase not configured */ }

  if (!event) {
    return { title: 'Wedding Invitation — Vows & Co' }
  }

  const { brideName, groomName } = event.data
  const title = brideName && groomName
    ? `${brideName} & ${groomName}'s Wedding`
    : 'Wedding Invitation'

  return {
    title: `${title} — Vows & Co`,
    description: `You're invited to celebrate the wedding of ${brideName} and ${groomName}.`,
    openGraph: {
      title,
      description: `You're invited! Join ${brideName} & ${groomName} on their special day.`,
      type: 'website',
      images: event.data.coverImage ? [event.data.coverImage] : [],
    },
  }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params

  let event = null
  try {
    event = await getEventBySlugAdmin(slug)
  } catch { /* Firebase not configured */ }

  if (!event) notFound()

  const ownerEmail = await getUserEmailAdmin(event.userId)

  const isExpired = event.eventDate
    ? new Date(event.eventDate + 'T23:59:59') < new Date()
    : false

  return <EventPageClient event={event} ownerEmail={ownerEmail} isExpired={isExpired} />
}
