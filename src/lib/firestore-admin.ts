import { adminDb } from './firebase-admin'
import type { Template, WeddingEvent, Invitation, EventInvite } from '@/types'
import { normalizeEvent } from './event-shape'

export async function getTemplatesAdmin(): Promise<Template[]> {
  const snap = await adminDb().collection('templates').get()
  return snap.docs.map(d => {
    const { createdAt, ...rest } = d.data()
    return { id: d.id, ...rest } as Template
  })
}

export async function getTemplateAdmin(id: string): Promise<Template | null> {
  const snap = await adminDb().collection('templates').doc(id).get()
  if (!snap.exists) return null
  const { createdAt, ...rest } = snap.data()!
  return { id: snap.id, ...rest } as Template
}

function eventFromAdminDoc(id: string, raw: FirebaseFirestore.DocumentData): WeddingEvent {
  return normalizeEvent({
    id,
    userId: raw.userId,
    ownerId: raw.ownerId,
    members: raw.members,
    memberIds: raw.memberIds,
    templateId: raw.templateId,
    componentKey: raw.componentKey,
    slug: raw.slug,
    eventDate: raw.eventDate,
    data: raw.data,
    createdAt: raw.createdAt?.toDate?.() ?? new Date(),
  })
}

export async function getEventBySlugAdmin(slug: string): Promise<WeddingEvent | null> {
  const snap = await adminDb().collection('events').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return eventFromAdminDoc(d.id, d.data())
}

export async function getEventByIdAdmin(id: string): Promise<WeddingEvent | null> {
  const snap = await adminDb().collection('events').doc(id).get()
  if (!snap.exists) return null
  return eventFromAdminDoc(snap.id, snap.data()!)
}

export async function getUserEmailAdmin(userId: string): Promise<string> {
  const snap = await adminDb().collection('users').doc(userId).get()
  return (snap.data()?.email as string) || ''
}

export async function getEventInviteByTokenAdmin(token: string): Promise<EventInvite | null> {
  const snap = await adminDb().collection('eventInvites').where('token', '==', token).limit(1).get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
  } as EventInvite
}

export async function getInvitationByTokenAdmin(token: string): Promise<Invitation | null> {
  const snap = await adminDb().collection('invitations').where('token', '==', token).limit(1).get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? new Date(),
  } as Invitation
}
