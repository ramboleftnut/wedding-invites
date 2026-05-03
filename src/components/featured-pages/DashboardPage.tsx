'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserEvents, getEventRSVPs, getTemplate, updateEvent,
  getEventInvitations, createInvitation, generateToken,
} from '@/lib/firestore'
import { firebaseStorage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  serifFonts, sansFonts, scriptFonts, categoryGoogleUrl,
  defaultFonts, type FontCategory,
} from '@/lib/fonts'
import type { WeddingEvent, RSVP, Template, Invitation, FontSelection } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

type View = 'list' | 'edit' | 'share' | 'rsvps'
type EditorTab = 'details' | 'fonts' | 'images'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null)
  const [selectedEventRSVPs, setSelectedEventRSVPs] = useState<RSVP[]>([])
  const [selectedEventInvitations, setSelectedEventInvitations] = useState<Invitation[]>([])
  const [templates, setTemplates] = useState<Record<string, Template>>({})
  const [view, setView] = useState<View>('list')
  const [saving, setSaving] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)
  const [editData, setEditData] = useState({
    brideName: '', groomName: '', eventName: '', eventDate: '', location: '', message: '',
  })
  const [fonts, setFonts] = useState<FontSelection>(defaultFonts)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    loadEvents()
  }, [user])

  async function loadEvents() {
    try {
      const evs = await getUserEvents(user!.uid)
      setEvents(evs)
      const tMap: Record<string, Template> = {}
      for (const ev of evs) {
        if (!tMap[ev.templateId]) {
          const t = await getTemplate(ev.templateId)
          if (t) tMap[ev.templateId] = t
        }
      }
      setTemplates(tMap)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }

  function openEdit(event: WeddingEvent) {
    setSelectedEvent(event)
    setEditData({
      brideName:  event.data.brideName  || '',
      groomName:  event.data.groomName  || '',
      eventName:  event.data.eventName  || '',
      eventDate:  event.eventDate       || '',
      location:   event.data.location   || '',
      message:    event.data.message    || '',
    })
    setFonts(event.data.fonts ?? defaultFonts)
    setView('edit')
  }

  async function openShare(event: WeddingEvent) {
    setSelectedEvent(event)
    try {
      setSelectedEventInvitations(await getEventInvitations(event.id))
    } catch { /* ignore */ }
    setView('share')
  }

  async function openRSVPs(event: WeddingEvent) {
    setSelectedEvent(event)
    try {
      setSelectedEventRSVPs(await getEventRSVPs(event.id))
    } catch { /* ignore */ }
    setView('rsvps')
  }

  async function handleSave() {
    if (!selectedEvent) return
    setSaving(true)
    try {
      await updateEvent(selectedEvent.id, {
        eventDate: editData.eventDate,
        data: {
          ...selectedEvent.data,
          brideName: editData.brideName,
          groomName: editData.groomName,
          eventName: editData.eventName,
          location:  editData.location,
          message:   editData.message,
          fonts,
        },
      })
      flash('Saved!')
      await loadEvents()
    } finally {
      setSaving(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedEvent) return
    const storageRef = ref(firebaseStorage(), `events/${selectedEvent.id}/cover-${Date.now()}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    await updateEvent(selectedEvent.id, { data: { ...selectedEvent.data, coverImage: url } })
    setSelectedEvent({ ...selectedEvent, data: { ...selectedEvent.data, coverImage: url } })
    flash('Cover updated!')
    loadEvents()
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !selectedEvent) return
    const urls = await Promise.all(files.map(async file => {
      const storageRef = ref(firebaseStorage(), `events/${selectedEvent.id}/gallery-${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      return getDownloadURL(storageRef)
    }))
    const merged = [...(selectedEvent.data.galleryImages || []), ...urls]
    await updateEvent(selectedEvent.id, { data: { ...selectedEvent.data, galleryImages: merged } })
    setSelectedEvent({ ...selectedEvent, data: { ...selectedEvent.data, galleryImages: merged } })
    flash('Gallery updated!')
  }

  async function handleAddGuest(guestName: string, guestEmail: string) {
    if (!selectedEvent) return
    setAddingGuest(true)
    try {
      const token = generateToken(guestName)
      await createInvitation({ eventId: selectedEvent.id, guestName, guestEmail: guestEmail || undefined, token, status: 'pending' })
      setSelectedEventInvitations(await getEventInvitations(selectedEvent.id))
    } finally {
      setAddingGuest(false)
    }
  }

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-stone-800">My Dashboard</h1>
            <p className="text-stone-500 text-sm mt-1">Manage your wedding invitations</p>
          </div>
          <Link href="/store"><Button variant="outline" size="sm">+ Get New Template</Button></Link>
        </div>

        {view === 'list' && (
          <EventList events={events} templates={templates} baseUrl={baseUrl}
            onEdit={openEdit} onShare={openShare} onViewRSVPs={openRSVPs} />
        )}

        {view === 'edit' && selectedEvent && (
          <EventEditor
            event={selectedEvent} editData={editData} setEditData={setEditData}
            fonts={fonts} setFonts={setFonts}
            onSave={handleSave} saving={saving} successMsg={successMsg}
            onCoverUpload={handleCoverUpload} onGalleryUpload={handleGalleryUpload}
            onBack={() => setView('list')} baseUrl={baseUrl}
          />
        )}

        {view === 'share' && selectedEvent && (
          <ShareView
            event={selectedEvent} invitations={selectedEventInvitations}
            baseUrl={baseUrl} onAdd={handleAddGuest} adding={addingGuest}
            onBack={() => setView('list')}
          />
        )}

        {view === 'rsvps' && selectedEvent && (
          <RSVPList event={selectedEvent} rsvps={selectedEventRSVPs} onBack={() => setView('list')} />
        )}
      </div>
    </main>
  )
}

