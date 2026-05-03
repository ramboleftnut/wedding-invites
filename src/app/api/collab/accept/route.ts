import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded
    try {
      decoded = await adminAuth().verifyIdToken(idToken)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { token } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const db = adminDb()
    const inviteSnap = await db
      .collection('eventInvites')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (inviteSnap.empty) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }
    const inviteDoc = inviteSnap.docs[0]
    const invite = inviteDoc.data()

    if (invite.status === 'revoked') {
      return NextResponse.json({ error: 'Invite revoked' }, { status: 410 })
    }

    const eventRef = db.collection('events').doc(invite.eventId)
    const eventSnap = await eventRef.get()
    if (!eventSnap.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const member = {
      role: invite.role,
      side: invite.side,
      canViewBothSides: invite.canViewBothSides,
      email: decoded.email || invite.email || '',
      addedAt: FieldValue.serverTimestamp(),
    }

    await eventRef.update({
      [`members.${decoded.uid}`]: member,
      memberIds: FieldValue.arrayUnion(decoded.uid),
    })

    if (invite.status !== 'accepted') {
      await inviteDoc.ref.update({ status: 'accepted' })
    }

    return NextResponse.json({ ok: true, eventId: invite.eventId })
  } catch (err: unknown) {
    console.error('Collab accept error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
