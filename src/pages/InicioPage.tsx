// src/pages/InicioPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import ReactGridLayout, { type LayoutItem } from 'react-grid-layout'
type Layout = LayoutItem[]
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { BarChart as BarChartIcon } from 'lucide-react'
import { Card, Heading, Text, Badge, Flex, Grid, Box, Button as RxButton, Tabs } from '@radix-ui/themes'
import {
  Users, Building2, Calculator, FileText, Plus, ExternalLink,
  Settings2, LayoutDashboard,
  TrendingUp, TrendingDown, Minus, Activity, Home,
  Globe, Newspaper, Database, Wrench,
  GripVertical,
} from 'lucide-react'
import { useDashboardStats, useExchangeRates, useWeather } from '@/hooks/useDashboardStats'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Layout storage ────────────────────────────────────────────────────────────

const LS_LAYOUT = 'dashboard_rgl_layout_v1'
const COLS = 12
const ROW_HEIGHT = 52

const DEFAULT_LAYOUT: Layout = [
  { i: 'kpis',      x: 0, y: 0,  w: 12, h: 3,  minW: 6,  minH: 2 },
  { i: 'radar',     x: 0, y: 3,  w: 8,  h: 7,  minW: 4,  minH: 4 },
  { i: 'mercado',   x: 8, y: 3,  w: 4,  h: 7,  minW: 3,  minH: 4 },
  { i: 'grafico',   x: 0, y: 10, w: 7,  h: 5,  minW: 4,  minH: 3 },
  { i: 'actividad', x: 7, y: 10, w: 5,  h: 5,  minW: 3,  minH: 3 },
  { i: 'proyectos', x: 0, y: 15, w: 6,  h: 5,  minW: 3,  minH: 3 },
  { i: 'recursos',  x: 6, y: 15, w: 6,  h: 5,  minW: 4,  minH: 3 },
]

function loadLayout(): Layout {
  try {
    const saved = localStorage.getItem(LS_LAYOUT)
    if (saved) {
      const parsed = JSON.parse(saved) as Layout
      // validate — must have all keys
      const ids = parsed.map((l) => l.i)
      if (DEFAULT_LAYOUT.every((d) => ids.includes(d.i))) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function weatherEmoji(desc: string): string {
  const d = desc.toLowerCase()
  if (d.includes('thunder') || d.includes('storm')) return '⛈️'
  if (d.includes('snow') || d.includes('sleet')) return '❄️'
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return '🌧️'
  if (d.includes('mist') || d.includes('fog') || d.includes('overcast')) return '🌫️'
  if (d.includes('partly') || d.includes('cloudy')) return '⛅'
  if (d.includes('clear') || d.includes('sunny') || d.includes('bright')) return '☀️'
  return '🌤️'
}

function PctArrow({ pct }: { pct: number }) {
  if (pct > 0.1) return <TrendingUp size={11} style={{ color: '#22c55e' }} />
  if (pct < -0.1) return <TrendingDown size={11} style={{ color: '#ef4444' }} />
  return <Minus size={11} style={{ color: '#cbd5e1' }} />
}

const STATUS_BADGE: Record<string, { color: 'violet' | 'blue' | 'green'; label: string }> = {
  en_pozo:         { color: 'violet', label: 'En pozo' },
  en_construccion: { color: 'blue',   label: 'En construcción' },
  entregado:       { color: 'green',  label: 'Entregado' },
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text size="1" weight="bold" color="gray"
      style={{ textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
      {children}
    </Text>
  )
}

// ─── Widget card wrapper ────────────────────────────────────────────────────────
// Fills its grid cell completely, no scrollbar overflow on resize

function WidgetShell({ label, editMode, children, dragHandle }: {
  label?: string
  editMode: boolean
  children: React.ReactNode
  dragHandle?: string
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {label && (
        <Flex align="center" justify="between" mb="1" style={{ flexShrink: 0 }}>
          <SectionLabel>{label}</SectionLabel>
          {editMode && (
            <div
              className={dragHandle?.replace('.', '')}
              style={{ cursor: 'grab', color: 'var(--muted-foreground)', padding: '2px 4px' }}
            >
              <GripVertical size={14} />
            </div>
          )}
        </Flex>
      )}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Widgets
// ══════════════════════════════════════════════════════════════════════════════

function KpisWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const metrics = [
    { label: 'Clientes',          value: stats?.counts.clients ?? 0,         icon: Users,      accent: '#6366f1' },
    { label: 'Proyectos activos', value: stats?.counts.projects_active ?? 0, icon: Activity,   accent: '#0ea5e9' },
    { label: 'Unidades dispon.',  value: stats?.counts.units_available ?? 0, icon: Home,       accent: '#10b981' },
    { label: 'Simulaciones',      value: stats?.counts.simulations ?? 0,     icon: Calculator, accent: '#f59e0b' },
  ]
  return (
    <Grid columns={{ initial: '2', sm: '4' }} gap="3" style={{ height: '100%' }}>
      {metrics.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label} size="2" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderTop: `3px solid ${accent}`, height: '100%', boxSizing: 'border-box' }}>
          <Flex direction="column" justify="between" style={{ height: '100%' }}>
            <Box style={{ background: `${accent}14`, borderRadius: 8, padding: 7, alignSelf: 'flex-start' }}>
              <Icon size={16} style={{ color: accent }} />
            </Box>
            <Box>
              <Heading size="8" weight="bold" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {isLoading ? '—' : value.toLocaleString('es-PY')}
              </Heading>
              <Text as="p" size="1" color="gray" mt="1">{label}</Text>
            </Box>
          </Flex>
        </Card>
      ))}
    </Grid>
  )
}

function RadarWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <Card size="1" style={{ overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: '100%', boxSizing: 'border-box' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            {['Proyecto', 'Estado', 'Precio m²', 'Rentab. est.', 'Unidades'].map((label, i) => (
              <th key={label} style={{ padding: '10px 16px', textAlign: i === 0 || i === 1 ? 'left' : 'right', fontWeight: 700, fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-foreground)', fontSize: 13 }}>Cargando...</td></tr>
          ) : (stats?.radar ?? []).length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-foreground)', fontSize: 13 }}>
              No hay proyectos. <a href="/" style={{ color: 'var(--accent-foreground)' }}>Crear uno</a>
            </td></tr>
          ) : (
            (stats?.radar ?? []).map((p, i) => {
              const sb = STATUS_BADGE[p.status]
              return (
                <tr key={p.id} onClick={() => navigate('/')}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                  className="hover:bg-muted/50"
                >
                  <td style={{ padding: '12px 16px' }}><Text size="2" weight="bold">{p.name}</Text></td>
                  <td style={{ padding: '12px 16px' }}>
                    {sb ? <Badge color={sb.color} variant="soft" radius="full">{sb.label}</Badge>
                        : <Badge color="gray" variant="soft" radius="full">{p.status}</Badge>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {p.avg_price_m2 ? <Text size="2" weight="bold">USD {p.avg_price_m2.toLocaleString('es-PY')}</Text> : <Text size="2" color="gray">—</Text>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Text size="2" color="gray">—</Text>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Text size="2" color="gray">{p.unit_count}</Text>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </Card>
  )
}

function MercadoWidget() {
  const { data: rates, isLoading } = useExchangeRates()
  const { data: weather } = useWeather()

  const items = [
    { label: 'USD / PYG', value: rates?.pyg ? rates.pyg.venta.toLocaleString('es-PY', { maximumFractionDigits: 2 }) : '—', detail: 'Guaraní', pct: rates?.pyg?.pctChange ?? null },
    { label: 'USD / ARS', value: rates?.ars ? `$ ${rates.ars.venta.toLocaleString('es-PY', { maximumFractionDigits: 2 })}` : '—', detail: `Compra $ ${rates?.ars?.compra.toLocaleString('es-PY', { maximumFractionDigits: 2 }) ?? '—'}`, pct: null },
    { label: 'USD / BRL', value: rates?.brl ? `R$ ${rates.brl.venta.toFixed(2)}` : '—', detail: 'Real', pct: rates?.brl?.pctChange ?? null },
    { label: 'Asunción', value: weather ? `${weatherEmoji(weather.desc)} ${weather.temp_c}°C` : '—', detail: weather ? weather.desc.split(' ').slice(0, 2).join(' ') : 'Clima', pct: null },
  ]

  return (
    <Flex direction="column" gap="2" style={{ height: '100%' }}>
      {items.map(({ label, value, detail, pct }) => (
        <Card key={label} size="2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', flex: 1, padding: '10px 14px' }}>
          <Flex justify="between" align="start" mb="1">
            <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Text>
            {pct !== null && <PctArrow pct={pct} />}
          </Flex>
          <Heading size="4" weight="bold" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: isLoading ? 0.3 : 1 }}>{value}</Heading>
          <Text as="p" size="1" color="gray" mt="1">{detail}</Text>
        </Card>
      ))}
    </Flex>
  )
}

function GraficoWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const data = stats?.simsByMonth ?? []
  const maxVal = Math.max(...data.map((d) => d.total), 1)
  return (
    <Card size="3" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: '100%', boxSizing: 'border-box' }}>
      {isLoading ? (
        <Flex align="center" justify="center" style={{ height: '100%' }}><Text size="1" color="gray">Cargando...</Text></Flex>
      ) : data.every((d) => d.total === 0) ? (
        <Flex align="center" justify="center" direction="column" gap="2" style={{ height: '100%' }}>
          <BarChartIcon size={28} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
          <Text size="1" color="gray">Sin simulaciones aún</Text>
        </Flex>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={26} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card)', color: 'var(--foreground)' }} formatter={(v) => [`${v ?? 0} simulaciones`, '']} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.total === maxVal ? 'var(--foreground)' : 'var(--muted-foreground)'} style={{ opacity: entry.total === maxVal ? 1 : 0.3 }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

function ActividadWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <Card size="1" style={{ overflow: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: '100%', boxSizing: 'border-box' }}>
      {isLoading ? (
        <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Cargando...</Text></Flex>
      ) : (stats?.recent.simulations ?? []).length === 0 ? (
        <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Sin actividad aún</Text></Flex>
      ) : (
        <>
          {(stats?.recent.simulations ?? []).map((sim, i) => {
            const project = sim.snapshot_project as Record<string, unknown>
            const clientName = (sim.clients as { full_name: string } | null)?.full_name ?? '—'
            return (
              <Box key={sim.id} onClick={() => window.open(`/informes/${sim.id}`, '_blank')}
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', padding: '10px 14px' }}
                className="hover:bg-muted/50"
              >
                <Flex align="center" justify="between">
                  <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                    <Box style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--muted-foreground)', opacity: 0.4, flexShrink: 0 }} />
                    <Box style={{ minWidth: 0 }}>
                      <Text size="2" weight="medium" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(project?.name as string) ?? '—'}
                      </Text>
                      <Text size="1" color="gray">{clientName}</Text>
                    </Box>
                  </Flex>
                  <Flex align="center" gap="1.5" style={{ flexShrink: 0, marginLeft: 10 }}>
                    <Text size="1" color="gray">{timeAgo(sim.created_at)}</Text>
                    <ExternalLink size={11} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                  </Flex>
                </Flex>
              </Box>
            )
          })}
          <Box style={{ borderTop: '1px solid var(--border)' }}>
            <Box onClick={() => navigate('/informes')} style={{ cursor: 'pointer', padding: '8px 14px' }} className="hover:bg-muted/50">
              <Flex align="center" justify="center" gap="1">
                <Text size="1" color="indigo">Ver todos</Text>
                <ExternalLink size={11} style={{ color: 'var(--muted-foreground)' }} />
              </Flex>
            </Box>
          </Box>
        </>
      )}
    </Card>
  )
}

function ProyectosWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <Card size="1" style={{ overflow: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: '100%', boxSizing: 'border-box' }}>
      {isLoading ? (
        <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Cargando...</Text></Flex>
      ) : (stats?.recent.projects ?? []).length === 0 ? (
        <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Sin proyectos</Text></Flex>
      ) : (
        <>
          {(stats?.recent.projects ?? []).map((p, i) => {
            const sb = STATUS_BADGE[p.status]
            return (
              <Box key={p.id} onClick={() => navigate('/proyectos')}
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', padding: '10px 14px' }}
                className="hover:bg-muted/50"
              >
                <Flex align="center" justify="between">
                  <Flex align="center" gap="3">
                    <Box style={{ background: 'oklch(0.78 0.15 92.7 / 0.09)', borderRadius: 8, padding: 5 }}>
                      <Building2 size={13} style={{ color: 'var(--muted-foreground)' }} />
                    </Box>
                    <Text size="2" weight="medium">{p.name}</Text>
                  </Flex>
                  {sb ? <Badge color={sb.color} variant="soft" radius="full" size="1">{sb.label}</Badge>
                      : <Badge color="gray" variant="soft" radius="full" size="1">{p.status}</Badge>}
                </Flex>
              </Box>
            )
          })}
          <Box style={{ borderTop: '1px solid var(--border)' }}>
            <Box onClick={() => navigate('/proyectos')} style={{ cursor: 'pointer', padding: '8px 14px' }} className="hover:bg-muted/50">
              <Flex align="center" justify="center" gap="1">
                <Text size="1" color="indigo">Ver todos</Text>
                <ExternalLink size={11} style={{ color: 'var(--muted-foreground)' }} />
              </Flex>
            </Box>
          </Box>
        </>
      )}
    </Card>
  )
}

