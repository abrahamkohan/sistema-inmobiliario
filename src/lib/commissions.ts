// src/lib/commissions.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type CommissionRow    = Database['public']['Tables']['commissions']['Row']
type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
type CommissionUpdate = Database['public']['Tables']['commissions']['Update']
type SplitRow         = Database['public']['Tables']['commission_splits']['Row']
type SplitUpdate      = Database['public']['Tables']['commission_splits']['Update']
type IncomeRow        = Database['public']['Tables']['commission_incomes']['Row']
type IncomeInsert     = Database['public']['Tables']['commission_incomes']['Insert']
type ClientLinkRow    = Database['public']['Tables']['commission_clients']['Row']

// ─── Tipo extendido con relaciones embebidas ──────────────────────────────────

export type CommissionFull = CommissionRow & {
  commission_splits: SplitRow[]
  commission_incomes: IncomeRow[]
  commission_clients: (ClientLinkRow & {
    clients: { id: string; full_name: string; phone: string | null }
  })[]
  projects: {
    id: string
    name: string
    developer_name: string | null
    ciudad: string | null
    barrio: string | null
  } | null
}

const SELECT_FULL = `
  *,
  commission_splits(*),
  commission_incomes(*),
  commission_clients(*, clients(id, full_name, phone)),
  projects(id, name, developer_name, ciudad, barrio)
`

// ─── Comisiones ───────────────────────────────────────────────────────────────

export async function getCommissions(): Promise<CommissionFull[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select(SELECT_FULL)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as CommissionFull[]
}

export async function getCommissionById(id: string): Promise<CommissionFull> {
  const { data, error } = await supabase
    .from('commissions')
    .select(SELECT_FULL)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as CommissionFull
}

export async function createCommission(input: CommissionInsert): Promise<CommissionRow> {
  const { data, error } = await supabase
    .from('commissions')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as CommissionRow
}

export async function createCommissionWithSplits(
  commissionData: CommissionInsert,
  agentes: { id: string; nombre: string; porcentaje_comision: number }[]
): Promise<CommissionRow> {
  const commission = await createCommission(commissionData)

  if (agentes.length > 0) {
    const splits = agentes.map(a => ({
      commission_id: commission.id,
      agente_id:     a.id,
      agente_nombre: a.nombre,
      porcentaje:    a.porcentaje_comision,
      monto:         Math.round((commission.importe_comision * a.porcentaje_comision / 100) * 100) / 100,
    }))
    const { error } = await supabase.from('commission_splits').insert(splits)
    if (error) throw error
  }

  return commission
}

export async function updateCommission(id: string, input: CommissionUpdate): Promise<CommissionRow> {
  const { data, error } = await supabase
    .from('commissions')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as CommissionRow
}

export async function deleteCommission(id: string): Promise<void> {
  const { error } = await supabase.from('commissions').delete().eq('id', id)
  if (error) throw error
}

// ─── Splits ───────────────────────────────────────────────────────────────────

export async function updateSplit(id: string, input: SplitUpdate): Promise<SplitRow> {
  const { data, error } = await supabase
    .from('commission_splits')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as SplitRow
}

export async function markSplitAsFacturado(
  splitId: string,
  numeroFactura: string,
  fechaFactura: string
): Promise<SplitRow> {
  return updateSplit(splitId, {
    facturada: true,
    numero_factura: numeroFactura || null,
    fecha_factura: fechaFactura || null,
  })
}

// ─── Clientes vinculados ──────────────────────────────────────────────────────

export async function addCommissionClient(
  commissionId: string,
  clientId: string,
  tipo: 'vendedor' | 'comprador'
) {
  const { data, error } = await supabase
    .from('commission_clients')
    .insert({ commission_id: commissionId, client_id: clientId, tipo })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeCommissionClient(commissionId: string, clientId: string): Promise<void> {
  const { error } = await supabase
    .from('commission_clients')
    .delete()
    .eq('commission_id', commissionId)
    .eq('client_id', clientId)
  if (error) throw error
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────

export async function createIncome(input: IncomeInsert) {
  const { data, error } = await supabase
    .from('commission_incomes')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateIncome(id: string, input: Partial<IncomeInsert>) {
  const { data, error } = await supabase
    .from('commission_incomes')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('commission_incomes').delete().eq('id', id)
  if (error) throw error
}

// ─── Helpers client-side ──────────────────────────────────────────────────────

export function calcTotals(c: CommissionFull) {
  const totalCobrado   = c.commission_incomes.reduce((s, i) => s + i.monto_ingresado, 0)
  const saldoPendiente = c.importe_comision - totalCobrado
  const estado: '🟢' | '🔴' = saldoPendiente <= 0 ? '🟢' : '🔴'
  return { totalCobrado, saldoPendiente, estado }
}

export function getFacturacionStatus(c: CommissionFull): {
  status: 'completo' | 'parcial' | 'sin_facturar'
  facturados: number
  total: number
} {
  const total      = c.commission_splits.length
  const facturados = c.commission_splits.filter(s => s.facturada).length
  const status = total === 0 || facturados === 0
    ? 'sin_facturar'
    : facturados === total
      ? 'completo'
      : 'parcial'
  return { status, facturados, total }
}

export function getProjectoDisplay(c: CommissionFull): string | null {
  if (!c.projects) return null
  return c.projects.developer_name
    ? `${c.projects.developer_name} — ${c.projects.name}`
    : c.projects.name
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}
