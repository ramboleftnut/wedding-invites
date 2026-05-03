import Stripe from 'stripe'

function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export async function createCheckoutSession({
  templateId,
  templateName,
  price,
  userId,
  userEmail,
}: {
  templateId: string
  templateName: string
  price: number
  userId: string
  userEmail: string
}) {
  const stripeClient = createStripeClient()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: userEmail,
    metadata: { templateId, userId },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: price * 100,
          product_data: {
            name: templateName,
            description: `Wedding invitation template: ${templateName}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?success=1`,
    cancel_url: `${baseUrl}/store?cancelled=1`,
  })

  return session
}

export function getStripeWebhookClient() {
  return createStripeClient()
}
