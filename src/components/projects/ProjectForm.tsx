// src/components/projects/ProjectForm.tsx
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, MapPin, Globe, FolderOpen, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AmenitiesEditor } from './AmenitiesEditor'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

export type ProjectLink = { type: string; name: string; url: string }

const LINK_PRESETS: { type: string; name: string; icon: React.ElementType; color: string }[] = [
  { type: 'maps',     name: 'Google Maps', icon: MapPin,        color: '#EA4335' },
  { type: 'web',      name: 'Web',         icon: Globe,         color: '#1a56db' },
  { type: 'drive',    name: 'Drive',       icon: FolderOpen,    color: '#0F9D58' },
  { type: 'whatsapp', name: 'WhatsApp',    icon: MessageCircle, color: '#25D366' },
]

export function linkIcon(type: string): React.ElementType {
  return LINK_PRESETS.find((p) => p.type === type)?.icon ?? ExternalLink
}
export function linkColor(type: string): string {
  return LINK_PRESETS.find((p) => p.type === type)?.color ?? '#6b7280'
}

const projectSchema = z.object({
  name:            z.string().min(1, 'El nombre es requerido'),
  location:        z.string().optional(),
  status:          z.enum(['en_pozo', 'en_construccion', 'entregado']),
  delivery_date:   z.string().optional(),
  developer_name:  z.string().optional(),
  usd_to_pyg_rate: z.number().positive().nullable().optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema> & { links: ProjectLink[] }

interface ProjectFormProps {
  defaultValues?: Partial<ProjectRow>
  onSubmit: (values: ProjectFormValues, brochureFile: File | null) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  stickyButtons?: boolean
}

export function ProjectForm({ defaultValues, onSubmit, onCancel, isSubmitting, stickyButtons }: ProjectFormProps) {
  const brochureRef = useRef<HTMLInputElement>(null)
  const [links, setLinks] = useState<ProjectLink[]>(
    (defaultValues?.links as ProjectLink[] | undefined) ?? []
  )

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name:            defaultValues?.name           ?? '',
      location:        defaultValues?.location        ?? '',
      status:          defaultValues?.status          ?? 'en_pozo',
      delivery_date:   defaultValues?.delivery_date   ?? '',
      developer_name:  defaultValues?.developer_name  ?? '',
      usd_to_pyg_rate: defaultValues?.usd_to_pyg_rate ?? null,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const brochureFile = brochureRef.current?.files?.[0] ?? null
    await onSubmit({ ...values, links, delivery_date: values.delivery_date || undefined }, brochureFile)
  })

  function addPreset(preset: typeof LINK_PRESETS[number]) {
    setLinks((prev) => [...prev, { type: preset.type, name: preset.name, url: '' }])
  }

  function addCustom() {
    setLinks((prev) => [...prev, { type: 'other', name: '', url: '' }])
  }

  function updateLink(i: number, field: keyof ProjectLink, value: string) {
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Nombre */}
      <div className="grid gap-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...form.register('name')} placeholder="Ej: Edificio Torres del Sol" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Ubicación + Desarrolladora */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" {...form.register('location')} placeholder="Asunción, Paraguay" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="developer_name">Desarrolladora</Label>
          <Input id="developer_name" {...form.register('developer_name')} />
        </div>
      </div>

      {/* Estado + Fecha */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Estado</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) => form.setValue('status', v as ProjectFormValues['status'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en_pozo">En pozo</SelectItem>
              <SelectItem value="en_construccion">En construcción</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="delivery_date">Fecha de entrega</Label>
          <Input id="delivery_date" type="date" {...form.register('delivery_date')} />
        </div>
      </div>

      {/* Amenities */}
      {defaultValues?.id && (
        <div className="grid gap-2">
          <Label>Amenities</Label>
          <AmenitiesEditor projectId={defaultValues.id} />
        </div>
      )}

      {/* Links */}
      <div className="grid gap-2">
        <Label>Links</Label>

        {/* Quick-add presets */}
        <div className="flex flex-wrap gap-1.5">
          {LINK_PRESETS.map((preset) => {
            const Icon = preset.icon
            const already = links.some((l) => l.type === preset.type)
            return (
              <button
                key={preset.type}
                type="button"
                disabled={already}
                onClick={() => addPreset(preset)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ borderColor: already ? '#e5e7eb' : preset.color, color: already ? '#9ca3af' : preset.color }}
              >
                <Icon className="h-3 w-3" />
                {preset.name}
              </button>
            )
          })}
          <button
            type="button"
            onClick={addCustom}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-300 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-3 w-3" />Otro
          </button>
        </div>

        {/* Link list */}
        {links.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            {links.map((link, i) => {
              const Icon = linkIcon(link.type)
              const color = linkColor(link.type)
              return (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border bg-gray-50/60">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <Input
                    value={link.name}
                    onChange={(e) => updateLink(i, 'name', e.target.value)}
                    placeholder="Nombre"
                    className="h-7 text-xs w-28 flex-shrink-0"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className="h-7 text-xs flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Brochure */}
      <div className="grid gap-1.5">
        <Label htmlFor="brochure">Brochure (PDF)</Label>
        <input
          ref={brochureRef}
          id="brochure"
          type="file"
          accept=".pdf"
          className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground cursor-pointer"
        />
        {defaultValues?.brochure_path && (
          <p className="text-xs text-muted-foreground">Ya hay un brochure cargado. Seleccioná uno nuevo para reemplazarlo.</p>
        )}
      </div>

      {stickyButtons ? (
        <div
          className="flex gap-2"
          style={{ position: 'sticky', bottom: 0, background: '#f1f5f9', paddingTop: 8, paddingBottom: 16, borderTop: '1px solid #e5e7eb', marginTop: 8 }}
        >
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1 h-11">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      )}
    </form>
  )
}
