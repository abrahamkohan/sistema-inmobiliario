// src/pages/InicioPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { BarChart as BarChartIcon } from 'lucide-react'
import { Card, Heading, Text, Badge, Flex, Grid, Box, Button as RxButton, Tabs } from '@radix-ui/themes'
import {
  Users, Building2, Calculator, FileText, Plus, ExternalLink,
  Settings2, LayoutDashboard, GripVertical,
  TrendingUp, TrendingDown, Minus, Activity, Home,
  Globe, Newspaper, Database, Wrench,
} from 'lucide-react'
import { useDashboardStats, useExchangeRates, useWeather } from '@/hooks/useDashboardStats'
import { useConsultoraConfig } from '@/hooks/useConsultora'

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

function SectionTitle({ children }: { children: string }) {
  return (
    <Text size="1" weight="bold" color="gray"
      style={{ textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>
      {children}
    </Text>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KPIs — 4 métricas grandes (full width, 4 cols)
// ══════════════════════════════════════════════════════════════════════════════

function ResumenWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const metrics = [
    { label: 'Clientes',          value: stats?.counts.clients ?? 0,         icon: Users,      accent: '#6366f1' },
    { label: 'Proyectos activos', value: stats?.counts.projects_active ?? 0, icon: Activity,   accent: '#0ea5e9' },
    { label: 'Unidades dispon.',  value: stats?.counts.units_available ?? 0, icon: Home,       accent: '#10b981' },
    { label: 'Simulaciones',      value: stats?.counts.simulations ?? 0,     icon: Calculator, accent: '#f59e0b' },
  ]
  return (
    <Box>
      <SectionTitle>Estado del negocio</SectionTitle>
      <Grid columns={{ initial: '2', sm: '4' }} gap="3">
        {metrics.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} size="3" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderTop: `3px solid ${accent}` }}>
            <Flex direction="column" gap="3">
              <Box style={{ background: `${accent}14`, borderRadius: 8, padding: 9, alignSelf: 'flex-start' }}>
                <Icon size={18} style={{ color: accent }} />
              </Box>
              <Box>
                <Heading size="9" weight="bold" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {isLoading ? '—' : value.toLocaleString('es-PY')}
                </Heading>
                <Text as="p" size="1" color="gray" mt="1">{label}</Text>
              </Box>
            </Flex>
          </Card>
        ))}
      </Grid>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Radar — bloque grande (ocupa 2/3 del ancho en desktop)
// ══════════════════════════════════════════════════════════════════════════════

