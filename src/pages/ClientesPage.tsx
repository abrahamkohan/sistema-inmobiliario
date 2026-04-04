// src/pages/ClientesPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClientTableDesktop } from '@/components/clients/ClientTableDesktop'
import { ClientCardMobile }   from '@/components/clients/ClientCardMobile'
import {
  useClients,
  useDeleteClient,
  useConvertToCliente,
  useChangeEstado,
} from '@/hooks/useClients'
import { useIsAdmin } from '@/hooks/useUserRole'
import { usePermiso } from '@/hooks/usePermiso'
import { useAuth } from '@/context/AuthContext'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']
type Tab = 'leads' | 'clientes' | 'todos'

export function ClientesPage() {
  const navigate = useNavigate()
  const { data: clients = [], isLoading } = useClients()
  const deleteClient  = useDeleteClient()
  const convertLead   = useConvertToCliente()
  const changeEstado  = useChangeEstado()
  const isAdmin = useIsAdmin()
  const puedeCrear = usePermiso('crm', 'write')
  const puedeEditar = usePermiso('crm', 'write')
  const { session } = useAuth()

  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<Tab>('leads')
  const [showMine, setShowMine]   = useState(false)

  // ─── Derived ──────────────────────────────────────────────────────────────

  const visibleClients = useMemo(() =>
    isAdmin && showMine
      ? clients.filter(c => c.assigned_to === session?.user?.id)
      : clients,
    [clients, isAdmin, showMine, session]
  )

  const leads    = useMemo(() => visibleClients.filter(c => (c.tipo ?? 'lead') === 'lead'),  [visibleClients])
  const clientes = useMemo(() => visibleClients.filter(c => c.tipo === 'cliente'),            [visibleClients])

  const filtered = useMemo(() => {
    const base = tab === 'leads' ? leads : tab === 'clientes' ? clientes : visibleClients
    const q = search.toLowerCase().trim()
    if (!q) return base
    return base.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.nationality?.toLowerCase().includes(q) ||
      c.apodo?.toLowerCase().includes(q)
    )
  }, [clients, leads, clientes, tab, search])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function openCreate() { navigate('/clientes/nuevo') }
  function openEdit(c: ClientRow) { navigate(`/clientes/${c.id}/editar`) }

  function handleDelete(id: string) { deleteClient.mutate(id) }

  function handleConvert(id: string) {
    if (!confirm('¿Convertir este lead en cliente?')) return
    convertLead.mutate(id, {
      onSuccess: () => toast.success('Lead convertido en Cliente'),
      onError:   () => toast.error('Error al convertir'),
    })
  }

  function handleChangeEstado(id: string, estado: string) {
    changeEstado.mutate({ id, estado })
  }

  // Form submission now handled in separate pages (ClienteFormPage)

  // isPending no longer needed here

  // ─── Render ───────────────────────────────────────────────────────────────

  const TAB_CLS = (active: boolean) =>
    `flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
      active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
    }`

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setShowMine(false)}
                className={`px-3 py-1.5 rounded-md transition-all ${!showMine ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setShowMine(true)}
                className={`px-3 py-1.5 rounded-md transition-all ${showMine ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Míos
              </button>
            </div>
          )}
          {puedeCrear && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nuevo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button className={TAB_CLS(tab === 'leads')}
          onClick={() => setTab('leads')}>
          Leads {leads.length > 0 && <span className="ml-1 text-xs text-amber-600 font-bold">({leads.length})</span>}
        </button>
        <button className={TAB_CLS(tab === 'clientes')}
          onClick={() => setTab('clientes')}>
          Clientes {clientes.length > 0 && <span className="ml-1 text-xs text-emerald-600 font-bold">({clientes.length})</span>}
        </button>
        <button className={TAB_CLS(tab === 'todos')}
          onClick={() => setTab('todos')}>
          Todos
        </button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, apodo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando...</p>
      )}

      {!isLoading && filtered.length === 0 && (
        search
          ? <EmptyState
              icon={Search}
              title={`Sin resultados para "${search}"`}
              description="Probá con otro nombre, teléfono o apodo."
            />
          : <EmptyState
              icon={tab === 'clientes' ? Users : UserPlus}
              title={tab === 'leads' ? 'Sin leads todavía' : tab === 'clientes' ? 'Sin clientes todavía' : 'Sin contactos todavía'}
              description={tab === 'leads' ? 'Agregá tu primer lead y empezá a hacer seguimiento.' : 'Los clientes aparecen acá cuando convertís un lead.'}
              action={tab !== 'clientes' ? { label: 'Agregar el primero', onClick: openCreate } : undefined}
            />
      )}

      {filtered.length > 0 && (
        <>
          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <ClientTableDesktop
              clients={filtered}
              onEdit={openEdit}
              onDelete={handleDelete}
              onConvert={handleConvert}
              onChangeEstado={handleChangeEstado}
              onView={c => navigate(`/clientes/${c.id}`)}
              puedeEditar={puedeEditar}
            />
          </div>
          {/* Mobile: cards compactas */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(c => (
              <ClientCardMobile
                key={c.id}
                client={c}
                onEdit={openEdit}
                onDelete={handleDelete}
                onConvert={handleConvert}
                onChangeEstado={handleChangeEstado}
                onView={c => navigate(`/clientes/${c.id}`)}
                puedeEditar={puedeEditar}
              />
            ))}
          </div>
        </>
      )}

    </div>
  )
}
