export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          location: string | null
          status: 'en_pozo' | 'en_construccion' | 'entregado'
          delivery_date: string | null
          developer_name: string | null
          amenities: string[]
          brochure_path: string | null
          usd_to_pyg_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          location?: string | null
          status: 'en_pozo' | 'en_construccion' | 'entregado'
          delivery_date?: string | null
          developer_name?: string | null
          amenities?: string[]
          brochure_path?: string | null
          usd_to_pyg_rate?: number | null
        }
        Update: {
          name?: string
          description?: string | null
          location?: string | null
          status?: 'en_pozo' | 'en_construccion' | 'entregado'
          delivery_date?: string | null
          developer_name?: string | null
          amenities?: string[]
          brochure_path?: string | null
          usd_to_pyg_rate?: number | null
        }
        Relationships: []
      }
      financing_plans: {
        Row: {
          id: string
          project_id: string
          name: string
          anticipo_pct: number
          cuotas: number
          tasa_interes_pct: number | null
          pago_final_pct: number | null
          notas: string | null
          created_at: string
        }
        Insert: {
          project_id: string
          name: string
          anticipo_pct: number
          cuotas: number
          tasa_interes_pct?: number | null
          pago_final_pct?: number | null
          notas?: string | null
        }
        Update: {
          project_id?: string
          name?: string
          anticipo_pct?: number
          cuotas?: number
          tasa_interes_pct?: number | null
          pago_final_pct?: number | null
          notas?: string | null
        }
        Relationships: []
      }
      typologies: {
        Row: {
          id: string
          project_id: string
          name: string
          area_m2: number
          price_usd: number     // bigint cents
          price_pyg: number | null  // bigint Guaraníes
          units_available: number
          floor_plan_path: string | null
          base_sim_params: Record<string, unknown> | null
          category: 'unidad' | 'cochera' | 'baulera'
          unit_type: string | null
          bathrooms: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
          name: string
          area_m2: number
          price_usd: number
          price_pyg?: number | null
          units_available: number
          floor_plan_path?: string | null
          base_sim_params?: Record<string, unknown> | null
          category?: 'unidad' | 'cochera' | 'baulera'
          unit_type?: string | null
          bathrooms?: number | null
        }
        Update: {
          project_id?: string
          name?: string
          area_m2?: number
          price_usd?: number
          price_pyg?: number | null
          units_available?: number
          floor_plan_path?: string | null
          base_sim_params?: Record<string, unknown> | null
          category?: 'unidad' | 'cochera' | 'baulera'
          unit_type?: string | null
          bathrooms?: number | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          nationality: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          full_name: string
          email?: string | null
          phone?: string | null
          nationality?: string | null
          notes?: string | null
        }
        Update: {
          full_name?: string
          email?: string | null
          phone?: string | null
          nationality?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          id: string
          project_id: string
          storage_path: string
          sort_order: number
          created_at: string
        }
        Insert: {
          project_id: string
          storage_path: string
          sort_order: number
        }
        Update: {
          project_id?: string
          storage_path?: string
          sort_order?: number
        }
        Relationships: []
      }
      consultora_config: {
        Row: {
          id: number
          nombre: string
          logo_url: string | null
          telefono: string | null
          email: string | null
          whatsapp: string | null
          instagram: string | null
          sitio_web: string | null
          market_data: Record<string, unknown> | null
          updated_at: string
        }
        Insert: {
          id?: number
          nombre: string
          logo_url?: string | null
          telefono?: string | null
          email?: string | null
          whatsapp?: string | null
          instagram?: string | null
          sitio_web?: string | null
          market_data?: Record<string, unknown> | null
        }
        Update: {
          nombre?: string
          logo_url?: string | null
          telefono?: string | null
          email?: string | null
          whatsapp?: string | null
          instagram?: string | null
          sitio_web?: string | null
          market_data?: Record<string, unknown> | null
        }
        Relationships: []
      }
      simulations: {
        Row: {
          id: string
          client_id: string | null
          project_id: string | null
          typology_id: string | null
          scenario_airbnb: Record<string, unknown> | null
          scenario_alquiler: Record<string, unknown> | null
          scenario_plusvalia: Record<string, unknown> | null
          snapshot_project: Record<string, unknown>
          snapshot_typology: Record<string, unknown>
          report_path: string | null
          created_at: string
        }
        Insert: {
          client_id?: string | null
          project_id?: string | null
          typology_id?: string | null
          scenario_airbnb?: Record<string, unknown> | null
          scenario_alquiler?: Record<string, unknown> | null
          scenario_plusvalia?: Record<string, unknown> | null
          snapshot_project: Record<string, unknown>
          snapshot_typology: Record<string, unknown>
          report_path?: string | null
        }
        Update: {
          client_id?: string
          project_id?: string
          typology_id?: string
          scenario_airbnb?: Record<string, unknown> | null
          scenario_alquiler?: Record<string, unknown> | null
          scenario_plusvalia?: Record<string, unknown> | null
          snapshot_project?: Record<string, unknown>
          snapshot_typology?: Record<string, unknown>
          report_path?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
