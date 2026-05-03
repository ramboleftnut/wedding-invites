'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllOrders,
  getAllEvents,
} from '@/lib/firestore'
import { firebaseStorage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { Template, Order, WeddingEvent } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Tab = 'templates' | 'orders' | 'events'

export default function AdminPage() {
  const { user, appUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('templates')

  useEffect(() => {
    if (!authLoading && (!user || appUser?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, appUser, authLoading, router])

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  if (!user || appUser?.role !== 'admin') return null

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-serif text-3xl text-stone-800 mb-6">Admin Panel</h1>

        <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 mb-8 w-fit">
          {(['templates', 'orders', 'events'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                tab === t ? 'bg-rose-500 text-white' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'templates' && <TemplatesTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'events' && <EventsTab />}
      </div>
    </main>
  )
}

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', componentKey: 'phone-card', price: 50, description: '', isFree: false })
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setTemplates(await getTemplates())
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', componentKey: 'phone-card', price: 50, description: '', isFree: false })
    setPreviewFile(null)
    setShowForm(true)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setForm({ name: t.name, componentKey: t.componentKey || 'phone-card', price: t.price, description: t.description || '', isFree: t.isFree || false })
    setPreviewFile(null)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let previewImage = editing?.previewImage || ''

      if (previewFile) {
        setUploading(true)
        const storageRef = ref(firebaseStorage(), `templates/preview-${Date.now()}`)
        await uploadBytes(storageRef, previewFile)
        previewImage = await getDownloadURL(storageRef)
        setUploading(false)
      }

      const data = {
        name: form.name,
        componentKey: form.componentKey,
        price: form.isFree ? 0 : form.price,
        description: form.description,
        isFree: form.isFree,
        previewImage,
        fieldsSchema: [
          { name: 'brideName', label: "Bride's Name", type: 'text' as const, required: true },
          { name: 'groomName', label: "Groom's Name", type: 'text' as const, required: true },
          { name: 'eventDate', label: 'Wedding Date', type: 'date' as const, required: true },
          { name: 'location', label: 'Location', type: 'text' as const, required: true },
          { name: 'coverImage', label: 'Cover Image', type: 'image' as const, required: false },
          { name: 'galleryImages', label: 'Gallery Images', type: 'images' as const, required: false },
        ],
      }

      if (editing) {
        await updateTemplate(editing.id, data)
      } else {
        await createTemplate(data)
      }

      await load()
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save template:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    await deleteTemplate(id)
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-stone-800">Templates ({templates.length})</h2>
        <Button size="sm" onClick={openNew}>+ New Template</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-stone-800 mb-4">{editing ? 'Edit Template' : 'New Template'}</h3>
          <div className="space-y-4">
            <Input
              label="Template Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Classic Envelope"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-700">Component Key</label>
              <select
                value={form.componentKey}
                onChange={e => setForm({ ...form, componentKey: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
              >
                <option value="phone-card">phone-card — Phone Card (envelope)</option>
              </select>
              <p className="text-xs text-stone-400">Maps this template to a React component in /src/templates/</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFree"
                checked={form.isFree}
                onChange={e => setForm({ ...form, isFree: e.target.checked })}
                className="rounded border-stone-300"
              />
              <label htmlFor="isFree" className="text-sm text-stone-700">Free template</label>
            </div>
            {!form.isFree && (
              <Input
                label="Price ($)"
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                min={1}
              />
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-700">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-2">Preview Image</label>
              {editing?.previewImage && !previewFile && (
                <img src={editing.previewImage} alt="Preview" className="h-24 object-cover rounded-lg mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => setPreviewFile(e.target.files?.[0] || null)}
                className="text-sm text-stone-600"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} loading={saving || uploading}>{editing ? 'Save' : 'Create'}</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-12 bg-stone-100 rounded-lg overflow-hidden shrink-0">
              {t.previewImage && <img src={t.previewImage} alt={t.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800">{t.name}</p>
              <p className="text-sm text-stone-500">{t.isFree ? 'Free' : `$${t.price}`}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(t)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(t.id)}>Delete</Button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="bg-white rounded-xl border border-stone-100 p-10 text-center text-stone-400">
            No templates yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h2 className="font-semibold text-stone-800 mb-5">Orders ({orders.length})</h2>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-stone-400">No orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                {['Order ID', 'User', 'Template', 'Amount', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-stone-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-stone-700">{order.userId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-stone-700">{order.templateId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-medium text-stone-800">${order.amount}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function EventsTab() {
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllEvents().then(setEvents).catch(console.error).finally(() => setLoading(false))
  }, [])

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h2 className="font-semibold text-stone-800 mb-5">Events ({events.length})</h2>
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-100 p-10 text-center text-stone-400">
            No events yet.
          </div>
        ) : events.map(ev => (
          <div key={ev.id} className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-stone-800">
                  {ev.data.brideName && ev.data.groomName
                    ? `${ev.data.brideName} & ${ev.data.groomName}`
                    : 'Untitled'}
                </p>
                <p className="text-sm text-stone-500 mt-0.5">
                  {ev.data.location || 'No location'} •{' '}
                  {ev.eventDate || 'No date'} •{' '}
                  <span className="font-mono text-xs">{ev.userId.slice(0, 8)}</span>
                </p>
              </div>
              <a
                href={`${baseUrl}/event/${ev.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-500 hover:underline shrink-0"
              >
                View →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
