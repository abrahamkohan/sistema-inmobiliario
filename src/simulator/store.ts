// src/simulator/store.ts
import { create } from 'zustand'
import type { AirbnbInputs, AlquilerInputs, PlusvaliaInputs } from './engine'

export interface SimBaseValues {
  price_usd: number       // unit price in dollars
  cochera_price: number   // cochera price in dollars (0 if none selected)
  baulera_price: number   // baulera price in dollars (0 if none selected)
}

export interface SimOverrides {
  // Compartido
  expensas?: number           // mismo inmueble → mismo gasto en ambas modalidades
  // Airbnb
  airbnb_amoblamiento?: number
  airbnb_noches_mes?: number
  airbnb_tarifa_diaria?: number
  airbnb_admin_pct?: number
  airbnb_electricidad?: number
  airbnb_internet?: number
  airbnb_cable_tv?: number
  // Alquiler
  alquiler_amoblamiento?: number
  alquiler_incluir_amoblamiento?: boolean
  alquiler_mensual?: number
  alquiler_admin_pct?: number
  alquiler_otros?: number
  // Plusvalía
  plusvalia_precio_venta?: number
  plusvalia_anios?: number
  plusvalia_comision_pct?: number
}

// Conservative market defaults for Paraguay
export const MARKET_DEFAULTS = {
  airbnb_amoblamiento: 5000,
  airbnb_noches_mes: 20,
  airbnb_tarifa_diaria: 80,
  airbnb_admin_pct: 20,
  expensas: 100,
  airbnb_electricidad: 50,
  airbnb_internet: 30,
  airbnb_cable_tv: 20,
  alquiler_amoblamiento: 0,
  alquiler_incluir_amoblamiento: false,
  alquiler_mensual: 600,
  alquiler_admin_pct: 8,
  alquiler_otros: 0,
  plusvalia_precio_venta: 0,
  plusvalia_anios: 3,
  plusvalia_comision_pct: 5.5,
} as const

interface SimState {
  projectId: string | null
  typologyId: string | null
  clientId: string | null
  baseValues: SimBaseValues | null
  overrides: SimOverrides
  setSelection: (projectId: string, typologyId: string, clientId: string) => void
  setBaseValues: (base: SimBaseValues) => void
  setOverride: <K extends keyof SimOverrides>(key: K, value: SimOverrides[K]) => void
  resetOverrides: () => void
  reset: () => void
}

export const useSimStore = create<SimState>((set) => ({
  projectId: null,
  typologyId: null,
  clientId: null,
  baseValues: null,
  overrides: {},

  setSelection: (projectId, typologyId, clientId) =>
    set({ projectId, typologyId, clientId }),

  setBaseValues: (base) => set({ baseValues: base }),

  setOverride: (key, value) =>
    set((s) => ({ overrides: { ...s.overrides, [key]: value } })),

  resetOverrides: () => set({ overrides: {} }),

  reset: () => set({ projectId: null, typologyId: null, clientId: null, baseValues: null, overrides: {} }),
}))

export function useAirbnbInputs(): AirbnbInputs {
  const { baseValues, overrides } = useSimStore()
  const d = MARKET_DEFAULTS
  const price = (baseValues?.price_usd ?? 0) + (baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0)
  return {
    precio_compra_propiedad_usd: price,
    amoblamiento_preparacion_str_usd: overrides.airbnb_amoblamiento ?? d.airbnb_amoblamiento,
    noches_ocupadas_mes: overrides.airbnb_noches_mes ?? d.airbnb_noches_mes,
    tarifa_diaria_promedio_usd: overrides.airbnb_tarifa_diaria ?? d.airbnb_tarifa_diaria,
    tarifa_administracion_percent: overrides.airbnb_admin_pct ?? d.airbnb_admin_pct,
    expensas_usd_mes: overrides.expensas ?? d.expensas,
    electricidad_usd_mes: overrides.airbnb_electricidad ?? d.airbnb_electricidad,
    internet_usd_mes: overrides.airbnb_internet ?? d.airbnb_internet,
    cable_tv_usd_mes: overrides.airbnb_cable_tv ?? d.airbnb_cable_tv,
  }
}

export function useAlquilerInputs(): AlquilerInputs {
  const { baseValues, overrides } = useSimStore()
  const d = MARKET_DEFAULTS
  const price = (baseValues?.price_usd ?? 0) + (baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0)
  return {
    precio_compra_propiedad_usd: price,
    amoblamiento_preparacion_str_usd: overrides.alquiler_amoblamiento ?? d.alquiler_amoblamiento,
    incluir_amoblamiento: overrides.alquiler_incluir_amoblamiento ?? d.alquiler_incluir_amoblamiento,
    alquiler_mensual_usd: overrides.alquiler_mensual ?? d.alquiler_mensual,
    tarifa_administracion_percent: overrides.alquiler_admin_pct ?? d.alquiler_admin_pct,
    expensas_usd_mes: overrides.expensas ?? d.expensas,
    otros_usd_mes: overrides.alquiler_otros ?? d.alquiler_otros,
  }
}

export function usePlusvaliaInputs(): PlusvaliaInputs {
  const { baseValues, overrides } = useSimStore()
  const d = MARKET_DEFAULTS
  const price = (baseValues?.price_usd ?? 0) + (baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0)
  return {
    precio_compra_propiedad_usd: price,
    precio_estimado_venta_usd: overrides.plusvalia_precio_venta
      ?? (price > 0 ? Math.round(price * 1.30) : 0),
    anios_tenencia: overrides.plusvalia_anios ?? d.plusvalia_anios,
    comision_inmobiliaria_pct: overrides.plusvalia_comision_pct ?? d.plusvalia_comision_pct,
  }
}
