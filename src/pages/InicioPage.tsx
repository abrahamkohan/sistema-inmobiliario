// src/pages/InicioPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ResponsiveGridLayout, verticalCompactor, type LayoutItem } from 'react-grid-layout'
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

const LS_LAYOUTS = 'dashboard_rgl_layouts_v3'
type Layout  = LayoutItem[]
type Layouts = { lg: Layout; md: Layout; sm: Layout }

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 }
const COLS        = { lg: 12,   md: 6,   sm: 1 }
const ROW_HEIGHT  = 52

const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    // Fila 1: KPIs full width
    { i: 'kpis',      x: 0, y: 0,  w: 12, h: 2,  minW: 6,  minH: 2 },
    // Fila 2: Proyectos (6) + Indicadores (6) — mismo h
    { i: 'proyectos', x: 0, y: 2,  w: 6,  h: 5,  minW: 3,  minH: 3 },
    { i: 'mercado',   x: 6, y: 2,  w: 6,  h: 5,  minW: 3,  minH: 3 },
    // Fila 3: Actividad (6) + Simulaciones (6) — mismo h
    { i: 'actividad', x: 0, y: 7,  w: 6,  h: 6,  minW: 3,  minH: 3 },
    { i: 'grafico',   x: 6, y: 7,  w: 6,  h: 6,  minW: 4,  minH: 3 },
    // Fila 4: Radar full width
    { i: 'radar',     x: 0, y: 13, w: 8,  h: 5,  minW: 4,  minH: 3 },
    { i: 'recursos',  x: 8, y: 13, w: 4,  h: 5,  minW: 4,  minH: 3 },
  ],
  md: [
    { i: 'kpis',      x: 0, y: 0,  w: 6, h: 3,  minW: 6, minH: 2 },
    { i: 'mercado',   x: 0, y: 3,  w: 2, h: 7,  minW: 2, minH: 3 },
    { i: 'radar',     x: 2, y: 3,  w: 4, h: 7,  minW: 3, minH: 3 },
    { i: 'grafico',   x: 0, y: 10, w: 4, h: 6,  minW: 3, minH: 3 },
    { i: 'actividad', x: 4, y: 10, w: 2, h: 6,  minW: 2, minH: 3 },
    { i: 'proyectos', x: 0, y: 16, w: 3, h: 4,  minW: 3, minH: 3 },
    { i: 'recursos',  x: 3, y: 16, w: 3, h: 5,  minW: 3, minH: 3 },
  ],
  sm: [
    { i: 'kpis',      x: 0, y: 0,  w: 1, h: 5,  minW: 1, minH: 3 },
    { i: 'mercado',   x: 0, y: 5,  w: 1, h: 3,  minW: 1, minH: 2 },
    { i: 'radar',     x: 0, y: 8,  w: 1, h: 9,  minW: 1, minH: 5 },
    { i: 'grafico',   x: 0, y: 17, w: 1, h: 5,  minW: 1, minH: 3 },
    { i: 'actividad', x: 0, y: 22, w: 1, h: 6,  minW: 1, minH: 3 },
    { i: 'proyectos', x: 0, y: 28, w: 1, h: 6,  minW: 1, minH: 3 },
    { i: 'recursos',  x: 0, y: 34, w: 1, h: 7,  minW: 1, minH: 4 },
  ],
}

const WIDGET_IDS = ['kpis', 'radar', 'mercado', 'grafico', 'actividad', 'proyectos', 'recursos']

