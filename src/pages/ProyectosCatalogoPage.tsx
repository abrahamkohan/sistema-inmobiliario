// src/pages/ProyectosCatalogoPage.tsx
// Ruta pública: /catalogo/proyectos — sin auth, sin AppShell
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Search, X } from 'lucide-react'
import { getPublicProjects, getConsultoraPublic } from '@/lib/publicData'
import { PublicHeader } from '@/components/landing/PublicHeader'
import { ProjectPublicCard } from '@/components/landing/ProjectPublicCard'
import type { Database } from '@/types/database'

type ProjectRow    = Database['public']['Tables']['projects']['Row']
type ConsultoraRow = Database['public']['Tables']['consultants']['Row']

const STATUS_LABEL: Record<string, string> = {
  en_pozo:        'En pozo',
  en_construccion: 'En construcción',
  entregado:      'Entregado',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="h-36 bg-[#1a2744] animate-pulse" />
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="max-w-[940px] mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Empty state sin publicaciones ─────────────────────────────────────────────

function EmptyState({ config }: { config: ConsultoraRow | null }) {
  const contactUrl = config?.whatsapp
    ? `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`
    : config?.telefono
      ? `tel:${config.telefono}`
      : config?.email
        ? `mailto:${config.email}`
        : null

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-5xl mb-4">🏗️</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        No hay proyectos disponibles en este momento
      </h2>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        Estamos actualizando el catálogo. Volvé pronto o contactanos para más información.
      </p>
      {contactUrl && (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold"
        >
          Contactar
        </a>
      )}
    </div>
  )
}

// ── Empty state con filtros activos ───────────────────────────────────────────

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <p className="text-sm text-gray-500 mb-3">
        No se encontraron proyectos con estos filtros.
      </p>
      <button
        onClick={onClear}
        className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProyectosCatalogoPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [config, setConfig]     = useState<ConsultoraRow | null>(null)
  const [loading, setLoading]   = useState(true)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    Promise.all([getPublicProjects(), getConsultoraPublic()])
      .then(([projs, cfg]) => {
        setProjects(projs)
        setConfig(cfg)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return projects.filter(p => {
      if (status && p.status !== status) return false
      if (q) {
        const haystack = [p.name, p.barrio, p.ciudad, p.location]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [projects, search, status])

  const hasFilters = search !== '' || status !== ''

  function clearFilters() {
    setSearch('')
    setStatus('')
  }

  const contactLinks = [
    config?.whatsapp
      ? { href: `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`, label: 'WhatsApp', external: true }
      : config?.telefono
        ? { href: `tel:${config.telefono}`, label: config.telefono, external: false }
        : null,
    config?.email
      ? { href: `mailto:${config.email}`, label: config.email, external: false }
      : null,
    config?.sitio_web
      ? { href: config.sitio_web, label: config.sitio_web.replace(/^https?:\/\//, ''), external: true }
      : null,
  ].filter(Boolean) as { href: string; label: string; external: boolean }[]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader config={config} />

      {/* ── Hero ── */}
      <div className="bg-[#1a2744] px-6 py-10">
        <div className="max-w-[940px] mx-auto">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs mb-4 transition-colors"
          >
            ← Catálogo
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Proyectos
          </h1>
          <p className="text-white/60 text-sm mt-1.5">
            Desarrollos en construcción y oportunidades en pozo
          </p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-10">
        <div className="max-w-[940px] mx-auto flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, barrio, ciudad..."
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 focus:border-[#1a2744]/40 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 focus:border-[#1a2744]/40 bg-white text-gray-700"
          >
            <option value="">Estado</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Grilla ── */}
      <main className="flex-1 max-w-[940px] w-full mx-auto px-4 pt-8 pb-12">
        {projects.length === 0 ? (
          <EmptyState config={config} />
        ) : filtered.length === 0 ? (
          <EmptyFiltered onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <ProjectPublicCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer consolidado ── */}
      <footer className="border-t border-gray-200 bg-white py-6 px-6">
        <div className="max-w-[940px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {config?.nombre && (
            <span className="text-sm font-medium text-gray-700">{config.nombre}</span>
          )}
          {contactLinks.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {contactLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
