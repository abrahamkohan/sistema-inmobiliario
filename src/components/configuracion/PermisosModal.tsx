// src/components/configuracion/PermisosModal.tsx
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import type { TeamMember } from '@/lib/team'

// Módulos con etiquetas amigables
const PERM_MODULES: Record<string, string> = {
  crm: 'CRM',
  propiedades: 'Propiedades',
  proyectos: 'Proyectos',
  media_props: 'Media (Prop/Proj)',
  marketing_media: 'Marketing',
  finanzas: 'Finanzas',
  tareas: 'Tareas',
  reportes: 'Reportes',
  configuracion: 'Configuración',
}

const PERM_OPTIONS = [
  { value: 'none', label: '—', description: 'Sin acceso' },
  { value: 'read', label: '👁', description: 'Solo lectura' },
  { value: 'write', label: '✏️', description: 'Crear y editar' },
  { value: 'full', label: '🗑️', description: 'Control total' },
]

interface PermisosModalProps {
  user: TeamMember
  open: boolean
  onClose: () => void
}

export function PermisosModal({ user, open, onClose }: PermisosModalProps) {
  const setPermisos = useSetPermisos()
  const [permValues, setPermValues] = useState<Record<string, string>>({})

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (open) {
      setPermValues((user.permisos as Record<string, string>) || {})
    }
  }, [open, user.permisos])

  function updatePerm(module: string, value: string) {
    setPermValues(prev => ({ ...prev, [module]: value }))
  }

  async function handleSave() {
    try {
      await setPermisos.mutateAsync({ userId: user.id, permisos: permValues })
      toast.success('Permisos actualizados')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[90vw] max-w-md max-h-[85vh] overflow-y-auto z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {user.full_name || 'Usuario'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500">
                Edita los permisos por módulo
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Leyenda */}
          <div className="px-4 py-3 bg-gray-50 border-b text-xs text-gray-600 flex flex-wrap gap-3">
            {PERM_OPTIONS.map(opt => (
              <span key={opt.value} className="flex items-center gap-1">
                <span className="font-medium">{opt.label}</span>
                <span className="text-gray-400">=</span>
                <span>{opt.description}</span>
              </span>
            ))}
          </div>

          {/* Grid de permisos */}
          <div className="p-4">
            <div className="space-y-2">
              {Object.entries(PERM_MODULES).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex gap-1">
                    {PERM_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePerm(key, opt.value)}
                        className={`w-10 h-8 rounded-md text-lg transition-all ${
                          permValues[key] === opt.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={opt.description}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={setPermisos.isPending}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {setPermisos.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
