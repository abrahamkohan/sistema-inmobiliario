// src/pages/SaasAdminPage.tsx
// Dashboard interno del owner del SaaS — gestión de tenants.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Building2, Users, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useIsSaasOwner } from '@/hooks/useIsSaasOwner'
import type { Database } from '@/types/database'

type ConsultantRow = Database['public']['Tables']['consultants']['Row']

interface TenantStats {
  consultant_id: string
  user_count: number
}

async function getTenants(): Promise<ConsultantRow[]> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ConsultantRow[]
}

async function getTenantUserCounts(): Promise<TenantStats[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('consultant_id')
  if (error) return []
  const counts = new Map<string, number>()
  ;(data ?? []).forEach(r => {
    if (r.consultant_id) counts.set(r.consultant_id, (counts.get(r.consultant_id) ?? 0) + 1)
  })
  return Array.from(counts.entries()).map(([consultant_id, user_count]) => ({ consultant_id, user_count }))
}

async function toggleTenant(uuid: string, activo: boolean): Promise<void> {
  const { error } = await supabase
    .from('consultants')
    .update({ activo } as any)
    .eq('uuid', uuid as any)
  if (error) throw error
}

export function SaasAdminPage() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const isSaasOwner = useIsSaasOwner()
  const [search, setSearch] = useState('')

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['saas-tenants'],
    queryFn: getTenants,
    enabled: isSaasOwner === true,
  })

  const { data: counts = [] } = useQuery({
    queryKey: ['saas-tenant-counts'],
    queryFn: getTenantUserCounts,
    enabled: isSaasOwner === true,
  })

  const toggle = useMutation({
    mutationFn: ({ uuid, activo }: { uuid: string; activo: boolean }) =>
      toggleTenant(uuid, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-tenants'] }),
    onError: () => toast.error('Error al actualizar el tenant'),
  })

  if (isSaasOwner === null) return null
  if (!isSaasOwner) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-muted-foreground">Sin acceso</p>
    </div>
  )

  const countMap = new Map(counts.map(c => [c.consultant_id, c.user_count]))

  const filtered = tenants.filter(t =>
    !search || t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.subdomain?.includes(search) || t.custom_domain?.includes(search)
  )

  const activos   = tenants.filter(t => t.activo).length
  const inactivos = tenants.filter(t => !t.activo).length

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin SaaS</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activos} activo{activos !== 1 ? 's' : ''} · {inactivos} inactivo{inactivos !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/nuevo')}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nombre, subdominio o dominio..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-background"
      />

      {/* Tabla */}
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-gray-50 px-4 py-2.5 border-b">
          <span>Cliente</span>
          <span className="text-center px-6">Usuarios</span>
          <span className="text-center px-4">Estado</span>
          <span />
        </div>

        {isLoading && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {search ? 'Sin resultados' : 'No hay tenants todavía'}
          </div>
        )}

        {filtered.map((t, i) => {
          const userCount = t.uuid ? (countMap.get(t.uuid) ?? 0) : 0
          const domain    = t.custom_domain ?? (t.subdomain ? `${t.subdomain}.sistema` : '—')

          return (
            <div
              key={t.uuid ?? i}
              className={`grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-3 hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t' : ''}`}
            >
              {/* Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: t.color_primary ?? '#1e293b' }}
                >
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.nombre}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{domain}</p>
                </div>
              </div>

              {/* Usuarios */}
              <div className="flex items-center gap-1 px-6 text-sm text-gray-600">
                <Users className="w-3.5 h-3.5" />
                <span>{userCount}</span>
              </div>

              {/* Toggle activo */}
              <div className="px-4">
                <button
                  onClick={() => t.uuid && toggle.mutate({ uuid: t.uuid, activo: !t.activo })}
                  disabled={toggle.isPending}
                  title={t.activo ? 'Desactivar' : 'Activar'}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                >
                  {t.activo
                    ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600">Activo</span></>
                    : <><XCircle    className="w-4 h-4 text-gray-400"    /><span className="text-gray-400">Inactivo</span></>
                  }
                </button>
              </div>

              {/* Ir al detalle */}
              <button
                onClick={() => navigate(`/admin/tenant/${t.uuid}`)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
