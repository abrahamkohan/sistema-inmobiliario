// src/lib/financingPlans.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type PlanRow = Database['public']['Tables']['financing_plans']['Row']
type PlanInsert = Database['public']['Tables']['financing_plans']['Insert']
type PlanUpdate = Database['public']['Tables']['financing_plans']['Update']

export async function getFinancingPlans(projectId: string): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from('financing_plans')
    .select('*')
    .eq('project_id', projectId as unknown as never)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as unknown as PlanRow[]
}

export async function createFinancingPlan(input: PlanInsert): Promise<PlanRow> {
  const { data, error } = await supabase
    .from('financing_plans')
    .insert(input as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PlanRow
}

export async function updateFinancingPlan(id: string, input: PlanUpdate): Promise<PlanRow> {
  const { data, error } = await supabase
    .from('financing_plans')
    .update(input as unknown as never)
    .eq('id', id as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PlanRow
}

export async function deleteFinancingPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('financing_plans')
    .delete()
    .eq('id', id as unknown as never)
  if (error) throw error
}
