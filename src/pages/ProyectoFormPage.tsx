// src/pages/ProyectoFormPage.tsx
// Pantalla única para Nuevo proyecto y Editar proyecto
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { X, Upload, Link as LinkIcon, Check, Plus, Trash2, Clipboard, ChevronDown, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { createProject, updateProject } from '@/lib/projects'
import { createTypology } from '@/lib/typologies'
import { getProjectPhotos, deleteProjectPhoto } from '@/lib/projectPhotos'
import { getPublicUrl } from '@/lib/storage'
import { AmenitiesEditor } from '@/components/projects/AmenitiesEditor'
import { TypologiesSheet } from '@/components/typologies/TypologiesSheet'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type PhotoRow   = Database['public']['Tables']['project_photos']['Row']

// ─── Types ────────────────────────────────────────────────────────────────────

type Status        = 'en_pozo' | 'en_construccion' | 'entregado'
type TipoProyecto  = 'residencial' | 'comercial' | 'mixto'
type BadgeAnalisis = 'oportunidad' | 'estable' | 'a_evaluar'
type SectionId     = 'info' | 'proyecto' | 'links' | 'tipologias' | 'amenities' | 'media'

interface UnitDraft    { _id: string; name: string; area_m2: string; bedrooms: number | null; bathrooms: number | null; image: File | null; previewUrl: string | null }
interface AmenityDraft { _id: string; name: string; categoria: string; icon: string; custom: boolean; photo: File | null; previewUrl: string | null }
interface UrlPhotoDraft { _id: string; url: string }

interface FormState {
  name: string; status: Status; badge_analisis: BadgeAnalisis | null; publicado_en_web: boolean
  developer_name: string; tipo_proyecto: TipoProyecto | null
  delivery_date: string; precio_desde: string
  maps_url: string; tour_360_url: string; brochure_url: string; drive_folder_url: string
  lat: number | null; lng: number | null
  ciudad: string; barrio: string; zona: string; direccion: string
  unitDrafts: UnitDraft[]
  caracteristicas: string; fotos: File[]; urlPhotos: UrlPhotoDraft[]; resumen: string; amenityDrafts: AmenityDraft[]
  // Hero separado de la galería
  hero_file: File | null         // archivo subido para el hero
  hero_previewUrl: string | null // preview local del archivo
  hero_url: string               // input de URL para el hero
  hero_image_url: string | null  // valor guardado en DB (edit mode)
}

const EMPTY: FormState = {
  name: '', status: 'en_pozo', badge_analisis: null, publicado_en_web: false,
  developer_name: '', tipo_proyecto: null, delivery_date: '', precio_desde: '',
  maps_url: '', tour_360_url: '', brochure_url: '', drive_folder_url: '',
  lat: null, lng: null, ciudad: '', barrio: '', zona: '', direccion: '',
  unitDrafts: [], caracteristicas: '', fotos: [], urlPhotos: [], resumen: '', amenityDrafts: [],
  hero_file: null, hero_previewUrl: null, hero_url: '', hero_image_url: null,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITY_ICON_PRESETS: Record<string, string> = {
  'Aire acondicionado': 'wind',
  'Calefacción': 'flame',
  'Lavandería': 'washing-machine',
  'Cocina equipada': 'utensils',
  'Placares': 'archive',
  'Balcón': 'door-open',
  'Terraza': 'sun',
  'Piscina': 'waves',
  'Gimnasio': 'dumbbell',
  'Parrilla / Quincho': 'beef',
  'Jardín': 'tree-pine',
  'Seguridad 24h': 'shield',
  'Ascensor': 'arrow-up-down',
  'Salón de usos': 'building-2',
  'Estacionamiento': 'car',
}

const BEDROOM_NAMES: Record<number, string> = {
  0: 'Monoambiente',
  1: '1 Dormitorio',
  2: '2 Dormitorios',
  3: '3 Dormitorios',
  4: '4+ Dormitorios',
}

const AMENITIES_INTERIOR = ['Aire acondicionado', 'Calefacción', 'Lavandería', 'Cocina equipada', 'Placares', 'Balcón', 'Terraza']
const AMENITIES_EDIFICIO = ['Piscina', 'Gimnasio', 'Parrilla / Quincho', 'Jardín', 'Seguridad 24h', 'Ascensor', 'Salón de usos', 'Estacionamiento']

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 ${props.className ?? ''}`} />
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-gray-700 mb-1.5">{children}</p>
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function Section({ title, open, onToggle, children, badge }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode; badge?: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</span>
          {badge && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  )
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

function parseMapsUrl(url: string): { embedSrc: string; lat: number | null; lng: number | null } | null {
  const u = url.trim()
  if (!u) return null
  const isGMaps = u.includes('google.com/maps') || u.includes('goo.gl/maps') || u.includes('maps.app.goo.gl')
  if (!isGMaps) return null
  const at = u.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (at) { const lat = parseFloat(at[1]), lng = parseFloat(at[2]); return { embedSrc: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`, lat, lng } }
  const q = u.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (q) { const lat = parseFloat(q[1]), lng = parseFloat(q[2]); return { embedSrc: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`, lat, lng } }
  if (!u.includes('goo.gl') && !u.includes('maps.app.goo.gl')) {
    const src = u.includes('output=embed') ? u : u + (u.includes('?') ? '&' : '?') + 'output=embed'
    return { embedSrc: src, lat: null, lng: null }
  }
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProyectoFormPage() {
  const navigate    = useNavigate()
  const { id }      = useParams<{ id?: string }>()
  const isEdit      = !!id

  const [s, setS]               = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const [existingPhotos, setExistingPhotos] = useState<PhotoRow[]>([])
  const [amenityModal, setAmenityModal] = useState<{ draftId: string; file: File | null; previewUrl: string | null } | null>(null)
  const amenityModalRef = useRef<HTMLDivElement>(null)
  const [isResolvingMap, setIsResolvingMap] = useState(false)
  const [resolvedEmbed, setResolvedEmbed]   = useState<{ embedSrc: string; lat: number | null; lng: number | null } | null>(null)
  const [typologiesOpen, setTypologiesOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [pasteZoneFocused, setPasteZoneFocused] = useState(false)
  const [heroPasteZoneFocused, setHeroPasteZoneFocused] = useState(false)
  const pasteZoneRef     = useRef<HTMLDivElement>(null)
  const heroPasteZoneRef = useRef<HTMLDivElement>(null)
  const heroFileInputRef = useRef<HTMLInputElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrls = useRef<Record<string, string>>({})

  function update(patch: Partial<FormState>) { setS(prev => ({ ...prev, ...patch })) }
  function toggle(sid: SectionId) { setOpenSection(prev => prev === sid ? null : sid) }

  // ── Load project for edit ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return
    async function load() {
      try {
        const projectId = id!
        const [proj, photos] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single().then(r => r.data as unknown as ProjectRow),
          getProjectPhotos(projectId),
        ])
        if (!proj) { navigate('/proyectos'); return }
        setS({
          ...EMPTY,
          name:            proj.name           ?? '',
          status:          proj.status          ?? 'en_pozo',
          badge_analisis:  (proj.badge_analisis as BadgeAnalisis | null) ?? null,
          publicado_en_web: proj.publicado_en_web ?? false,
          developer_name:  proj.developer_name  ?? '',
          tipo_proyecto:   (proj.tipo_proyecto  ?? null) as TipoProyecto | null,
          delivery_date:   proj.delivery_date   ?? '',
          precio_desde:    proj.precio_desde != null ? String(proj.precio_desde) : '',
          maps_url:        proj.maps_url        ?? '',
          tour_360_url:    proj.tour_360_url    ?? '',
          brochure_url:    proj.brochure_url    ?? '',
          drive_folder_url: proj.drive_folder_url ?? '',
          ciudad:          proj.ciudad          ?? '',
          barrio:          proj.barrio          ?? '',
          zona:            proj.zona    ?? proj.location ?? '',
          direccion:       proj.direccion        ?? '',
          caracteristicas: proj.caracteristicas ?? '',
          resumen:         proj.description     ?? '',
          hero_image_url:  (proj as unknown as { hero_image_url: string | null }).hero_image_url ?? null,
        })
        setExistingPhotos(photos)
      } catch { navigate('/proyectos') }
      setIsLoading(false)
    }
    load()
  }, [id, isEdit, navigate])

  // ── Maps ──────────────────────────────────────────────────────────────────
  const isShortUrl = (url: string) => url.includes('goo.gl') || url.includes('maps.app.goo.gl')
  const mapsData   = resolvedEmbed ?? parseMapsUrl(s.maps_url)

  const resolveShortUrl = useCallback(async (link: string) => {
    setIsResolvingMap(true); setResolvedEmbed(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/resolve-maps?url=${encodeURIComponent(link)}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as { finalUrl: string; coords: { lat: number; lng: number } | null; placeName: string | null }
      const coords = data.coords
      const q = data.placeName ? encodeURIComponent(data.placeName) : coords ? `${coords.lat},${coords.lng}` : null
      const embedSrc = q ? `https://maps.google.com/maps?q=${q}&output=embed` : data.finalUrl + (data.finalUrl.includes('?') ? '&' : '?') + 'output=embed'
      setResolvedEmbed({ embedSrc, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
      update({ lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    } catch { toast.error('No se pudo resolver el link de Maps') }
    setIsResolvingMap(false)
  }, [])

  function handleMapsLink(link: string) {
    const trimmed = link.trim(); setResolvedEmbed(null)
    if (!trimmed) { update({ maps_url: '', lat: null, lng: null }); return }
    update({ maps_url: trimmed })
    if (isShortUrl(trimmed)) { resolveShortUrl(trimmed); return }
    const parsed = parseMapsUrl(trimmed)
    update({ lat: parsed?.lat ?? null, lng: parsed?.lng ?? null })
  }

  // ── Photos ────────────────────────────────────────────────────────────────
  function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}` }
  function getPreviewUrl(file: File) {
    const key = fileKey(file)
    if (!previewUrls.current[key]) previewUrls.current[key] = URL.createObjectURL(file)
    return previewUrls.current[key]
  }
  function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    // Usar setS funcional para evitar stale closure en el listener global de paste
    setS(prev => ({ ...prev, fotos: [...prev.fotos, ...valid].slice(0, 20) }))
  }

  // ── Hero handlers ─────────────────────────────────────────────────────────
  function handleHeroFile(file: File) {
    if (s.hero_previewUrl) URL.revokeObjectURL(s.hero_previewUrl)
    update({ hero_file: file, hero_previewUrl: URL.createObjectURL(file), hero_url: '' })
  }
  function handleHeroPaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items ?? [])
    const imageItem = items.find(item => item.type.startsWith('image/'))
    const file = imageItem?.getAsFile()
    if (file) { handleHeroFile(file); toast.success('Hero pegado desde clipboard') }
  }
  function clearHero() {
    if (s.hero_previewUrl) URL.revokeObjectURL(s.hero_previewUrl)
    update({ hero_file: null, hero_previewUrl: null, hero_url: '', hero_image_url: null })
  }

  // ── Paste zone handler ────────────────────────────────────────────────────
  function handlePasteZone(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items ?? [])
    const imageItem = items.find(item => item.type.startsWith('image/'))
    const file = imageItem?.getAsFile()
    if (!file) return
    setS(prev => ({ ...prev, fotos: [...prev.fotos, file].slice(0, 20) }))
    toast.success('Imagen pegada')
  }
  function removeNewFile(i: number) {
    const file = s.fotos[i]; const key = fileKey(file)
    const url = previewUrls.current[key]; if (url) URL.revokeObjectURL(url)
    delete previewUrls.current[key]
    update({ fotos: s.fotos.filter((_, idx) => idx !== i) })
  }
  async function removeExistingPhoto(photo: PhotoRow) {
    await deleteProjectPhoto(photo).catch(() => null)
    setExistingPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  // ── URL photos ────────────────────────────────────────────────────────────
  function addUrlPhoto() {
    const url = urlInput.trim()
    if (!url) return
    update({ urlPhotos: [...s.urlPhotos, { _id: crypto.randomUUID(), url }] })
    setUrlInput('')
  }
  function removeUrlPhoto(uid: string) {
    update({ urlPhotos: s.urlPhotos.filter(u => u._id !== uid) })
  }

  // ── Portada (create mode) — mover al frente de la cola ───────────────────
  function setFileCover(i: number) {
    if (i === 0) return
    const next = [...s.fotos]
    const [item] = next.splice(i, 1)
    setS(prev => ({ ...prev, fotos: [item, ...next] }))
  }
  function setUrlCover(uid: string) {
    const idx = s.urlPhotos.findIndex(u => u._id === uid)
    if (idx <= 0) return
    const next = [...s.urlPhotos]
    const [item] = next.splice(idx, 1)
    update({ urlPhotos: [item, ...next] })
  }

  // ── Hero photo (edit mode — reorder existing in DB) ───────────────────────
  async function setHeroPhoto(photo: PhotoRow) {
    if (photo.sort_order === 0) return
    const sorted = [...existingPhotos].sort((a, b) => a.sort_order - b.sort_order)
    const reordered = [photo, ...sorted.filter(p => p.id !== photo.id)]
    setExistingPhotos(reordered.map((p, i) => ({ ...p, sort_order: i })))
    await Promise.all(
      reordered.map((p, i) => supabase.from('project_photos').update({ sort_order: i }).eq('id', p.id))
    )
  }

  // ── Amenities (create mode only — edit uses AmenitiesEditor) ─────────────
  function toggleAmenity(name: string, categoria: string) {
    const exists = s.amenityDrafts.find(d => d.name === name && !d.custom)
    if (exists) {
      if (exists.previewUrl) URL.revokeObjectURL(exists.previewUrl)
      update({ amenityDrafts: s.amenityDrafts.filter(d => d._id !== exists._id) })
    } else {
      update({ amenityDrafts: [...s.amenityDrafts, { _id: crypto.randomUUID(), name, categoria, icon: AMENITY_ICON_PRESETS[name] ?? '', custom: false, photo: null, previewUrl: null }] })
    }
  }
  function addCustomAmenity() {
    update({ amenityDrafts: [...s.amenityDrafts, { _id: crypto.randomUUID(), name: '', categoria: 'edificio', icon: '', custom: true, photo: null, previewUrl: null }] })
  }
  function removeAmenity(aid: string) {
    const d = s.amenityDrafts.find(a => a._id === aid)
    if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl)
    update({ amenityDrafts: s.amenityDrafts.filter(a => a._id !== aid) })
  }
  function setAmenityPhoto(aid: string, file: File) {
    update({ amenityDrafts: s.amenityDrafts.map(a => {
      if (a._id !== aid) return a
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      return { ...a, photo: file, previewUrl: URL.createObjectURL(file) }
    })})
  }
  function setAmenityName(aid: string, name: string) {
    update({ amenityDrafts: s.amenityDrafts.map(a => a._id === aid ? { ...a, name } : a) })
  }
  function openAmenityModal(draftId: string) { setAmenityModal({ draftId, file: null, previewUrl: null }) }
  function closeAmenityModal() {
    if (amenityModal?.previewUrl) URL.revokeObjectURL(amenityModal.previewUrl)
    setAmenityModal(null)
  }
  function handleAmenityModalPaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
    const f = item?.getAsFile()
    if (!f) return
    if (amenityModal?.previewUrl) URL.revokeObjectURL(amenityModal.previewUrl)
    setAmenityModal(prev => prev ? { ...prev, file: f, previewUrl: URL.createObjectURL(f) } : null)
  }
  function confirmAmenityPaste() {
    if (!amenityModal?.file) return
    setAmenityPhoto(amenityModal.draftId, amenityModal.file)
    if (amenityModal.previewUrl) URL.revokeObjectURL(amenityModal.previewUrl)
    setAmenityModal(null)
  }
  useEffect(() => {
    if (amenityModal) { const t = setTimeout(() => amenityModalRef.current?.focus(), 50); return () => clearTimeout(t) }
  }, [amenityModal])

  // ── Unit drafts (create mode only) ───────────────────────────────────────
  function addUnitDraft() {
    update({ unitDrafts: [...s.unitDrafts, { _id: crypto.randomUUID(), name: '', area_m2: '', bedrooms: null, bathrooms: null, image: null, previewUrl: null }] })
  }
  function removeUnitDraft(uid: string) {
    const d = s.unitDrafts.find(u => u._id === uid)
    if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl)
    update({ unitDrafts: s.unitDrafts.filter(u => u._id !== uid) })
  }
  function updateUnitDraft(uid: string, patch: Partial<UnitDraft>) {
    update({ unitDrafts: s.unitDrafts.map(u => u._id === uid ? { ...u, ...patch } : u) })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!s.name.trim()) { toast.error('El nombre es requerido'); return }
    setIsSaving(true)
    try {
      const precioDesde = s.precio_desde.trim() ? parseFloat(s.precio_desde) : null

      // ── Resolver hero_image_url ────────────────────────────────────────────
      let heroImageUrl: string | null = s.hero_image_url  // valor previo (edit)
      if (s.hero_file) {
        // Subir archivo a storage y obtener URL pública
        const ext  = s.hero_file.name.split('.').pop() ?? 'jpg'
        const path = `hero/${Date.now()}.${ext}`  // path temporal; se asocia al proyecto después
        const { error: upErr } = await supabase.storage.from('project-media').upload(path, s.hero_file)
        if (!upErr) {
          const { data } = supabase.storage.from('project-media').getPublicUrl(path)
          heroImageUrl = data.publicUrl
        }
      } else if (s.hero_url.trim()) {
        heroImageUrl = s.hero_url.trim()
      }
      // Si terminamos con un data: URL, subir a storage en vez de guardar el base64 en la DB
      if (heroImageUrl?.startsWith('data:')) {
        try {
          const res = await fetch(heroImageUrl)
          const blob = await res.blob()
          const ext = blob.type.split('/')[1] ?? 'jpg'
          const path = `hero/${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from('project-media').upload(path, blob)
          if (!upErr) {
            const { data } = supabase.storage.from('project-media').getPublicUrl(path)
            heroImageUrl = data.publicUrl
          } else {
            heroImageUrl = null  // no guardar base64 en DB
          }
        } catch {
          heroImageUrl = null
        }
      }

      const payload = {
        name:            s.name.trim(),
        status:          s.status,
        badge_analisis:  s.badge_analisis,
        publicado_en_web: s.publicado_en_web,
        developer_name:  s.developer_name || null,
        tipo_proyecto:   s.tipo_proyecto,
        location:        s.zona || null,
        ciudad:          s.ciudad || null,
        barrio:          s.barrio || null,
        zona:            s.zona || null,
        direccion:       s.direccion || null,
        description:     s.resumen || null,
        delivery_date:   s.delivery_date || null,
        precio_desde:    precioDesde,
        maps_url:        s.maps_url || null,
        tour_360_url:    s.tour_360_url || null,
        brochure_url:    s.brochure_url || null,
        drive_folder_url: s.drive_folder_url || null,
        caracteristicas: s.caracteristicas || null,
        hero_image_url:  heroImageUrl,
      }

      let projectId: string

      if (isEdit && id) {
        await updateProject(id, payload)
        projectId = id
      } else {
        const created = await createProject(payload)
        projectId = created.id

        // Unidades (solo en crear)
        for (const unit of s.unitDrafts) {
          if (!unit.name.trim()) continue
          let imagePaths: string[] = []
          if (unit.image) {
            const ext = unit.image.name.split('.').pop() ?? 'jpg'
            const imgPath = `${projectId}/typologies/${unit._id}.${ext}`
            const { error: upErr } = await supabase.storage.from('project-media').upload(imgPath, unit.image)
            if (!upErr) imagePaths = [imgPath]
          }
          await createTypology({
            project_id: projectId,
            name: unit.name.trim(),
            area_m2: parseFloat(unit.area_m2) || 0,
            unit_type: unit.bedrooms != null ? String(unit.bedrooms) : null,
            bathrooms: unit.bathrooms ?? null,
            price_usd: 0,
            units_available: 0,
            images: imagePaths,
            features: [],
            category: 'unidad',
          })
        }

        // Amenities (solo en crear)
        for (let i = 0; i < s.amenityDrafts.length; i++) {
          const draft = s.amenityDrafts[i]
          if (!draft.name.trim()) continue
          const { data: amenity } = await supabase.from('project_amenities').insert({ project_id: projectId, name: draft.name.trim(), sort_order: i, categoria: draft.categoria ?? 'edificio', icon: draft.icon || null }).select().single()
          if (draft.photo && amenity) {
            const ext = draft.photo.name.split('.').pop() ?? 'jpg'
            const path = `${projectId}/amenities/${(amenity as { id: string }).id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('project-media').upload(path, draft.photo)
            if (!upErr) await supabase.from('project_amenity_images').insert({ amenity_id: (amenity as { id: string }).id, storage_path: path, sort_order: 0 })
          }
        }
      }

      // Fotos nuevas por archivo (ambos modos)
      const startOrder = isEdit ? existingPhotos.length : 0
      for (let i = 0; i < s.fotos.length; i++) {
        const file = s.fotos[i]
        const ext  = file.name.split('.').pop()
        const path = `${projectId}/photos/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('project-media').upload(path, file)
        if (error) continue
        await supabase.from('project_photos').insert({ project_id: projectId, storage_path: path, sort_order: startOrder + i })
      }

      // Fotos nuevas por URL (ambos modos)
      const urlStartOrder = isEdit ? existingPhotos.length + s.fotos.length : s.fotos.length
      for (let i = 0; i < s.urlPhotos.length; i++) {
        const { url } = s.urlPhotos[i]
        if (!url.trim()) continue
        await supabase.from('project_photos').insert({ project_id: projectId, storage_path: url.trim(), sort_order: urlStartOrder + i })
      }

      toast.success(isEdit ? 'Cambios guardados' : 'Proyecto creado')
      navigate('/proyectos')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al guardar: ${msg}`)
      console.error('[handleSave]', err)
    }
    setIsSaving(false)
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando proyecto...</p>
      </div>
    )
  }

  const BADGE_OPTIONS: { value: BadgeAnalisis; label: string; cls: string }[] = [
    { value: 'oportunidad', label: 'Oportunidad', cls: 'border-amber-400 bg-amber-50 text-amber-700' },
    { value: 'estable',     label: 'Estable',     cls: 'border-blue-400  bg-blue-50  text-blue-700'  },
    { value: 'a_evaluar',   label: 'A evaluar',   cls: 'border-gray-400  bg-gray-100 text-gray-600'  },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate('/proyectos')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-0.5">
            ← Volver a proyectos
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {isEdit ? s.name || 'Editar proyecto' : 'Nuevo proyecto'}
          </h1>
        </div>
        <button onClick={() => navigate('/proyectos')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-3">

        {/* ══ 1 — HERO / HEADER (siempre visible) ══ */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-5">Hero / Header</h2>

          {/* Nombre */}
          <div className="mb-4">
            <FieldLabel>Nombre del proyecto</FieldLabel>
            <TextInput value={s.name} onChange={e => update({ name: e.target.value })} placeholder="Ej: Urban Cumbres Torre B" />
          </div>

          {/* Carpeta Comercial (Drive) */}
          <div className="mb-4">
            <FieldLabel>Carpeta Comercial (DRIVE)</FieldLabel>
            <TextInput value={s.drive_folder_url} onChange={e => update({ drive_folder_url: e.target.value })} placeholder="https://" />
          </div>

          {/* Estado + Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Estado</FieldLabel>
              <div className="flex gap-2">
                {([{ v: 'en_pozo' as Status, l: 'En pozo' }, { v: 'en_construccion' as Status, l: 'En obra' }, { v: 'entregado' as Status, l: 'Terminado' }]).map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => update({ status: v })}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${s.status === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Entrega estimada</FieldLabel>
              <input type="date" value={s.delivery_date} onChange={e => update({ delivery_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
              />
            </div>
          </div>

          {/* Badge análisis */}
          <div className="mb-4">
            <FieldLabel>Badge de análisis</FieldLabel>
            <div className="flex gap-2">
              {BADGE_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => update({ badge_analisis: s.badge_analisis === opt.value ? null : opt.value })}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    s.badge_analisis === opt.value ? `border-2 ${opt.cls}` : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Publicado en web */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-4 py-3 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Publicado en web</p>
              <p className="text-xs text-gray-400">Visible en kohancampos.com</p>
            </div>
            <button
              type="button"
              onClick={() => update({ publicado_en_web: !s.publicado_en_web })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none ${
                s.publicado_en_web ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                s.publicado_en_web ? 'translate-x-[22px]' : 'translate-x-[4px]'
              }`} />
            </button>
          </div>

          {/* Ciudad + Barrio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Ciudad</FieldLabel>
              <TextInput value={s.ciudad} onChange={e => update({ ciudad: e.target.value })} placeholder="Ej: Asunción" />
            </div>
            <div>
              <FieldLabel>Barrio</FieldLabel>
              <TextInput value={s.barrio} onChange={e => update({ barrio: e.target.value })} placeholder="Ej: Ycuá Bolados" />
            </div>
          </div>

          {/* Zona */}
          <div className="mb-4">
            <FieldLabel>Zona</FieldLabel>
            <TextInput value={s.zona} onChange={e => update({ zona: e.target.value })} placeholder="Ej: Luque – Zona CIT" />
          </div>

          {/* Desarrolladora + Precio desde */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Desarrolladora</FieldLabel>
              <TextInput value={s.developer_name} onChange={e => update({ developer_name: e.target.value })} placeholder="Ej: Urban Domus" />
            </div>
            <div>
              <FieldLabel>Precio desde (USD)</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">USD</span>
                <TextInput
                  type="number"
                  value={s.precio_desde}
                  onChange={e => update({ precio_desde: e.target.value })}
                  placeholder="85000"
                  className="pl-11"
                />
              </div>
            </div>
          </div>

          {/* ── Imagen de portada (hero) ── */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <FieldLabel>Imagen de portada · Ficha PDF</FieldLabel>
            <p className="text-xs text-gray-400 mb-3">Esta imagen se usa como banner principal en el frontend y como portada de la ficha PDF. Independiente de la galería.</p>

            {/* Preview actual */}
            {(s.hero_previewUrl || s.hero_image_url) && (
              <div className="relative mb-3 rounded-xl overflow-hidden bg-gray-100" style={{ height: 160 }}>
                <img
                  src={s.hero_previewUrl ?? s.hero_image_url ?? ''}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearHero}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-semibold">
                  {s.hero_previewUrl ? 'Nueva portada · Ficha PDF (sin guardar)' : 'Portada · Ficha PDF'}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* Upload */}
              <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">Subir imagen</span>
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroFile(f) }}
                />
              </label>

              {/* Paste Ctrl+V */}
              <div
                ref={heroPasteZoneRef}
                tabIndex={0}
                onFocus={() => setHeroPasteZoneFocused(true)}
                onBlur={() => setHeroPasteZoneFocused(false)}
                onPaste={handleHeroPaste}
                onClick={() => heroPasteZoneRef.current?.focus()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all outline-none ${
                  heroPasteZoneFocused
                    ? 'border-gray-900 bg-gray-900/5 ring-2 ring-gray-900/10'
                    : 'border-dashed border-gray-200 hover:border-gray-400'
                }`}
              >
                <Clipboard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">
                  {heroPasteZoneFocused
                    ? <><span className="font-semibold text-gray-700">Listo</span> — presioná <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-mono text-xs">Ctrl+V</kbd></>
                    : <>Clic + <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-xs">Ctrl+V</kbd> para pegar</>
                  }
                </span>
              </div>

              {/* URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={s.hero_url}
                  onChange={e => update({ hero_url: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && s.hero_url.trim()) {
                      e.preventDefault()
                      update({ hero_image_url: s.hero_url.trim(), hero_url: '', hero_file: null, hero_previewUrl: null })
                    }
                  }}
                  placeholder="https://ejemplo.com/portada.jpg"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                />
                <button
                  type="button"
                  disabled={!s.hero_url.trim()}
                  onClick={() => {
                    if (!s.hero_url.trim()) return
                    update({ hero_image_url: s.hero_url.trim(), hero_url: '', hero_file: null, hero_previewUrl: null })
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  Usar URL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 2 — INFORMACIÓN GENERAL ══ */}
        <Section title="Información general" open={openSection === 'info'} onToggle={() => toggle('info')}>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Dirección</FieldLabel>
              <TextInput value={s.direccion} onChange={e => update({ direccion: e.target.value })} placeholder="Ej: Av. Mariscal López 123" />
            </div>
            <div>
              <FieldLabel>Tipo de proyecto</FieldLabel>
              <div className="flex gap-2">
                {([{ v: 'residencial' as TipoProyecto, l: 'Residencial' }, { v: 'comercial' as TipoProyecto, l: 'Comercial' }, { v: 'mixto' as TipoProyecto, l: 'Mixto' }]).map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => update({ tipo_proyecto: s.tipo_proyecto === v ? null : v })}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${s.tipo_proyecto === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ══ 3 — SOBRE EL PROYECTO ══ */}
        <Section title="Sobre el proyecto" open={openSection === 'proyecto'} onToggle={() => toggle('proyecto')}>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Resumen</FieldLabel>
              <textarea value={s.resumen} onChange={e => update({ resumen: e.target.value })} rows={5}
                placeholder={"URBAN CUMBRES TORRE B\nEntrega: Marzo 2027\n\nUbicación estratégica en el corazón de Luque..."}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
              />
            </div>
            <div>
              <FieldLabel>Características del edificio</FieldLabel>
              <textarea value={s.caracteristicas} onChange={e => update({ caracteristicas: e.target.value })} rows={4}
                placeholder={"4 Torres · 6 pisos · 14 dptos por piso\n2 Piscinas · Solarium\nSeguridad 24h · Ascensor panorámico"}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
              />
            </div>
          </div>
        </Section>

        {/* ══ 4 — LINKS ══ */}
        <Section title="Links" open={openSection === 'links'} onToggle={() => toggle('links')}>
          <div className="flex flex-col gap-4">

            {/* Google Maps */}
            <div>
              <FieldLabel>Google Maps</FieldLabel>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="url" value={s.maps_url} onChange={e => handleMapsLink(e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              {isResolvingMap && <p className="text-xs text-gray-400 mt-1.5">Resolviendo link…</p>}
              {!isResolvingMap && mapsData && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {mapsData.lat ? `${mapsData.lat.toFixed(4)}, ${mapsData.lng?.toFixed(4)}` : 'Link válido'}
                </p>
              )}
              {mapsData && !isResolvingMap && (
                <div className="overflow-hidden rounded-xl border border-gray-200 mt-2" style={{ height: 160 }}>
                  <iframe src={mapsData.embedSrc} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}
            </div>

            {/* Vista 360° */}
            <div>
              <FieldLabel>Vista 360°</FieldLabel>
              <div className="relative">
                <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="url" value={s.tour_360_url} onChange={e => update({ tour_360_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
            </div>

            {/* Brochure PDF */}
            <div>
              <FieldLabel>Brochure PDF</FieldLabel>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="url" value={s.brochure_url} onChange={e => update({ brochure_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
            </div>

          </div>
        </Section>

        {/* ══ 5 — TIPOLOGÍAS ══ */}
        <Section title="Tipologías" open={openSection === 'tipologias'} onToggle={() => toggle('tipologias')}
          badge={isEdit ? undefined : s.unitDrafts.length > 0 ? `${s.unitDrafts.length} unidad${s.unitDrafts.length !== 1 ? 'es' : ''}` : undefined}
        >
          {isEdit ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500">Las tipologías se gestionan en la pantalla principal del proyecto.</p>
              <button type="button" onClick={() => setTypologiesOpen(true)}
                className="self-start flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Gestionar tipologías
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {s.unitDrafts.map((unit, idx) => (
                <div key={unit._id} className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">

                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Unidad {idx + 1}</span>
                    <button type="button" onClick={() => removeUnitDraft(unit._id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dormitorios */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Dormitorios</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(BEDROOM_NAMES) as [string, string][]).map(([k, label]) => {
                        const n = parseInt(k)
                        return (
                          <button key={k} type="button"
                            onClick={() => updateUnitDraft(unit._id, { bedrooms: unit.bedrooms === n ? null : n, name: unit.name || label })}
                            className={`px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition-all ${unit.bedrooms === n ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                          >{label}</button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Nombre + m² + Baños */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <p className="text-xs text-gray-400 mb-1">Nombre</p>
                      <TextInput value={unit.name} onChange={e => updateUnitDraft(unit._id, { name: e.target.value })} placeholder="Ej: 2 Dormitorios" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">m²</p>
                      <TextInput type="number" value={unit.area_m2} onChange={e => updateUnitDraft(unit._id, { area_m2: e.target.value })} placeholder="65" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Baños</p>
                      <TextInput type="number" value={unit.bathrooms ?? ''} onChange={e => updateUnitDraft(unit._id, { bathrooms: e.target.value ? parseInt(e.target.value) : null })} placeholder="1" />
                    </div>
                  </div>

                  {/* Imagen */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:border-gray-400 cursor-pointer transition-colors">
                      <Upload className="w-3 h-3" />
                      {unit.image ? <span className="text-emerald-600 max-w-[80px] truncate">{unit.image.name}</span> : 'Imagen'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        if (unit.previewUrl) URL.revokeObjectURL(unit.previewUrl)
                        updateUnitDraft(unit._id, { image: f, previewUrl: URL.createObjectURL(f) })
                      }} />
                    </label>
                    {unit.previewUrl && <img src={unit.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addUnitDraft}
                className="self-start flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar unidad
              </button>
            </div>
          )}
        </Section>

        {/* ══ 6 — AMENITIES ══ */}
        <Section title="Amenities" open={openSection === 'amenities'} onToggle={() => toggle('amenities')}>
          {isEdit && id ? (
            <AmenitiesEditor projectId={id} />
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Interior</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {AMENITIES_INTERIOR.map(name => {
                  const active = s.amenityDrafts.some(d => d.name === name && !d.custom)
                  return (
                    <button key={name} type="button" onClick={() => toggleAmenity(name, 'interior')}
                      className={`h-8 px-3 rounded-full border text-[12px] font-medium transition-all ${active ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >{name}</button>
                  )
                })}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Edificio</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {AMENITIES_EDIFICIO.map(name => {
                  const active = s.amenityDrafts.some(d => d.name === name && !d.custom)
                  return (
                    <button key={name} type="button" onClick={() => toggleAmenity(name, 'edificio')}
                      className={`h-8 px-3 rounded-full border text-[12px] font-medium transition-all ${active ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >{name}</button>
                  )
                })}
                <button type="button" onClick={addCustomAmenity}
                  className="h-8 px-3 rounded-full border border-dashed border-gray-300 text-[12px] text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-all"
                >+ Otro</button>
              </div>
              {s.amenityDrafts.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
                  {s.amenityDrafts.map(draft => (
                    <div key={draft._id} className="flex items-center gap-2">
                      {draft.custom ? (
                        <input value={draft.name} onChange={e => setAmenityName(draft._id, e.target.value)} placeholder="Nombre..."
                          className="w-36 flex-shrink-0 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                        />
                      ) : (
                        <span className="w-36 flex-shrink-0 text-xs font-medium text-gray-700 truncate">{draft.name}</span>
                      )}
                      {draft.previewUrl && <img src={draft.previewUrl} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0 border border-gray-200" />}
                      <label className="flex-shrink-0 h-7 w-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors" title="Subir imagen">
                        <Upload className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && setAmenityPhoto(draft._id, e.target.files[0])} />
                      </label>
                      <button type="button" onClick={() => openAmenityModal(draft._id)}
                        className="flex-shrink-0 h-7 w-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors" title="Pegar imagen"
                      ><Clipboard className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => removeAmenity(draft._id)} className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Section>

        {/* ══ 7 — MEDIA ══ */}
        <Section title="Media" open={openSection === 'media'} onToggle={() => toggle('media')}
          badge={`${existingPhotos.length + s.fotos.length + s.urlPhotos.length} foto${existingPhotos.length + s.fotos.length + s.urlPhotos.length !== 1 ? 's' : ''}`}
        >
          <div className="flex flex-col gap-6">

            {/* ─ Fotos existentes (edit) ─ */}
            {existingPhotos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Fotos actuales</p>
                  <p className="text-[10px] text-gray-400">⭐ = portada · clic en otra foto para cambiarla</p>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {existingPhotos.map((photo, i) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={getPublicUrl(photo.storage_path)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      {/* Estrella portada — siempre visible en la portada, visible en hover en las demás */}
                      <button
                        type="button"
                        onClick={() => setHeroPhoto(photo)}
                        title={i === 0 ? 'Portada actual' : 'Usar como portada'}
                        className={`absolute bottom-1 left-1 transition-all ${
                          i === 0
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                        }`}
                      >
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          i === 0 ? 'bg-amber-400 text-white' : 'bg-black/60 text-white/80 hover:bg-amber-400 hover:text-white'
                        }`}>
                          ⭐ {i === 0 ? 'Portada' : 'Portada'}
                        </span>
                      </button>
                      <button type="button" onClick={() => removeExistingPhoto(photo)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─ Bloque 1: Subir imágenes ─ */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Subir imágenes</p>
              {/* Drop zone */}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
                className={`border-2 border-dashed rounded-2xl px-6 py-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-500">Arrastrá o hacé clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · máx. 20</p>
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
              </div>
              {/* Paste zone — focusable, igual al modal de tipologías */}
              <div
                ref={pasteZoneRef}
                tabIndex={0}
                onFocus={() => setPasteZoneFocused(true)}
                onBlur={() => setPasteZoneFocused(false)}
                onPaste={handlePasteZone}
                onClick={() => pasteZoneRef.current?.focus()}
                className={`mt-2 flex items-center justify-center gap-2 rounded-xl border-2 py-3 cursor-pointer transition-all outline-none ${
                  pasteZoneFocused
                    ? 'border-gray-900 bg-gray-900/5 ring-2 ring-gray-900/10'
                    : 'border-dashed border-gray-200 hover:border-gray-400'
                }`}
              >
                <Clipboard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">
                  {pasteZoneFocused
                    ? <><span className="font-semibold text-gray-700">Listo</span> — presioná <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-mono text-xs">Ctrl+V</kbd></>
                    : <>Hacé clic acá y presioná <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-xs">Ctrl+V</kbd> para pegar imagen</>
                  }
                </span>
              </div>
              {s.fotos.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                  {s.fotos.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={getPreviewUrl(file)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      {/* Estrella portada */}
                      <button
                        type="button"
                        onClick={() => setFileCover(i)}
                        title={i === 0 ? 'Portada' : 'Usar como portada'}
                        className={`absolute bottom-1 left-1 transition-all ${
                          i === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          i === 0 ? 'bg-amber-400 text-white' : 'bg-black/60 text-white/80 hover:bg-amber-400 hover:text-white'
                        }`}>
                          ⭐ Portada
                        </span>
                      </button>
                      <button type="button" onClick={() => removeNewFile(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─ Bloque 2: Pegar URL ─ */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Pegar URL de imagen</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrlPhoto())}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={addUrlPhoto}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  Agregar
                </button>
              </div>
              {s.urlPhotos.length > 0 && (
                <div className="flex flex-col gap-2 mt-3">
                  {s.urlPhotos.map((up, i) => (
                    <div key={up._id} className={`flex items-center gap-3 rounded-xl p-2 border ${i === 0 && s.fotos.length === 0 ? 'border-amber-300 bg-amber-50/50' : 'border-gray-100'}`}>
                      <img
                        src={up.url}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '' }}
                      />
                      <span className="flex-1 text-xs text-gray-500 truncate min-w-0">{up.url}</span>
                      {/* Portada solo si no hay fotos de archivo (que tienen prioridad) */}
                      {s.fotos.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setUrlCover(up._id)}
                          title={i === 0 ? 'Portada' : 'Usar como portada'}
                          className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
                            i === 0 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400 hover:bg-amber-400 hover:text-white'
                          }`}
                        >
                          ⭐ {i === 0 ? 'Portada' : ''}
                        </button>
                      )}
                      <button type="button" onClick={() => removeUrlPhoto(up._id)} className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </Section>

      </div>

      {/* ── Barra inferior mobile ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center gap-3 px-4 py-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={() => navigate('/proyectos')} disabled={isSaving}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proyecto'}
        </button>
      </div>

      {/* ── Panel flotante desktop ── */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex-col gap-2">
        <button type="button" onClick={handleSave} disabled={isSaving}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proyecto'}
        </button>
        <button type="button" onClick={() => navigate('/proyectos')} disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* ── Modal pegar imagen amenity ───────────────────────────────────────── */}
      {amenityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={closeAmenityModal}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Pegar imagen</p>
              <button onClick={closeAmenityModal} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div ref={amenityModalRef} tabIndex={0} onPaste={handleAmenityModalPaste}
              className="border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-gray-900 transition-colors cursor-default" style={{ minHeight: 180 }}
            >
              {amenityModal.previewUrl ? (
                <img src={amenityModal.previewUrl} alt="preview" className="w-full rounded-xl object-contain" style={{ maxHeight: 240 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Clipboard className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Pegá con Ctrl + V</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={closeAmenityModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmAmenityPaste} disabled={!amenityModal.file}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40"
              >{amenityModal.file ? 'Confirmar' : 'Esperando imagen…'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TypologiesSheet (edit mode) ─────────────────────────────────────── */}
      {isEdit && id && (
        <TypologiesSheet projectId={id} projectName={s.name} open={typologiesOpen} onOpenChange={setTypologiesOpen} />
      )}

    </div>
  )
}
