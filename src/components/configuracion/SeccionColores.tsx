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
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🎨 Colores del sistema</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pickers */}
        <div className="flex flex-col gap-4">
          {COLOR_FIELDS.map(({ key, label, description, default: def }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <input
                  type="color"
                  value={values[key] || def}
                  onChange={e => onChange(key, e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                </div>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
              <input
                type="text"
                value={values[key] || def}
                onChange={e => {
                  const v = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(key, v)
                }}
                className="w-24 h-8 px-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                placeholder={def}
              />
            </div>
          ))}
        </div>

        {/* Live preview */}
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
