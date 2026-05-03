import emailjs from '@emailjs/browser'

export async function sendRSVPNotification({
  toEmail,
  eventName,
  guestName,
  attending,
}: {
  toEmail: string
  eventName: string
  guestName: string
  attending: 'yes' | 'no'
}) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) return

  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: toEmail,
      event_name: eventName,
      guest_name: guestName,
      attending_status: attending === 'yes' ? 'Attending' : 'Not attending',
    },
    publicKey
  )
}
