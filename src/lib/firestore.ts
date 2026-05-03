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
} from 'firebase/firestore'
import { firebaseDb } from './firebase'
import type { Template, WeddingEvent, Order, RSVP, AppUser } from '@/types'

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
export async function createEvent(data: Omit<WeddingEvent, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'events'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function getEventBySlug(slug: string): Promise<WeddingEvent | null> {
  const q = query(collection(firebaseDb(), 'events'), where('slug', '==', slug))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as WeddingEvent
}

export async function getUserEvents(userId: string): Promise<WeddingEvent[]> {
  const q = query(collection(firebaseDb(), 'events'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as WeddingEvent))
}

export async function getAllEvents(): Promise<WeddingEvent[]> {
  const q = query(collection(firebaseDb(), 'events'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp).toDate(),
  } as WeddingEvent))
}

export async function updateEvent(id: string, data: Partial<WeddingEvent>) {
  await updateDoc(doc(firebaseDb(), 'events', id), data as DocumentData)
}

// RSVPs
export async function createRSVP(data: Omit<RSVP, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(firebaseDb(), 'rsvps'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
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
