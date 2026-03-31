// src/components/landing/PublicHeader.tsx
import type { Database } from '@/types/database'

type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']

interface PublicHeaderProps {
  config: ConsultoraRow | null
  /** Optional right-side slot (e.g. contact button) */
  right?: React.ReactNode
}

export function PublicHeader({ config, right }: PublicHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20 px-5 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {config?.logo_url ? (
          <img src={config.logo_url} alt={config.nombre} className="h-7 w-auto object-contain flex-shrink-0" />
        ) : config?.nombre ? (
          <span className="text-sm font-semibold text-gray-800 truncate">{config.nombre}</span>
        ) : null}
      </div>
      {right && <div className="flex-shrink-0 ml-3">{right}</div>}
    </header>
  )
}
