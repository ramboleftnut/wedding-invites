import type { WeddingEvent, EventMember, Side } from '@/types'

export function getMember(
  event: WeddingEvent,
  uid: string | null | undefined,
): EventMember | null {
  if (!uid) return null
  return event.members?.[uid] ?? null
}

export function isOwner(event: WeddingEvent, uid: string | null | undefined): boolean {
  return !!uid && event.ownerId === uid
}

export function isAdmin(event: WeddingEvent, uid: string | null | undefined): boolean {
  if (isOwner(event, uid)) return true
  return getMember(event, uid)?.role === 'admin'
}

export function isMember(event: WeddingEvent, uid: string | null | undefined): boolean {
  return !!getMember(event, uid)
}

export function canEditSide(
  event: WeddingEvent,
  uid: string | null | undefined,
  side: Side,
): boolean {
  const m = getMember(event, uid)
  if (!m) return false
  if (m.role === 'owner' || m.role === 'admin') return true
  return m.side === 'both' || m.side === side
}

export function canViewSide(
  event: WeddingEvent,
  uid: string | null | undefined,
  side: Side,
): boolean {
  const m = getMember(event, uid)
  if (!m) return false
  if (m.role === 'owner' || m.role === 'admin') return true
  if (m.side === 'both' || m.side === side) return true
  return m.canViewBothSides
}

export function canEditEventDetails(event: WeddingEvent, uid: string | null | undefined): boolean {
  return isAdmin(event, uid)
}

export function canInvite(event: WeddingEvent, uid: string | null | undefined): boolean {
  return isAdmin(event, uid)
}

export function canManageMembers(event: WeddingEvent, uid: string | null | undefined): boolean {
  return isOwner(event, uid)
}

export function visibleSides(event: WeddingEvent, uid: string | null | undefined): Side[] {
  const m = getMember(event, uid)
  if (!m) return []
  if (m.role === 'owner' || m.role === 'admin' || m.side === 'both' || m.canViewBothSides) {
    return ['bride', 'groom']
  }
  return [m.side]
}

export function editableSides(event: WeddingEvent, uid: string | null | undefined): Side[] {
  const m = getMember(event, uid)
  if (!m) return []
  if (m.role === 'owner' || m.role === 'admin' || m.side === 'both') {
    return ['bride', 'groom']
  }
  return [m.side]
}
