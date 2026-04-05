// src/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  counts: {
    clients: number
    projects: number
    projects_active: number
    simulations: number
    typologies: number
    units_available: number
  }
  recent: {
    simulations: Array<{
      id: string
      created_at: string
      snapshot_project: Record<string, unknown>
      snapshot_typology: Record<string, unknown>
      clients: { full_name: string } | null
    }>
    projects: Array<{ id: string; name: string; status: string; created_at: string }>
  }
  radar: Array<{
    id: string
    name: string
    status: string
    avg_price_m2: number | null
    unit_count: number
  }>
  simsByMonth: Array<{ month: string; total: number }>
}

export interface ExchangeRates {
  ars: { compra: number; venta: number } | null
  pyg: { compra: number; venta: number; pctChange: number } | null
  brl: { compra: number; venta: number; pctChange: number } | null
}

export interface WeatherData {
  temp_c: number
  feels_like: number
  desc: string
  code: number
}

// ─── useDashboardStats ────────────────────────────────────────────────────────

const EMPTY_STATS: DashboardStats = {
  counts: { clients: 0, projects: 0, projects_active: 0, simulations: 0, typologies: 0, units_available: 0 },
  recent: { simulations: [], projects: [] },
  radar: [],
  simsByMonth: [],
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      try {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const [
          { count: clients },
          { count: projects },
          { count: projects_active },
          { count: simulations },
          { count: typologies },
          { data: unitsData },
          { data: recentSims },
          { data: recentProjects },
          { data: radarRaw },
          { data: simsForChart },
        ] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['en_pozo', 'en_construccion'] as unknown as never),
          supabase.from('simulations').select('*', { count: 'exact', head: true }),
          supabase.from('typologies').select('*', { count: 'exact', head: true }).eq('category', 'unidad' as unknown as never),
          supabase.from('typologies').select('units_available').eq('category', 'unidad' as unknown as never),
          supabase
            .from('simulations')
            .select('id, created_at, snapshot_project, snapshot_typology, clients(full_name)')
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('projects')
            .select('id, name, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('projects')
            .select('id, name, status, typologies(price_usd, area_m2, category)')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('simulations')
            .select('created_at')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at'),
        ])

        const units_available = (unitsData ?? [])?.reduce((sum, t) => sum + ((t as { units_available?: number }).units_available ?? 0), 0) ?? 0

        const radar = ((radarRaw ?? []) as Array<Record<string, unknown>>).map((p) => {
          const typs = (p.typologies as Array<{ price_usd: number; area_m2: number; category: string }>) ?? []
          const units = typs.filter((t) => t.category === 'unidad' && t.area_m2 > 0)
          const avg = units.length > 0
            ? units.reduce((sum, t) => sum + (t.price_usd / 100) / t.area_m2, 0) / units.length
            : null
          return {
            id: p.id as string,
            name: p.name as string,
            status: p.status as string,
            avg_price_m2: avg ? Math.round(avg) : null,
            unit_count: units.length,
          }
        })

        // Group sims by month
        const monthMap: Record<string, number> = {}
        for (let i = 5; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthMap[key] = 0
        }
        for (const sim of (simsForChart ?? []) as Array<{ created_at: string }>) {
          const d = new Date(sim.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (key in monthMap) monthMap[key]++
        }
        const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const simsByMonth = Object.entries(monthMap).map(([key, total]) => {
          const [, month] = key.split('-')
          return { month: MONTHS_ES[parseInt(month) - 1], total }
        })

        return {
          counts: {
            clients: clients ?? 0,
            projects: projects ?? 0,
            projects_active: projects_active ?? 0,
            simulations: simulations ?? 0,
            typologies: typologies ?? 0,
            units_available,
          },
          recent: {
            simulations: (recentSims ?? []) as unknown as DashboardStats['recent']['simulations'],
            projects: (recentProjects ?? []) as unknown as DashboardStats['recent']['projects'],
          },
          radar: radar ?? [],
          simsByMonth: simsByMonth ?? [],
        }
      } catch (err) {
        console.error('[useDashboardStats] error:', err)
        return EMPTY_STATS
      }
    },
    initialData: EMPTY_STATS,
    staleTime: 30_000,
  })
}

// ─── useExchangeRates ─────────────────────────────────────────────────────────

export function useExchangeRates() {
  return useQuery<ExchangeRates>({
    queryKey: ['exchange_rates'],
    queryFn: async () => {
      const [arsRes, pygRes, brlRes] = await Promise.allSettled([
        fetch('https://dolarapi.com/v1/dolares/blue').then((r) => r.json()),
        fetch('https://economia.awesomeapi.com.br/json/last/USD-PYG').then((r) => r.json()),
        fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL').then((r) => r.json()),
      ])
      return {
        ars: arsRes.status === 'fulfilled' ? { compra: arsRes.value.compra, venta: arsRes.value.venta } : null,
        pyg: pygRes.status === 'fulfilled'
          ? { compra: Math.round(parseFloat(pygRes.value.USDPYG?.bid ?? '0')), venta: Math.round(parseFloat(pygRes.value.USDPYG?.ask ?? '0')), pctChange: parseFloat(pygRes.value.USDPYG?.pctChange ?? '0') }
          : null,
        brl: brlRes.status === 'fulfilled'
          ? { compra: parseFloat(parseFloat(brlRes.value.USDBRL?.bid ?? '0').toFixed(2)), venta: parseFloat(parseFloat(brlRes.value.USDBRL?.ask ?? '0').toFixed(2)), pctChange: parseFloat(brlRes.value.USDBRL?.pctChange ?? '0') }
          : null,
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  })
}

// ─── useWeather ───────────────────────────────────────────────────────────────

export function useWeather() {
  return useQuery<WeatherData | null>({
    queryKey: ['weather_asuncion'],
    queryFn: async () => {
      const res = await fetch('https://wttr.in/Asuncion?format=j1')
      const data = await res.json()
      const cond = data.current_condition?.[0]
      if (!cond) return null
      return {
        temp_c: parseInt(cond.temp_C),
        feels_like: parseInt(cond.FeelsLikeC),
        desc: cond.weatherDesc?.[0]?.value ?? '',
        code: parseInt(cond.weatherCode ?? '113'),
      }
    },
    staleTime: 15 * 60_000,
    retry: 1,
  })
}

// ─── useMarketRates (compat) ──────────────────────────────────────────────────

export function useMarketRates() {
  const q = useExchangeRates()
  return { data: q.data?.ars ?? undefined }
}
