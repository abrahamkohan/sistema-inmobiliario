// src/components/configuracion/SeccionColores.tsx
import { ColorPreview } from './ColorPreview'

interface Props {
  color_primary: string
  color_secondary: string
  color_accent: string
  nombre: string
  onChange: (key: string, value: string) => void
}

const COLOR_FIELDS = [
  {
    key:         'color_primary',
    label:       'Color primario',
    description: 'Botones principales, CTAs',
    default:     '#C9A34E',
  },
  {
    key:         'color_secondary',
    label:       'Color secundario',
    description: 'Header del CRM, fondos oscuros',
    default:     '#1E3A5F',
  },
  {
    key:         'color_accent',
    label:       'Color accent',
    description: 'Links, highlights, iconos',
    default:     '#C9A34E',
  },
] as const

export function SeccionColores({ color_primary, color_secondary, color_accent, nombre, onChange }: Props) {
  const values: Record<string, string> = { color_primary, color_secondary, color_accent }

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
      <p className="text-base font-semibold text-foreground">🎨 Colores del sistema</p>

      {/* Pickers en fila */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          {COLOR_FIELDS.map(({ key, label, description, default: def }) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <input
                type="color"
                value={values[key] || def}
                onChange={e => onChange(key, e.target.value)}
                className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{label}</p>
                <p className="text-[10px] text-gray-400 truncate">{description}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Preview abajo */}
        <ColorPreview
          primary={color_primary || '#C9A34E'}
          secondary={color_secondary || '#1E3A5F'}
          accent={color_accent || '#C9A34E'}
          nombre={nombre}
        />
      </div>
    </div>
  )
}
