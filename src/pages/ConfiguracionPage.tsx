// src/pages/ConfiguracionPage.tsx
import { useEffect, useState } from 'react'
import { Loader2, Check, Users, Copy, MessageCircle, Plus, Trash2, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { useConsultoraConfig, useSaveConsultoraConfig } from '@/hooks/useConsultora'
import { useAgentes, useCreateAgente, useDeleteAgente } from '@/hooks/useAgentes'
import { useIsAdmin } from '@/hooks/useUserRole'

import { SeccionIdentidad }     from '@/components/configuracion/SeccionIdentidad'
import { SeccionColores }       from '@/components/configuracion/SeccionColores'
import { SeccionContacto }      from '@/components/configuracion/SeccionContacto'
import { SeccionIntegraciones } from '@/components/configuracion/SeccionIntegraciones'
import { SeccionEquipo }        from '@/components/configuracion/SeccionEquipo'
import { SeccionAliados }       from '@/components/configuracion/SeccionAliados'

// ─── Referidos ────────────────────────────────────────────────────────────────

const APP_URL    = ((import.meta.env.VITE_APP_URL as string) || window.location.origin).replace(/\/$/, '')
const SHORT_BASE = `${APP_URL}/l/`

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  nombre:            string
  slogan:            string
  logo_url:          string
  logo_light_url:    string
  pwa_icon_url:      string
  color_primary:     string
  color_secondary:   string
  color_accent:      string
  telefono:          string
  email:             string
  whatsapp:          string
  instagram:         string
  sitio_web:         string
  simulador_publico: boolean
}

