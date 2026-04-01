// src/pages/ConfiguracionPage.tsx
import { useEffect, useState } from 'react'
import {
  Building2, Phone, Mail, MessageCircle, Instagram, Globe, Image,
  Loader2, Check, Copy, Users, Trash2, Plus, Calendar,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
import { useConsultoraConfig, useSaveConsultoraConfig } from '@/hooks/useConsultora'
import { useAgentes, useCreateAgente, useDeleteAgente } from '@/hooks/useAgentes'
import { useTeam, useSetRole, useRemoveRole, useInviteUser } from '@/hooks/useTeam'
import { useIsAdmin } from '@/hooks/useUserRole'
import { useAuth } from '@/context/AuthContext'

// ─── Referidos helpers ────────────────────────────────────────────────────────

const APP_URL    = ((import.meta.env.VITE_APP_URL as string) || window.location.origin).replace(/\/$/, '')
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
  simulador_publico: boolean
  pwa_icon_url: string
}

const EMPTY_FORM: FormState = {
  nombre: '', logo_url: '', telefono: '', email: '', whatsapp: '', instagram: '', sitio_web: '',
  simulador_publico: false, pwa_icon_url: '',
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

  // Google Calendar
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)
  const [gcalLoading,   setGcalLoading]   = useState(false)

  // Equipo (solo admin)
  const isAdmin   = useIsAdmin()
  const { session } = useAuth()
  const { data: team = [] } = useTeam()
  const setRole    = useSetRole()
  const removeRole = useRemoveRole()
  const inviteUser = useInviteUser()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<'admin' | 'agente'>('agente')
  const [showInvite,  setShowInvite]  = useState(false)

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    try {
      await inviteUser.mutateAsync(inviteEmail.trim())
      toast.success(`Invitación enviada a ${inviteEmail} — asignale el rol "${inviteRole}" cuando acepte`)
      setInviteEmail(''); setShowInvite(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al invitar')
    }
  }

  async function handleSetRole(userId: string, role: 'admin' | 'agente') {
    try {
      await setRole.mutateAsync({ userId, role })
      toast.success('Rol actualizado')
    } catch {
      toast.error('Error al actualizar rol')
    }
  }

  async function handleRemoveUser(userId: string, name: string) {
    if (!confirm(`¿Quitarle el acceso al sistema a "${name}"?`)) return
    try {
      await removeRole.mutateAsync(userId)
      toast.success('Acceso eliminado')
    } catch {
      toast.error('Error al eliminar acceso')
    }
  }

  // Agentes
  const { data: agentes = [] } = useAgentes()
  const createAgente = useCreateAgente()
  const deleteAgente = useDeleteAgente()
  const [showAddAgente, setShowAddAgente] = useState(false)
  const [nuevoNombre, setNuevoNombre]     = useState('')
  const [nuevoPct, setNuevoPct]           = useState('')

  const totalPct = agentes.filter(a => a.activo).reduce((s, a) => s + a.porcentaje_comision, 0)

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
    } catch {
      toast.error('Error al eliminar')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setGcalConnected(false); return }
      supabase.functions
        .invoke('google-oauth', {
          body: { action: 'status' },
          headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY },
        })
        .then(({ data }) => setGcalConnected(data?.connected ?? false))
        .catch(() => setGcalConnected(false))
    })
  }, [])

  async function handleConnectGoogle() {
    setGcalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('No hay sesión activa. Volvé a iniciar sesión.'); return }

      // Generar state criptográficamente seguro para protección CSRF
      const stateBytes = new Uint8Array(16)
      crypto.getRandomValues(stateBytes)
      const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      const { data, error } = await supabase.functions.invoke('google-oauth', {
        body: { action: 'authorize', state },
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY },
      })
      if (error || !data?.url) { toast.error('No se pudo obtener la URL de autorización'); return }

      // Guardar state antes de redirigir — se valida en el callback
      sessionStorage.setItem('gcal_oauth_state', state)
      window.location.href = data.url
    } finally {
      setGcalLoading(false)
    }
  }

  useEffect(() => {
    if (!config) return
    setForm({
      nombre:            config.nombre            ?? '',
      logo_url:          config.logo_url          ?? '',
      telefono:          config.telefono          ?? '',
      email:             config.email             ?? '',
      whatsapp:          config.whatsapp          ?? '',
      instagram:         config.instagram         ?? '',
      sitio_web:         config.sitio_web         ?? '',
      simulador_publico: config.simulador_publico ?? false,
      pwa_icon_url:      config.pwa_icon_url      ?? '',
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
        sitio_web:         form.sitio_web || null,
        simulador_publico: form.simulador_publico,
        pwa_icon_url:      form.pwa_icon_url || null,
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
          <div className="grid gap-1.5 pt-1 border-t border-gray-100">
            <Field label="Ícono de app (PWA)" icon={Image} value={form.pwa_icon_url} onChange={setF('pwa_icon_url')} placeholder="https://sistema.kohancampos.com.py/pwa_icon_url.png" />
            <p className="text-xs text-muted-foreground">Cuadrado · mínimo 512×512px · PNG recomendado</p>
            {form.pwa_icon_url && (
              <div className="mt-1 p-2 border rounded-md bg-muted flex items-center gap-3">
                <img src={form.pwa_icon_url} alt="Ícono PWA" className="w-12 h-12 object-cover rounded-xl border" />
                <p className="text-xs text-muted-foreground">Vista previa del ícono instalado</p>
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

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Simulador público</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permite acceso sin login a <code className="text-xs">/simulador</code></p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, simulador_publico: !p.simulador_publico }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.simulador_publico ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.simulador_publico ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

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

      {/* Agentes / Socios */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agentes / Socios</p>
            <p className="text-sm text-muted-foreground mt-1">Define quiénes reciben comisiones y en qué porcentaje. La suma debe ser 100%.</p>
          </div>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${Math.abs(totalPct - 100) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
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

      {/* ── Google Calendar ── */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Google Calendar</p>
        </div>

        {gcalConnected === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verificando conexión...
          </div>
        ) : gcalConnected ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Conectado</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Las tareas de tipo llamada, visita y reunión se sincronizan automáticamente al crearse.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Conectá la cuenta Google de la consultora para que las tareas de tipo llamada, visita y reunión se agreguen automáticamente al calendario al crearse.
            </p>
            <button
              onClick={handleConnectGoogle}
              disabled={gcalLoading}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
              {gcalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              Conectar Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* ── Equipo (solo admin) ── */}
      {isAdmin && (
        <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Equipo</h2>
              <p className="text-xs text-gray-400 mt-0.5">Usuarios con acceso al sistema</p>
            </div>
            <button
              onClick={() => setShowInvite(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Invitar
            </button>
          </div>

          {/* Formulario de invitación */}
          {showInvite && (
            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                  autoFocus
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'admin' | 'agente')}
                  className="h-9 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                >
                  <option value="agente">Agente</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviteUser.isPending || !inviteEmail.trim()}
                  className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold disabled:opacity-40"
                >
                  {inviteUser.isPending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Le llegará un magic link por email. Asignale el rol "{inviteRole}" cuando aparezca en la lista.
              </p>
            </div>
          )}

          {/* Lista de usuarios */}
          <div className="flex flex-col gap-2">
            {team.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(member.full_name ?? member.id)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      {member.full_name ?? '—'}
                      {member.is_owner && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Propietario</span>
                      )}
                      {!member.is_owner && member.id === session?.user.id && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Vos</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{member.role ?? 'Sin rol'}</p>
                  </div>
                </div>
                {!member.is_owner && member.id !== session?.user.id && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role ?? ''}
                      onChange={e => handleSetRole(member.id, e.target.value as 'admin' | 'agente')}
                      className="h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                    >
                      <option value="">Sin rol</option>
                      <option value="admin">Admin</option>
                      <option value="agente">Agente</option>
                    </select>
                    <button
                      onClick={() => handleRemoveUser(member.id, member.full_name ?? member.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar acceso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {team.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No hay usuarios todavía</p>
            )}
          </div>
        </div>
      )}

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
