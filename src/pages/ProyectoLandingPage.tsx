// src/pages/ProyectoLandingPage.tsx
// Ruta pública: /proyecto/:id — sin auth, sin AppShell
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { MapPin, Calendar, DollarSign, FileText, Map, Video, MessageCircle, Phone, Mail, Building2 } from 'lucide-react'
import { getPublicProject, getConsultoraPublic } from '@/lib/publicData'
import type { ProjectRow } from '@/lib/publicData'
import type { Database } from '@/types/database'

type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']

// ── Labels ────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  en_pozo:         'En pozo',
  en_construccion: 'En construcción',
  entregado:       'Entregado',
}

const STATUS_CLS: Record<string, string> = {
  en_pozo:         'bg-amber-50 text-amber-700 border-amber-200',
  en_construccion: 'bg-blue-50 text-blue-700 border-blue-200',
  entregado:       'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial',
  comercial:   'Comercial',
  mixto:       'Mixto',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(amount: number, moneda: string) {
  return `${moneda} ${amount.toLocaleString('es-PY')}`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
}

function buildContactUrl(config: ConsultoraRow | null, projectName: string) {
  if (config?.whatsapp) {
    const num = config.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola, me interesa el proyecto: ${projectName}`)
    return { url: `https://wa.me/${num}?text=${msg}`, label: 'Consultar por WhatsApp', icon: 'whatsapp' as const }
  }
  if (config?.telefono) {
    return { url: `tel:${config.telefono}`, label: 'Llamar', icon: 'phone' as const }
  }
  if (config?.email) {
    return { url: `mailto:${config.email}`, label: 'Enviar email', icon: 'mail' as const }
  }
  return null
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="h-52 bg-gray-200 animate-pulse" />
      <div className="max-w-[940px] mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

// ── Not available ─────────────────────────────────────────────────────────────

function NotAvailable({ config }: { config: ConsultoraRow | null }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 bg-white border-b border-gray-100 px-5 flex items-center">
        {config?.logo_url ? (
          <img src={config.logo_url} alt={config.nombre} className="h-7 w-auto object-contain" />
        ) : (
          <span className="text-sm font-semibold text-gray-800">{config?.nombre ?? ''}</span>
        )}
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-5xl">🏗️</div>
        <h1 className="text-xl font-semibold text-gray-800">Proyecto no disponible</h1>
        <p className="text-gray-500 text-sm max-w-xs">
          Este proyecto no está publicado o el enlace es inválido.
        </p>
        {config?.nombre && (
          <p className="text-xs text-gray-400 mt-1">{config.nombre}</p>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProyectoLandingPage() {
  const { id } = useParams<{ id: string }>()

  const [project, setProject]   = useState<ProjectRow | null>(null)
  const [config, setConfig]     = useState<ConsultoraRow | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }

    Promise.all([
      getPublicProject(id),
      getConsultoraPublic(),
    ])
      .then(([proj, cfg]) => {
        setConfig(cfg)
        if (!proj) { setNotFound(true); return }
        setProject(proj)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading)  return <LoadingSkeleton />
  if (notFound) return <NotAvailable config={config} />

  // ── Data derived ─────────────────────────────────────────────────────────────

  const p       = project!
  const contact = buildContactUrl(config, p.name)

  const companyName = config?.nombre ?? ''
  const logoUrl     = config?.logo_url ?? null

  const fullLocation = [p.direccion, p.barrio, p.zona, p.ciudad].filter(Boolean).join(', ')
  const locationDisplay = p.location ?? fullLocation

  const fichaRows = [
    locationDisplay && { icon: 'map', label: 'Ubicación', value: locationDisplay, sub: fullLocation !== p.location ? fullLocation : null },
    p.delivery_date && { icon: 'cal', label: 'Entrega estimada', value: fmtDate(p.delivery_date), sub: null },
    p.precio_desde  && {
      icon: 'usd',
      label: 'Precio desde',
      value: fmtPrice(p.precio_desde, p.moneda),
      sub: p.precio_hasta ? `hasta ${fmtPrice(p.precio_hasta, p.moneda)}` : null,
    },
    p.developer_name && { icon: 'building', label: 'Desarrolladora', value: p.developer_name, sub: null },
  ].filter(Boolean) as { icon: string; label: string; value: string; sub: string | null }[]

  // ── CTA button ───────────────────────────────────────────────────────────────

  function CTAButton({ className = '' }: { className?: string }) {
    if (!contact) return null
    return (
      <a
        href={contact.url}
        target={contact.icon !== 'phone' ? '_blank' : undefined}
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 w-full h-14 rounded-2xl font-semibold text-base transition-colors ${
          contact.icon === 'whatsapp'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-900 hover:bg-gray-700 text-white'
        } ${className}`}
      >
        {contact.icon === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
        {contact.icon === 'phone'    && <Phone className="w-5 h-5" />}
        {contact.icon === 'mail'     && <Mail className="w-5 h-5" />}
        {contact.label}
      </a>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-7 w-auto object-contain flex-shrink-0" />
          ) : companyName ? (
            <span className="text-sm font-semibold text-gray-800 truncate">{companyName}</span>
          ) : null}
        </div>
        {contact && (
          <a
            href={contact.url}
            target={contact.icon !== 'phone' ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ml-3
              text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          >
            {contact.icon === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5" />}
            {contact.icon === 'phone'    && <Phone className="w-3.5 h-3.5" />}
            {contact.icon === 'mail'     && <Mail className="w-3.5 h-3.5" />}
            Contactar
          </a>
        )}
      </header>

      {/* ── Contenido ── */}
      <div className="max-w-[940px] mx-auto px-4 pb-32 lg:pb-8 flex flex-col gap-4 pt-5">

        {/* ── Hero image — contenido y redondeado ── */}
        <div className="rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0" style={{ height: 220 }}>
          {p.hero_image_url ? (
            <img src={p.hero_image_url} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Building2 className="w-14 h-14 text-gray-400" />
            </div>
          )}
        </div>

        {/* ── Nombre + desarrolladora ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          {/* Badges antes del título */}
          {(p.status || p.tipo_proyecto) && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {p.status && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              )}
              {p.tipo_proyecto && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {TIPO_LABEL[p.tipo_proyecto] ?? p.tipo_proyecto}
                </span>
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{p.name}</h1>
          {p.developer_name && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">{p.developer_name}</span>
            </div>
          )}
          {locationDisplay && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">{locationDisplay}</span>
            </div>
          )}
        </div>

        {/* ── Ficha técnica ── */}
        {fichaRows.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
            {fichaRows.map((row, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gray-400">
                  {row.icon === 'map'      && <MapPin className="w-4 h-4" />}
                  {row.icon === 'cal'      && <Calendar className="w-4 h-4" />}
                  {row.icon === 'usd'      && <DollarSign className="w-4 h-4" />}
                  {row.icon === 'building' && <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{row.label}</p>
                  <p className="text-sm text-gray-800 font-medium mt-0.5">{row.value}</p>
                  {row.sub && <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Descripción ── */}
        {p.description && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Descripción</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{p.description}</p>
          </div>
        )}

        {/* ── Destacados ── */}
        {p.highlights && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Destacados</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{p.highlights}</p>
          </div>
        )}

        {/* ── Características ── */}
        {p.caracteristicas && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Características</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{p.caracteristicas}</p>
          </div>
        )}

        {/* ── Links externos ── */}
        {(p.brochure_url || p.maps_url || p.tour_360_url) && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documentos y links</p>
            <div className="flex flex-wrap gap-2">
              {p.brochure_url && (
                <a href={p.brochure_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  Brochure PDF
                </a>
              )}
              {p.maps_url && (
                <a href={p.maps_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <Map className="w-3.5 h-3.5" />
                  Google Maps
                </a>
              )}
              {p.tour_360_url && (
                <a href={p.tour_360_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-purple-50 text-purple-600 text-xs font-semibold hover:bg-purple-100 transition-colors">
                  <Video className="w-3.5 h-3.5" />
                  Tour 360°
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── CTA desktop ── */}
        {contact && (
          <div className="hidden lg:block bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">¿Te interesa este proyecto?</p>
            <CTAButton />
            {companyName && (
              <p className="text-center text-xs text-gray-400 mt-3">{companyName}</p>
            )}
          </div>
        )}

      </div>

      {/* ── CTA fija mobile ── */}
      {contact && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white/95 backdrop-blur border-t border-gray-100 z-20">
          <CTAButton />
        </div>
      )}

    </div>
  )
}
