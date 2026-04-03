// src/components/configuracion/ColorPreview.tsx

interface Props {
  primary: string
  secondary: string
  accent: string
  nombre: string
}

function luminance(hex: string): number {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function textColor(bg: string): string {
  try { return luminance(bg) > 0.35 ? '#1a1a1a' : '#ffffff' }
  catch { return '#ffffff' }
}

export function ColorPreview({ primary, secondary, accent, nombre }: Props) {
  const headerText  = textColor(secondary)
  const buttonText  = textColor(primary)

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 border-b">
        Preview en vivo
      </p>

      {/* Header simulado */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: secondary }}
      >
        <span className="text-sm font-bold" style={{ color: headerText }}>
          {nombre || 'Mi Inmobiliaria'}
        </span>
        <div className="w-5 h-5 rounded-full opacity-60" style={{ backgroundColor: headerText }} />
      </div>

      {/* Contenido simulado */}
      <div className="bg-white px-4 py-4 flex flex-col gap-3">
        <button
          className="w-full py-2 rounded-lg text-sm font-semibold transition-none"
          style={{ backgroundColor: primary, color: buttonText }}
        >
          Botón principal
        </button>

        <p className="text-xs text-gray-500">
          Texto normal con{' '}
          <span className="font-medium underline" style={{ color: accent }}>
            link de ejemplo
          </span>
          {' '}y más contenido.
        </p>
      </div>
    </div>
  )
}
