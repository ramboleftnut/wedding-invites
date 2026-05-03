'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserEvents, getEventRSVPs, getTemplate, updateEvent } from '@/lib/firestore'
import { firebaseStorage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { WeddingEvent, RSVP, Template } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null)
  const [selectedEventRSVPs, setSelectedEventRSVPs] = useState<RSVP[]>([])
  const [templates, setTemplates] = useState<Record<string, Template>>({})
  const [view, setView] = useState<'list' | 'edit' | 'rsvps'>('list')
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [editData, setEditData] = useState({
    brideName: '',
    groomName: '',
    eventDate: '',
    location: '',
    message: '',
  })
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

  async function openEdit(event: WeddingEvent) {
    setSelectedEvent(event)
    setEditData({
      brideName: event.data.brideName || '',
      groomName: event.data.groomName || '',
      eventDate: event.eventDate || '',
      location: event.data.location || '',
      message: event.data.message || '',
    })
    setView('edit')
  }

  async function openRSVPs(event: WeddingEvent) {
    setSelectedEvent(event)
    try {
      const rsvps = await getEventRSVPs(event.id)
      setSelectedEventRSVPs(rsvps)
    } catch (err) {
      console.error('Failed to load RSVPs:', err)
    }
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
          location: editData.location,
          message: editData.message,
        },
      })
      setSuccessMsg('Changes saved!')
      setTimeout(() => setSuccessMsg(''), 3000)
      await loadEvents()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedEvent || !user) return
    setUploadingCover(true)
    try {
      const storageRef = ref(firebaseStorage(), `events/${selectedEvent.id}/cover-${Date.now()}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateEvent(selectedEvent.id, {
        data: { ...selectedEvent.data, coverImage: url },
      })
      setSelectedEvent({ ...selectedEvent, data: { ...selectedEvent.data, coverImage: url } })
      setSuccessMsg('Cover image updated!')
      setTimeout(() => setSuccessMsg(''), 3000)
      await loadEvents()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !selectedEvent || !user) return
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(firebaseStorage(), `events/${selectedEvent.id}/gallery-${Date.now()}-${file.name}`)
          await uploadBytes(storageRef, file)
          return getDownloadURL(storageRef)
        })
      )
      const existing = selectedEvent.data.galleryImages || []
      const merged = [...existing, ...urls]
      await updateEvent(selectedEvent.id, {
        data: { ...selectedEvent.data, galleryImages: merged },
      })
      setSelectedEvent({ ...selectedEvent, data: { ...selectedEvent.data, galleryImages: merged } })
      setSuccessMsg('Gallery updated!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error('Gallery upload failed:', err)
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-stone-800">My Dashboard</h1>
            <p className="text-stone-500 text-sm mt-1">Manage your wedding invitations</p>
          </div>
          <Link href="/store">
            <Button variant="outline" size="sm">+ Get New Template</Button>
          </Link>
        </div>

        {view === 'list' && (
          <EventList
            events={events}
            templates={templates}
            baseUrl={baseUrl}
            onEdit={openEdit}
            onViewRSVPs={openRSVPs}
          />
        )}

        {view === 'edit' && selectedEvent && (
          <EventEditor
            event={selectedEvent}
            editData={editData}
            setEditData={setEditData}
            onSave={handleSave}
            saving={saving}
            successMsg={successMsg}
            uploadingCover={uploadingCover}
            onCoverUpload={handleCoverUpload}
            onGalleryUpload={handleGalleryUpload}
            onBack={() => setView('list')}
            baseUrl={baseUrl}
          />
        )}

        {view === 'rsvps' && selectedEvent && (
          <RSVPList
            event={selectedEvent}
            rsvps={selectedEventRSVPs}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </main>
  )
}

function EventList({
  events,
  templates,
  baseUrl,
  onEdit,
  onViewRSVPs,
}: {
  events: WeddingEvent[]
  templates: Record<string, Template>
  baseUrl: string
  onEdit: (e: WeddingEvent) => void
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
        const shareUrl = `${baseUrl}/event/${event.slug}`
        const isExpired = event.eventDate ? new Date(event.eventDate + 'T23:59:59') < new Date() : false

        return (
          <div key={event.id} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-stone-800">
                    {event.data.brideName && event.data.groomName
                      ? `${event.data.brideName} & ${event.data.groomName}`
                      : 'Untitled Invitation'}
                  </h3>
                  {isExpired && (
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Expired</span>
                  )}
                </div>
                <p className="text-sm text-stone-500">
                  {template?.name || 'Template'} •{' '}
                  {event.eventDate ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString() : 'Date not set'} •{' '}
                  {event.data.location || 'Location not set'}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 text-stone-600 flex-1 min-w-0"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="text-xs text-rose-500 hover:text-rose-600 shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">View</Button>
                </a>
                <Button variant="outline" size="sm" onClick={() => onViewRSVPs(event)}>RSVPs</Button>
                <Button size="sm" onClick={() => onEdit(event)}>Edit</Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EventEditor({
  event,
  editData,
  setEditData,
  onSave,
  saving,
  successMsg,
  uploadingCover,
  onCoverUpload,
  onGalleryUpload,
  onBack,
  baseUrl,
}: {
  event: WeddingEvent
  editData: { brideName: string; groomName: string; eventDate: string; location: string; message: string }
  setEditData: (d: typeof editData) => void
  onSave: () => void
  saving: boolean
  successMsg: string
  uploadingCover: boolean
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  baseUrl: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
      <div className="p-6 border-b border-stone-100 flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-stone-800">Edit Invitation</h2>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Bride's Name"
            value={editData.brideName}
            onChange={e => setEditData({ ...editData, brideName: e.target.value })}
            placeholder="e.g. Emily"
          />
          <Input
            label="Groom's Name"
            value={editData.groomName}
            onChange={e => setEditData({ ...editData, groomName: e.target.value })}
            placeholder="e.g. James"
          />
        </div>

        <Input
          label="Wedding Date"
          type="date"
          value={editData.eventDate}
          onChange={e => setEditData({ ...editData, eventDate: e.target.value })}
        />

        <Input
          label="Location"
          value={editData.location}
          onChange={e => setEditData({ ...editData, location: e.target.value })}
          placeholder="e.g. The Grand Ballroom, New York"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-stone-700">Message (optional)</label>
          <textarea
            value={editData.message}
            onChange={e => setEditData({ ...editData, message: e.target.value })}
            placeholder="A personal note to your guests..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none text-sm"
          />
        </div>

        {/* Cover image */}
        <div>
          <label className="text-sm font-medium text-stone-700 block mb-2">Cover Image</label>
          {event.data.coverImage && (
            <img src={event.data.coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg mb-3" />
          )}
          <label className="cursor-pointer">
            <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors">
              {uploadingCover ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="h-8 w-8 text-stone-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-stone-500">Click to upload cover image</p>
                  <p className="text-xs text-stone-400 mt-1">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
          </label>
        </div>

        {/* Gallery */}
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

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{successMsg}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={onSave} loading={saving} className="flex-1">Save Changes</Button>
          <a href={`${baseUrl}/event/${event.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Preview</Button>
          </a>
        </div>
      </div>
    </div>
  )
}

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
          <p className="text-xs text-stone-500 mt-0.5">
            {rsvps.length} total — {attending} attending, {declining} declining
          </p>
        </div>
      </div>

      {rsvps.length === 0 ? (
        <div className="p-12 text-center text-stone-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No RSVPs yet. Share your invitation link to get responses!</p>
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
                {rsvp.message && (
                  <p className="text-sm text-stone-600 mt-1 italic">&ldquo;{rsvp.message}&rdquo;</p>
                )}
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(rsvp.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
