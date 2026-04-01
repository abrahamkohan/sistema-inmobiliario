// src/components/ui/FormActionBar.tsx
// Barra flotante de acciones compartida para formularios internos.
// Mobile: barra full-width en el borde inferior.
// Desktop: panel flotante oscuro fijo en bottom-right.

interface FormActionBarProps {
  /** Texto del CTA principal — el padre resuelve isPending/isEdit antes de pasarlo */
  label: string
  onCancel: () => void
  disabled?: boolean
  /** Usar onSave cuando el submit es un onClick directo */
  onSave?: () => void
  /** Usar formId cuando el submit está vinculado a un <form id="..."> */
  formId?: string
}

export function FormActionBar({ label, onCancel, disabled = false, onSave, formId }: FormActionBarProps) {
  const submitProps = formId
    ? ({ type: 'submit' as const, form: formId })
    : ({ type: 'button' as const, onClick: onSave })

  return (
    <>
      {/* ── Mobile: barra full-width ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center gap-3 px-4 py-2"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          {...submitProps}
          disabled={disabled}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {label}
        </button>
      </div>

      {/* ── Desktop: panel flotante ── */}
      <div className="hidden md:flex fixed bottom-5 right-5 z-30 w-[220px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-3 flex-col gap-1.5">
        <button
          {...submitProps}
          disabled={disabled}
          className="w-full py-2 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="w-full py-1.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </>
  )
}
