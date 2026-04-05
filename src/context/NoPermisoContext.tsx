// src/context/NoPermisoContext.tsx
// Contexto global para mostrar el modal de "sin permisos".
// Uso: const { showNoPermiso } = useNoPermiso()
//       showNoPermiso()  →  abre el modal
import { createContext, useContext, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ShieldOff } from 'lucide-react'

interface NoPermisoContextValue {
  showNoPermiso: () => void
}

const NoPermisoContext = createContext<NoPermisoContextValue>({ showNoPermiso: () => {} })

export function useNoPermiso() {
  return useContext(NoPermisoContext)
}

export function NoPermisoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <NoPermisoContext.Provider value={{ showNoPermiso: () => setOpen(true) }}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[90vw] max-w-sm p-6 z-50 text-center">

            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldOff className="w-6 h-6 text-red-500" />
              </div>
            </div>

            <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
              Sin permisos
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500 mb-5">
              No tenés permisos para realizar esta acción.
              Contactá a un administrador si necesitás acceso.
            </Dialog.Description>

            <Dialog.Close asChild>
              <button className="w-full py-2 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
                Entendido
              </button>
            </Dialog.Close>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </NoPermisoContext.Provider>
  )
}
