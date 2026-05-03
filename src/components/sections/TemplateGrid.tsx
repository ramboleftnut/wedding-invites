'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Template } from '@/types'
import Button from '@/components/ui/Button'

interface TemplateGridProps {
  templates: Template[]
  limit?: number
}

export default function TemplateGrid({ templates, limit }: TemplateGridProps) {
  const items = limit ? templates.slice(0, limit) : templates

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
    </div>
  )
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-rose-50 to-amber-50 overflow-hidden">
        {template.previewImage ? (
          <Image
            src={template.previewImage}
            alt={template.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="h-16 w-16 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {template.isFree && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Free
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-stone-800 mb-1">{template.name}</h3>
        {template.description && (
          <p className="text-sm text-stone-500 mb-3 line-clamp-2">{template.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-stone-800">
            {template.price === 0 ? 'Free' : `$${template.price}`}
          </span>
          <div className="flex gap-2">
            <Link href={`/store/${template.id}`}>
              <Button variant="outline" size="sm">Preview</Button>
            </Link>
            <Link href={`/store/${template.id}`}>
              <Button size="sm">{template.price === 0 ? 'Use Free' : 'Purchase'}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