function loadLayouts(): Layouts {
  try {
    const saved = localStorage.getItem(LS_LAYOUTS)
    if (saved) {
      const parsed = JSON.parse(saved) as Layouts
      // Validate: must have all widget IDs in lg
      if (parsed.lg && WIDGET_IDS.every((id) => parsed.lg.some((l) => l.i === id))) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUTS
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

// ─── Widget shell ──────────────────────────────────────────────────────────────

function WidgetShell({ label, editMode, children }: {
  label?: string
  editMode: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {label && (
        <Flex align="center" justify="between" mb="1" style={{ flexShrink: 0 }}>
          <SectionLabel>{label}</SectionLabel>
          {editMode && (
            <div
              className="drag-handle"
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
    // Single container divided by 1px gaps — no individual card boxes
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: 'var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {metrics.map(({ label, value, icon: Icon, accent }) => (
        <div key={label} style={{ background: 'var(--card)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Box style={{ color: accent, flexShrink: 0 }}>
            <Icon size={15} />
          </Box>
          <Box>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)' }}>
              {isLoading ? '—' : value.toLocaleString('es-PY')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{label}</div>
          </Box>
        </div>
      ))}
    </div>
  )
}

function RadarWidget({ stats, isLoading, compact }: {
  stats: ReturnType<typeof useDashboardStats>['data']
  isLoading: boolean
  compact?: boolean
}) {
  const navigate = useNavigate()
  const rows = stats?.radar ?? []

  // Mobile: card list
  if (compact) {
    return (
      <Flex direction="column" gap="2" style={{ height: '100%', overflow: 'auto' }}>
        {isLoading ? (
          <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Cargando...</Text></Flex>
        ) : rows.length === 0 ? (
          <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Sin proyectos</Text></Flex>
        ) : rows.map((p) => {
          const sb = STATUS_BADGE[p.status]
          return (
            <Card key={p.id} size="2" style={{ borderRadius: 12 }} onClick={() => navigate('/')}>
              <Flex justify="between" align="center">
                <Box>
                  <Text size="2" weight="bold">{p.name}</Text>
                  {p.avg_price_m2 ? (
                    <Text as="p" size="1" color="gray">USD {p.avg_price_m2.toLocaleString('es-PY')} / m²</Text>
                  ) : null}
                </Box>
                {sb
                  ? <Badge color={sb.color} variant="soft" radius="full">{sb.label}</Badge>
                  : <Badge color="gray" variant="soft" radius="full">{p.status}</Badge>}
              </Flex>
            </Card>
          )
        })}
      </Flex>
    )
  }

  // Desktop: tabla limpia sin sombra ni divisores de fila
  return (
    <div style={{ height: '100%', overflow: 'auto', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Proyecto', 'Estado', 'USD / m²', 'Unidades'].map((label, i) => (
              <th key={label} style={{ padding: '8px 14px', textAlign: i > 1 ? 'right' : 'left', fontWeight: 600, fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-foreground)', fontSize: 13 }}>Cargando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-foreground)', fontSize: 13 }}>Sin proyectos aún.</td></tr>
          ) : rows.map((p, i) => {
            const sb = STATUS_BADGE[p.status]
            return (
              <tr key={p.id} onClick={() => navigate('/')}
                style={{ background: i % 2 === 1 ? 'var(--muted)' : 'transparent', cursor: 'pointer' }}
                className="hover:opacity-75"
              >
                <td style={{ padding: '9px 14px', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{p.name}</td>
                <td style={{ padding: '9px 14px' }}>
                  {sb ? <Badge color={sb.color} variant="soft" radius="full" size="1">{sb.label}</Badge>
                      : <Badge color="gray" variant="soft" radius="full" size="1">{p.status}</Badge>}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: p.avg_price_m2 ? 600 : 400, color: p.avg_price_m2 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                  {p.avg_price_m2 ? p.avg_price_m2.toLocaleString('es-PY') : '—'}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'right', color: 'var(--muted-foreground)', fontSize: 13 }}>{p.unit_count}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MercadoWidget({ compact }: { compact?: boolean }) {
  const { data: rates, isLoading } = useExchangeRates()
  const { data: weather } = useWeather()

  const items = [
    { label: 'USD / PYG', value: rates?.pyg ? rates.pyg.venta.toLocaleString('es-PY', { maximumFractionDigits: 2 }) : '—', detail: 'Guaraní', pct: rates?.pyg?.pctChange ?? null },
    { label: 'USD / ARS', value: rates?.ars ? `$ ${rates.ars.venta.toLocaleString('es-PY', { maximumFractionDigits: 2 })}` : '—', detail: `Compra $ ${rates?.ars?.compra.toLocaleString('es-PY', { maximumFractionDigits: 2 }) ?? '—'}`, pct: null },
    { label: 'USD / BRL', value: rates?.brl ? `R$ ${rates.brl.venta.toFixed(2)}` : '—', detail: 'Real', pct: rates?.brl?.pctChange ?? null },
    { label: 'Asunción',  value: weather ? `${weatherEmoji(weather.desc)} ${weather.temp_c}°C` : '—', detail: weather ? weather.desc.split(' ').slice(0, 2).join(' ') : 'Clima', pct: null },
  ]

  // Mobile: horizontal scroll strip
  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', height: '100%', alignItems: 'stretch', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {items.map(({ label, value, detail, pct }) => (
          <Card key={label} size="2" style={{ minWidth: 110, flexShrink: 0, borderRadius: 14, padding: '10px 14px' }}>
            <Flex justify="between" align="center" mb="1">
              <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 9 }}>{label}</Text>
              {pct !== null && <PctArrow pct={pct} />}
            </Flex>
            <Heading size="3" weight="bold" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: isLoading ? 0.3 : 1 }}>{value}</Heading>
            <Text as="p" size="1" color="gray" mt="1" style={{ fontSize: 10 }}>{detail}</Text>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop: lista compacta en un solo contenedor
  return (
    <div style={{ height: '100%', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'auto' }}>
      {items.map(({ label, value, pct }, i) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
          <Text size="1" color="gray" style={{ letterSpacing: '0.02em' }}>{label}</Text>
          <Flex align="center" gap="2">
            {pct !== null && <PctArrow pct={pct} />}
            <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)', opacity: isLoading ? 0.3 : 1 }}>{value}</div>
          </Flex>
        </div>
      ))}
    </div>
  )
}

function GraficoWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const data = stats?.simsByMonth ?? []
  const maxVal = Math.max(...data.map((d) => d.total), 1)
  return (
    <div style={{ height: '100%', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', padding: '12px 4px 8px' }}>
      {isLoading ? (
        <Flex align="center" justify="center" style={{ height: '100%' }}><Text size="1" color="gray">Cargando...</Text></Flex>
      ) : data.every((d) => d.total === 0) ? (
        <Flex align="center" justify="center" direction="column" gap="2" style={{ height: '100%' }}>
          <BarChartIcon size={28} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
          <Text size="1" color="gray">Sin simulaciones aún</Text>
        </Flex>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card)', color: 'var(--foreground)' }} formatter={(v) => [`${v ?? 0} simulaciones`, '']} />
            <Bar dataKey="total" radius={[5, 5, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.total === maxVal ? 'var(--foreground)' : 'var(--muted-foreground)'} style={{ opacity: entry.total === maxVal ? 1 : 0.25 }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ActividadWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <div style={{ overflow: 'auto', height: '100%', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }}>
      {isLoading ? (
        <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Cargando...</Text></Flex>
      ) : (stats?.recent.simulations ?? []).length === 0 ? (
        <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Sin actividad aún</Text></Flex>
      ) : (
        <>
          {(stats?.recent.simulations ?? []).map((sim) => {
            const project = sim.snapshot_project as Record<string, unknown>
            const clientName = (sim.clients as { full_name: string } | null)?.full_name ?? '—'
            return (
              <div key={sim.id} onClick={() => window.open(`/informes/${sim.id}`, '_blank')}
                style={{ cursor: 'pointer', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                className="hover:bg-muted/40"
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--foreground)' }}>
                    {(project?.name as string) ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>{clientName}</div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{timeAgo(sim.created_at)}</span>
                  <ExternalLink size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                </div>
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            onClick={() => navigate('/informes')} className="hover:bg-muted/40">
            <Text size="1" color="indigo">Ver todos</Text>
            <ExternalLink size={10} style={{ color: 'var(--muted-foreground)' }} />
          </div>
        </>
      )}
    </div>
  )
}

function ProyectosWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <Card size="1" style={{ overflow: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: '100%', boxSizing: 'border-box', borderRadius: 14 }}>
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
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', padding: '8px 12px' }}
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
            <Box onClick={() => navigate('/proyectos')} style={{ cursor: 'pointer', padding: '10px 16px' }} className="hover:bg-muted/50">
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
      <Card size="2" style={{ boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.07)', pointerEvents: 'none', borderRadius: 12 }}>
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
          <Card size="2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderRadius: 12 }} className="hover:shadow-md">
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
    <Card size="2" style={{ height: '100%', overflow: 'auto', boxSizing: 'border-box', borderRadius: 14 }}>
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
    <Card size="2" style={{ boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 16, borderRadius: 14 }}>
      <Flex gap="2" wrap="wrap">
        {actions.map(({ label, icon: Icon, path }) => (
          <Box key={label} onClick={() => navigate(path)} style={{ cursor: 'pointer', flex: 1, minWidth: 100 }}>
            <Flex align="center" gap="2" style={{ padding: '10px 14px', borderRadius: 10, background: 'oklch(0.75 0.11 90.08 / 0.15)', transition: 'opacity 0.15s' }} className="hover:opacity-70">
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
// PAGE — ResponsiveGridLayout
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
  const [editMode, setEditMode]     = useState(false)
  const [layouts, setLayouts]       = useState<Layouts>(loadLayouts)
  const [breakpoint, setBreakpoint] = useState<'lg' | 'md' | 'sm'>('lg')
  const [containerWidth, setContainerWidth] = useState(0)

  const { data: stats, isLoading } = useDashboardStats()
  const { data: config } = useConsultoraConfig()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const isMobile = breakpoint === 'sm'

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

  function handleLayoutChange(
    _layout: readonly LayoutItem[],
    allLayouts: Partial<Record<string, readonly LayoutItem[]>>,
  ) {
    const next: Layouts = {
      lg: [...(allLayouts.lg ?? layouts.lg)],
      md: [...(allLayouts.md ?? layouts.md)],
      sm: [...(allLayouts.sm ?? layouts.sm)],
    }
    setLayouts(next)
    localStorage.setItem(LS_LAYOUTS, JSON.stringify(next))
  }

  function handleBreakpointChange(bp: string) {
    setBreakpoint(bp as 'lg' | 'md' | 'sm')
  }

  function resetLayout() {
    setLayouts(DEFAULT_LAYOUTS)
    localStorage.removeItem(LS_LAYOUTS)
  }

  function renderWidget(id: string) {
    switch (id) {
      case 'kpis':      return <KpisWidget stats={stats} isLoading={isLoading} />
      case 'radar':     return <RadarWidget stats={stats} isLoading={isLoading} compact={isMobile} />
      case 'mercado':   return <MercadoWidget compact={isMobile} />
      case 'grafico':   return <GraficoWidget stats={stats} isLoading={isLoading} />
      case 'actividad': return <ActividadWidget stats={stats} isLoading={isLoading} />
      case 'proyectos': return <ProyectosWidget stats={stats} isLoading={isLoading} />
      case 'recursos':  return <RecursosWidget config={config} editMode={editMode} />
      default: return null
    }
  }

  return (
    <Box p={{ initial: '3', md: '5' }} style={{ maxWidth: 1400, margin: '0 auto' }}>

      <style>{`
        .rgl-item { display: flex; flex-direction: column; }
        .rgl-item > .widget-inner { flex: 1; min-height: 0; overflow: hidden; }
        .react-grid-item.react-grid-placeholder {
          background: oklch(0.78 0.15 92.7 / 0.15) !important;
          border: 2px dashed oklch(0.65 0.12 92.7 / 0.4) !important;
          border-radius: 12px !important;
          opacity: 1 !important;
        }
        .react-resizable-handle { opacity: 0; transition: opacity 0.15s; }
        .react-grid-item:hover .react-resizable-handle { opacity: 1; }
        .react-resizable-handle::after { border-color: var(--muted-foreground) !important; }
      `}</style>

      {/* Header */}
      <Flex align="start" justify="between" mb="4" wrap="wrap" gap="2">
        <Box>
          <Text size="1" color="gray">
            {now.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Heading size={{ initial: '6', md: '7' }} weight="bold" mt="1">
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
        <Card mb="3" style={{ background: 'var(--muted)', border: '1px solid var(--border)', boxShadow: 'none', borderRadius: 12 }}>
          <Flex align="center" gap="2">
            <GripVertical size={14} style={{ color: 'var(--muted-foreground)' }} />
            <Text size="2" color="gray">
              Arrastrá desde el ícono · Redimensioná desde la esquina inferior derecha · Los cambios se guardan automáticamente.
            </Text>
          </Flex>
        </Card>
      )}

      {/* Responsive Grid */}
      <div id="rgl-container" ref={containerRef}>
        {containerWidth > 0 && (
          <ResponsiveGridLayout
            width={containerWidth}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            margin={[8, 8]}
            containerPadding={[0, 0]}
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            compactor={verticalCompactor}
            dragConfig={{ enabled: editMode, bounded: false, handle: '.drag-handle', threshold: 3 }}
            resizeConfig={{ enabled: editMode, handles: ['se'] }}
          >
            {WIDGET_IDS.map((id) => (
              <div key={id} className="rgl-item">
                <div className="widget-inner" style={{ height: '100%' }}>
                  <WidgetShell label={WIDGET_LABELS[id]} editMode={editMode}>
                    {renderWidget(id)}
                  </WidgetShell>
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </Box>
  )
}
