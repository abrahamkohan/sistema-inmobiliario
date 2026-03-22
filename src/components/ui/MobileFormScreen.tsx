// src/components/ui/MobileFormScreen.tsx
import { useEffect, useRef } from 'react'
import { ChevronLeft, X } from 'lucide-react'

interface MobileFormScreenProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function MobileFormScreen({ open, onClose, title, children }: MobileFormScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 })
  }, [open])

  if (!open) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col w-screen max-w-full overflow-x-hidden bg-slate-100">

      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 h-12 bg-white border-b">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-gray-500 px-2 py-1 rounded-lg active:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Volver</span>
        </button>

        <h2 className="text-sm font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
          {title}
        </h2>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 active:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full w-full min-w-0 overflow-y-auto overflow-x-hidden px-3 py-3"
        >
          {children}
        </div>
      </div>

    </div>
  )
}
