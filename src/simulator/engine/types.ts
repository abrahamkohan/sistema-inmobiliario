// src/simulator/engine/types.ts
// All monetary inputs/outputs: USD dollars (not cents).
// Percentages: 0-100 range (e.g. 20 for 20%).

export interface AirbnbInputs {
  precio_compra_propiedad_usd: number
  amoblamiento_preparacion_str_usd: number
  noches_ocupadas_mes: number            // absolute nights per month (e.g. 20)
  tarifa_diaria_promedio_usd: number
  tarifa_administracion_percent: number  // 0-100
  expensas_usd_mes: number
  electricidad_usd_mes: number
  internet_usd_mes: number
  cable_tv_usd_mes: number
}

export interface AirbnbResult {
  inversion_total: number
  ingresos_brutos_mensuales: number
  ingresos_brutos_anuales: number
  costo_administracion: number           // monthly
  costos_operativos: number              // monthly (expensas + utilities)
  costos_totales_mensuales: number       // admin + operativos
  ganancia_neta_mensual: number
  ganancia_neta_anual: number
  rentabilidad_percent: number           // annual net yield %
  anos_recuperacion: number
}

export interface AlquilerInputs {
  precio_compra_propiedad_usd: number
  amoblamiento_preparacion_str_usd: number
  incluir_amoblamiento: boolean
  alquiler_mensual_usd: number
  tarifa_administracion_percent: number  // 0-100
  expensas_usd_mes: number
  otros_usd_mes: number
}

export interface AlquilerResult {
  inversion_total: number
  ingresos_brutos_mensuales: number
  ingresos_brutos_anuales: number
  costos_totales_mensuales: number
  ganancia_neta_mensual: number
  ganancia_neta_anual: number
  rentabilidad_percent: number
  anos_recuperacion: number
}

export interface PlusvaliaInputs {
  precio_compra_propiedad_usd: number
  precio_estimado_venta_usd: number
  anios_tenencia: number
  comision_inmobiliaria_pct: number
  escribania_usd: number
}

export interface PlusvaliaResult {
  inversion_total: number
  plusvalia: number                      // venta - compra
  roi_total_percent: number
  roi_anualizado_percent: number         // CAGR
}

export interface FlipInputs {
  precio_lista: number
  entrega: number
  cantidad_cuotas: number
  valor_cuota: number
  rentabilidad_anual_percent: number
  comision_percent: number
}

export interface FlipResult {
  capital_invertido: number
  anos: number
  ganancia: number
  comision: number
  precio_flip: number
  neto_inversor: number
  roi_total: number
  roi_anualizado: number
}