// ─── Event List ───────────────────────────────────────────────────────────────

function EventList({ events, templates, baseUrl, onEdit, onShare, onViewRSVPs }: {
  events: WeddingEvent[]
  templates: Record<string, Template>
  baseUrl: string
  onEdit: (e: WeddingEvent) => void
  onShare: (e: WeddingEvent) => void
  onViewRSVPs: (e: WeddingEvent) => void
}) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-16 text-center shadow-sm">
        <div className="text-5xl mb-4">💌</div>
        <h2 className="text-xl font-semibold text-stone-700 mb-2">No invitations yet</h2>
        <p className="text-stone-500 text-sm mb-6">Get started by purchasing or using a free template.</p>
        <Link href="/store"><Button>Browse Templates</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map(event => {
        const template = templates[event.templateId]
        const isExpired = event.eventDate ? new Date(event.eventDate + 'T23:59:59') < new Date() : false
        const previewUrl = `${baseUrl}/event/${event.slug}`

        return (
          <div key={event.id} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-stone-800">
                    {event.data.brideName && event.data.groomName
                      ? `${event.data.brideName} & ${event.data.groomName}`
                      : 'Untitled Invitation'}
                  </h3>
                  {isExpired && <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Expired</span>}
                </div>
                <p className="text-sm text-stone-500">
                  {template?.name || 'Template'} •{' '}
                  {event.eventDate ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString() : 'Date not set'} •{' '}
                  {event.data.location || 'Location not set'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">Preview</Button>
                </a>
                <Button variant="outline" size="sm" onClick={() => onShare(event)}>Share</Button>
                <Button variant="outline" size="sm" onClick={() => onViewRSVPs(event)}>RSVPs</Button>
                <Button size="sm" onClick={() => onEdit(event)}>Customize</Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Event Editor ─────────────────────────────────────────────────────────────

function EventEditor({ event, editData, setEditData, fonts, setFonts, onSave, saving, successMsg, onCoverUpload, onGalleryUpload, onBack, baseUrl }: {
  event: WeddingEvent
  editData: { brideName: string; groomName: string; eventName: string; eventDate: string; location: string; message: string }
  setEditData: (d: typeof editData) => void
  fonts: FontSelection
  setFonts: (f: FontSelection) => void
  onSave: () => void
  saving: boolean
  successMsg: string
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  baseUrl: string
}) {
  const [tab, setTab] = useState<EditorTab>('details')

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-stone-800">Customize Invitation</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100">
        {(['details', 'fonts', 'images'] as EditorTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-rose-500 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'details' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Bride's Name" value={editData.brideName} onChange={e => setEditData({ ...editData, brideName: e.target.value })} placeholder="e.g. Sofia" />
              <Input label="Groom's Name" value={editData.groomName} onChange={e => setEditData({ ...editData, groomName: e.target.value })} placeholder="e.g. Luca" />
            </div>
            <Input label="Event Name (optional)" value={editData.eventName} onChange={e => setEditData({ ...editData, eventName: e.target.value })} placeholder="e.g. Our Wedding Day" />
            <Input label="Wedding Date" type="date" value={editData.eventDate} onChange={e => setEditData({ ...editData, eventDate: e.target.value })} />
            <Input label="Location" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} placeholder="e.g. Villa Rosa, Santorini" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-700">Message (optional)</label>
              <textarea
                value={editData.message} onChange={e => setEditData({ ...editData, message: e.target.value })}
                placeholder="A personal note to your guests..." rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none text-sm"
              />
            </div>
          </div>
        )}

        {tab === 'fonts' && (
          <FontPicker fonts={fonts} onChange={setFonts}
            preview={`${editData.brideName || 'Sofia'} & ${editData.groomName || 'Luca'}`} />
        )}

        {tab === 'images' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-2">Cover Image</label>
              {event.data.coverImage && (
                <img src={event.data.coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg mb-3" />
              )}
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors">
                  <svg className="h-8 w-8 text-stone-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-stone-500">Click to upload cover image</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-2">Gallery Images</label>
              {(event.data.galleryImages || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {event.data.galleryImages!.map((url, i) => (
                    <img key={i} src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                  ))}
                </div>
              )}
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center hover:border-rose-400 transition-colors">
                  <p className="text-sm text-stone-500">Click to add gallery images</p>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onGalleryUpload} />
              </label>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-5 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{successMsg}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button onClick={onSave} loading={saving} className="flex-1">Save Changes</Button>
          <a href={`${baseUrl}/event/${event.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Preview</Button>
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Font Picker ──────────────────────────────────────────────────────────────

function FontPicker({ fonts, onChange, preview }: {
  fonts: FontSelection
  onChange: (f: FontSelection) => void
  preview: string
}) {
  const [cat, setCat] = useState<FontCategory>('serif')
  const [loadedCats, setLoadedCats] = useState<Set<FontCategory>>(new Set())

  // Load Google Fonts for the active category when tab opens
  useEffect(() => {
    if (loadedCats.has(cat)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = categoryGoogleUrl(cat)
    link.setAttribute(`data-gf-${cat}`, '1')
    document.head.appendChild(link)
    setLoadedCats(prev => new Set(prev).add(cat))
  }, [cat])

  const categoryFonts = { serif: serifFonts, sans: sansFonts, script: scriptFonts }
  const currentFont = cat === 'serif' ? fonts.serif : cat === 'sans' ? fonts.sans : fonts.script
  const labels: Record<FontCategory, string> = { serif: 'Serif', sans: 'Sans-serif', script: 'Script' }
  const usageNote: Record<FontCategory, string> = {
    serif: 'Used for date, location & body text',
    sans: 'Used for labels and UI elements',
    script: 'Used for the couple\'s names',
  }

  function select(name: string) {
    onChange({ ...fonts, [cat]: name })
  }

  return (
    <div>
      {/* Preview */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 mb-6 text-center">
        <p className="text-xs text-stone-400 mb-2 uppercase tracking-wider">Preview</p>
        <div style={{ fontFamily: `'${fonts.script}', cursive`, fontSize: '28px', color: '#1c1917' }}>
          {preview}
        </div>
        <div style={{ fontFamily: `'${fonts.serif}', serif`, fontSize: '14px', color: '#78716c', marginTop: '4px' }}>
          Saturday, September 14, 2025 · Santorini, Greece
        </div>
        <div style={{ fontFamily: `'${fonts.sans}', sans-serif`, fontSize: '11px', color: '#a8a29e', marginTop: '4px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          You are cordially invited
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-4 w-fit">
        {(Object.keys(labels) as FontCategory[]).map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              cat === c ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}>
            {labels[c]}
          </button>
        ))}
      </div>
      <p className="text-xs text-stone-400 mb-4">{usageNote[cat]}</p>

      {/* Font grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {categoryFonts[cat].map(font => (
          <button
            key={font.name}
            onClick={() => select(font.name)}
            className={`p-3 rounded-xl border-2 text-center transition-all hover:border-rose-300 ${
              currentFont === font.name
                ? 'border-rose-500 bg-rose-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div style={{ fontFamily: `'${font.name}', ${cat === 'script' ? 'cursive' : cat === 'serif' ? 'serif' : 'sans-serif'}`, fontSize: cat === 'script' ? '22px' : '18px', color: '#1c1917', lineHeight: 1.2 }}>
              Aa
            </div>
            <div className="text-xs text-stone-500 mt-1.5 leading-tight" style={{ fontSize: '10px' }}>
              {font.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Share View ───────────────────────────────────────────────────────────────

function ShareView({ event, invitations, baseUrl, onAdd, adding, onBack }: {
  event: WeddingEvent
  invitations: Invitation[]
  baseUrl: string
  onAdd: (name: string, email: string) => Promise<void>
  adding: boolean
  onBack: () => void
}) {
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [copiedGeneral, setCopiedGeneral] = useState(false)

  const generalLink = `${baseUrl}/event/${event.slug}`
  const pending = invitations.filter(i => i.status === 'pending').length
  const accepted = invitations.filter(i => i.status === 'accepted').length

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    if (key === 'general') {
      setCopiedGeneral(true)
      setTimeout(() => setCopiedGeneral(false), 2000)
    } else {
      setCopiedToken(key)
      setTimeout(() => setCopiedToken(null), 2000)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await onAdd(guestName, guestEmail)
    setGuestName('')
    setGuestEmail('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-stone-800">Share Invitation</h2>
      </div>

      {/* General link */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0 text-lg">🔗</div>
          <div>
            <h3 className="font-semibold text-stone-800">One link for everyone</h3>
            <p className="text-sm text-stone-500 mt-0.5">Share this with all your guests. Anyone with the link can view the invitation and RSVP with their own name.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input readOnly value={generalLink}
            className="flex-1 text-sm bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-stone-600 min-w-0" />
          <Button size="sm" onClick={() => copy(generalLink, 'general')} className="shrink-0">
            {copiedGeneral ? '✓ Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Personalised links */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-lg">✉️</div>
            <div>
              <h3 className="font-semibold text-stone-800">Personalised links</h3>
              <p className="text-sm text-stone-500 mt-0.5">
                Generate a unique link per guest. Their name is pre-filled and you can track who accepted.
                {invitations.length > 0 && ` — ${accepted} accepted, ${pending} pending`}
              </p>
            </div>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Guest name (required)" value={guestName}
              onChange={e => setGuestName(e.target.value)} required className="flex-1" />
            <Input placeholder="Email (optional)" type="email" value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)} className="flex-1" />
            <Button type="submit" loading={adding} className="shrink-0">Generate</Button>
          </form>
        </div>

        {invitations.length === 0 ? (
          <div className="p-10 text-center text-stone-400">
            <p className="text-3xl mb-2">✉️</p>
            <p className="text-sm">No personalised links yet. Add your first guest above.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {invitations.map(inv => {
              const link = `${baseUrl}/invite/${inv.token}`
              return (
                <div key={inv.id} className="p-4 sm:p-5 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    inv.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {inv.status === 'accepted' ? '✓' : '…'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-stone-800">{inv.guestName}</span>
                      {inv.guestEmail && <span className="text-sm text-stone-400">{inv.guestEmail}</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status === 'accepted' ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input readOnly value={link}
                        className="text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 text-stone-500 flex-1 min-w-0" />
                      <button onClick={() => copy(link, inv.token)}
                        className="text-xs text-rose-500 hover:text-rose-600 font-medium shrink-0 transition-colors">
                        {copiedToken === inv.token ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── RSVP List ────────────────────────────────────────────────────────────────

function RSVPList({ event, rsvps, onBack }: { event: WeddingEvent; rsvps: RSVP[]; onBack: () => void }) {
  const attending = rsvps.filter(r => r.attending === 'yes').length
  const declining = rsvps.filter(r => r.attending === 'no').length

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
      <div className="p-6 border-b border-stone-100 flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="font-semibold text-stone-800">RSVP Responses</h2>
          <p className="text-xs text-stone-500 mt-0.5">{rsvps.length} total — {attending} attending, {declining} declining</p>
        </div>
      </div>
      {rsvps.length === 0 ? (
        <div className="p-12 text-center text-stone-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No RSVPs yet. Share your invitation to get responses!</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-50">
          {rsvps.map(rsvp => (
            <div key={rsvp.id} className="p-4 sm:p-5 flex items-start gap-4">
              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                rsvp.attending === 'yes' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
              }`}>
                {rsvp.attending === 'yes' ? '✓' : '✗'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-stone-800">{rsvp.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    rsvp.attending === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {rsvp.attending === 'yes' ? 'Attending' : 'Declining'}
                  </span>
                </div>
                <p className="text-sm text-stone-500">{rsvp.email}</p>
                {rsvp.message && <p className="text-sm text-stone-600 mt-1 italic">&ldquo;{rsvp.message}&rdquo;</p>}
                <p className="text-xs text-stone-400 mt-1">{new Date(rsvp.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
