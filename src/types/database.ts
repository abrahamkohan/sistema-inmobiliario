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
          links: Array<{ type: string; name: string; url: string }>
          tipo_proyecto: 'residencial' | 'comercial' | 'mixto' | null
          precio_desde: number | null
          precio_hasta: number | null
          moneda: 'USD' | 'PYG'
          caracteristicas: string | null
          publicado_en_web: boolean
          badge_analisis: 'oportunidad' | 'estable' | 'a_evaluar' | null
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
          links?: Array<{ type: string; name: string; url: string }>
          tipo_proyecto?: 'residencial' | 'comercial' | 'mixto' | null
          precio_desde?: number | null
          precio_hasta?: number | null
          moneda?: 'USD' | 'PYG'
          caracteristicas?: string | null
          publicado_en_web?: boolean
          badge_analisis?: 'oportunidad' | 'estable' | 'a_evaluar' | null
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
          links?: Array<{ type: string; name: string; url: string }>
          tipo_proyecto?: 'residencial' | 'comercial' | 'mixto' | null
          precio_desde?: number | null
          precio_hasta?: number | null
          moneda?: 'USD' | 'PYG'
          caracteristicas?: string | null
          publicado_en_web?: boolean
          badge_analisis?: 'oportunidad' | 'estable' | 'a_evaluar' | null
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
          tipo: 'lead' | 'cliente'
          fuente: string | null
          dni: string | null
          fecha_nacimiento: string | null
          campos_extra: Record<string, string> | null
          apodo: string | null
          referido_por: string | null
          estado: string | null
          converted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          full_name: string
          email?: string | null
          phone?: string | null
          nationality?: string | null
          notes?: string | null
          tipo?: 'lead' | 'cliente'
          fuente?: string | null
          dni?: string | null
          fecha_nacimiento?: string | null
          campos_extra?: Record<string, string> | null
          apodo?: string | null
          referido_por?: string | null
          estado?: string | null
          converted_at?: string | null
        }
        Update: {
          full_name?: string
          email?: string | null
          phone?: string | null
          nationality?: string | null
          notes?: string | null
          tipo?: 'lead' | 'cliente'
          fuente?: string | null
          dni?: string | null
          fecha_nacimiento?: string | null
          campos_extra?: Record<string, string> | null
          apodo?: string | null
          referido_por?: string | null
          estado?: string | null
          converted_at?: string | null
        }
        Relationships: []
      }
      project_amenities: {
        Row: {
          id:         string
          project_id: string
          name:       string
          sort_order: number
          created_at: string
        }
        Insert: {
          project_id: string
          name:       string
          sort_order?: number
        }
        Update: {
          name?:       string
          sort_order?: number
        }
        Relationships: []
      }
      project_amenity_images: {
        Row: {
          id:           string
          amenity_id:   string
          storage_path: string
          sort_order:   number
          created_at:   string
        }
        Insert: {
          amenity_id:   string
          storage_path: string
          sort_order?:  number
        }
        Update: {
          sort_order?: number
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
      presupuestos: {
        Row: {
          id: string
          client_id: string | null
          client_name: string | null
          unidad_nombre: string
          superficie_m2: number | null
          precio_usd: number
          cochera_nombre: string | null
          cochera_precio_usd: number
          floor_plan_path: string | null
          entrega: number
          cuotas_cantidad: number
          cuotas_valor: number
          saldo_contra_entrega: number
          refuerzos_cantidad: number
          refuerzos_valor: number
          refuerzos_periodicidad: number
          notas: string | null
          created_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          unidad_nombre?: string
          superficie_m2?: number | null
          precio_usd?: number
          cochera_nombre?: string | null
          cochera_precio_usd?: number
          floor_plan_path?: string | null
          entrega?: number
          cuotas_cantidad?: number
          cuotas_valor?: number
          saldo_contra_entrega?: number
          refuerzos_cantidad?: number
          refuerzos_valor?: number
          refuerzos_periodicidad?: number
          notas?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          unidad_nombre?: string
          superficie_m2?: number | null
          precio_usd?: number
          cochera_nombre?: string | null
          cochera_precio_usd?: number
          floor_plan_path?: string | null
          entrega?: number
          cuotas_cantidad?: number
          cuotas_valor?: number
          saldo_contra_entrega?: number
          refuerzos_cantidad?: number
          refuerzos_valor?: number
          refuerzos_periodicidad?: number
          notas?: string | null
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
      properties: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          operacion: 'venta' | 'alquiler'
          tipo: 'departamento' | 'casa' | 'terreno' | 'comercial'
          titulo: string | null
          descripcion: string | null
          estado: 'activo' | 'inactivo'
          publicado_en_web: boolean
          dormitorios: number | null
          banos: number | null
          superficie_m2: number | null
          superficie_cubierta_m2: number | null
          estacionamientos: number | null
          terreno_m2: number | null
          anio: number | null
          condicion: 'nuevo' | 'usado' | 'reventa' | null
          piso: number | null
          deposito: boolean | null
          garajes: number | null
          precio: number | null
          moneda: 'USD' | 'PYG'
          zona: string | null
          direccion: string | null
          latitud: number | null
          longitud: number | null
          amenities: string[]
          foto_portada: string | null
        }
        Insert: {
          operacion?: 'venta' | 'alquiler'
          tipo?: 'departamento' | 'casa' | 'terreno' | 'comercial'
          titulo?: string | null
          descripcion?: string | null
          estado?: 'activo' | 'inactivo'
          publicado_en_web?: boolean
          dormitorios?: number | null
          banos?: number | null
          superficie_m2?: number | null
          superficie_cubierta_m2?: number | null
          estacionamientos?: number | null
          terreno_m2?: number | null
          anio?: number | null
          condicion?: 'nuevo' | 'usado' | 'reventa' | null
          piso?: number | null
          deposito?: boolean | null
          garajes?: number | null
          precio?: number | null
          moneda?: 'USD' | 'PYG'
          zona?: string | null
          direccion?: string | null
          latitud?: number | null
          longitud?: number | null
          amenities?: string[]
          foto_portada?: string | null
        }
        Update: {
          operacion?: 'venta' | 'alquiler'
          tipo?: 'departamento' | 'casa' | 'terreno' | 'comercial'
          titulo?: string | null
          descripcion?: string | null
          estado?: 'activo' | 'inactivo'
          publicado_en_web?: boolean
          dormitorios?: number | null
          banos?: number | null
          superficie_m2?: number | null
          superficie_cubierta_m2?: number | null
          estacionamientos?: number | null
          terreno_m2?: number | null
          anio?: number | null
          condicion?: 'nuevo' | 'usado' | 'reventa' | null
          piso?: number | null
          deposito?: boolean | null
          garajes?: number | null
          precio?: number | null
          moneda?: 'USD' | 'PYG'
          zona?: string | null
          direccion?: string | null
          latitud?: number | null
          longitud?: number | null
          amenities?: string[]
          foto_portada?: string | null
        }
        Relationships: []
      }
      property_photos: {
        Row: {
          id: string
          created_at: string
          property_id: string
          storage_path: string
          sort_order: number
          es_portada: boolean
        }
        Insert: {
          property_id: string
          storage_path: string
          sort_order?: number
          es_portada?: boolean
        }
        Update: {
          property_id?: string
          storage_path?: string
          sort_order?: number
          es_portada?: boolean
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
