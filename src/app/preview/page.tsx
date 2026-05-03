'use client'

import PhoneCardTemplate from '@/templates/PhoneCardTemplate'
import type { WeddingEvent } from '@/types'

const mockEvent: WeddingEvent = {
  id: 'preview',
  userId: 'preview',
  templateId: 'preview',
  componentKey: 'phone-card',
  slug: 'preview',
  eventDate: '2025-09-14',
  ownerEmail: '',
  createdAt: new Date(),
  data: {
    brideName: 'Sofia',
    groomName: 'Luca',
    location: 'Villa Rosa, Santorini, Greece',
    message: 'Join us as we begin our forever.',
    coverImage: '',
    galleryImages: [],
  },
}

export default function PreviewPage() {
  return <PhoneCardTemplate event={mockEvent} isExpired={false} />
}
