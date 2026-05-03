import { getTemplatesAdmin } from '@/lib/firestore-admin'
import type { Template } from '@/types'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import StorePage from '@/components/featured-pages/StorePage'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Templates — Vows & Co',
  description: 'Browse our collection of beautiful wedding invitation templates.',
}

export default async function Store() {
  let templates: Template[] = []
  try {
    templates = await getTemplatesAdmin()
  } catch (err) {
    console.error('[Store] getTemplatesAdmin() failed:', err)
  }

  return (
    <>
      <Navbar />
      <StorePage templates={templates} />
      <Footer />
    </>
  )
}
