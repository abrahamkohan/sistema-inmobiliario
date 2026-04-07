// src/pages/SaasAdminTenantPage.tsx
// Detalle de un tenant: branding, equipo, acciones.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft, Copy, ToggleLeft, ToggleRight, Pencil, Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useIsSaasOwner } from '@/hooks/useIsSaasOwner'
import type { Database } from '@/types/database'

type ConsultantRow = Database['public']['Tables']['consultants']['Row']

interface TeamMemberBasic {
  user_id: string
  role: string
  is_owner: boolean
  full_name: string | null
  email: string | null
}

async function getTenant(uuid: string): Promise<ConsultantRow | null> {
  const { data } = await supabase
    .from('consultants')
    .select('*')
    .eq('uuid', uuid as any)
    .maybeSingle()
  return data as ConsultantRow | null
}

async function getTenantTeam(uuid: string): Promise<TeamMemberBasic[]> {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role, is_owner')
    .eq('consultant_id', uuid as any)

  if (!roles?.length) return []

  const userIds = roles.map(r => r.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds as any)

  const { data: emails } = await (supabase.rpc as any)('get_team_emails')

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))
  const emailMap = new Map<string, string>((emails ?? []).map((e: any) => [e.user_id as string, String(e.email ?? '')]))

  return roles.map(r => ({
    user_id:   r.user_id,
    role:      r.role,
    is_owner:  r.is_owner,
    full_name: profileMap.get(r.user_id) ?? null,
    email:     emailMap.get(r.user_id) ?? null,
  }))
}

async function updateTenantBranding(uuid: string, patch: Partial<ConsultantRow>): Promise<void> {
  const { error } = await supabase
    .from('consultants')
    .update(patch as any)
    .eq('uuid', uuid as any)
  if (error) throw error
}

export function SaasAdminTenantPage() {
  const { uuid }    = useParams<{ uuid: string }>()
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const isSaasOwner = useIsSaasOwner()

  const [editing, setEditing] = useState(false)
  const [nombre,  setNombre]  = useState('')
  const [colorP,  setColorP]  = useState('')
  const [colorS,  setColorS]  = useState('')

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['saas-tenant', uuid],
    queryFn: () => getTenant(uuid!),
    enabled: !!uuid && isSaasOwner === true,
  })

  const { data: team = [] } = useQuery({
    queryKey: ['saas-tenant-team', uuid],
    queryFn: () => getTenantTeam(uuid!),
    enabled: !!uuid && isSaasOwner === true,
  })

  const toggleActive = useMutation({
    mutationFn: () => updateTenantBranding(uuid!, { activo: !tenant?.activo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saas-tenant', uuid] })
      qc.invalidateQueries({ queryKey: ['saas-tenants'] })
      toast.success(tenant?.activo ? 'Tenant desactivado' : 'Tenant activado')
    },
  })

  const saveBranding = useMutation({
    mutationFn: () => updateTenantBranding(uuid!, {
      nombre:        nombre || tenant!.nombre,
      color_primary: colorP || tenant!.color_primary,
      color_secondary: colorS || tenant!.color_secondary,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saas-tenant', uuid] })
      qc.invalidateQueries({ queryKey: ['saas-tenants'] })
      setEditing(false)
      toast.success('Branding actualizado')
    },
    onError: () => toast.error('Error al guardar'),
  })

  function startEdit() {
    setNombre(tenant?.nombre ?? '')
    setColorP(tenant?.color_primary ?? '#D4AF37')
    setColorS(tenant?.color_secondary ?? '#1e293b')
    setEditing(true)
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado'))
  }

  if (isSaasOwner === null || isLoading) return null
  if (!isSaasOwner) return null
  if (!tenant) return <div className="p-6 text-sm text-muted-foreground">Tenant no encontrado</div>

  const appUrl = tenant.custom_domain
    ? `https://${tenant.custom_domain}`
    : tenant.subdomain ? `https://${tenant.subdomain}.sistema.kohancampos.com.py` : '—'

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">{tenant.nombre}</h1>
          <p className="text-xs text-muted-foreground">{appUrl}</p>
        </div>
        <button
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 hover:bg-gray-50"
        >
          {tenant.activo
            ? <><ToggleRight className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600">Activo</span></>
            : <><ToggleLeft  className="w-4 h-4 text-gray-400"   /><span className="text-gray-400">Inactivo</span></>
          }
        </button>
      </div>

      {/* Branding */}
      <div className="rounded-xl border p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branding</p>
          {!editing
            ? <button onClick={startEdit} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            : <div className="flex items-center gap-2">
                <button onClick={() => saveBranding.mutate()} disabled={saveBranding.isPending}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5" /> Guardar
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              </div>
          }
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Color primario',   value: colorP, setter: setColorP },
                { label: 'Color secundario', value: colorS, setter: setColorS },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-lg border bg-background">
                    <input type="color" value={value} onChange={e => setter(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                    <span className="text-xs font-mono text-gray-600">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: tenant.color_primary ?? '#1e293b' }} />
            <div>
              <p className="text-sm font-medium text-gray-900">{tenant.nombre}</p>
              <p className="text-xs text-muted-foreground font-mono">{tenant.color_primary} · {tenant.color_secondary}</p>
            </div>
          </div>
        )}
      </div>

      {/* Acceso */}
      <div className="rounded-xl border p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acceso</p>
        {[
          { label: 'UUID',    value: tenant.uuid ?? '—' },
          { label: 'URL',     value: appUrl },
          { label: 'Subdom.', value: tenant.subdomain ?? '—' },
          { label: 'Dominio', value: tenant.custom_domain ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
            <span className="text-sm font-mono text-gray-800 truncate flex-1">{value}</span>
            {value !== '—' && (
              <button onClick={() => copy(value)} className="flex-shrink-0 p-1.5 rounded hover:bg-gray-100 transition-colors">
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Equipo */}
      <div className="rounded-xl border p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Equipo ({team.length})
          </p>
        </div>
        {team.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin usuarios todavía</p>
        )}
        {team.map(m => (
          <div key={m.user_id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
              {(m.full_name ?? m.email ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.full_name ?? 'Sin nombre'}</p>
              <p className="text-xs text-muted-foreground truncate">{m.email ?? '—'}</p>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              m.is_owner ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {m.is_owner ? 'Owner' : m.role}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
