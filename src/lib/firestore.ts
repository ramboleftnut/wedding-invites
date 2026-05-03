import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore'
import { firebaseDb } from './firebase'
import type {
  Template, WeddingEvent, Order, RSVP, AppUser, Invitation,
  EventMember, EventRole, Side, EventInvite, Table,
} from '@/types'
import { normalizeEvent, eventNeedsMigration, buildOwnerMembers } from './event-shape'

// Users
export async function createUser(id: string, email: string, role: 'admin' | 'customer' = 'customer') {
  await setDoc(doc(firebaseDb(), 'users', id), { id, email, role })
}

export async function getUser(id: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(firebaseDb(), 'users', id))
  return snap.exists() ? (snap.data() as AppUser) : null
}

// Templates
export async function getTemplates(): Promise<Template[]> {
  const snap = await getDocs(collection(firebaseDb(), 'templates'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Template))
}

export async function getTemplate(id: string): Promise<Template | null> {
  const snap = await getDoc(doc(firebaseDb(), 'templates', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Template) : null
}

export async function createTemplate(data: Omit<Template, 'id'>): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'templates'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function updateTemplate(id: string, data: Partial<Template>) {
  await updateDoc(doc(firebaseDb(), 'templates', id), data as DocumentData)
}

export async function deleteTemplate(id: string) {
  await deleteDoc(doc(firebaseDb(), 'templates', id))
}

// Orders
export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'orders'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(collection(firebaseDb(), 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as Order))
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(firebaseDb(), 'orders'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as Order))
}

export async function orderExistsForTemplate(userId: string, templateId: string): Promise<boolean> {
  const q = query(
    collection(firebaseDb(), 'orders'),
    where('userId', '==', userId),
    where('templateId', '==', templateId),
  )
  const snap = await getDocs(q)
  return !snap.empty
}

// Events
function eventFromDoc(id: string, raw: DocumentData): WeddingEvent {
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
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : (raw.createdAt ?? new Date()),
  })
}

async function migrateEventDocIfNeeded(id: string, raw: DocumentData): Promise<void> {
  if (!eventNeedsMigration(raw)) return
  const ownerId = (raw.ownerId as string) || (raw.userId as string)
  if (!ownerId) return
  const update: Record<string, unknown> = {}
  if (!raw.ownerId) update.ownerId = ownerId
  const hasMembers = raw.members && typeof raw.members === 'object' && Object.keys(raw.members).length > 0
  if (!hasMembers) {
    update.members = buildOwnerMembers(ownerId).members
  }
  if (!Array.isArray(raw.memberIds) || raw.memberIds.length === 0) {
    update.memberIds = buildOwnerMembers(ownerId).memberIds
  }
  if (Object.keys(update).length === 0) return
  try {
    await updateDoc(doc(firebaseDb(), 'events', id), update as DocumentData)
  } catch (err) {
    console.error('event migration write failed', id, err)
  }
}

