// src/pages/ConfiguracionPage.tsx
import { useEffect, useState } from 'react'
import {
  Building2, Phone, Mail, MessageCircle, Instagram, Globe, Image,
  Loader2, Check, Copy, Users,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useConsultoraConfig, useSaveConsultoraConfig } from '@/hooks/useConsultora'

// ─── Referidos helpers ────────────────────────────────────────────────────────

const APP_URL  = (import.meta.env.VITE_APP_URL as string ?? '').replace(/\/$/, '')
const SHORT_BASE = `${APP_URL}/l/`

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

function copyToClipboard(text: string, label = 'Copiado') {
  navigator.clipboard.writeText(text).then(() => toast.success(label))
}

function waShareUrl(link: string) {
  const msg = encodeURIComponent(`Cargá un contacto acá: ${link}`)
  return `https://wa.me/?text=${msg}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  nombre: string
  logo_url: string
  telefono: string
  email: string
  whatsapp: string
  instagram: string
  sitio_web: string
}

const EMPTY_FORM: FormState = {
  nombre: '', logo_url: '', telefono: '', email: '', whatsapp: '', instagram: '', sitio_web: '',
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label, icon: Icon, value, onChange, placeholder, type = 'text',
}: {
  label: string; icon: React.ElementType; value: string
  onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />{label}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConfiguracionPage() {
  const { data: config, isLoading } = useConsultoraConfig()
  const save = useSaveConsultoraConfig()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [refName, setRefName]     = useState('')
  const [refLink, setRefLink]     = useState('')

  useEffect(() => {
    if (!config) return
    setForm({
      nombre:    config.nombre    ?? '',
      logo_url:  config.logo_url  ?? '',
      telefono:  config.telefono  ?? '',
      email:     config.email     ?? '',
      whatsapp:  config.whatsapp  ?? '',
      instagram: config.instagram ?? '',
      sitio_web: config.sitio_web ?? '',
    })
  }, [config])

  function setF(key: keyof FormState) { return (v: string) => setForm((p) => ({ ...p, [key]: v })) }

  function handleSave() {
    setSaveError(null)
    save.mutate(
      {
        nombre:      form.nombre    || 'Consultora',
        logo_url:    form.logo_url  || null,
        telefono:    form.telefono  || null,
        email:       form.email     || null,
        whatsapp:    form.whatsapp  || null,
        instagram:   form.instagram || null,
        sitio_web:   form.sitio_web || null,
        // Preserve resources — never overwrite them from this page
        market_data: config?.market_data ?? {},
      },
      {
        onSuccess: () => {
          setSaved(true)
          setSaveError(null)
          setTimeout(() => setSaved(false), 3000)
        },
        onError: (e: Error) => {
          setSaveError(e.message || 'Error al guardar. Revisá tu conexión e intentá de nuevo.')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Datos de la consultora para reportes y presentaciones.</p>
      </div>

      {saveError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-start gap-2">
          <span className="text-destructive text-sm font-medium">Error al guardar:</span>
          <span className="text-destructive/80 text-sm">{saveError}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-6 items-start">

        {/* Identidad */}
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-4 flex-1 min-w-[280px]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identidad</p>
          <Field label="Nombre de la consultora" icon={Building2} value={form.nombre} onChange={setF('nombre')} placeholder="Ej: Kohan Inmobiliaria" />
          <div className="grid gap-1.5">
            <Field label="URL del logo (imagen)" icon={Image} value={form.logo_url} onChange={setF('logo_url')} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">SVG, PNG, JPG, JPEG · El HTML muestra todos. El PDF solo PNG/JPG.</p>
            {form.logo_url && (
              <div className="mt-1 p-3 border rounded-md bg-muted flex items-center justify-center h-16">
                <img src={form.logo_url} alt="Preview" className="max-h-12 max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-4 flex-1 min-w-[280px]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contacto</p>
          <Field label="Teléfono" icon={Phone} value={form.telefono} onChange={setF('telefono')} placeholder="+595 981 000 000" />
          <Field label="Email" icon={Mail} type="email" value={form.email} onChange={setF('email')} placeholder="info@consultora.com.py" />
          <Field label="WhatsApp (número con código de país)" icon={MessageCircle} value={form.whatsapp} onChange={setF('whatsapp')} placeholder="595981000000" />
        </div>

        {/* Redes y web */}
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-4 flex-1 min-w-[280px]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Redes y web</p>
          <Field label="Instagram (@usuario)" icon={Instagram} value={form.instagram} onChange={setF('instagram')} placeholder="@kohaninmobiliaria" />
          <Field label="Sitio web" icon={Globe} value={form.sitio_web} onChange={setF('sitio_web')} placeholder="https://consultora.com.py" />
        </div>

      </div>

      {/* Referidos — links cortos */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links cortos para referidos</p>
        </div>

        {/* Base URL */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Base</Label>
          <code className="text-sm font-medium text-gray-700">{SHORT_BASE}</code>
          <p className="text-xs text-muted-foreground">
            Cualquier cosa después de <code>/l/</code> funciona: <code>/l/juan</code>, <code>/l/pedro</code>, <code>/l/mozo1</code>
          </p>
        </div>

        {/* Generador */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs text-muted-foreground">Generar link</Label>
          <div className="flex gap-2">
            <Input
              value={refName}
              onChange={e => { setRefName(e.target.value); setRefLink('') }}
              placeholder="Nombre del referido (ej: Juan Mozo)"
              className="text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter' && refName.trim()) {
                  setRefLink(`${SHORT_BASE}${toSlug(refName)}`)
                }
              }}
            />
            <Button
              variant="outline"
              disabled={!refName.trim()}
              onClick={() => setRefLink(`${SHORT_BASE}${toSlug(refName)}`)}
            >
              Generar
            </Button>
          </div>

          {refLink && (
            <div className="flex flex-col gap-3 p-4 bg-muted/60 rounded-lg border">
              <code className="text-sm font-semibold text-gray-800">{refLink}</code>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(refLink, 'Link copiado')}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />Copiar
                </Button>
                <a
                  href={waShareUrl(refLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra sticky de guardado */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t py-3 flex items-center justify-between gap-4 -mx-6 px-6 z-10">
        <span className="text-xs text-muted-foreground">
          {saved ? '✓ Cambios guardados' : 'Recordá guardar tus cambios antes de salir.'}
        </span>
        <Button onClick={handleSave} disabled={save.isPending} className="min-w-[140px]">
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <><Check className="h-4 w-4 mr-1.5" />Guardado</>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  )
}
