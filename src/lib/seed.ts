'use server'

import { createTemplate, getTemplates } from './firestore'

export async function seedDefaultTemplates() {
  const existing = await getTemplates()
  if (existing.length > 0) return

  await createTemplate({
    name: 'Classic Envelope',
    price: 0,
    isFree: true,
    previewImage: '',
    description: 'A beautiful envelope-style invitation. Tap to open and reveal your wedding details inside. Clean, minimal, and mobile-first.',
    fieldsSchema: [
      { name: 'brideName', label: "Bride's Name", type: 'text', required: true },
      { name: 'groomName', label: "Groom's Name", type: 'text', required: true },
      { name: 'eventDate', label: 'Wedding Date', type: 'date', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'coverImage', label: 'Cover Image', type: 'image', required: false },
      { name: 'galleryImages', label: 'Gallery Images', type: 'images', required: false },
    ],
  })
}
