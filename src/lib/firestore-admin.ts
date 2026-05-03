import { adminDb } from './firebase-admin'
import type { Template, WeddingEvent, Invitation } from '@/types'

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

export async function getEventBySlugAdmin(slug: string): Promise<WeddingEvent | null> {
  const snap = await adminDb().collection('events').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? new Date(),
  } as WeddingEvent
}

export async function getEventByIdAdmin(id: string): Promise<WeddingEvent | null> {
  const snap = await adminDb().collection('events').doc(id).get()
  if (!snap.exists) return null
  return {
    id: snap.id,
    ...snap.data(),
    createdAt: snap.data()!.createdAt?.toDate() ?? new Date(),
  } as WeddingEvent
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
