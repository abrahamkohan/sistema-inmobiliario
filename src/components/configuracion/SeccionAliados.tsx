// src/components/configuracion/SeccionAliados.tsx
import { useState } from 'react'
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCommercialAllies, useCreateAlly, useUpdateAlly, useDeleteAlly } from '@/hooks/useCommercialAllies'

export function SeccionAliados() {
  const { data: allies = [], isLoading } = useCommercialAllies()
  const createAlly = useCreateAlly()
  const updateAlly = useUpdateAlly()
  const deleteAlly = useDeleteAlly()

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [form, setForm] = useState({
    nombre: '',
    porcentaje_default: '',
    telefono: '',
    email: '',
    activo: true,
  })

  function resetForm() {
    setForm({ nombre: '', porcentaje_default: '', telefono: '', email: '', activo: true })
    setShowAdd(false)
    setEditingId(null)
  }

  async function handleAdd() {
    if (!form.nombre.trim() || !form.porcentaje_default) {
      toast.error('Nombre y porcentaje son obligatorios')
      return
    }
    try {
      await createAlly.mutateAsync({
        nombre: form.nombre.trim(),
        porcentaje_default: parseFloat(form.porcentaje_default),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        activo: form.activo,
      })
      toast.success('Aliado comercial agregado')
      resetForm()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function handleUpdate(id: string) {
    if (!form.nombre.trim() || !form.porcentaje_default) {
      toast.error('Nombre y porcentaje son obligatorios')
      return
    }
    try {
      await updateAlly.mutateAsync({
        id,
        nombre: form.nombre.trim(),
        porcentaje_default: parseFloat(form.porcentaje_default),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        activo: form.activo,
      })
      toast.success('Aliado comercial actualizado')
      resetForm()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar al aliado "${nombre}"?`)) return
    try {
      await deleteAlly.mutateAsync(id)
      toast.success('Aliado comercial eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function handleToggleActivo(ally: typeof allies[0]) {
    try {
      await updateAlly.mutateAsync({
        id: ally.id,
        activo: !ally.activo,
      })
      toast.success(ally.activo ? 'Aliado desactivado' : 'Aliado activado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  function startEdit(ally: typeof allies[0]) {
    setForm({
      nombre: ally.nombre,
      porcentaje_default: ally.porcentaje_default.toString(),
      telefono: ally.telefono ?? '',
      email: ally.email ?? '',
      activo: ally.activo,
    })
    setEditingId(ally.id)
    setShowAdd(true)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">🤝 Aliados Comerciales</p>
          <p className="text-xs text-gray-400 mt-1">
            Aliados externos que reciben porcentaje de comisión en ventas
          </p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        )}
      </div>

      {/* Formulario de agregar/editar */}
      {showAdd && (
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
              <input
                type="text"
                placeholder="Nombre del aliado"
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">% Comisión por defecto *</label>
              <input
                type="number"
                placeholder="Ej: 20"
                min="0"
                max="100"
                step="0.01"
                value={form.porcentaje_default}
                onChange={e => setForm(p => ({ ...p, porcentaje_default: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
              <input
                type="text"
                placeholder="+595..."
                value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="aliado@ejemplo.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              Activo
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
              disabled={createAlly.isPending || updateAlly.isPending}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Guardar' : 'Agregar'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de aliados */}
      <div className="flex flex-col gap-2">
        {allies.map(ally => (
          <div key={ally.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {ally.nombre[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{ally.nombre}</span>
                  {!ally.activo && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                      Inactivo
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {ally.porcentaje_default}% por defecto
                  {ally.email && ` • ${ally.email}`}
                  {ally.telefono && ` • ${ally.telefono}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Toggle activo */}
              <button
                onClick={() => handleToggleActivo(ally)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  ally.activo ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
                title={ally.activo ? 'Desactivar' : 'Activar'}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  ally.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>

              {/* Editar */}
              <button
                onClick={() => startEdit(ally)}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Eliminar */}
              <button
                onClick={() => handleDelete(ally.id, ally.nombre)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {allies.length === 0 && !showAdd && (
          <p className="text-xs text-gray-400 text-center py-4">
            No hay aliados comerciales. Agregá uno para usar en las comisiones.
          </p>
        )}
      </div>
    </div>
  )
}
