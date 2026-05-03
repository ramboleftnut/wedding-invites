'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserEvents, getEventRSVPs, getTemplate, updateEvent,
  getEventInvitations, createInvitation, generateToken,
  getEventInvites, createEventInvite, updateEventInviteStatus,
  removeEventMember, updateEventMember, updateRSVPSide, updateRSVPTable,
  getEventTables, createTable, updateTable, deleteTable,
} from '@/lib/firestore'
import { isAdmin, isOwner, visibleSides, editableSides, canEditSide } from '@/lib/permissions'
import { firebaseStorage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  serifFonts, sansFonts, scriptFonts, categoryGoogleUrl,
  defaultFonts, type FontCategory,
} from '@/lib/fonts'
import type {
  WeddingEvent, RSVP, Template, Invitation, FontSelection,
  EventInvite, EventRole, Side, EventMember, Table,
} from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

type View = 'list' | 'edit' | 'share' | 'rsvps' | 'team' | 'tables'
type EditorTab = 'details' | 'fonts' | 'images'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null)
  const [selectedEventRSVPs, setSelectedEventRSVPs] = useState<RSVP[]>([])
  const [selectedEventInvitations, setSelectedEventInvitations] = useState<Invitation[]>([])
  const [selectedEventTeamInvites, setSelectedEventTeamInvites] = useState<EventInvite[]>([])
  const [selectedEventTables, setSelectedEventTables] = useState<Table[]>([])
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

  async function openTeam(event: WeddingEvent) {
    setSelectedEvent(event)
    try {
      setSelectedEventTeamInvites(await getEventInvites(event.id))
    } catch { /* ignore */ }
    setView('team')
  }

  async function refreshTeam() {
    if (!selectedEvent) return
    const evs = await getUserEvents(user!.uid)
    setEvents(evs)
    const fresh = evs.find(e => e.id === selectedEvent.id) ?? selectedEvent
    setSelectedEvent(fresh)
    setSelectedEventTeamInvites(await getEventInvites(fresh.id))
  }

  async function handleCreateTeamInvite(input: {
    email: string; role: EventRole; side: Side; canViewBothSides: boolean
  }) {
    if (!selectedEvent || !user) return
    const token = generateToken(input.email.split('@')[0] || 'collab')
    await createEventInvite({
      eventId: selectedEvent.id,
      email: input.email,
      role: input.role,
      side: input.side,
      canViewBothSides: input.canViewBothSides,
      token,
      status: 'pending',
      invitedByUid: user.uid,
    })
    await refreshTeam()
  }

  async function handleRevokeInvite(inviteId: string) {
    await updateEventInviteStatus(inviteId, 'revoked')
    await refreshTeam()
  }

  async function handleRemoveMember(uid: string) {
    if (!selectedEvent) return
    if (uid === selectedEvent.ownerId) return
    await removeEventMember(selectedEvent.id, uid)
    await refreshTeam()
  }

  async function handleUpdateMember(uid: string, patch: Partial<EventMember>) {
    if (!selectedEvent) return
    await updateEventMember(selectedEvent.id, uid, patch)
    await refreshTeam()
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

  async function handleAddGuest(guestName: string, guestEmail: string, side: Side, guestNames?: string[]) {
    if (!selectedEvent) return
    setAddingGuest(true)
    try {
      const token = generateToken(guestName)
      await createInvitation({
        eventId: selectedEvent.id,
        guestName,
        guestEmail: guestEmail || undefined,
        guestCount: guestNames ? guestNames.length : 1,
        guestNames: guestNames && guestNames.length > 1 ? guestNames : undefined,
        token,
        status: 'pending',
        side,
      })
      setSelectedEventInvitations(await getEventInvitations(selectedEvent.id))
    } finally {
      setAddingGuest(false)
    }
  }

  async function handleTagRSVPSide(rsvpId: string, side: Side) {
    await updateRSVPSide(rsvpId, side)
    if (selectedEvent) {
      setSelectedEventRSVPs(await getEventRSVPs(selectedEvent.id))
    }
  }

  async function openTables(event: WeddingEvent) {
    setSelectedEvent(event)
    try {
      const [tbls, rsvps] = await Promise.all([
        getEventTables(event.id),
        getEventRSVPs(event.id),
      ])
      setSelectedEventTables(tbls)
      setSelectedEventRSVPs(rsvps)
    } catch { /* ignore */ }
    setView('tables')
  }

  async function refreshTables() {
    if (!selectedEvent) return
    const [tbls, rsvps] = await Promise.all([
      getEventTables(selectedEvent.id),
      getEventRSVPs(selectedEvent.id),
    ])
    setSelectedEventTables(tbls)
    setSelectedEventRSVPs(rsvps)
  }

  async function handleCreateTable(input: { number: number; seats: number; side: Side }) {
    if (!selectedEvent) return
    await createTable({ eventId: selectedEvent.id, ...input })
    await refreshTables()
  }

  async function handleUpdateTable(id: string, patch: Partial<Table>) {
    await updateTable(id, patch)
    await refreshTables()
  }

  async function handleDeleteTable(id: string) {
    if (!selectedEvent) return
    // Unassign any RSVPs at this table first
    const assigned = selectedEventRSVPs.filter(r => r.tableId === id)
    await Promise.all(assigned.map(r => updateRSVPTable(r.id, null)))
    await deleteTable(id)
    await refreshTables()
  }

  async function handleAssignRSVP(rsvpId: string, tableId: string | null) {
    await updateRSVPTable(rsvpId, tableId)
    if (selectedEvent) {
      setSelectedEventRSVPs(await getEventRSVPs(selectedEvent.id))
    }
  }

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')

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
            currentUid={user?.uid}
            onEdit={openEdit} onShare={openShare} onViewRSVPs={openRSVPs}
            onTeam={openTeam} onTables={openTables} />
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

        {view === 'share' && selectedEvent && user && (
          <ShareView
            event={selectedEvent} invitations={selectedEventInvitations}
            currentUid={user.uid}
            baseUrl={baseUrl} onAdd={handleAddGuest} adding={addingGuest}
            onBack={() => setView('list')}
          />
        )}


        {view === 'rsvps' && selectedEvent && user && (
          <RSVPList
            event={selectedEvent}
            rsvps={selectedEventRSVPs}
            currentUid={user.uid}
            onTagSide={handleTagRSVPSide}
            onBack={() => setView('list')}
          />
        )}

        {view === 'tables' && selectedEvent && user && (
          <TablesView
            event={selectedEvent}
            tables={selectedEventTables}
            rsvps={selectedEventRSVPs}
            currentUid={user.uid}
            onCreate={handleCreateTable}
            onUpdate={handleUpdateTable}
            onDelete={handleDeleteTable}
            onAssign={handleAssignRSVP}
            onBack={() => setView('list')}
          />
        )}

        {view === 'team' && selectedEvent && user && (
          <TeamView
            event={selectedEvent}
            invites={selectedEventTeamInvites}
            currentUid={user.uid}
            baseUrl={baseUrl}
            onInvite={handleCreateTeamInvite}
            onRevokeInvite={handleRevokeInvite}
            onRemoveMember={handleRemoveMember}
            onUpdateMember={handleUpdateMember}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </main>
  )
}

// ─── Event List ───────────────────────────────────────────────────────────────

function EventList({ events, templates, baseUrl, currentUid, onEdit, onShare, onViewRSVPs, onTeam, onTables }: {
  events: WeddingEvent[]
  templates: Record<string, Template>
  baseUrl: string
  currentUid: string | undefined
  onEdit: (e: WeddingEvent) => void
  onShare: (e: WeddingEvent) => void
  onViewRSVPs: (e: WeddingEvent) => void
  onTeam: (e: WeddingEvent) => void
  onTables: (e: WeddingEvent) => void
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
                <Button variant="outline" size="sm" onClick={() => onTables(event)}>Tables</Button>
                {isAdmin(event, currentUid) && (
                  <Button variant="outline" size="sm" onClick={() => onTeam(event)}>Team</Button>
                )}
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

function ShareView({ event, invitations, currentUid, baseUrl, onAdd, adding, onBack }: {
  event: WeddingEvent
  invitations: Invitation[]
  currentUid: string
  baseUrl: string
  onAdd: (name: string, email: string, side: Side, guestNames?: string[]) => Promise<void>
  adding: boolean
  onBack: () => void
}) {
  const editable = editableSides(event, currentUid)
  const visible = visibleSides(event, currentUid)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestSide, setGuestSide] = useState<Side>(editable[0] ?? 'bride')
  const [guestCount, setGuestCount] = useState(1)
  const [nameFields, setNameFields] = useState<string[]>([''])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [copiedGeneral, setCopiedGeneral] = useState(false)

  const generalLink = `${baseUrl}/event/${event.slug}`
  const visibleInvites = invitations.filter(inv => !inv.side || visible.includes(inv.side))
  const pending = visibleInvites.filter(i => i.status === 'pending').length
  const accepted = visibleInvites.filter(i => i.status === 'accepted').length

  function handleCountChange(count: number) {
    setGuestCount(count)
    setNameFields(prev => {
      const next = [...prev]
      while (next.length < count) next.push('')
      return next.slice(0, count)
    })
  }

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
    if (guestCount > 1) {
      const names = nameFields.map(n => n.trim()).filter(Boolean)
      const label = guestName.trim() || names[0] || 'Group'
      await onAdd(label, guestEmail, guestSide, names)
    } else {
      await onAdd(guestName, guestEmail, guestSide)
    }
    setGuestName('')
    setGuestEmail('')
    setGuestCount(1)
    setNameFields([''])
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
                Generate a unique link per guest or family group.
                {invitations.length > 0 && ` — ${accepted} accepted, ${pending} pending`}
              </p>
            </div>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {guestCount === 1 ? (
                <Input placeholder="Guest name (required)" value={guestName}
                  onChange={e => setGuestName(e.target.value)} required className="flex-1" />
              ) : (
                <Input placeholder="Group label (e.g. Smith Family)" value={guestName}
                  onChange={e => setGuestName(e.target.value)} className="flex-1" />
              )}
              <Input placeholder="Email (optional)" type="email" value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)} className="flex-1" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-stone-500">Guests</label>
                <select
                  value={guestCount}
                  onChange={e => handleCountChange(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-stone-500">Side</label>
                <select
                  value={guestSide}
                  onChange={e => setGuestSide(e.target.value as Side)}
                  disabled={editable.length <= 1}
                  className="px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-stone-50 disabled:text-stone-500"
                >
                  {editable.includes('bride') && <option value="bride">{"Bride's side"}</option>}
                  {editable.includes('groom') && <option value="groom">{"Groom's side"}</option>}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" loading={adding} className="shrink-0">Generate</Button>
              </div>
            </div>
            {guestCount > 1 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-stone-500">Enter each guest&apos;s name:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nameFields.map((n, i) => (
                    <input
                      key={i}
                      required
                      placeholder={`Guest ${i + 1} name`}
                      value={n}
                      onChange={e => {
                        const updated = [...nameFields]
                        updated[i] = e.target.value
                        setNameFields(updated)
                      }}
                      className="px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {visibleInvites.length === 0 ? (
          <div className="p-10 text-center text-stone-400">
            <p className="text-3xl mb-2">✉️</p>
            <p className="text-sm">No personalised links yet. Add your first guest above.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {visibleInvites.map(inv => {
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
                      {inv.guestCount && inv.guestCount > 1 && (
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          {inv.guestCount} guests
                        </span>
                      )}
                      {inv.guestEmail && <span className="text-sm text-stone-400">{inv.guestEmail}</span>}
                      {inv.side && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          inv.side === 'bride' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {inv.side}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status === 'accepted' ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                    {inv.guestNames && inv.guestNames.length > 0 && (
                      <p className="text-xs text-stone-400 mb-1">{inv.guestNames.join(', ')}</p>
                    )}
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

function RSVPList({ event, rsvps, currentUid, onTagSide, onBack }: {
  event: WeddingEvent
  rsvps: RSVP[]
  currentUid: string
  onTagSide: (rsvpId: string, side: Side) => Promise<void>
  onBack: () => void
}) {
  const visible = visibleSides(event, currentUid)
  const editable = editableSides(event, currentUid)
  const viewerIsAdmin = isAdmin(event, currentUid)

  // Editors only see RSVPs whose side they can view. Untagged RSVPs visible only to admins/owner.
  const filtered = rsvps.filter(r => {
    if (!r.side) return viewerIsAdmin
    return visible.includes(r.side)
  })
  const attending = filtered.filter(r => r.attending === 'yes').length
  const declining = filtered.filter(r => r.attending === 'no').length

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
          <p className="text-xs text-stone-500 mt-0.5">{filtered.length} total — {attending} attending, {declining} declining</p>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-stone-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No RSVPs yet. Share your invitation to get responses!</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-50">
          {filtered.map(rsvp => (
            <div key={rsvp.id} className="p-4 sm:p-5 flex items-start gap-4">
              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                rsvp.attending === 'yes' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
              }`}>
                {rsvp.attending === 'yes' ? '✓' : '✗'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-stone-800">{rsvp.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {rsvp.side ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        rsvp.side === 'bride' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {rsvp.side}
                      </span>
                    ) : viewerIsAdmin ? (
                      <select
                        defaultValue=""
                        onChange={e => e.target.value && onTagSide(rsvp.id, e.target.value as Side)}
                        className="text-xs border border-stone-200 rounded px-2 py-0.5 bg-white text-stone-600"
                      >
                        <option value="" disabled>Tag side…</option>
                        {editable.includes('bride') && <option value="bride">Bride</option>}
                        {editable.includes('groom') && <option value="groom">Groom</option>}
                      </select>
                    ) : null}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      rsvp.attending === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {rsvp.attending === 'yes' ? 'Attending' : 'Declining'}
                    </span>
                  </div>
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

// ─── Team View ────────────────────────────────────────────────────────────────

function TeamView({
  event, invites, currentUid, baseUrl,
  onInvite, onRevokeInvite, onRemoveMember, onUpdateMember, onBack,
}: {
  event: WeddingEvent
  invites: EventInvite[]
  currentUid: string
  baseUrl: string
  onInvite: (input: { email: string; role: EventRole; side: Side; canViewBothSides: boolean }) => Promise<void>
  onRevokeInvite: (id: string) => Promise<void>
  onRemoveMember: (uid: string) => Promise<void>
  onUpdateMember: (uid: string, patch: Partial<EventMember>) => Promise<void>
  onBack: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<EventRole>('editor')
  const [side, setSide] = useState<Side>('bride')
  const [canViewBothSides, setCanViewBothSides] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const viewerIsOwner = isOwner(event, currentUid)
  const pendingInvites = invites.filter(i => i.status === 'pending')
  const memberEntries = Object.entries(event.members || {})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    try {
      await onInvite({
        email: email.trim(),
        role,
        side: role === 'admin' ? 'both' : side,
        canViewBothSides: role === 'admin' ? true : canViewBothSides,
      })
      setEmail('')
      setRole('editor')
      setSide('bride')
      setCanViewBothSides(false)
    } finally {
      setBusy(false)
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${baseUrl}/collab/${token}`)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-stone-800">Team & Collaborators</h2>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-semibold text-stone-800 mb-1">Invite a collaborator</h3>
        <p className="text-xs text-stone-500 mb-5">
          {"Send a link to your bride, mother-in-law, or anyone helping plan. They'll create an account (or sign in) to join."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="them@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-700">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as EventRole)}
                className="px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="editor">Editor (one side only)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            {role === 'editor' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-stone-700">Side</label>
                <select
                  value={side}
                  onChange={e => setSide(e.target.value as Side)}
                  className="px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="bride">{"Bride's side"}</option>
                  <option value="groom">{"Groom's side"}</option>
                </select>
              </div>
            )}
          </div>
          {role === 'editor' && (
            <label className="flex items-start gap-2 text-sm text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={canViewBothSides}
                onChange={e => setCanViewBothSides(e.target.checked)}
                className="mt-0.5 accent-rose-500"
              />
              <span>
                Allow them to <em>see</em> the other side as well (read-only).
                They can still only edit their own side.
              </span>
            </label>
          )}
          <Button type="submit" loading={busy}>Generate invite link</Button>
        </form>
      </div>

      {/* Pending invites */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <div className="p-6 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Pending invites ({pendingInvites.length})</h3>
        </div>
        {pendingInvites.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-400">No pending invites.</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {pendingInvites.map(inv => {
              const link = `${baseUrl}/collab/${inv.token}`
              return (
                <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{inv.email}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {inv.role === 'admin' ? 'Admin' : `Editor — ${inv.side}'s side`}
                      {inv.canViewBothSides && inv.role !== 'admin' && ' (sees both sides)'}
                    </p>
                    <input
                      readOnly
                      value={link}
                      className="text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 mt-2 text-stone-500 w-full"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium px-3 py-1.5 rounded-md hover:bg-rose-50 transition-colors"
                    >
                      {copiedToken === inv.token ? '✓ Copied' : 'Copy link'}
                    </button>
                    {viewerIsOwner && (
                      <button
                        onClick={() => onRevokeInvite(inv.id)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Current members */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <div className="p-6 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Members ({memberEntries.length})</h3>
        </div>
        <div className="divide-y divide-stone-50">
          {memberEntries.map(([uid, m]) => {
            const isOwnerRow = uid === event.ownerId
            const isSelf = uid === currentUid
            return (
              <div key={uid} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-800 truncate">
                      {m.email || `${uid.slice(0, 8)}…`}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      m.role === 'owner' ? 'bg-rose-100 text-rose-700'
                        : m.role === 'admin' ? 'bg-amber-100 text-amber-700'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {m.role}
                    </span>
                    {isSelf && <span className="text-xs text-stone-400">(you)</span>}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Side: <span className="text-stone-700">{m.side}</span>
                    {m.canViewBothSides && m.side !== 'both' && ' • can view both sides'}
                  </p>
                </div>
                {viewerIsOwner && !isOwnerRow && (
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {m.role === 'editor' ? (
                      <button
                        onClick={() => onUpdateMember(uid, { role: 'admin', side: 'both', canViewBothSides: true })}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium px-3 py-1.5 rounded-md hover:bg-amber-50 transition-colors"
                      >
                        Promote to admin
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateMember(uid, { role: 'editor', side: 'bride', canViewBothSides: false })}
                        className="text-xs text-stone-600 hover:text-stone-700 font-medium px-3 py-1.5 rounded-md hover:bg-stone-100 transition-colors"
                      >
                        Demote to editor
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveMember(uid)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tables View ──────────────────────────────────────────────────────────────

function TablesView({
  event, tables, rsvps, currentUid,
  onCreate, onUpdate, onDelete, onAssign, onBack,
}: {
  event: WeddingEvent
  tables: Table[]
  rsvps: RSVP[]
  currentUid: string
  onCreate: (input: { number: number; seats: number; side: Side }) => Promise<void>
  onUpdate: (id: string, patch: Partial<Table>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAssign: (rsvpId: string, tableId: string | null) => Promise<void>
  onBack: () => void
}) {
  const visible = visibleSides(event, currentUid)
  const editable = editableSides(event, currentUid)
  const visibleTables = tables.filter(t => visible.includes(t.side))
  const nextNumber = (visibleTables.reduce((max, t) => Math.max(max, t.number), 0) || 0) + 1

  const [seatsInput, setSeatsInput] = useState<number>(10)
  const [numberInput, setNumberInput] = useState<number>(() => nextNumber)
  const [tableSide, setTableSide] = useState<Side>(editable[0] ?? 'bride')
  const [busy, setBusy] = useState(false)

  const visibleAttendingRSVPs = rsvps.filter(r => {
    if (r.attending !== 'yes') return false
    if (!r.side) return isAdmin(event, currentUid)
    return visible.includes(r.side)
  })

  const occupancyByTable: Record<string, number> = {}
  for (const r of rsvps) {
    if (r.tableId && r.attending === 'yes') {
      occupancyByTable[r.tableId] = (occupancyByTable[r.tableId] || 0) + 1
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (numberInput < 1 || seatsInput < 1) return
    if (visibleTables.some(t => t.number === numberInput)) {
      alert(`Table ${numberInput} already exists. Pick a different number.`)
      return
    }
    setBusy(true)
    try {
      await onCreate({ number: numberInput, seats: seatsInput, side: tableSide })
      setNumberInput(prev => prev + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-stone-800">Tables & Seating</h2>
      </div>

      {/* Add a table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-semibold text-stone-800 mb-4">Add a table</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">Number</label>
            <input
              type="number" min={1} value={numberInput}
              onChange={e => setNumberInput(parseInt(e.target.value || '1', 10))}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">Seats</label>
            <input
              type="number" min={1} value={seatsInput}
              onChange={e => setSeatsInput(parseInt(e.target.value || '1', 10))}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">Side</label>
            <select
              value={tableSide}
              onChange={e => setTableSide(e.target.value as Side)}
              disabled={editable.length <= 1}
              className="px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-stone-50"
            >
              {editable.includes('bride') && <option value="bride">{"Bride's"}</option>}
              {editable.includes('groom') && <option value="groom">{"Groom's"}</option>}
            </select>
          </div>
          <Button type="submit" loading={busy}>Add table</Button>
        </form>
      </div>

      {/* Tables grid */}
      {visibleTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-stone-400">
          <p className="text-3xl mb-2">🪑</p>
          <p className="text-sm">No tables yet. Add your first table above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleTables.map(table => {
            const occupancy = occupancyByTable[table.id] || 0
            const isFull = occupancy >= table.seats
            const seatedHere = visibleAttendingRSVPs.filter(r => r.tableId === table.id)
            const canEditThis = canEditSide(event, currentUid, table.side)
            return (
              <div key={table.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-800">Table {table.number}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        table.side === 'bride' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {table.side}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isFull ? 'text-amber-600' : 'text-stone-500'}`}>
                      {occupancy} / {table.seats} seated
                      {isFull && ' — full'}
                    </p>
                  </div>
                  {canEditThis && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete table ${table.number}? Anyone seated here will be unassigned.`)) {
                          onDelete(table.id)
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-600"
                      aria-label="Delete table"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {canEditThis && (
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs text-stone-500">Seats:</label>
                    <input
                      type="number" min={1} defaultValue={table.seats}
                      onBlur={e => {
                        const v = parseInt(e.target.value || '0', 10)
                        if (v >= 1 && v !== table.seats) onUpdate(table.id, { seats: v })
                      }}
                      className="w-16 text-xs px-2 py-1 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                )}
                {seatedHere.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">Nobody seated yet.</p>
                ) : (
                  <ul className="text-sm text-stone-700 space-y-1">
                    {seatedHere.map(r => (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{r.name}</span>
                        {canEditThis && (
                          <button
                            onClick={() => onAssign(r.id, null)}
                            className="text-xs text-stone-400 hover:text-red-500 shrink-0"
                            aria-label="Unseat"
                          >
                            unseat
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Unseated guests */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <div className="p-6 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">Attending guests</h3>
          <p className="text-xs text-stone-500 mt-0.5">Assign each guest to a table.</p>
        </div>
        {visibleAttendingRSVPs.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-400">
            No accepted RSVPs yet for the side(s) you can see.
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {visibleAttendingRSVPs.map(rsvp => {
              const tablesForSide = visibleTables.filter(t => !rsvp.side || t.side === rsvp.side)
              return (
                <div key={rsvp.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-stone-800 truncate">{rsvp.name}</p>
                      {rsvp.side && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          rsvp.side === 'bride' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {rsvp.side}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 truncate">{rsvp.email}</p>
                  </div>
                  <select
                    value={rsvp.tableId || ''}
                    onChange={e => onAssign(rsvp.id, e.target.value || null)}
                    className="text-sm px-3 py-1.5 rounded-md border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-400 shrink-0"
                  >
                    <option value="">Unassigned</option>
                    {tablesForSide.map(t => {
                      const occ = occupancyByTable[t.id] || 0
                      const full = occ >= t.seats && t.id !== rsvp.tableId
                      return (
                        <option key={t.id} value={t.id} disabled={full}>
                          Table {t.number} ({occ}/{t.seats}){full ? ' — full' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
