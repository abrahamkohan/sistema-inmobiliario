// src/pages/ProyectoFormPage.tsx
// Pantalla única para Nuevo proyecto y Editar proyecto
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { X, Upload, Link as LinkIcon, Check, Plus, Trash2, Clipboard, ChevronDown, Globe, FolderOpen, MessageCircle, FileText, Eye, ExternalLink } from 'lucide-react'
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

type Status       = 'en_pozo' | 'en_construccion' | 'entregado'
type TipoProyecto = 'residencial' | 'comercial' | 'mixto'
type TypologyType = 'mono' | '1dorm' | '2dorm' | '3dorm' | '4dorm' | 'cochera' | 'cochera_xl' | 'baulera'
type SectionId    = 'esencial' | 'tipologias' | 'amenities' | 'media' | 'contenido' | 'links'

interface TypologyVariant { _id: string; area_m2: string; plano: File | null }
interface TypologyDraft   { banos: number | null; variants: TypologyVariant[] }
interface LinkEntry        { _id: string; type: string; url: string }
interface AmenityDraft     { _id: string; name: string; custom: boolean; photo: File | null; previewUrl: string | null }

interface FormState {
  name: string; status: Status; developer_name: string; tipo_proyecto: TipoProyecto | null
  delivery_date: string; maps_url: string; lat: number | null; lng: number | null
  zona: string; direccion: string; links: LinkEntry[]
  selected_types: TypologyType[]; typology_data: Partial<Record<TypologyType, TypologyDraft>>
  caracteristicas: string; fotos: File[]; resumen: string; amenityDrafts: AmenityDraft[]
}