const EMPTY: FormState = {
  nombre: '', slogan: '', logo_url: '', logo_light_url: '', pwa_icon_url: '',
  color_primary: '#C9A34E', color_secondary: '#1E3A5F', color_accent: '#C9A34E',
  telefono: '', email: '', whatsapp: '', instagram: '', sitio_web: '',
  simulador_publico: false,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConfiguracionPage() {
  const { data: config, isLoading } = useConsultoraConfig()
  const save    = useSaveConsultoraConfig()
  const isAdmin = useIsAdmin()

  const [form,      setForm]      = useState<FormState>(EMPTY)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [refName,   setRefName]   = useState('')
  const [refLink,   setRefLink]   = useState('')

  // Agentes
  const { data: agentes = [] } = useAgentes()
  const createAgente  = useCreateAgente()
  const deleteAgente  = useDeleteAgente()
  const [showAddAgente, setShowAddAgente] = useState(false)
  const [nuevoNombre,   setNuevoNombre]   = useState('')
  const [nuevoPct,      setNuevoPct]      = useState('')
  const totalPct = agentes.filter(a => a.activo).reduce((s, a) => s + a.porcentaje_comision, 0)

  useEffect(() => {
    if (!config) return
    setForm({
      nombre:            config.nombre            ?? '',
      slogan:            config.slogan            ?? '',
      logo_url:          config.logo_url          ?? '',
      logo_light_url:    config.logo_light_url    ?? '',
      pwa_icon_url:      config.pwa_icon_url      ?? '',
      color_primary:     config.color_primary     ?? '#C9A34E',
      color_secondary:   config.color_secondary   ?? '#1E3A5F',
      color_accent:      config.color_accent      ?? '#C9A34E',
      telefono:          config.telefono          ?? '',
      email:             config.email             ?? '',
      whatsapp:          config.whatsapp          ?? '',
      instagram:         config.instagram         ?? '',
      sitio_web:         config.sitio_web         ?? '',
      simulador_publico: config.simulador_publico ?? false,
    })
  }, [config])

  function set(key: string, value: string | boolean) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function handleSave() {
    setSaveError(null)
    save.mutate(
      {
        nombre:            form.nombre    || 'Consultora',
        slogan:            form.slogan    || null,
        logo_url:          form.logo_url          || null,
        logo_light_url:    form.logo_light_url    || null,
        pwa_icon_url:      form.pwa_icon_url      || null,
        color_primary:     form.color_primary     || null,
        color_secondary:   form.color_secondary   || null,
        color_accent:      form.color_accent       || null,
        telefono:          form.telefono          || null,
        email:             form.email             || null,
        whatsapp:          form.whatsapp          || null,
        instagram:         form.instagram         || null,
        sitio_web:         form.sitio_web         || null,
        simulador_publico: form.simulador_publico,
        market_data:       config?.market_data ?? {},
        version:           config?.version ?? 1,
      },
      {
        onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
        onError: (e: Error) => setSaveError(e.message || 'Error al guardar'),
      },
    )
  }

  async function handleAddAgente() {
    if (!nuevoNombre.trim() || !nuevoPct) return
    try {
      await createAgente.mutateAsync({ nombre: nuevoNombre.trim(), porcentaje_comision: parseFloat(nuevoPct) })
      toast.success('Agente agregado')
      setNuevoNombre(''); setNuevoPct(''); setShowAddAgente(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function handleDeleteAgente(id: string, nombre: string) {
    if (!confirm(`¿Eliminar a "${nombre}"?`)) return
    try {
      await deleteAgente.mutateAsync(id)
      toast.success('Agente eliminado')
    } catch { toast.error('Error al eliminar') }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl flex flex-col gap-5">

      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Branding, contacto e integraciones del sistema.</p>
      </div>

      {saveError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* 1. Mi Inmobiliaria */}
      <SeccionIdentidad
        nombre={form.nombre}
        slogan={form.slogan}
        logo_url={form.logo_url}
        logo_light_url={form.logo_light_url}
        pwa_icon_url={form.pwa_icon_url}
        onChange={set}
      />

      {/* 2. Colores */}
      <SeccionColores
        color_primary={form.color_primary}
        color_secondary={form.color_secondary}
        color_accent={form.color_accent}
        nombre={form.nombre}
        onChange={set}
      />

      {/* 3. Contacto */}
      <SeccionContacto
        telefono={form.telefono}
        email={form.email}
        whatsapp={form.whatsapp}
        instagram={form.instagram}
        sitio_web={form.sitio_web}
        onChange={set}
      />

      {/* 4. Integraciones */}
      <SeccionIntegraciones
        simulador_publico={form.simulador_publico}
        onSimuladorChange={v => set('simulador_publico', v)}
      />

      {/* Referidos */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links para referidos</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Base</Label>
          <code className="text-sm font-medium text-gray-700">{SHORT_BASE}</code>
          <p className="text-xs text-muted-foreground">
            Cualquier cosa después de <code>/l/</code> funciona: <code>/l/juan</code>, <code>/l/pedro</code>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={refName}
              onChange={e => { setRefName(e.target.value); setRefLink('') }}
              placeholder="Nombre del referido"
              className="text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && refName.trim()) setRefLink(`${SHORT_BASE}${toSlug(refName)}`) }}
            />
            <Button variant="outline" disabled={!refName.trim()} onClick={() => setRefLink(`${SHORT_BASE}${toSlug(refName)}`)}>
              Generar
            </Button>
          </div>
          {refLink && (
            <div className="flex flex-col gap-3 p-4 bg-muted/60 rounded-lg border">
              <code className="text-sm font-semibold text-gray-800 break-all">{refLink}</code>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(refLink).then(() => toast.success('Link copiado'))}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />Copiar
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Cargá un contacto acá: ${refLink}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agentes / Socios */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agentes / Socios</p>
            <p className="text-xs text-muted-foreground mt-1">
              Definen quiénes reciben comisiones y en qué porcentaje. La suma debe ser 100%.
            </p>
          </div>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
            Math.abs(totalPct - 100) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {totalPct}%
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {agentes.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {a.nombre[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.nombre}</p>
                  <p className="text-xs text-gray-500">{a.porcentaje_comision}% de cada comisión</p>
                </div>
              </div>
              <button onClick={() => handleDeleteAgente(a.id, a.nombre)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {showAddAgente ? (
            <div className="p-3 border border-gray-200 rounded-xl flex flex-col gap-3 bg-gray-50">
              <input type="text" placeholder="Nombre del agente" value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 bg-white" />
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="% comisión (ej: 50)" value={nuevoPct}
                  onChange={e => setNuevoPct(e.target.value)} min="0" max="100" step="0.01"
                  className="flex-1 h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 bg-white" />
                <button onClick={handleAddAgente} disabled={createAgente.isPending}
                  className="h-10 px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40">
                  Agregar
                </button>
                <button onClick={() => setShowAddAgente(false)} className="h-10 px-3 text-sm text-gray-500 hover:text-gray-700">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddAgente(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
              <Plus className="w-4 h-4" />Agregar agente
            </button>
          )}
        </div>
      </div>

      {/* 5. Equipo — solo admin */}
      {isAdmin && <SeccionEquipo />}

      {/* Aliados comerciales */}
      <SeccionAliados />

      {/* 6. Seguridad */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🔒 Seguridad</p>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-800">Cambiar contraseña</p>
            <p className="text-xs text-muted-foreground mt-0.5">Te enviamos un email para resetearla</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
              if (!session?.user.email) return
              const { supabase } = await import('@/lib/supabase')
              await supabase.auth.resetPasswordForEmail(session.user.email)
              toast.success('Email de recuperación enviado')
            }}
          >
            Enviar email
          </Button>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t py-3 flex items-center justify-between gap-4 -mx-4 sm:-mx-6 px-4 sm:px-6 z-10">
        <span className="text-xs text-muted-foreground">
          {saved ? '✓ Cambios guardados' : 'Recordá guardar antes de salir.'}
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
