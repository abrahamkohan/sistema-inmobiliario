// src/components/configuracion/SeccionAssets.tsx
import type { BrandEngine } from '@/lib/brand/BrandEngine'
import { useBrand } from '@/context/BrandContext'
import { useState, useRef } from 'react'
import { usePuedeEditar, usePuedeBorrar } from '@/hooks/usePermiso'
import { ImageIcon, Loader2, Plus, Pencil, Trash2, X, Upload, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset,
  type AssetWithUsages, type AssetType, type AssetSubtipo,
} from '@/hooks/useAssets'

// ── Constantes de display ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<AssetType, string> = {
  brand:    'Brand',
  property: 'Propiedad',
  project:  'Proyecto',
  document: 'Documento',
}

const SUBTIPO_LABELS: Record<AssetSubtipo, string> = {
  logo:       'Logo',
  logo_light: 'Logo claro',
  favicon:    'Favicon',
  hero:       'Hero',
  gallery:    'Galería',
  floor_plan: 'Plano',
  brochure:   'Brochure',
  contract:   'Contrato',
  other:      'Otro',
}

const TYPE_COLORS: Record<AssetType, string> = {
  brand:    'bg-violet-50 text-violet-700',
  property: 'bg-blue-50 text-blue-700',
  project:  'bg-amber-50 text-amber-700',
  document: 'bg-gray-100 text-gray-600',
}

const ALL_TYPES: AssetType[]    = ['brand', 'property', 'project', 'document']
const ALL_SUBTIPOS: AssetSubtipo[] = ['logo', 'logo_light', 'favicon', 'hero', 'gallery', 'floor_plan', 'brochure', 'contract', 'other']

// Subtipos relevantes por tipo (para el filtro rápido y el form)
const SUBTIPOS_BY_TYPE: Record<AssetType, AssetSubtipo[]> = {
  brand:    ['logo', 'logo_light', 'favicon', 'hero', 'other'],
  property: ['hero', 'gallery', 'floor_plan', 'brochure', 'other'],
  project:  ['hero', 'gallery', 'floor_plan', 'brochure', 'other'],
  document: ['brochure', 'contract', 'other'],
}

// ── Chip de filtro ─────────────────────────────────────────────────────────────

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

// ── Tarjeta de asset ───────────────────────────────────────────────────────────

