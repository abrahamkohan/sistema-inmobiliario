// src/types/consultant.ts
// Tipos para multi-tenant: Consultant (consultants table)

export type PermLevel = 'none' | 'read' | 'write' | 'full'
export type RoleKey   = 'admin' | 'agente' | 'cm' | 'finanzas' | 'viewer'
export type ModuleKey = 'crm' | 'tareas' | 'notas' | 'propiedades' | 'proyectos' | 'finanzas' | 'reportes' | 'marketing' | 'configuracion'

export type RoleDefaults = Partial<Record<RoleKey, Partial<Record<ModuleKey, PermLevel>>>>

export interface Consultant {
  id: number
  uuid: string
  nombre: string
  logo_url: string | null
  logo_light_url: string | null
  color_primary: string
  color_secondary: string
  color_accent: string
  subdomain: string | null
  custom_domain: string | null
  activo: boolean
  created_at: string
  role_defaults: RoleDefaults | null
}

/** Valor por defecto cuando no se encuentra consultant (fallback) */
export const DEFAULT_CONSULTANT: Consultant = {
  id: 1,
  uuid: 'default',
  nombre: '',
  logo_url: null,
  logo_light_url: null,
  color_primary: '#C9A34E',
  color_secondary: '#1E3A5F',
  color_accent: '#C9A34E',
  subdomain: 'default',
  custom_domain: null,
  activo: true,
  created_at: new Date().toISOString(),
  role_defaults: null,
}