// src/hooks/useAssets.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadAsset, deleteStorageFile } from '@/lib/storage'
import type { Database } from '@/types/database'

type AssetRow      = Database['public']['Tables']['assets']['Row']
type AssetInsert   = Database['public']['Tables']['assets']['Insert']
type AssetUsageRow = Database['public']['Tables']['asset_usages']['Row']
export type { AssetRow, AssetUsageRow }

export type AssetType    = AssetRow['type']
export type AssetSubtipo = AssetRow['subtipo']

// Incluimos los usages embebidos para saber si un asset está en uso sin query extra
export type AssetWithUsages = AssetRow & { asset_usages: AssetUsageRow[] }

const QK = 'assets'

// ── Filtros opcionales ─────────────────────────────────────────────────────────

interface AssetFilters {
  type?:    AssetType    | null
  subtipo?: AssetSubtipo | null
}

// ── useAssets ──────────────────────────────────────────────────────────────────

export function useAssets(filters: AssetFilters = {}) {
  return useQuery<AssetWithUsages[]>({
    queryKey: [QK, filters],
    queryFn: async () => {
      let q = supabase
        .from('assets')
        .select('*, asset_usages(asset_id, usage_type, usage_id)')
        .eq('activo', true as unknown as never)
        .order('created_at', { ascending: false })

      if (filters.type)    q = q.eq('type',    filters.type as unknown as never)
      if (filters.subtipo) q = q.eq('subtipo', filters.subtipo as unknown as never)

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as AssetWithUsages[]
    },
  })
}

// ── useCreateAsset ─────────────────────────────────────────────────────────────

interface CreateAssetInput {
  nombre:      string
  alt_text:    string
  type:        AssetType
  subtipo:     AssetSubtipo
  file?:       File
  externalUrl?: string
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAssetInput): Promise<AssetRow> => {
      let payload: AssetInsert

      if (input.file) {
        const { path, url } = await uploadAsset(input.file)
        payload = {
          url,
          storage_type: 'supabase',
          // Guardamos el path en external_url para poder borrar el archivo después
          external_url: path,
          type:     input.type,
          subtipo:  input.subtipo,
          nombre:   input.nombre,
          alt_text: input.alt_text || null,
        }
      } else if (input.externalUrl) {
        payload = {
          url:          input.externalUrl,
          storage_type: 'external',
          external_url: input.externalUrl,
          type:     input.type,
          subtipo:  input.subtipo,
          nombre:   input.nombre,
          alt_text: input.alt_text || null,
        }
      } else {
        throw new Error('Se requiere un archivo o una URL externa')
      }

      const { data, error } = await supabase
        .from('assets')
        .insert(payload as any)
        .select()
        .single()
      if (error) throw error
      return data as unknown as AssetRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

// ── useDeleteAsset ─────────────────────────────────────────────────────────────

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (asset: AssetWithUsages): Promise<void> => {
      // Validación fresca desde la DB — no nos fiamos del cache
      const { count, error: countError } = await supabase
        .from('asset_usages')
        .select('*', { count: 'exact', head: true })
        .eq('asset_id', asset.id as unknown as never)
      if (countError) throw countError
      if ((count ?? 0) > 0) {
        throw new Error(`Este asset está en uso en ${count} lugar${count === 1 ? '' : 'es'} y no puede eliminarse`)
      }

      // Borrar del storage si es un archivo subido
      if (asset.storage_type === 'supabase' && asset.external_url) {
        await deleteStorageFile(asset.external_url)
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id as unknown as never)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

// ── useUpdateAsset ─────────────────────────────────────────────────────────────

interface UpdateAssetInput {
  id:      string
  nombre:  string
  alt_text: string
  type:    AssetType
  subtipo: AssetSubtipo
  // Para edición, solo se actualiza la URL si el usuario elige cambiarla
  newFile?:      File
  newExternalUrl?: string
}

export function useUpdateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateAssetInput): Promise<AssetRow> => {
      const updates: Partial<AssetRow> = {
        nombre:   input.nombre,
        alt_text: input.alt_text,
        type:     input.type,
        subtipo:  input.subtipo,
        updated_at: new Date().toISOString(),
      }

      // Si hay nuevo archivo, subirlo
      if (input.newFile) {
        const { path, url } = await uploadAsset(input.newFile)
        updates.url = url
        updates.storage_type = 'supabase'
        updates.external_url = path
      } else if (input.newExternalUrl) {
        updates.url = input.newExternalUrl
        updates.storage_type = 'external'
        updates.external_url = input.newExternalUrl
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updates as unknown as never)
        .eq('id', input.id as unknown as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as AssetRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}
