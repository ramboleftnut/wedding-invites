import { getTemplateAdmin } from '@/lib/firestore-admin'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import TemplateDetailClient from './_components/TemplateDetailClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  let template = null
  try {
    template = await getTemplateAdmin(id)
  } catch { /* Firebase not configured */ }

  return {
    title: template ? `${template.name} — Vows & Co` : 'Template — Vows & Co',
    description: template?.description || 'Wedding invitation template',
  }
}

export default async function TemplatePage({ params }: Props) {
  const { id } = await params

  let template = null
  try {
    template = await getTemplateAdmin(id)
  } catch { /* Firebase not configured */ }

  if (!template) notFound()

  return (
    <>
      <Navbar />
      <TemplateDetailClient template={template} />
      <Footer />
    </>
  )
}
