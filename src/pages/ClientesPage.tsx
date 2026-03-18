// src/pages/ClientesPage.tsx
import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { toast } from 'sonner'
import { ClientCard } from '@/components/clients/ClientCard'
import { ClientForm, type ClientFormValues } from '@/components/clients/ClientForm'
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '@/hooks/useClients'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

export function ClientesPage() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ClientRow | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return clients
    return clients.filter((c) =>
      c.full_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.nationality?.toLowerCase().includes(q)
    )
  }, [clients, search])

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(client: ClientRow) {
    setEditing(client)
    setSheetOpen(true)
  }

  function handleDelete(id: string) {
    deleteClient.mutate(id)
  }

  async function handleSubmit(values: ClientFormValues) {
    try {
      const payload = {
        full_name:        values.full_name,
        email:            values.email || null,
        phone:            values.phone || null,
        nationality:      values.nationality || null,
        notes:            values.notes || null,
        tipo:             values.tipo,
        fuente:           values.fuente || null,
        dni:              values.dni || null,
        fecha_nacimiento: values.fecha_nacimiento || null,
        campos_extra:     Object.keys(values.campos_extra).length > 0 ? values.campos_extra : null,
        apodo:            values.apodo || null,
      }
      if (editing) {
        await updateClient.mutateAsync({ id: editing.id, input: payload })
        toast.success('Guardado')
      } else {
        await createClient.mutateAsync(payload)
        toast.success(values.tipo === 'lead' ? 'Lead creado' : 'Cliente creado')
      }
      setSheetOpen(false)
      setEditing(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const isPending = createClient.isPending || updateClient.isPending

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuevo cliente
        </Button>
      </div>

      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando clientes...</p>
      )}

      {!isLoading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-muted-foreground">No hay clientes todavía.</p>
          <Button variant="outline" onClick={openCreate}>Agregar el primero</Button>
        </div>
      )}

      {!isLoading && clients.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No se encontraron clientes para "{search}".
        </p>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Mobile: full-screen */}
      <MobileFormScreen
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
      >
        <ClientForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setSheetOpen(false)}
          isSubmitting={isPending}
          stickyButtons
        />
      </MobileFormScreen>

      {/* Desktop: modal */}
      <div className="hidden md:block">
        <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
          <ClientForm
            key={editing?.id ?? 'new'}
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setSheetOpen(false)}
            isSubmitting={isPending}
          />
        </Modal>
      </div>
    </div>
  )
}
