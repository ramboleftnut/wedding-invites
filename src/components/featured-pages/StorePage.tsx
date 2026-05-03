'use client'

import { useState } from 'react'
import type { Template } from '@/types'
import TemplateGrid from '@/components/sections/TemplateGrid'

export default function StorePage({ templates }: { templates: Template[] }) {
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-rose-400 text-sm font-medium tracking-widest uppercase mb-3">Templates</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-stone-800 mb-4">
            Wedding Invitation Templates
          </h1>
          <p className="text-stone-500 max-w-xl mx-auto">
            Choose from our carefully curated collection of digital wedding invitations.
          </p>

          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {filtered.length > 0 ? (
          <>
            <p className="text-sm text-stone-500 mb-6">{filtered.length} template{filtered.length !== 1 ? 's' : ''} available</p>
            <TemplateGrid templates={filtered} />
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💌</div>
            <p className="text-lg font-medium text-stone-600 mb-2">
              {search ? 'No templates match your search' : 'No templates yet'}
            </p>
            <p className="text-stone-400 text-sm">
              {search ? 'Try a different search term.' : 'Check back soon — new designs are coming!'}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