// ─── Links / Recursos ─────────────────────────────────────────────────────────

type LinkItem = { label: string; sub: string; url: string }
type ConfigurableItem = LinkItem & { enabled?: boolean }

const DEFAULT_PORTALES: LinkItem[] = [
  { label: 'Infocasas', sub: 'Portal inmobiliario PY', url: 'https://www.infocasas.com.py' },
  { label: 'Properati', sub: 'Portal regional',        url: 'https://www.properati.com.py' },
  { label: 'Zonaprop',  sub: 'Portal regional',        url: 'https://www.zonaprop.com.py'  },
]
const DEFAULT_NOTICIAS: LinkItem[] = [
  { label: 'ABC Economía', sub: 'abc.com.py',     url: 'https://www.abc.com.py/economia'     },
  { label: 'Última Hora',  sub: 'ultimahora.com', url: 'https://www.ultimahora.com/economia' },
  { label: '5 Días',       sub: '5dias.com.py',   url: 'https://www.5dias.com.py'            },
  { label: 'Bloomberg',    sub: 'bloomberg.com',  url: 'https://www.bloomberg.com'           },
  { label: 'Ámbito',       sub: 'ambito.com',     url: 'https://www.ambito.com'              },
]
const DEFAULT_DATOS_OFICIALES: LinkItem[] = [
  { label: 'BCP',               sub: 'Banco Central PY',    url: 'https://www.bcp.gov.py'      },
  { label: 'Catastro Nacional', sub: 'catastro.gov.py',      url: 'https://www.catastro.gov.py' },
  { label: 'Municipalidad ASU', sub: 'asuncion.gov.py',      url: 'https://www.asuncion.gov.py' },
  { label: 'INE',               sub: 'Estadística nacional', url: 'https://www.ine.gov.py'      },
]
const DEFAULT_HERRAMIENTAS: LinkItem[] = [
  { label: 'Airbnb Host',      sub: 'Panel anfitrión',   url: 'https://www.airbnb.com/hosting' },
  { label: 'Booking Extranet', sub: 'Gestión Booking',   url: 'https://admin.booking.com'      },
  { label: 'Dólar Hoy',        sub: 'Cotización ARS',    url: 'https://dolarhoy.com'           },
  { label: 'Google Maps',      sub: 'Análisis de zonas', url: 'https://maps.google.com'        },
]