const EMPTY: FormState = {
  name: '', status: 'en_pozo', developer_name: '', tipo_proyecto: null, delivery_date: '',
  maps_url: '', lat: null, lng: null, zona: '', direccion: '', links: [],
  selected_types: [], typology_data: {}, caracteristicas: '', fotos: [], resumen: '', amenityDrafts: [],
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPOLOGY_DEFS: Array<{ id: TypologyType; label: string; hasBanos: boolean; category: 'unidad'|'cochera'|'baulera' }> = [
  { id: 'mono',       label: 'Monoambiente',  hasBanos: true,  category: 'unidad'  },
  { id: '1dorm',      label: '1 Dormitorio',  hasBanos: true,  category: 'unidad'  },
  { id: '2dorm',      label: '2 Dormitorios', hasBanos: true,  category: 'unidad'  },
  { id: '3dorm',      label: '3 Dormitorios', hasBanos: true,  category: 'unidad'  },
  { id: '4dorm',      label: '4 Dormitorios', hasBanos: true,  category: 'unidad'  },
  { id: 'cochera',    label: 'Cochera',        hasBanos: false, category: 'cochera' },
  { id: 'cochera_xl', label: 'Cochera XL',     hasBanos: false, category: 'cochera' },
  { id: 'baulera',    label: 'Baulera',        hasBanos: false, category: 'baulera' },
]
// Orden: primero lo comercial, después lo técnico
const LINK_PRESETS: { value: string; label: string; icon: React.ElementType; color: string; single?: boolean }[] = [
  { value: 'web',      label: 'Web',       icon: Globe,         color: '#1a56db', single: true  },
  { value: 'whatsapp', label: 'WhatsApp',  icon: MessageCircle, color: '#25D366'               },
  { value: 'drive',    label: 'Drive',     icon: FolderOpen,    color: '#0F9D58'               },
  { value: 'brochure', label: 'Brochure',  icon: FileText,      color: '#6366f1', single: true  },
  { value: 'vista360', label: 'Vista 360', icon: Eye,           color: '#f59e0b', single: true  },
  { value: 'otro',     label: 'Otro',      icon: ExternalLink,  color: '#6b7280'               },
]
function linkPreset(type: string) { return LINK_PRESETS.find(p => p.value === type) }
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

  const [s, setS]             = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [openSection, setOpenSection] = useState<SectionId>('esencial')
  const [existingPhotos, setExistingPhotos] = useState<PhotoRow[]>([])
  const [amenityModal, setAmenityModal] = useState<{ draftId: string; file: File | null; previewUrl: string | null } | null>(null)
  const amenityModalRef = useRef<HTMLDivElement>(null)
  const [isResolvingMap, setIsResolvingMap] = useState(false)
  const [resolvedEmbed, setResolvedEmbed]   = useState<{ embedSrc: string; lat: number | null; lng: number | null } | null>(null)
  const [planoModal, setPlanoModal]         = useState<{ typologyType: TypologyType; variantId: string; previewUrl: string | null; file: File | null } | null>(null)
  const [typologiesOpen, setTypologiesOpen] = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const brochureRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrls = useRef<Record<string, string>>({})
  const modalRef    = useRef<HTMLDivElement>(null)

  function update(patch: Partial<FormState>) { setS(prev => ({ ...prev, ...patch })) }
  function toggle(sid: SectionId) { setOpenSection(prev => prev === sid ? 'esencial' : sid) }

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
        const mapsLink = (proj.links as Array<{ type: string; url: string }>)?.find(l => l.type === 'maps')
        const otherLinks = ((proj.links as Array<{ type: string; url: string }>) ?? [])
          .filter(l => l.type !== 'maps')
          .map(l => ({ _id: crypto.randomUUID(), type: l.type, url: l.url }))
        setS({
          ...EMPTY,
          name:            proj.name           ?? '',
          status:          proj.status          ?? 'en_pozo',
          developer_name:  proj.developer_name  ?? '',
          tipo_proyecto:   (proj.tipo_proyecto  ?? null) as TipoProyecto | null,
          delivery_date:   proj.delivery_date   ?? '',
          maps_url:        mapsLink?.url        ?? '',
          zona:            proj.location        ?? '',
          links:           otherLinks,
          caracteristicas: proj.caracteristicas ?? '',
          resumen:         proj.description     ?? '',
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

  // ── Links ─────────────────────────────────────────────────────────────────
  function addLink(type = 'otro') { update({ links: [...s.links, { _id: crypto.randomUUID(), type, url: '' }] }) }
  function removeLink(i: string) { update({ links: s.links.filter(l => l._id !== i) }) }
  function setLinkField(i: string, f: 'type' | 'url', v: string) { update({ links: s.links.map(l => l._id === i ? { ...l, [f]: v } : l) }) }

  // ── Photos ────────────────────────────────────────────────────────────────
  function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}` }
  function getPreviewUrl(file: File) {
    const key = fileKey(file)
    if (!previewUrls.current[key]) previewUrls.current[key] = URL.createObjectURL(file)
    return previewUrls.current[key]
  }
  function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    update({ fotos: [...s.fotos, ...valid].slice(0, 20) })
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

  // ── Amenities (create mode only — edit uses AmenitiesEditor) ─────────────
  function toggleAmenity(name: string) {
    const exists = s.amenityDrafts.find(d => d.name === name && !d.custom)
    if (exists) {
      if (exists.previewUrl) URL.revokeObjectURL(exists.previewUrl)
      update({ amenityDrafts: s.amenityDrafts.filter(d => d._id !== exists._id) })
    } else {
      update({ amenityDrafts: [...s.amenityDrafts, { _id: crypto.randomUUID(), name, custom: false, photo: null, previewUrl: null }] })
    }
  }
  function addCustomAmenity() {
    update({ amenityDrafts: [...s.amenityDrafts, { _id: crypto.randomUUID(), name: '', custom: true, photo: null, previewUrl: null }] })
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

  // ── Typologies ────────────────────────────────────────────────────────────
  function toggleTypology(type: TypologyType) {
    if (s.selected_types.includes(type)) {
      update({ selected_types: s.selected_types.filter(t => t !== type) })
    } else {
      const newData = { ...s.typology_data }
      if (!newData[type]) newData[type] = { banos: null, variants: [{ _id: crypto.randomUUID(), area_m2: '', plano: null }] }
      update({ selected_types: [...s.selected_types, type], typology_data: newData })
    }
  }
  function updateBanos(type: TypologyType, banos: number | null) {
    update({ typology_data: { ...s.typology_data, [type]: { ...s.typology_data[type]!, banos } } })
  }
  function addVariant(type: TypologyType) {
    const draft = s.typology_data[type]!
    update({ typology_data: { ...s.typology_data, [type]: { ...draft, variants: [...draft.variants, { _id: crypto.randomUUID(), area_m2: '', plano: null }] } } })
  }
  function removeVariant(type: TypologyType, variantId: string) {
    const draft = s.typology_data[type]!
    if (draft.variants.length <= 1) return
    update({ typology_data: { ...s.typology_data, [type]: { ...draft, variants: draft.variants.filter(v => v._id !== variantId) } } })
  }
  function updateVariantField(type: TypologyType, variantId: string, field: 'area_m2' | 'plano', value: string | File | null) {
    const draft = s.typology_data[type]!
    update({ typology_data: { ...s.typology_data, [type]: { ...draft, variants: draft.variants.map(v => v._id === variantId ? { ...v, [field]: value } : v) } } })
  }

  // ── Plano modal ───────────────────────────────────────────────────────────
  function openPlanoModal(type: TypologyType, variantId: string) { setPlanoModal({ typologyType: type, variantId, previewUrl: null, file: null }) }
  function closePlanoModal() { if (planoModal?.previewUrl) URL.revokeObjectURL(planoModal.previewUrl); setPlanoModal(null) }
  function handleModalPaste(e: React.ClipboardEvent) {
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile(); if (!f) break
        if (planoModal?.previewUrl) URL.revokeObjectURL(planoModal.previewUrl)
        setPlanoModal(prev => prev ? { ...prev, file: f, previewUrl: URL.createObjectURL(f) } : null)
        break
      }
    }
  }
  function confirmPlano() {
    if (!planoModal?.file) return
    updateVariantField(planoModal.typologyType, planoModal.variantId, 'plano', planoModal.file)
    if (planoModal.previewUrl) URL.revokeObjectURL(planoModal.previewUrl)
    setPlanoModal(null)
  }
  useEffect(() => {
    if (planoModal) { const t = setTimeout(() => modalRef.current?.focus(), 50); return () => clearTimeout(t) }
  }, [planoModal])

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!s.name.trim()) { toast.error('El nombre es requerido'); return }
    setIsSaving(true)
    try {
      const dbLinks = [
        s.maps_url && { type: 'maps', name: 'Google Maps', url: s.maps_url },
        ...s.links.filter(l => l.url.trim()).map(l => ({ type: l.type, name: linkPreset(l.type)?.label ?? 'Link', url: l.url.trim() })),
      ].filter(Boolean) as Array<{ type: string; name: string; url: string }>

      const payload = {
        name:            s.name.trim(),
        status:          s.status,
        developer_name:  s.developer_name || null,
        tipo_proyecto:   s.tipo_proyecto,
        location:        s.zona || null,
        description:     s.resumen || null,
        delivery_date:   s.delivery_date || null,
        links:           dbLinks,
        caracteristicas: s.caracteristicas || null,
      }

      let projectId: string

      if (isEdit && id) {
        await updateProject(id, payload)
        projectId = id
      } else {
        const created = await createProject({ ...payload, amenities: [] })
        projectId = created.id

        // Tipologías (solo en crear)
        for (const def of TYPOLOGY_DEFS) {
          if (!s.selected_types.includes(def.id)) continue
          const typDraft = s.typology_data[def.id]!
          for (const variant of typDraft.variants) {
            let floorPlanPath: string | null = null
            if (variant.plano) {
              const ext = variant.plano.name.split('.').pop()
              const planPath = `${projectId}/plan-${def.id}-${variant._id}.${ext}`
              const { error: upErr } = await supabase.storage.from('project-media').upload(planPath, variant.plano)
              if (!upErr) floorPlanPath = planPath
            }
            await createTypology({ project_id: projectId, name: def.label, area_m2: parseFloat(variant.area_m2) || 0, price_usd: 0, units_available: 0, category: def.category, unit_type: def.id, bathrooms: typDraft.banos, floor_plan_path: floorPlanPath })
          }
        }

        // Amenities (solo en crear)
        for (let i = 0; i < s.amenityDrafts.length; i++) {
          const draft = s.amenityDrafts[i]
          if (!draft.name.trim()) continue
          const { data: amenity } = await supabase.from('project_amenities').insert({ project_id: projectId, name: draft.name.trim(), sort_order: i }).select().single()
          if (draft.photo && amenity) {
            const ext = draft.photo.name.split('.').pop() ?? 'jpg'
            const path = `${projectId}/amenities/${(amenity as { id: string }).id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('project-media').upload(path, draft.photo)
            if (!upErr) await supabase.from('project_amenity_images').insert({ amenity_id: (amenity as { id: string }).id, storage_path: path, sort_order: 0 })
          }
        }
      }

      // Fotos nuevas (ambos modos)
      const startOrder = isEdit ? existingPhotos.length : 0
      for (let i = 0; i < s.fotos.length; i++) {
        const file = s.fotos[i]
        const ext  = file.name.split('.').pop()
        const path = `${projectId}/photos/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('project-media').upload(path, file)
        if (error) continue
        await supabase.from('project_photos').insert({ project_id: projectId, storage_path: path, sort_order: startOrder + i })
      }

      // Brochure
      const brochureFile = brochureRef.current?.files?.[0]
      if (brochureFile) {
        const ext  = brochureFile.name.split('.').pop()
        const path = `${projectId}/brochure.${ext}`
        await supabase.storage.from('project-media').upload(path, brochureFile, { upsert: true })
        await updateProject(projectId, { brochure_path: path })
      }

      toast.success(isEdit ? 'Cambios guardados' : 'Proyecto creado')
      navigate('/proyectos')
    } catch (err) {
      toast.error('Error al guardar')
      console.error(err)
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

  const TIPO_LABEL: Record<TipoProyecto, string> = { residencial: 'Residencial', comercial: 'Comercial', mixto: 'Mixto' }

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
          {s.tipo_proyecto && <span className="text-xs text-gray-400">· {TIPO_LABEL[s.tipo_proyecto]}</span>}
        </div>
        <button onClick={() => navigate('/proyectos')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-3">

        {/* ══ 1 — LO ESENCIAL (siempre visible) ══ */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-5">Lo esencial</h2>

          <div className="mb-4">
            <FieldLabel>Nombre del proyecto</FieldLabel>
            <TextInput value={s.name} onChange={e => update({ name: e.target.value })} placeholder="Ej: Urban Cumbres Torre B" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Ubicación / Zona</FieldLabel>
              <TextInput value={s.zona} onChange={e => update({ zona: e.target.value })} placeholder="Ej: Luque – Zona CIT" />
            </div>
            <div>
              <FieldLabel>Desarrolladora</FieldLabel>
              <TextInput value={s.developer_name} onChange={e => update({ developer_name: e.target.value })} placeholder="Ej: Urban Domus" />
            </div>
          </div>

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

          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div className="flex gap-2">
              {([{ v: 'residencial' as TipoProyecto, l: 'Residencial' }, { v: 'comercial' as TipoProyecto, l: 'Comercial' }, { v: 'mixto' as TipoProyecto, l: 'Mixto' }]).map(({ v, l }) => (
                <button key={v} type="button" onClick={() => update({ tipo_proyecto: v })}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${s.tipo_proyecto === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                >{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ 2 — TIPOLOGÍAS ══ */}
        <Section title="Tipologías" open={openSection === 'tipologias'} onToggle={() => toggle('tipologias')}
          badge={isEdit ? 'Ver existentes →' : s.selected_types.length > 0 ? `${s.selected_types.length} seleccionadas` : undefined}
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
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {TYPOLOGY_DEFS.map(def => {
                  const active = s.selected_types.includes(def.id)
                  return (
                    <button key={def.id} type="button" onClick={() => toggleTypology(def.id)}
                      className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >{def.label}</button>
                  )
                })}
              </div>
              {s.selected_types.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {TYPOLOGY_DEFS.filter(def => s.selected_types.includes(def.id)).map(def => {
                    const draft = s.typology_data[def.id]!
                    return (
                      <div key={def.id} className="border border-gray-200 rounded-2xl p-4">
                        <p className="text-sm font-semibold text-gray-800 mb-3">{def.label}</p>
                        {def.hasBanos && (
                          <div className="flex items-center gap-2.5 mb-3">
                            <span className="text-xs text-gray-400 w-9 flex-shrink-0">Baños</span>
                            <div className="flex gap-1">
                              {[1, 2, 3].map(n => (
                                <button key={n} type="button" onClick={() => updateBanos(def.id, draft.banos === n ? null : n)}
                                  className={`w-8 h-8 rounded-xl border-2 text-xs font-medium transition-all ${draft.banos === n ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                                >{n === 3 ? '3+' : n}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {draft.variants.map((variant, idx) => (
                            <div key={variant._id} className="flex items-center gap-2">
                              {draft.variants.length > 1 && <span className="text-xs text-gray-400 w-14 flex-shrink-0">Var. {idx + 1}</span>}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-gray-400">m²</span>
                                <input type="number" value={variant.area_m2} onChange={e => updateVariantField(def.id, variant._id, 'area_m2', e.target.value)}
                                  placeholder="50" style={{ width: 76 }}
                                  className="px-2 py-1.5 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                />
                              </div>
                              <div className="flex-1 flex gap-1.5">
                                <label className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:border-gray-400 cursor-pointer transition-colors flex-shrink-0">
                                  <Upload className="w-3 h-3" />
                                  {variant.plano ? <span className="text-emerald-600 max-w-[60px] truncate">{variant.plano.name}</span> : 'Subir'}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && updateVariantField(def.id, variant._id, 'plano', e.target.files[0])} />
                                </label>
                                <button type="button" onClick={() => openPlanoModal(def.id, variant._id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                                ><Clipboard className="w-3 h-3" /> Pegar plano</button>
                              </div>
                              {draft.variants.length > 1 && (
                                <button type="button" onClick={() => removeVariant(def.id, variant._id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => addVariant(def.id)} className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Agregar variante
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-1">Seleccioná las tipologías del proyecto arriba</p>
              )}
            </>
          )}
        </Section>

        {/* ══ 3 — AMENITIES ══ */}
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
                    <button key={name} type="button" onClick={() => toggleAmenity(name)}
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
                    <button key={name} type="button" onClick={() => toggleAmenity(name)}
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

        {/* ══ 4 — MEDIA (Fotos + Brochure) ══ */}
        <Section title="Media" open={openSection === 'media'} onToggle={() => toggle('media')}
          badge={`${existingPhotos.length + s.fotos.length} foto${existingPhotos.length + s.fotos.length !== 1 ? 's' : ''}`}
        >
          <div className="flex flex-col gap-4">
            {/* Fotos existentes (edit) */}
            {existingPhotos.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Fotos actuales</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {existingPhotos.map((photo, i) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={getPublicUrl(photo.storage_path)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Portada</span>}
                      <button type="button" onClick={() => removeExistingPhoto(photo)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agregar fotos nuevas */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
              className={`border-2 border-dashed rounded-2xl px-6 py-5 text-center cursor-pointer transition-colors ${isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
              <p className="text-sm text-gray-500">{isEdit ? 'Agregar más fotos' : 'Tocá para agregar fotos'}</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · máx. 20</p>
              <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
            </div>
            {s.fotos.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {s.fotos.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={getPreviewUrl(file)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button type="button" onClick={() => removeNewFile(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Brochure */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Brochure (PDF)</p>
              <input ref={brochureRef} type="file" accept=".pdf"
                className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 cursor-pointer"
              />
            </div>
          </div>
        </Section>

        {/* ══ 5 — CONTENIDO (Resumen + Características) ══ */}
        <Section title="Contenido" open={openSection === 'contenido'} onToggle={() => toggle('contenido')}>
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

        {/* ══ 6 — LINKS ══ */}
        <Section title="Links" open={openSection === 'links'} onToggle={() => toggle('links')}
          badge={s.links.length > 0 ? `${s.links.length}` : undefined}
        >
          <div className="flex flex-col gap-3">
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
            </div>
            {mapsData && !isResolvingMap && (
              <div className="overflow-hidden rounded-xl border border-gray-200" style={{ height: 160 }}>
                <iframe src={mapsData.embedSrc} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}

            {/* Chips para agregar links */}
            <div className="flex flex-wrap gap-1.5">
              {LINK_PRESETS.map(preset => {
                const Icon = preset.icon
                const already = preset.single && s.links.some(l => l.type === preset.value)
                return (
                  <button key={preset.value} type="button" disabled={already} onClick={() => addLink(preset.value)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    style={{ borderColor: already ? '#e5e7eb' : preset.color, color: already ? '#9ca3af' : preset.color }}
                  >
                    <Icon className="h-3 w-3" />{preset.label}
                  </button>
                )
              })}
            </div>

            {s.links.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {s.links.map(link => {
                  const preset = linkPreset(link.type)
                  const Icon = preset?.icon ?? ExternalLink
                  const color = preset?.color ?? '#6b7280'
                  return (
                    <div key={link._id} className="flex items-center gap-2 p-2.5 rounded-xl border bg-gray-50/60">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <input type="url" value={link.url} onChange={e => setLinkField(link._id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 min-w-0 h-7 px-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                      <button type="button" onClick={() => removeLink(link._id)} className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>

      </div>

      {/* ── Panel flotante ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-2">
        <button type="button" onClick={handleSave} disabled={isSaving}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar proyecto'}
        </button>
        <button type="button" onClick={() => navigate('/proyectos')} disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* ── Modal plano ──────────────────────────────────────────────────────── */}
      {planoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={closePlanoModal}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Pegar plano</p>
              <button onClick={closePlanoModal} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div ref={modalRef} tabIndex={0} onPaste={handleModalPaste}
              className="border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-gray-900 transition-colors cursor-default" style={{ minHeight: 180 }}
            >
              {planoModal.previewUrl ? (
                <img src={planoModal.previewUrl} alt="preview" className="w-full rounded-xl object-contain" style={{ maxHeight: 240 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Clipboard className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Pegá con Ctrl + V</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={closePlanoModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmPlano} disabled={!planoModal.file}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40"
              >{planoModal.file ? 'Confirmar' : 'Esperando imagen…'}</button>
            </div>
          </div>
        </div>
      )}

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
