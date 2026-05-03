import { getEventBySlugAdmin, getUserEmailAdmin } from '@/lib/firestore-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { WeddingEvent } from '@/types'
import EventPageClient from './_components/EventPageClient'

// Date / Firestore Timestamp → ISO string so Next.js can serialize across the server→client boundary
function toDateStr(v: unknown): string | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  return undefined
}

function serializeEvent(event: WeddingEvent): WeddingEvent {
  return {
    ...event,
    createdAt: (toDateStr(event.createdAt) ?? event.createdAt) as unknown as Date,
    members: Object.fromEntries(
      Object.entries(event.members).map(([uid, m]) => {
        const addedAt = toDateStr(m.addedAt)
        return [uid, addedAt ? { ...m, addedAt: addedAt as unknown as Date } : m]
      })
    ),
  }
}

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

  let ownerEmail = ''
  try {
    ownerEmail = await getUserEmailAdmin(event.ownerId)
  } catch { /* non-critical */ }

  const isExpired = event.eventDate
    ? new Date(event.eventDate + 'T23:59:59') < new Date()
    : false

  return <EventPageClient event={serializeEvent(event)} ownerEmail={ownerEmail} isExpired={isExpired} />
}