export async function createEvent(data: Omit<WeddingEvent, 'id' | 'createdAt' | 'members' | 'memberIds'>): Promise<string> {
  const ownerId = data.ownerId || data.userId
  const seeded = buildOwnerMembers(ownerId)
  const ref = await addDoc(collection(firebaseDb(), 'events'), {
    ...data,
    ownerId,
    userId: ownerId,
    members: seeded.members,
    memberIds: seeded.memberIds,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function getEventBySlug(slug: string): Promise<WeddingEvent | null> {
  const q = query(collection(firebaseDb(), 'events'), where('slug', '==', slug))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  void migrateEventDocIfNeeded(d.id, d.data())
  return eventFromDoc(d.id, d.data())
}

export async function getEventById(id: string): Promise<WeddingEvent | null> {
  const snap = await getDoc(doc(firebaseDb(), 'events', id))
  if (!snap.exists()) return null
  void migrateEventDocIfNeeded(snap.id, snap.data())
  return eventFromDoc(snap.id, snap.data())
}

export async function getUserEvents(userId: string): Promise<WeddingEvent[]> {
  // Dual-read: events under the new `memberIds` shape and any leftover legacy events keyed by `userId`.
  // No `orderBy` here so we don't need a composite index for the array-contains query — sort in memory.
  const newQ = query(
    collection(firebaseDb(), 'events'),
    where('memberIds', 'array-contains', userId),
  )
  const legacyQ = query(
    collection(firebaseDb(), 'events'),
    where('userId', '==', userId),
  )
  const [newSnap, legacySnap] = await Promise.all([getDocs(newQ), getDocs(legacyQ)])

  const seen = new Set<string>()
  const out: WeddingEvent[] = []
  for (const d of newSnap.docs) {
    seen.add(d.id)
    out.push(eventFromDoc(d.id, d.data()))
  }
  for (const d of legacySnap.docs) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    out.push(eventFromDoc(d.id, d.data()))
    void migrateEventDocIfNeeded(d.id, d.data())
  }
  out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return out
}

export async function getAllEvents(): Promise<WeddingEvent[]> {
  const q = query(collection(firebaseDb(), 'events'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    void migrateEventDocIfNeeded(d.id, d.data())
    return eventFromDoc(d.id, d.data())
  })
}

export async function updateEvent(id: string, data: Partial<WeddingEvent>) {
  await updateDoc(doc(firebaseDb(), 'events', id), data as DocumentData)
}

// Event members
export async function addEventMember(
  eventId: string,
  uid: string,
  member: EventMember,
): Promise<void> {
  await updateDoc(doc(firebaseDb(), 'events', eventId), {
    [`members.${uid}`]: member,
    memberIds: arrayUnion(uid),
  } as DocumentData)
}

export async function updateEventMember(
  eventId: string,
  uid: string,
  patch: Partial<EventMember>,
): Promise<void> {
  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    update[`members.${uid}.${k}`] = v
  }
  await updateDoc(doc(firebaseDb(), 'events', eventId), update as DocumentData)
}

export async function removeEventMember(eventId: string, uid: string): Promise<void> {
  await updateDoc(doc(firebaseDb(), 'events', eventId), {
    [`members.${uid}`]: deleteField(),
    memberIds: arrayRemove(uid),
  } as DocumentData)
}

export type { EventMember, EventRole, Side }

// Event invites (collaborator invites — distinct from guest invitations)
export async function createEventInvite(
  data: Omit<EventInvite, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'eventInvites'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function getEventInvites(eventId: string): Promise<EventInvite[]> {
  const q = query(collection(firebaseDb(), 'eventInvites'), where('eventId', '==', eventId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: (d.data().createdAt as Timestamp).toDate(),
    } as EventInvite))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getEventInviteByToken(token: string): Promise<EventInvite | null> {
  const q = query(collection(firebaseDb(), 'eventInvites'), where('token', '==', token), )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as EventInvite
}

export async function updateEventInviteStatus(
  id: string,
  status: 'pending' | 'accepted' | 'revoked',
): Promise<void> {
  await updateDoc(doc(firebaseDb(), 'eventInvites', id), { status })
}

// RSVPs
export async function createRSVP(data: Omit<RSVP, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'rsvps'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function updateRSVPSide(rsvpId: string, side: Side): Promise<void> {
  await updateDoc(doc(firebaseDb(), 'rsvps', rsvpId), { side })
}

export async function updateRSVPTable(rsvpId: string, tableId: string | null): Promise<void> {
  await updateDoc(doc(firebaseDb(), 'rsvps', rsvpId), {
    tableId: tableId === null ? deleteField() : tableId,
  } as DocumentData)
}

export async function getEventRSVPs(eventId: string): Promise<RSVP[]> {
  const q = query(collection(firebaseDb(), 'rsvps'), where('eventId', '==', eventId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as RSVP))
}

export function generateSlug(brideName: string, groomName: string): string {
  const combined = `${brideName}-${groomName}`.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const random = Math.random().toString(36).slice(2, 7)
  return `${combined}-${random}`
}

export function generateToken(name?: string): string {
  const rand = Math.random().toString(36).slice(2, 7)
  if (!name) return rand
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug}-${rand}`
}

// Tables
export async function createTable(data: Omit<Table, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'tables'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function getEventTables(eventId: string): Promise<Table[]> {
  const q = query(collection(firebaseDb(), 'tables'), where('eventId', '==', eventId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
    } as Table))
    .sort((a, b) => a.number - b.number)
}

export async function updateTable(id: string, patch: Partial<Table>): Promise<void> {
  await updateDoc(doc(firebaseDb(), 'tables', id), patch as DocumentData)
}

export async function deleteTable(id: string): Promise<void> {
  await deleteDoc(doc(firebaseDb(), 'tables', id))
}

// Invitations
export async function createInvitation(data: Omit<Invitation, 'id' | 'createdAt'>): Promise<string> {
  const doc: Record<string, unknown> = { ...data, createdAt: Timestamp.now() }
  for (const key of Object.keys(doc)) {
    if (doc[key] === undefined) delete doc[key]
  }
  const ref = await addDoc(collection(firebaseDb(), 'invitations'), doc)
  return ref.id
}

export async function getEventInvitations(eventId: string): Promise<Invitation[]> {
  const q = query(
    collection(firebaseDb(), 'invitations'),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as Invitation))
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const q = query(collection(firebaseDb(), 'invitations'), where('token', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as Invitation
}

export async function updateInvitationStatus(id: string, status: 'pending' | 'accepted') {
  await updateDoc(doc(firebaseDb(), 'invitations', id), { status })
}
