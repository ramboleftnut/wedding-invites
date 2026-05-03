import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeWebhookClient } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { generateSlug } from '@/lib/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripeClient = getStripeWebhookClient()
  let event: Stripe.Event

  try {
    event = stripeClient.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { templateId, userId } = session.metadata || {}

    if (!templateId || !userId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const db = adminDb()

    // Idempotency check
    const existingOrders = await db.collection('orders')
      .where('stripeSessionId', '==', session.id)
      .limit(1)
      .get()

    if (!existingOrders.empty) {
      return NextResponse.json({ received: true })
    }

    const templateSnap = await db.collection('templates').doc(templateId).get()
    if (!templateSnap.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Create order
    await db.collection('orders').add({
      userId,
      templateId,
      stripeSessionId: session.id,
      amount: (session.amount_total || 0) / 100,
      createdAt: FieldValue.serverTimestamp(),
    })

    // Create event
    const slug = generateSlug('bride', 'groom')
    await db.collection('events').add({
      userId,
      templateId,
      slug,
      eventDate: '',
      data: {
        brideName: '',
        groomName: '',
        location: '',
      },
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  return NextResponse.json({ received: true })
}
