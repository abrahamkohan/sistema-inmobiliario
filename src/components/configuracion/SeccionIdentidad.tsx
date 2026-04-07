// src/components/configuracion/SeccionIdentidad.tsx
import { Image } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  nombre: string
  slogan: string
  logo_url: string
  logo_light_url: string
  pwa_icon_url: string
  onChange: (key: string, value: string) => void
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function LogoField({ label, value, onChange, placeholder, hint, preview }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string; preview?: 'dark' | 'light'
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Image className="h-3.5 w-3.5" />{label}
      </Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {value && (
        <div className={`mt-1 p-3 border rounded-md flex items-center justify-center h-16 ${
          preview === 'dark' ? 'bg-[#1E3A5F]' : 'bg-gray-50'
        }`}>
          <img src={value} alt="Preview" className="max-h-10 max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}

export function SeccionIdentidad({ nombre, slogan, logo_url, logo_light_url, pwa_icon_url, onChange }: Props) {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      <p className="text-base font-semibold text-foreground">🏠 Mi Inmobiliaria</p>

      <Field
        label="Nombre de la empresa"
        value={nombre}
        onChange={v => onChange('nombre', v)}
        placeholder="Ej: Kohan & Campos"
      />

      <Field
        label="Slogan"
        value={slogan}
        onChange={v => onChange('slogan', v)}
        placeholder="Ej: Inversiones inmobiliarias de alto valor"
      />

      <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
        <LogoField
          label="Logo principal (fondos oscuros — CRM, PDF, sidebar)"
          value={logo_url}
          onChange={v => onChange('logo_url', v)}
          placeholder="https://..."
          hint="SVG, PNG · El PDF solo acepta PNG/JPG"
          preview="dark"
        />

        <LogoField
          label="Logo secundario (fondos claros — landing, email)"
          value={logo_light_url}
          onChange={v => onChange('logo_light_url', v)}
          placeholder="https://..."
          hint="PNG con fondo transparente recomendado"
          preview="light"
        />

        {/* Guía de specs */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex flex-col gap-1">
          <p className="text-xs font-semibold text-gray-600">📐 Guía para subir logos</p>
          <ul className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
            <li>• PNG con fondo transparente</li>
            <li>• 400 × 150 px máximo</li>
            <li>• Menos de 100 KB</li>
            <li>• Horizontal (isotipo + nombre)</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <LogoField
          label="Favicon / Ícono PWA"
          value={pwa_icon_url}
          onChange={v => onChange('pwa_icon_url', v)}
          placeholder="https://..."
          hint="Cuadrado · mínimo 512 × 512 px · PNG"
        />
        {pwa_icon_url && (
          <div className="mt-2 flex items-center gap-3 p-2 border rounded-md bg-muted">
            <img src={pwa_icon_url} alt="Ícono PWA" className="w-10 h-10 object-cover rounded-xl border" />
            <p className="text-xs text-muted-foreground">Vista previa del ícono instalado</p>
          </div>
        )}
      </div>
    </div>
  )
}
