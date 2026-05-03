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

export interface EventData {
  brideName: string
  groomName: string
  location: string
  message?: string
  coverImage?: string
  galleryImages?: string[]
}

export interface WeddingEvent {
  id: string
  userId: string
  templateId: string
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
  createdAt: Date
}
