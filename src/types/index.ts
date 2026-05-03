export interface AppUser {
  id: string
  email: string
  role: 'admin' | 'customer'
}

export interface TemplateField {
  name: string
  label: string
  type: 'text' | 'date' | 'image' | 'images'
  required: boolean
}

export interface Template {
  id: string
  name: string
  componentKey: string
  price: number
  previewImage: string
  description: string
  fieldsSchema: TemplateField[]
  isFree?: boolean
  createdAt?: Date
}

export interface Order {
  id: string
  userId: string
  templateId: string
  stripeSessionId: string
  amount: number
  createdAt: Date
}

export interface FontSelection {
  serif: string
  sans: string
  script: string
}

export interface EventData {
  brideName: string
  groomName: string
  eventName?: string
  location: string
  message?: string
  coverImage?: string
  galleryImages?: string[]
  fonts?: FontSelection
}

export type Side = 'bride' | 'groom' | 'both'
export type EventRole = 'owner' | 'admin' | 'editor'

export interface EventMember {
  role: EventRole
  side: Side
  canViewBothSides: boolean
  email?: string
  addedAt?: Date
}

export interface WeddingEvent {
  id: string
  /** @deprecated Use ownerId. Retained on the document for backward compatibility. */
  userId: string
  ownerId: string
  members: Record<string, EventMember>
  memberIds: string[]
  templateId: string
  componentKey: string
  slug: string
  eventDate: string
  data: EventData
  createdAt: Date
}

export interface RSVP {
  id: string
  eventId: string
  name: string
  email: string
  attending: 'yes' | 'no'
  message?: string
  side?: Side
  tableId?: string
  createdAt: Date
}

export interface Invitation {
  id: string
  eventId: string
  guestName: string
  guestEmail?: string
  guestCount?: number
  guestNames?: string[]
  token: string
  status: 'pending' | 'accepted'
  side?: Side
  createdAt: Date
}

export interface EventInvite {
  id: string
  eventId: string
  email: string
  role: EventRole
  side: Side
  canViewBothSides: boolean
  token: string
  status: 'pending' | 'accepted' | 'revoked'
  invitedByUid: string
  createdAt: Date
}

export interface Table {
  id: string
  eventId: string
  number: number
  seats: number
  side: Side
  createdAt: Date
}
