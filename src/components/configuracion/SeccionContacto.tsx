// src/components/configuracion/SeccionContacto.tsx
import { Phone, Mail, MessageCircle, Instagram, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  telefono: string
  email: string
  whatsapp: string
  instagram: string
  sitio_web: string
  onChange: (key: string, value: string) => void
}

function Field({ label, icon: Icon, value, onChange, placeholder, type = 'text' }: {
  label: string; icon: React.ElementType; value: string
  onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />{label}
      </Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
    </div>
  )
}

export function SeccionContacto({ telefono, email, whatsapp, instagram, sitio_web, onChange }: Props) {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      <p className="text-base font-semibold text-foreground">📞 Contacto</p>

      <Field
        label="WhatsApp (número con código de país)"
        icon={MessageCircle}
        value={whatsapp}
        onChange={v => onChange('whatsapp', v)}
        placeholder="595981000000"
      />
      <Field
        label="Teléfono"
        icon={Phone}
        value={telefono}
        onChange={v => onChange('telefono', v)}
        placeholder="+595 981 000 000"
      />
      <Field
        label="Email"
        icon={Mail}
        type="email"
        value={email}
        onChange={v => onChange('email', v)}
        placeholder="info@consultora.com.py"
      />
      <Field
        label="Instagram (@usuario)"
        icon={Instagram}
        value={instagram}
        onChange={v => onChange('instagram', v)}
        placeholder="@kohaninmobiliaria"
      />
      <Field
        label="Sitio web"
        icon={Globe}
        value={sitio_web}
        onChange={v => onChange('sitio_web', v)}
        placeholder="https://consultora.com.py"
      />
    </div>
  )
}
