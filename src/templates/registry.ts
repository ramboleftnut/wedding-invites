import type { ComponentType } from 'react'
import type { WeddingEvent, RSVP } from '@/types'

export interface TemplateProps {
  event: WeddingEvent
  onRSVPSubmit?: (data: Omit<RSVP, 'id' | 'eventId' | 'createdAt'>) => Promise<void>
  isExpired?: boolean
  guestName?: string
}

// Lazy imports keep the bundle small — only the used template is loaded
import PhoneCardTemplate from './PhoneCardTemplate'

const registry: Record<string, ComponentType<TemplateProps>> = {
  'phone-card': PhoneCardTemplate,
}

export function getTemplateComponent(componentKey?: string): ComponentType<TemplateProps> {
  return registry[componentKey ?? 'phone-card'] ?? PhoneCardTemplate
}
