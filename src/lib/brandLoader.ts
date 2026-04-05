// src/lib/brandLoader.ts
// Carga consultant desde DB por subdomain o custom_domain con caché en memoria
import { supabase } from './supabase'
import type { Consultant } from '@/types/consultant'
import { DEFAULT_CONSULTANT } from '@/types/consultant'

// Tipo temporal para el row de DB (la migración renombró consultora_config a consultants)
interface ConsultantRow {
  id: number
  uuid: string
  nombre: string
  logo_url: string | null
  logo_light_url: string | null
  color_primary: string | null
  color_secondary: string | null
  color_accent: string | null
  subdomain: string | null
  custom_domain: string | null
  activo: boolean
  created_at: string
}

// Caché en memoria para evitar múltiples DB queries por sesión
const brandCache = new Map<string, Consultant | null>()
const CACHE_KEY_DEFAULT = 'consultant:default'

/**
 * Carga el consultant desde la DB usando consultantId o subdomain/custom_domain.
 * Si se provee consultantId, busca por ese ID primero (fuente de verdad: user_roles).
 * Implementa fallback a DEFAULT_CONSULTANT si no se encuentra.
 * Usa caché en memoria para evitar queries repetidas.
 */
export async function loadBrand(
  hostname: string,
  subdomain: string | null,
  consultantId?: string | null
): Promise<{
  consultant: Consultant
  isDefault: boolean
  notFound: boolean
}> {
  // Si es localhost, siempre usar default (no hay subdominios en dev)
  const cacheKey = consultantId ?? subdomain ?? 'default'

  // Verificar caché primero
  if (brandCache.has(cacheKey)) {
    const cached = brandCache.get(cacheKey)!
    return {
      consultant: cached,
      isDefault: cached.subdomain === 'default',
      notFound: cached === null,
    }
  }

  try {
    let dbRow: ConsultantRow | null = null

    // SI hay consultantId, buscar por ID primero (este es el flujo correcto)
    if (consultantId) {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('uuid', consultantId as unknown as never)
        .maybeSingle()
      
      if (!error && data) {
        dbRow = data as unknown as ConsultantRow
      }
    }

    // Si no se encontró por ID, buscar por subdomain/custom_domain (fallback)
    if (!dbRow && subdomain) {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('activo', true as unknown as never)
        .or(`subdomain.eq.${subdomain},custom_domain.eq.${hostname}`)
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        dbRow = data as unknown as ConsultantRow
      }
    }

    if (dbRow) {
      // Mapear row de DB al tipo Consultant
      const consultant: Consultant = {
        id: dbRow.id,
        uuid: dbRow.uuid,
        nombre: dbRow.nombre,
        logo_url: dbRow.logo_url,
        logo_light_url: dbRow.logo_light_url,
        color_primary: dbRow.color_primary ?? '#C9A34E',
        color_secondary: dbRow.color_secondary ?? '#1E3A5F',
        color_accent: dbRow.color_accent ?? '#C9A34E',
        subdomain: dbRow.subdomain,
        custom_domain: dbRow.custom_domain,
        activo: dbRow.activo,
        created_at: dbRow.created_at,
        role_defaults: (dbRow as any).role_defaults ?? null,
      }

      brandCache.set(cacheKey, consultant)

      return {
        consultant,
        isDefault: false,
        notFound: false,
      }
    }

    // No se encontró consultant
    // Marcar en caché como null para no reintentar
    brandCache.set(cacheKey, null)

    // Fallback: retornar default
    brandCache.set(CACHE_KEY_DEFAULT, DEFAULT_CONSULTANT)

    return {
      consultant: DEFAULT_CONSULTANT,
      isDefault: true,
      notFound: true,
    }
  } catch (err) {
    console.error('[brandLoader] Exception:', err)
    // Cualquier excepción: fallback a default
    brandCache.set(cacheKey, DEFAULT_CONSULTANT)
    return {
      consultant: DEFAULT_CONSULTANT,
      isDefault: true,
      notFound: false,
    }
  }
}

/**
 * Limpia el caché (útil para logout o testing)
 */
export function clearBrandCache(): void {
  brandCache.clear()
}

/**
 * Obtiene el consultant desde caché sin hacer query
 * Retorna null si no está en caché
 */
export function getCachedBrand(subdomain: string | null): Consultant | null {
  const cacheKey = subdomain ?? 'default'
  return brandCache.get(cacheKey) ?? null
}