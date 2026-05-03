import type { WeddingEvent, EventMember, EventData } from '@/types'

interface EventNormalizationInput {
  id: string
  userId?: string
  ownerId?: string
  members?: Record<string, EventMember>
  memberIds?: string[]
  templateId: string
  componentKey: string
  slug: string
  eventDate?: string
  data: EventData
  createdAt: Date
}

export function normalizeEvent(input: EventNormalizationInput): WeddingEvent {
  const userId = input.userId || ''
  const ownerId = input.ownerId || userId
  const hasMembers =
    input.members && typeof input.members === 'object' && Object.keys(input.members).length > 0
  const members = hasMembers
    ? input.members!
    : ownerId
      ? { [ownerId]: { role: 'owner' as const, side: 'both' as const, canViewBothSides: true } }
      : {}
  const memberIds =
    Array.isArray(input.memberIds) && input.memberIds.length > 0
      ? input.memberIds
      : Object.keys(members)
  return {
    id: input.id,
    userId,
    ownerId,
    members,
    memberIds,
    templateId: input.templateId,
    componentKey: input.componentKey,
    slug: input.slug,
    eventDate: input.eventDate || '',
    data: input.data,
    createdAt: input.createdAt,
  }
}

export function eventNeedsMigration(raw: {
  ownerId?: unknown
  userId?: unknown
  members?: unknown
  memberIds?: unknown
}): boolean {
  if (!raw.userId || typeof raw.userId !== 'string') return false
  if (!raw.ownerId) return true
  if (!raw.members || typeof raw.members !== 'object' || Object.keys(raw.members as object).length === 0) {
    return true
  }
  if (!Array.isArray(raw.memberIds) || (raw.memberIds as unknown[]).length === 0) {
    return true
  }
  return false
}

export function buildOwnerMembers(ownerId: string): {
  members: Record<string, EventMember>
  memberIds: string[]
} {
  return {
    members: { [ownerId]: { role: 'owner', side: 'both', canViewBothSides: true } },
    memberIds: [ownerId],
  }
}
