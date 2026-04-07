// src/pages/AdminOnboardingPage.tsx
// Alta manual de nuevos tenants (clientes SaaS).
// Solo accesible por el owner/admin del sistema.

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle2, Copy, ChevronLeft, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { createConsultant } from '@/lib/consultants'
import type { Database } from '@/types/database'

type ConsultantRow = Database['public']['Tables']['consultants']['Row']

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeSubdomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function normalizeDomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')  // quitar protocolo si lo pegan
    .replace(/\/$/, '')           // quitar trailing slash
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdminOnboardingPage() {
  const navigate = useNavigate()

  const [nombre,         setNombre]         = useState('')
  const [subdomain,      setSubdomain]      = useState('')
  const [customDomain,   setCustomDomain]   = useState('')
  const [colorPrimary,   setColorPrimary]   = useState('#D4AF37')
  const [colorSecondary, setColorSecondary] = useState('#1e293b')
  const [colorAccent,    setColorAccent]    = useState('#f0c93a')
  const [isPending,      setIsPending]      = useState(false)
  const [created,        setCreated]        = useState<ConsultantRow | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !subdomain.trim()) {
      toast.error('Nombre y subdominio son obligatorios')
      return
    }

    setIsPending(true)
    try {
      const row = await createConsultant({
        nombre:          nombre.trim(),
        subdomain:       subdomain.trim(),
        custom_domain:   customDomain.trim() || null,
        color_primary:   colorPrimary,
        color_secondary: colorSecondary,
        color_accent:    colorAccent,
        activo:          true,
        uuid:            crypto.randomUUID(),
      })
      setCreated(row)
      toast.success('Tenant creado correctamente')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('El subdominio ya existe, elegí otro')
      } else {
        toast.error('Ocurrió un error, intentá nuevamente')
      }
    } finally {
      setIsPending(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado'))
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (created) {
    const appUrl = created.custom_domain
      ? `https://${created.custom_domain}`
      : `https://${created.subdomain}.${window.location.hostname.split('.').slice(1).join('.')}`

    return (
      <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
        <button
          onClick={() => setCreated(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Crear otro
        </button>

        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{created.nombre}</h1>
            <p className="text-sm text-muted-foreground">Tenant creado correctamente</p>
          </div>
        </div>

        {/* UUID */}
        <div className="rounded-xl border bg-gray-50 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">UUID del tenant</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-800 bg-white border rounded-lg px-3 py-2 truncate">
              {created.uuid}
            </code>
            <button
              onClick={() => copyToClipboard(created.uuid ?? '')}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              title="Copiar UUID"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* URL del sistema */}
        <div className="rounded-xl border bg-gray-50 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">URL del sistema</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-800 bg-white border rounded-lg px-3 py-2 truncate">
              {appUrl}
            </code>
            <button
              onClick={() => copyToClipboard(appUrl)}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              title="Copiar URL"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {created.custom_domain && (
            <p className="text-xs text-muted-foreground">
              Asegurate de que el DNS apunte a este servidor antes de invitar usuarios.
            </p>
          )}
        </div>

        {/* Próximos pasos */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-amber-800">Próximos pasos</p>
          <ol className="text-sm text-amber-900 flex flex-col gap-1.5 list-decimal list-inside">
            <li>Desde la URL del sistema, iniciá sesión como admin del nuevo tenant</li>
            <li>Andá a <strong>Configuración → Mi Equipo → Invitar</strong></li>
            <li>Invitá al primer usuario del tenant</li>
          </ol>
        </div>

        <Button variant="outline" onClick={() => navigate('/configuracion')}>
          Volver a Configuración
        </Button>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  const saasBaseDomain = window.location.hostname.split('.').slice(1).join('.')

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/configuracion')}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-gray-900">Nuevo cliente</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Nombre de la inmobiliaria <span className="text-red-500">*</span></Label>
          <Input
            id="nombre"
            placeholder="Ej: Kohan & Campos Inmobiliaria"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        {/* Subdominio */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subdomain">
            Subdominio <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">(único, sin espacios)</span>
          </Label>
          <div className="flex items-center gap-0">
            <Input
              id="subdomain"
              placeholder="kohan"
              value={subdomain}
              onChange={e => setSubdomain(normalizeSubdomain(e.target.value))}
              className="rounded-r-none"
            />
            <span className="flex items-center h-10 px-3 rounded-r-lg border border-l-0 bg-gray-50 text-sm text-muted-foreground whitespace-nowrap">
              .{saasBaseDomain}
            </span>
          </div>
          {subdomain && (
            <p className="text-xs text-muted-foreground">{subdomain}.{saasBaseDomain}</p>
          )}
        </div>

        {/* Dominio propio (opcional) */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customDomain">
            Dominio propio
            <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional — si el cliente usa su propio dominio)</span>
          </Label>
          <Input
            id="customDomain"
            placeholder="Ej: sistema.suinmobiliaria.com"
            value={customDomain}
            onChange={e => setCustomDomain(normalizeDomain(e.target.value))}
          />
          {customDomain && (
            <p className="text-xs text-muted-foreground">El sistema cargará en https://{customDomain}</p>
          )}
        </div>

        {/* Colores */}
        <div className="flex flex-col gap-3">
          <Label>Colores de marca</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Primario',    value: colorPrimary,   setter: setColorPrimary },
              { label: 'Secundario',  value: colorSecondary, setter: setColorSecondary },
              { label: 'Acento',      value: colorAccent,    setter: setColorAccent },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border bg-background">
                  <input
                    type="color"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs font-mono text-gray-600">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={isPending} className="mt-2">
          {isPending ? 'Creando...' : 'Crear tenant'}
        </Button>

      </form>
    </div>
  )
}