function LinkCardContent({ link, icon: Icon }: { link: LinkItem; icon: React.ElementType }) {
  return (
    <Flex align="center" gap="3">
      <Box style={{ background: 'oklch(0.78 0.15 92.7 / 0.09)', borderRadius: 8, padding: 7, flexShrink: 0 }}>
        <Icon size={14} style={{ color: 'var(--muted-foreground)' }} />
      </Box>
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Text size="2" weight="bold" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</Text>
        <Text size="1" color="gray" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{link.sub}</Text>
      </Box>
      <ExternalLink size={11} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
    </Flex>
  )
}

function SortableLinkCard({ id, link, icon }: { id: string; link: LinkItem; icon: React.ElementType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, cursor: 'grab', userSelect: 'none', touchAction: 'none' }}
    >
      <Card size="2" style={{ boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.07)', pointerEvents: 'none' }}>
        <LinkCardContent link={link} icon={icon} />
      </Card>
    </div>
  )
}

function SmallLinkGrid({ items, editMode, storageKey, categoryIcon }: {
  items: LinkItem[]; editMode?: boolean; storageKey?: string; categoryIcon: React.ElementType
}) {
  const [ordered, setOrdered] = useState<LinkItem[]>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`lnk_${storageKey}`)
        if (saved) {
          const urls = JSON.parse(saved) as string[]
          const reordered = urls.map((u) => items.find((i) => i.url === u)).filter(Boolean) as LinkItem[]
          const missing = items.filter((i) => !urls.includes(i.url))
          return [...reordered, ...missing]
        }
      } catch { /* ignore */ }
    }
    return items
  })

  useEffect(() => {
    setOrdered((prev) => {
      const prevUrls = prev.map((p) => p.url)
      const reordered = prevUrls.map((u) => items.find((i) => i.url === u)).filter(Boolean) as LinkItem[]
      const missing = items.filter((i) => !prevUrls.includes(i.url))
      return [...reordered, ...missing]
    })
  }, [items])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = ordered.map((_, i) => `${storageKey}_${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrdered((prev) => {
        const oldIdx = ids.indexOf(active.id as string)
        const newIdx = ids.indexOf(over.id as string)
        const next = arrayMove(prev, oldIdx, newIdx)
        if (storageKey) localStorage.setItem(`lnk_${storageKey}`, JSON.stringify(next.map((i) => i.url)))
        return next
      })
    }
  }

  if (editMode && storageKey) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <Grid columns={{ initial: '2', sm: '3', lg: '4' }} gap="2">
            {ordered.map((link, i) => <SortableLinkCard key={ids[i]} id={ids[i]} link={link} icon={categoryIcon} />)}
          </Grid>
        </SortableContext>
      </DndContext>
    )
  }

  return (
    <Grid columns={{ initial: '2', sm: '3', lg: '4' }} gap="2">
      {ordered.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Card size="2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }} className="hover:shadow-md">
            <LinkCardContent link={link} icon={categoryIcon} />
          </Card>
        </a>
      ))}
    </Grid>
  )
}

function resolveLinks(raw: ConfigurableItem[] | undefined, fallback: LinkItem[]): LinkItem[] {
  if (Array.isArray(raw) && raw.length > 0) return raw.filter((item) => item.enabled !== false)
  return fallback
}

function RecursosWidget({ config, editMode }: { config: ReturnType<typeof useConsultoraConfig>['data']; editMode: boolean }) {
  const md = config?.market_data as Record<string, unknown> | null
  const portales     = resolveLinks(md?.portales       as ConfigurableItem[] | undefined, DEFAULT_PORTALES)
  const noticias     = resolveLinks(md?.noticias        as ConfigurableItem[] | undefined, DEFAULT_NOTICIAS)
  const datosOfi     = resolveLinks(md?.datos_oficiales as ConfigurableItem[] | undefined, DEFAULT_DATOS_OFICIALES)
  const herramientas = resolveLinks(md?.herramientas    as ConfigurableItem[] | undefined, DEFAULT_HERRAMIENTAS)

  return (
    <Card size="2" style={{ height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <Tabs.Root defaultValue="portales">
        <Tabs.List mb="3">
          <Tabs.Trigger value="portales">Portales</Tabs.Trigger>
          <Tabs.Trigger value="noticias">Noticias</Tabs.Trigger>
          <Tabs.Trigger value="datos">Datos oficiales</Tabs.Trigger>
          <Tabs.Trigger value="herramientas">Herramientas</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="portales">
          <SmallLinkGrid items={portales} editMode={editMode} storageKey="portales" categoryIcon={Globe} />
        </Tabs.Content>
        <Tabs.Content value="noticias">
          <SmallLinkGrid items={noticias} editMode={editMode} storageKey="noticias" categoryIcon={Newspaper} />
        </Tabs.Content>
        <Tabs.Content value="datos">
          <SmallLinkGrid items={datosOfi} editMode={editMode} storageKey="datos_oficiales" categoryIcon={Database} />
        </Tabs.Content>
        <Tabs.Content value="herramientas">
          <SmallLinkGrid items={herramientas} editMode={editMode} storageKey="herramientas" categoryIcon={Wrench} />
        </Tabs.Content>
      </Tabs.Root>
    </Card>
  )
}

// ─── Quick actions ─────────────────────────────────────────────────────────────

function QuickActionsBar() {
  const navigate = useNavigate()
  const actions = [
    { label: 'Nuevo proyecto', icon: Plus,       path: '/proyectos' },
    { label: 'Nuevo cliente',  icon: Users,      path: '/clientes'  },
    { label: 'Simulador',      icon: Calculator, path: '/simulador' },
    { label: 'Informes',       icon: FileText,   path: '/informes'  },
  ]
  return (
    <Card size="2" style={{ boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 16 }}>
      <Flex gap="2" wrap="wrap">
        {actions.map(({ label, icon: Icon, path }) => (
          <Box key={label} onClick={() => navigate(path)} style={{ cursor: 'pointer', flex: 1, minWidth: 110 }}>
            <Flex align="center" gap="2" style={{ padding: '8px 12px', borderRadius: 6, background: 'oklch(0.75 0.11 90.08 / 0.15)', transition: 'opacity 0.15s' }} className="hover:opacity-70">
              <Icon size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <Text size="2" weight="medium" style={{ whiteSpace: 'nowrap' }}>{label}</Text>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE — react-grid-layout
// ══════════════════════════════════════════════════════════════════════════════

const WIDGET_LABELS: Record<string, string> = {
  kpis:      'Estado del negocio',
  radar:     'Radar de oportunidades',
  mercado:   'Indicadores de mercado',
  grafico:   'Simulaciones por mes',
  actividad: 'Actividad reciente',
  proyectos: 'Proyectos',
  recursos:  'Recursos',
}

export function InicioPage() {
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<Layout>(loadLayout)
  const [containerWidth, setContainerWidth] = useState(0)

  const { data: stats, isLoading } = useDashboardStats()
  const { data: config } = useConsultoraConfig()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  // Measure container width for ReactGridLayout
  const containerRef = (node: HTMLDivElement | null) => {
    if (node) setContainerWidth(node.offsetWidth)
  }

  useEffect(() => {
    function handleResize() {
      const el = document.getElementById('rgl-container')
      if (el) setContainerWidth(el.offsetWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleLayoutChange(newLayout: readonly LayoutItem[]) {
    setLayout([...newLayout])
    localStorage.setItem(LS_LAYOUT, JSON.stringify(newLayout))
  }

  function resetLayout() {
    setLayout(DEFAULT_LAYOUT)
    localStorage.removeItem(LS_LAYOUT)
  }

  function renderWidget(id: string) {
    switch (id) {
      case 'kpis':      return <KpisWidget stats={stats} isLoading={isLoading} />
      case 'radar':     return <RadarWidget stats={stats} isLoading={isLoading} />
      case 'mercado':   return <MercadoWidget />
      case 'grafico':   return <GraficoWidget stats={stats} isLoading={isLoading} />
      case 'actividad': return <ActividadWidget stats={stats} isLoading={isLoading} />
      case 'proyectos': return <ProyectosWidget stats={stats} isLoading={isLoading} />
      case 'recursos':  return <RecursosWidget config={config} editMode={editMode} />
      default: return null
    }
  }

  return (
    <Box p={{ initial: '4', md: '5' }} style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* CSS overrides for react-grid-layout */}
      <style>{`
        .rgl-item {
          display: flex;
          flex-direction: column;
        }
        .rgl-item > .widget-inner {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .react-grid-item.react-grid-placeholder {
          background: oklch(0.78 0.15 92.7 / 0.15) !important;
          border: 2px dashed oklch(0.65 0.12 92.7 / 0.4) !important;
          border-radius: 12px !important;
          opacity: 1 !important;
        }
        .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.15s;
        }
        .react-grid-item:hover .react-resizable-handle {
          opacity: 1;
        }
        .react-resizable-handle::after {
          border-color: var(--muted-foreground) !important;
        }
      `}</style>

      {/* Header */}
      <Flex align="start" justify="between" mb="4">
        <Box>
          <Text size="1" color="gray">
            {now.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Heading size="7" weight="bold" mt="1">
            {greeting}{config?.nombre ? `, ${config.nombre}` : ''}
          </Heading>
        </Box>
        <Flex gap="2">
          {editMode && (
            <RxButton variant="ghost" color="gray" size="2" onClick={resetLayout}>
              Resetear layout
            </RxButton>
          )}
          <RxButton
            variant={editMode ? 'solid' : 'outline'}
            color="indigo"
            size="2"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode
              ? <><LayoutDashboard size={13} /> Listo</>
              : <><Settings2 size={13} /> Personalizar</>
            }
          </RxButton>
        </Flex>
      </Flex>

      {/* Quick actions */}
      <QuickActionsBar />

      {editMode && (
        <Card mb="3" style={{ background: 'var(--muted)', border: '1px solid var(--border)', boxShadow: 'none' }}>
          <Flex align="center" gap="2">
            <GripVertical size={14} style={{ color: 'var(--muted-foreground)' }} />
            <Text size="2" color="gray">
              Arrastrá desde el título del panel · Redimensioná desde la esquina inferior derecha · Los cambios se guardan automáticamente.
            </Text>
          </Flex>
        </Card>
      )}

      {/* Grid */}
      <div id="rgl-container" ref={containerRef}>
        {containerWidth > 0 && (
          <ReactGridLayout
            layout={layout}
            width={containerWidth}
            gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [12, 12], containerPadding: [0, 0], maxRows: Infinity }}
            dragConfig={{ enabled: editMode, bounded: false, handle: '.drag-handle', threshold: 3 }}
            resizeConfig={{ enabled: editMode, handles: ['se'] }}
            onLayoutChange={handleLayoutChange}
          >
            {layout.map((item) => (
              <div key={item.i} className="rgl-item">
                <div className="widget-inner" style={{ height: '100%' }}>
                  <WidgetShell
                    label={WIDGET_LABELS[item.i]}
                    editMode={editMode}
                    dragHandle=".drag-handle"
                  >
                    {renderWidget(item.i)}
                  </WidgetShell>
                </div>
              </div>
            ))}
          </ReactGridLayout>
        )}
      </div>
    </Box>
  )
}
