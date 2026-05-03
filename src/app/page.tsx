import { getTemplatesAdmin } from '@/lib/firestore-admin'
import type { Template } from '@/types'

export const dynamic = 'force-dynamic'
import Hero from '@/components/sections/Hero'
import TemplateGrid from '@/components/sections/TemplateGrid'
import About from '@/components/sections/About'
import Footer from '@/components/sections/Footer'
import Navbar from '@/components/sections/Navbar'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default async function HomePage() {
  let templates: Template[] = []
  try {
    templates = await getTemplatesAdmin()
  } catch (err) {
    console.error('[HomePage] getTemplatesAdmin() failed:', err)
  }

  const featured = templates.slice(0, 5)

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />

        {/* Featured Templates */}
        <section className="py-20 bg-stone-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-rose-400 text-sm font-medium tracking-widest uppercase mb-3">Designs</p>
              <h2 className="font-serif text-4xl text-stone-800">Featured Templates</h2>
              <p className="text-stone-500 mt-3 max-w-xl mx-auto">
                Handcrafted designs for every wedding style — classic, modern, minimalist, and more.
              </p>
            </div>

            {featured.length > 0 ? (
              <>
                <TemplateGrid templates={featured} />
                <div className="text-center mt-10">
                  <Link href="/store">
                    <Button variant="outline" size="lg">View All Templates</Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-stone-400">
                <div className="text-5xl mb-4">💌</div>
                <p className="text-lg font-medium text-stone-500 mb-2">Templates coming soon</p>
                <p className="text-sm">Configure Firebase to add your first template.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="font-serif text-4xl mb-4">Ready to Share Your Love Story?</h2>
            <p className="text-rose-100 text-lg mb-8">
              Join couples who chose a modern, beautiful way to invite their loved ones.
            </p>
            <Link href="/auth?tab=register">
              <button className="bg-white text-rose-500 font-semibold px-8 py-3 rounded-lg hover:bg-rose-50 transition-colors">
                Start for Free
              </button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