function RadarWidget({
  stats, isLoading, rentabilidadRef,
}: {
  stats: ReturnType<typeof useDashboardStats>['data']
  isLoading: boolean
  rentabilidadRef: number | null
}) {
  const navigate = useNavigate()
  return (
    <Box style={{ height: '100%' }}>
      <Flex align="center" justify="between" mb="2">
        <SectionTitle>Radar de oportunidades</SectionTitle>
        {rentabilidadRef && (
          <Text size="1" color="gray" style={{ marginBottom: 10 }}>
            Ref. mercado: <strong>{rentabilidadRef}% Airbnb</strong>
          </Text>
        )}
      </Flex>
      <Card size="1" style={{ overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: 'calc(100% - 32px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              {[
                { label: 'Proyecto',     align: 'left'  },
                { label: 'Estado',       align: 'left'  },
                { label: 'Precio m²',    align: 'right' },
                { label: 'Rentab. est.', align: 'right' },
                { label: 'Unidades',     align: 'right' },
              ].map(({ label, align }) => (
                <th key={label} style={{ padding: '12px 18px', textAlign: align as 'left' | 'right', fontWeight: 700, fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)', fontSize: 13 }}>Cargando...</td></tr>
            ) : (stats?.radar ?? []).length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)', fontSize: 13 }}>
                No hay proyectos. <a href="/" style={{ color: 'var(--accent-foreground)' }}>Crear uno</a>
              </td></tr>
            ) : (
              (stats?.radar ?? []).map((p, i) => {
                const sb = STATUS_BADGE[p.status]
                const monthlyEst = rentabilidadRef && p.avg_price_m2
                  ? `~USD ${Math.round(p.avg_price_m2 * (rentabilidadRef / 100) / 12 * 50)}/mes`
                  : null
                return (
                  <tr key={p.id} onClick={() => navigate('/')}
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                    className="hover:bg-muted/50"
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <Text size="2" weight="bold">{p.name}</Text>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {sb
                        ? <Badge color={sb.color} variant="soft" radius="full">{sb.label}</Badge>
                        : <Badge color="gray" variant="soft" radius="full">{p.status}</Badge>
                      }
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {p.avg_price_m2
                        ? <Text size="2" weight="bold">USD {p.avg_price_m2.toLocaleString('es-PY')}</Text>
                        : <Text size="2" color="gray">—</Text>
                      }
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {monthlyEst
                        ? <Text size="2" color="green" weight="medium">{monthlyEst}</Text>
                        : <Text size="2" color="gray">—</Text>
                      }
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <Text size="2" color="gray">{p.unit_count}</Text>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Card>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Mercado — sidebar (1/3 del ancho), cards apiladas verticalmente
// ══════════════════════════════════════════════════════════════════════════════

function MercadoWidget() {
  const { data: rates, isLoading } = useExchangeRates()
  const { data: weather } = useWeather()

  const items = [
    {
      label: 'USD / PYG',
      value: rates?.pyg ? rates.pyg.venta.toLocaleString('es-PY', { maximumFractionDigits: 2 }) : '—',
      detail: 'Guaraní',
      pct: rates?.pyg?.pctChange ?? null,
    },
    {
      label: 'USD / ARS',
      value: rates?.ars ? `$ ${rates.ars.venta.toLocaleString('es-PY', { maximumFractionDigits: 2 })}` : '—',
      detail: `Compra $ ${rates?.ars?.compra.toLocaleString('es-PY', { maximumFractionDigits: 2 }) ?? '—'}`,
      pct: null,
    },
    {
      label: 'USD / BRL',
      value: rates?.brl ? `R$ ${rates.brl.venta.toFixed(2)}` : '—',
      detail: 'Real',
      pct: rates?.brl?.pctChange ?? null,
    },
    {
      label: 'Asunción',
      value: weather ? `${weatherEmoji(weather.desc)} ${weather.temp_c}°C` : '—',
      detail: weather ? weather.desc.split(' ').slice(0, 2).join(' ') : 'Clima',
      pct: null,
    },
  ]

  return (
    <Box style={{ height: '100%' }}>
      <SectionTitle>Indicadores de mercado</SectionTitle>
      <Flex direction="column" gap="2" style={{ height: 'calc(100% - 32px)' }}>
        {items.map(({ label, value, detail, pct }) => (
          <Card key={label} size="2" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: '12px 16px', flex: 1 }}>
            <Flex justify="between" align="start" mb="1">
              <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </Text>
              {pct !== null && <PctArrow pct={pct} />}
            </Flex>
            <Heading size="4" weight="bold" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: isLoading ? 0.3 : 1 }}>
              {value}
            </Heading>
            <Text as="p" size="1" color="gray" mt="1">{detail}</Text>
          </Card>
        ))}
      </Flex>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Gráfico — bloque medio (1/2 del ancho en desktop)
// ══════════════════════════════════════════════════════════════════════════════

function GraficoWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const data = stats?.simsByMonth ?? []
  const maxVal = Math.max(...data.map((d) => d.total), 1)

  return (
    <Box>
      <SectionTitle>Simulaciones por mes</SectionTitle>
      <Card size="3" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <Flex align="center" justify="center" style={{ height: 180 }}>
            <Text size="1" color="gray">Cargando...</Text>
          </Flex>
        ) : data.every((d) => d.total === 0) ? (
          <Flex align="center" justify="center" direction="column" gap="2" style={{ height: 180 }}>
            <BarChartIcon size={32} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
            <Text size="1" color="gray">Aún no hay simulaciones registradas</Text>
          </Flex>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'var(--card)', color: 'var(--foreground)' }}
                formatter={(v) => [`${v ?? 0} simulaciones`, '']}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.total === maxVal ? 'var(--foreground)' : 'var(--muted-foreground)'} style={{ opacity: entry.total === maxVal ? 1 : 0.3 }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Actividad — bloque compacto (1/4 del ancho en desktop)
// ══════════════════════════════════════════════════════════════════════════════

function ActividadWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <Box>
      <SectionTitle>Actividad reciente</SectionTitle>
      <Card size="1" style={{ overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
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
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', padding: '11px 16px' }}
                  className="hover:bg-muted/50"
                >
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--muted-foreground)', opacity: 0.4, flexShrink: 0 }} />
                      <Box style={{ minWidth: 0 }}>
                        <Text size="2" weight="medium" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(project?.name as string) ?? '—'}
                        </Text>
                        <Text size="1" color="gray">{clientName}</Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap="1.5" style={{ flexShrink: 0, marginLeft: 12 }}>
                      <Text size="1" color="gray">{timeAgo(sim.created_at)}</Text>
                      <ExternalLink size={11} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                    </Flex>
                  </Flex>
                </Box>
              )
            })}
            <Box style={{ borderTop: '1px solid var(--border)' }}>
              <Box onClick={() => navigate('/informes')} style={{ cursor: 'pointer', padding: '9px 16px' }} className="hover:bg-muted/50">
                <Flex align="center" justify="center" gap="1">
                  <Text size="1" color="indigo">Ver todos</Text>
                  <ExternalLink size={11} style={{ color: 'var(--muted-foreground)' }} />
                </Flex>
              </Box>
            </Box>
          </>
        )}
      </Card>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Proyectos recientes — bloque compacto (1/4 del ancho en desktop)
