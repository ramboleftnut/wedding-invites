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

export interface WeddingEvent {
  id: string
  userId: string
  templateId: string
  componentKey: string
  slug: string
  eventDate: string
  ownerEmail: string
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
  createdAt: Date
}

export interface Invitation {
  id: string
  eventId: string
  guestName: string
  guestEmail?: string
  token: string
  status: 'pending' | 'accepted'
  createdAt: Date
}
