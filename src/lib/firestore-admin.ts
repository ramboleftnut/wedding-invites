import { adminDb } from './firebase-admin'
import type { Template, WeddingEvent } from '@/types'

export async function getTemplatesAdmin(): Promise<Template[]> {
  const snap = await adminDb().collection('templates').get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Template))
}

export async function getTemplateAdmin(id: string): Promise<Template | null> {
  const snap = await adminDb().collection('templates').doc(id).get()
  return snap.exists ? ({ id: snap.id, ...snap.data() } as Template) : null
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