// ══════════════════════════════════════════════════════════════════════════════

function ProyectosWidget({ stats, isLoading }: { stats: ReturnType<typeof useDashboardStats>['data']; isLoading: boolean }) {
  const navigate = useNavigate()
  return (
    <Box>
      <SectionTitle>Proyectos</SectionTitle>
      <Card size="1" style={{ overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Cargando...</Text></Flex>
        ) : (stats?.recent.projects ?? []).length === 0 ? (
          <Flex align="center" justify="center" py="5"><Text size="1" color="gray">Sin proyectos</Text></Flex>
        ) : (
          <>
            {(stats?.recent.projects ?? []).map((p, i) => {
              const sb = STATUS_BADGE[p.status]
              return (
                <Box key={p.id} onClick={() => navigate('/')}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', padding: '11px 16px' }}
                  className="hover:bg-muted/50"
                >
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="3">
                      <Box style={{ background: 'oklch(0.78 0.15 92.7 / 0.09)', borderRadius: 8, padding: 6 }}>
                        <Building2 size={13} style={{ color: 'var(--muted-foreground)' }} />
                      </Box>
                      <Text size="2" weight="medium">{p.name}</Text>
                    </Flex>
                    {sb
                      ? <Badge color={sb.color} variant="soft" radius="full" size="1">{sb.label}</Badge>
                      : <Badge color="gray" variant="soft" radius="full" size="1">{p.status}</Badge>
                    }
                  </Flex>
                </Box>
              )
            })}
            <Box style={{ borderTop: '1px solid var(--border)' }}>
              <Box onClick={() => navigate('/proyectos')} style={{ cursor: 'pointer', padding: '9px 16px' }} className="hover:bg-muted/50">
                <Flex align="center" justify="center" gap="1">
                  <Text size="1" color="indigo">Ver todos</Text>
                  <ExternalLink size={11} style={{ color: 'var(--muted-foreground)' }} />
                </Flex>
              </Box>
            </Box>
          </>
        )}
      </Card>
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Links útiles — con DnD interno por categoría
// ══════════════════════════════════════════════════════════════════════════════

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
  { label: 'Cronista',     sub: 'cronista.com',   url: 'https://www.cronista.com'            },
]
const DEFAULT_DATOS_OFICIALES: LinkItem[] = [
  { label: 'BCP',               sub: 'Banco Central PY',    url: 'https://www.bcp.gov.py'      },
  { label: 'Catastro Nacional', sub: 'catastro.gov.py',      url: 'https://www.catastro.gov.py' },
  { label: 'Registro Público',  sub: 'Poder Judicial PY',    url: 'https://www.pj.gov.py/contenido/154-direccion-general-de-los-registros-publicos/1063' },
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
      <Box style={{ background: 'oklch(0.78 0.15 92.7 / 0.09)', borderRadius: 8, padding: 8, flexShrink: 0 }}>
        <Icon size={15} style={{ color: 'var(--muted-foreground)' }} />
      </Box>
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Text size="2" weight="bold" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</Text>
        <Text size="1" color="gray" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{link.sub}</Text>
      </Box>
      <ExternalLink size={11} style={{ color: 'var(--muted-foreground)', opacity: 0.4, flexShrink: 0 }} />
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

function SmallLinkGrid({ items, editMode, storageKey, categoryIcon }: { items: LinkItem[]; editMode?: boolean; storageKey?: string; categoryIcon: React.ElementType }) {
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
          <Grid columns={{ initial: '2', sm: '3', lg: '4' }} gap="3">
            {ordered.map((link, i) => (
              <SortableLinkCard key={ids[i]} id={ids[i]} link={link} icon={categoryIcon} />
            ))}
          </Grid>
        </SortableContext>
      </DndContext>
    )
  }

  return (
    <Grid columns={{ initial: '2', sm: '3', lg: '4' }} gap="3">
      {ordered.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Card size="2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', transition: 'box-shadow 0.15s' }} className="hover:shadow-md">
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
    <Box>
      <SectionTitle>Recursos</SectionTitle>
      <Tabs.Root defaultValue="portales">
        <Tabs.List mb="4">
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
    </Box>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Quick actions
// ══════════════════════════════════════════════════════════════════════════════

function QuickActionsBar() {
  const navigate = useNavigate()
  const actions = [
    { label: 'Nuevo proyecto', icon: Plus,       path: '/proyectos' },
    { label: 'Nuevo cliente',  icon: Users,      path: '/clientes'  },
    { label: 'Simulador',      icon: Calculator, path: '/simulador' },
    { label: 'Informes',       icon: FileText,   path: '/informes'  },
  ]
  return (
    <Card size="2" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
      <Flex gap="2" wrap="wrap">
        {actions.map(({ label, icon: Icon, path }) => (
          <Box key={label} onClick={() => navigate(path)} style={{ cursor: 'pointer', flex: 1, minWidth: 120 }}>
            <Flex align="center" gap="2" style={{ padding: '8px 12px', borderRadius: 6, background: 'oklch(0.75 0.11 90.08 / 0.15)', transition: 'opacity 0.15s' }} className="hover:opacity-70">
              <Icon size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <Text size="2" weight="medium" style={{ whiteSpace: 'nowrap' }}>{label}</Text>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Secciones arrastrables
// ══════════════════════════════════════════════════════════════════════════════

type SectionId = 'kpis' | 'radar_mercado' | 'bottom' | 'recursos'

const DEFAULT_SECTIONS: SectionId[] = ['kpis', 'radar_mercado', 'bottom', 'recursos']
const LS_SECTIONS = 'dashboard_section_order_v1'

function loadSections(): SectionId[] {
  try {
    const saved = localStorage.getItem(LS_SECTIONS)
    if (saved) {
      const parsed = JSON.parse(saved) as string[]
      const valid = parsed.filter((id) => DEFAULT_SECTIONS.includes(id as SectionId)) as SectionId[]
      const missing = DEFAULT_SECTIONS.filter((id) => !valid.includes(id))
      return [...valid, ...missing]
    }
  } catch { /* ignore */ }
  return DEFAULT_SECTIONS
}

function SortableSection({ id, editMode, children }: { id: string; editMode: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 50 : undefined,
      }}
    >
      {editMode && (
        <div
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            padding: '3px 14px',
            borderRadius: '0 0 8px 8px',
            background: 'var(--color-background)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            cursor: 'grab',
            color: 'var(--muted-foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <GripVertical size={13} />
          <Text size="1" color="gray" style={{ userSelect: 'none', pointerEvents: 'none' }}>mover</Text>
        </div>
      )}
      <div style={{ paddingTop: editMode ? 24 : 0 }}>
        {children}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE — grid asimétrico + secciones arrastrables
// ══════════════════════════════════════════════════════════════════════════════

export function InicioPage() {
  const [editMode, setEditMode] = useState(false)
  const [sections, setSections] = useState<SectionId[]>(loadSections)

  const { data: stats, isLoading } = useDashboardStats()
  const { data: config } = useConsultoraConfig()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSections((prev) => {
        const next = arrayMove(prev, prev.indexOf(active.id as SectionId), prev.indexOf(over.id as SectionId))
        localStorage.setItem(LS_SECTIONS, JSON.stringify(next))
        return next
      })
    }
  }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  function renderSection(id: SectionId) {
    switch (id) {
      case 'kpis':
        return <ResumenWidget stats={stats} isLoading={isLoading} />

      case 'radar_mercado':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }} className="dashboard-row-2">
            <RadarWidget stats={stats} isLoading={isLoading} rentabilidadRef={null} />
            <MercadoWidget />
          </div>
        )

      case 'bottom':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }} className="dashboard-row-3">
            <GraficoWidget stats={stats} isLoading={isLoading} />
            <ActividadWidget stats={stats} isLoading={isLoading} />
            <ProyectosWidget stats={stats} isLoading={isLoading} />
          </div>
        )

      case 'recursos':
        return <RecursosWidget config={config} editMode={editMode} />
    }
  }

  return (
    <Box p={{ initial: '4', md: '6' }} style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Header ── */}
      <Flex align="start" justify="between" mb="4">
        <Box>
          <Text size="1" color="gray">
            {now.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Heading size="7" weight="bold" mt="1">
            {greeting}{config?.nombre ? `, ${config.nombre}` : ''}
          </Heading>
        </Box>
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

      {/* ── Quick actions ── */}
      <Box mb="5">
        <QuickActionsBar />
      </Box>

      {editMode && (
        <Card mb="4" style={{ background: 'var(--muted)', border: '1px solid var(--border)', boxShadow: 'none' }}>
          <Flex align="center" gap="2">
            <GripVertical size={15} style={{ color: 'var(--muted-foreground)' }} />
            <Text size="2" color="gray">
              Modo edición — arrastrá las secciones desde el handle central para reorganizar.
            </Text>
          </Flex>
        </Card>
      )}

      {/* ── Secciones arrastrables ── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections} strategy={verticalListSortingStrategy}>
          <Flex direction="column" gap="5">
            {sections.map((id) => (
              <SortableSection key={id} id={id} editMode={editMode}>
                {renderSection(id)}
              </SortableSection>
            ))}
          </Flex>
        </SortableContext>
      </DndContext>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-row-2,
          .dashboard-row-3 { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .dashboard-row-3 { grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important; }
          .dashboard-row-3 > *:first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </Box>
  )
}