function AssetCard({ asset, onDelete, onEdit, engine, puedeEditar, puedeEliminar }: {
  asset: AssetWithUsages
  onDelete: (a: AssetWithUsages) => void
  onEdit: (a: AssetWithUsages) => void
  engine: BrandEngine
  puedeEditar: boolean
  puedeEliminar: boolean
}) {
  const usageCount = asset.asset_usages.length
  const isUsed     = usageCount > 0
  const isDoc      = ['brochure', 'contract'].includes(asset.subtipo)

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
        {isDoc ? (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <LinkIcon className="w-8 h-8" />
            <span className="text-xs">Documento</span>
          </div>
        ) : (
          <img
            src={asset.url}
            alt={asset.alt_text ?? asset.nombre}
            className="w-full h-full object-cover"
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
              e.currentTarget.parentElement?.classList.add('bg-gray-100')
            }}
          />
        )}
        {/* Badge de uso flotante */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isUsed
            ? 'bg-rose-100 text-rose-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {isUsed ? `En uso (${usageCount})` : 'Sin uso'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">{asset.nombre}</p>
        {asset.alt_text && (
          <p className="text-xs text-gray-400 line-clamp-1">{asset.alt_text}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[asset.type]}`}>
            {TYPE_LABELS[asset.type]}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {SUBTIPO_LABELS[asset.subtipo]}
          </span>
        </div>
      </div>

      {/* Footer: acciones */}
      <div className="px-3 pb-3 flex items-center justify-between">
          <a
            href={engine.getAssetUrl(asset.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />Ver
          </a>

        <div className="flex items-center gap-1">
          {puedeEditar && (
            <button
              type="button"
              onClick={() => onEdit(asset)}
              title="Editar"
              className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {puedeEliminar && (
            <button
              type="button"
              disabled={isUsed}
              onClick={() => onDelete(asset)}
              title={isUsed ? 'No se puede eliminar: asset en uso' : 'Eliminar'}
              className={`p-1.5 rounded-lg transition-colors ${
                isUsed
                  ? 'text-gray-200 cursor-not-allowed'
                  : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulario de nuevo asset ──────────────────────────────────────────────────

interface FormState {
  nombre:      string
  alt_text:    string
  type:        AssetType
  subtipo:     AssetSubtipo
  mode:        'upload' | 'url'
  externalUrl: string
  file:        File | null
}

function buildEmptyForm(): FormState {
  return {
    nombre: '', alt_text: '', type: 'brand', subtipo: 'logo',
    mode: 'upload', externalUrl: '', file: null,
  }
}

function buildFormFromAsset(asset: AssetWithUsages): FormState {
  return {
    nombre: asset.nombre,
    alt_text: asset.alt_text ?? '',
    type: asset.type,
    subtipo: asset.subtipo,
    mode: 'url', // Al editar, usar URL existente
    externalUrl: asset.url,
    file: null,
  }
}

function AssetForm({ asset, onClose }: { asset?: AssetWithUsages; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(asset ? buildFormFromAsset(asset) : buildEmptyForm())
  const fileRef         = useRef<HTMLInputElement>(null)
  const create          = useCreateAsset()
  const update          = useUpdateAsset()
  const isEditing       = !!asset

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => {
      const next = { ...p, [key]: value }
      // Si cambia el tipo, resetear subtipo al primero válido
      if (key === 'type') {
        const validSubtipos = SUBTIPOS_BY_TYPE[value as AssetType]
        if (!validSubtipos.includes(next.subtipo)) {
          next.subtipo = validSubtipos[0]
        }
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.alt_text.trim()) { toast.error('El alt text es obligatorio (SEO)'); return }
    if (form.mode === 'upload' && !form.file && !isEditing) { toast.error('Seleccioná un archivo'); return }
    if (form.mode === 'url' && !form.externalUrl.trim()) { toast.error('Ingresá una URL'); return }

    try {
      if (isEditing && asset) {
        await update.mutateAsync({
          id:        asset.id,
          nombre:    form.nombre.trim(),
          alt_text:  form.alt_text.trim(),
          type:      form.type,
          subtipo:   form.subtipo,
          newFile:        form.mode === 'upload' ? form.file ?? undefined : undefined,
          newExternalUrl: form.mode === 'url'    ? form.externalUrl.trim() : undefined,
        })
      } else {
        await create.mutateAsync({
          nombre:      form.nombre.trim(),
          alt_text:    form.alt_text.trim(),
          type:        form.type,
          subtipo:     form.subtipo,
          file:        form.mode === 'upload' ? form.file ?? undefined : undefined,
          externalUrl: form.mode === 'url'    ? form.externalUrl.trim() : undefined,
        })
      }
      toast.success(isEditing ? 'Asset actualizado' : 'Asset guardado')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const availableSubtipos = SUBTIPOS_BY_TYPE[form.type]

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl bg-gray-50 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">{isEditing ? 'Editar asset' : 'Nuevo asset'}</p>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-md">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Nombre *</Label>
        <Input
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          placeholder="Ej: Logo principal oscuro"
          className="bg-white"
        />
      </div>

      {/* Alt text */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Alt text * <span className="font-normal text-gray-400">(descripción para SEO y accesibilidad)</span></Label>
        <Input
          value={form.alt_text}
          onChange={e => set('alt_text', e.target.value)}
          placeholder="Ej: Logo de Inmobiliaria ABC"
          className="bg-white"
        />
      </div>

      {/* Tipo + Subtipo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Tipo *</Label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value as AssetType)}
            className="h-10 px-3 border border-input rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ALL_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Subtipo *</Label>
          <select
            value={form.subtipo}
            onChange={e => set('subtipo', e.target.value as AssetSubtipo)}
            className="h-10 px-3 border border-input rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {availableSubtipos.map(s => (
              <option key={s} value={s}>{SUBTIPO_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modo: upload vs URL */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => set('mode', 'upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              form.mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />Subir archivo
          </button>
          <button
            type="button"
            onClick={() => set('mode', 'url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              form.mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />URL externa
          </button>
        </div>

        {form.mode === 'upload' ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-gray-400 transition-colors bg-white"
          >
            {form.file ? (
              <>
                <ImageIcon className="w-6 h-6 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">{form.file.name}</p>
                <p className="text-xs text-gray-400">{(form.file.size / 1024).toFixed(0)} KB</p>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-300" />
                <p className="text-sm text-gray-500">Clic para seleccionar archivo</p>
                <p className="text-xs text-gray-400">PNG, JPG, SVG, PDF</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) set('file', f)
              }}
            />
          </div>
        ) : (
          <Input
            type="url"
            value={form.externalUrl}
            onChange={e => set('externalUrl', e.target.value)}
            placeholder="https://ejemplo.com/imagen.png"
            className="bg-white"
          />
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function SeccionAssets() {
  const { engine } = useBrand()
  const [filterType,    setFilterType]    = useState<AssetType | null>(null)
  const [filterSubtipo, setFilterSubtipo] = useState<AssetSubtipo | null>(null)
  const [showForm,      setShowForm]      = useState(false)
  const [editingAsset,  setEditingAsset]  = useState<AssetWithUsages | null>(null)

  const { data: assets = [], isLoading } = useAssets({ type: filterType ?? undefined, subtipo: filterSubtipo ?? undefined })
  const deleteAsset   = useDeleteAsset()
  const puedeEditar   = usePuedeEditar('marketing')
  const puedeEliminar = usePuedeBorrar('marketing')

  async function handleDelete(asset: AssetWithUsages) {
    if (!confirm(`¿Eliminar "${asset.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteAsset.mutateAsync(asset)
      toast.success('Asset eliminado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  function handleEdit(asset: AssetWithUsages) {
    setEditingAsset(asset)
    setShowForm(true)
  }

  // Si filtramos por type, mostramos subtipos relevantes; si no, todos
  const subtiposDisponibles: AssetSubtipo[] = filterType ? SUBTIPOS_BY_TYPE[filterType] : ALL_SUBTIPOS

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🖼️ Assets / Media</p>
          <p className="text-xs text-muted-foreground mt-1">
            Imágenes y documentos reutilizables. No elimines assets en uso.
          </p>
        </div>
        {puedeEditar && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowForm(v => !v); setEditingAsset(null) }}
            className="gap-1.5 flex-shrink-0"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cerrar' : 'Nuevo'}
          </Button>
        )}
      </div>

      {/* Formulario colapsable */}
      {showForm && (
        <AssetForm 
          asset={editingAsset ?? undefined} 
          onClose={() => { setShowForm(false); setEditingAsset(null) }} 
        />
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-2">
        {/* Type */}
        <div className="flex gap-1.5 flex-wrap">
          <Chip active={filterType === null} onClick={() => { setFilterType(null); setFilterSubtipo(null) }}>
            Todos
          </Chip>
          {ALL_TYPES.map(t => (
            <Chip
              key={t}
              active={filterType === t}
              onClick={() => {
                setFilterType(t)
                setFilterSubtipo(null)
              }}
            >
              {TYPE_LABELS[t]}
            </Chip>
          ))}
        </div>
        {/* Subtipo — solo si hay type seleccionado o siempre visible */}
        <div className="flex gap-1.5 flex-wrap">
          <Chip active={filterSubtipo === null} onClick={() => setFilterSubtipo(null)}>
            Todos los subtipos
          </Chip>
          {subtiposDisponibles.map(s => (
            <Chip
              key={s}
              active={filterSubtipo === s}
              onClick={() => setFilterSubtipo(s)}
            >
              {SUBTIPO_LABELS[s]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Galería */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ImageIcon className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">No hay assets todavía</p>
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingAsset(null) }}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-700 transition-colors"
          >
            Subir el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} onEdit={handleEdit} engine={engine} puedeEditar={puedeEditar} puedeEliminar={puedeEliminar} />
          ))}
        </div>
      )}

    </div>
  )
}
