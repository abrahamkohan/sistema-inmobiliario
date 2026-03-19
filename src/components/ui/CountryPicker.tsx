// src/components/ui/CountryPicker.tsx
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

export interface Country {
  code: string
  name: string
  dial: string
  flag: string
}

// Priority countries shown first
const PRIORITY = ['PY', 'AR', 'BR', 'UY', 'ES', 'DE', 'US']

export const COUNTRIES: Country[] = [
  { code: 'PY', name: 'Paraguay',        dial: '+595', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina',       dial: '+54',  flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil',          dial: '+55',  flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay',         dial: '+598', flag: '🇺🇾' },
  { code: 'ES', name: 'España',          dial: '+34',  flag: '🇪🇸' },
  { code: 'DE', name: 'Alemania',        dial: '+49',  flag: '🇩🇪' },
  { code: 'US', name: 'Estados Unidos',  dial: '+1',   flag: '🇺🇸' },
  { code: 'BO', name: 'Bolivia',         dial: '+591', flag: '🇧🇴' },
  { code: 'CL', name: 'Chile',           dial: '+56',  flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia',        dial: '+57',  flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica',      dial: '+506', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba',            dial: '+53',  flag: '🇨🇺' },
  { code: 'DO', name: 'Rep. Dominicana', dial: '+1',   flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador',         dial: '+593', flag: '🇪🇨' },
  { code: 'GT', name: 'Guatemala',       dial: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras',        dial: '+504', flag: '🇭🇳' },
  { code: 'MX', name: 'México',          dial: '+52',  flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua',       dial: '+505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá',          dial: '+507', flag: '🇵🇦' },
  { code: 'PE', name: 'Perú',            dial: '+51',  flag: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico',     dial: '+1',   flag: '🇵🇷' },
  { code: 'SV', name: 'El Salvador',     dial: '+503', flag: '🇸🇻' },
  { code: 'VE', name: 'Venezuela',       dial: '+58',  flag: '🇻🇪' },
  { code: 'AT', name: 'Austria',         dial: '+43',  flag: '🇦🇹' },
  { code: 'BE', name: 'Bélgica',         dial: '+32',  flag: '🇧🇪' },
  { code: 'CA', name: 'Canadá',          dial: '+1',   flag: '🇨🇦' },
  { code: 'CH', name: 'Suiza',           dial: '+41',  flag: '🇨🇭' },
  { code: 'CN', name: 'China',           dial: '+86',  flag: '🇨🇳' },
  { code: 'FR', name: 'Francia',         dial: '+33',  flag: '🇫🇷' },
  { code: 'GB', name: 'Reino Unido',     dial: '+44',  flag: '🇬🇧' },
  { code: 'IL', name: 'Israel',          dial: '+972', flag: '🇮🇱' },
  { code: 'IN', name: 'India',           dial: '+91',  flag: '🇮🇳' },
  { code: 'IT', name: 'Italia',          dial: '+39',  flag: '🇮🇹' },
  { code: 'JP', name: 'Japón',           dial: '+81',  flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur',   dial: '+82',  flag: '🇰🇷' },
  { code: 'NL', name: 'Países Bajos',    dial: '+31',  flag: '🇳🇱' },
  { code: 'PL', name: 'Polonia',         dial: '+48',  flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',        dial: '+351', flag: '🇵🇹' },
  { code: 'RU', name: 'Rusia',           dial: '+7',   flag: '🇷🇺' },
  { code: 'TR', name: 'Turquía',         dial: '+90',  flag: '🇹🇷' },
  { code: 'AE', name: 'Emiratos Árabes', dial: '+971', flag: '🇦🇪' },
  { code: 'AU', name: 'Australia',       dial: '+61',  flag: '🇦🇺' },
  { code: 'ZA', name: 'Sudáfrica',       dial: '+27',  flag: '🇿🇦' },
]

// Sorted: priority first, then alphabetical
const SORTED_COUNTRIES = [
  ...PRIORITY.map(c => COUNTRIES.find(x => x.code === c)!),
  ...COUNTRIES.filter(c => !PRIORITY.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name)),
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface CountryPickerProps {
  value: Country | null
  onChange: (country: Country) => void
  mode?: 'dial' | 'nationality'   // dial = show +595, nationality = show full name
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CountryPicker({ value, onChange, mode = 'dial', className = '' }: CountryPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 80)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return SORTED_COUNTRIES
    return SORTED_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q)
    )
  }, [query])

  const label = value
    ? mode === 'dial'
      ? `${value.flag} ${value.dial}`
      : `${value.flag} ${value.name}`
    : mode === 'dial' ? '🌎 +---' : '🌎 País'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 h-12 px-3 border border-gray-200 bg-gray-50 rounded-xl text-base focus:outline-none focus:bg-white focus:border-gray-900 transition-colors whitespace-nowrap ${className}`}
      >
        <span>{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: '75vh' }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <p className="font-semibold text-gray-900">
                {mode === 'dial' ? 'Código de país' : 'Nacionalidad'}
              </p>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 h-11 bg-gray-100 rounded-xl">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar país..."
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 pb-safe">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors ${
                    value?.code === c.code ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <span className="flex-1 text-base text-gray-900">{c.name}</span>
                  <span className="text-sm text-gray-400">{c.dial}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">Sin resultados</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
