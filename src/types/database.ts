export interface Database {
  public: {
    Tables: {
      flip_calculations: {
        Row: {
          id: string
          label: string
          precio_lista: number
          entrega: number
          cantidad_cuotas: number
          valor_cuota: number
          rentabilidad_anual_percent: number
          comision_percent: number
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          label?: string
          precio_lista?: number
          entrega?: number
          cantidad_cuotas?: number
          valor_cuota?: number
          rentabilidad_anual_percent?: number
          comision_percent?: number
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          precio_lista?: number
          entrega?: number
          cantidad_cuotas?: number
          valor_cuota?: number
          rentabilidad_anual_percent?: number
          comision_percent?: number
          notas?: string | null
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          location: string | null
          ciudad: string | null
          barrio: string | null
          zona: string | null
          direccion: string | null
          status: 'en_pozo' | 'en_construccion' | 'entregado'
          delivery_date: string | null
          developer_name: string | null
          brochure_path: string | null
          brochure_url: string | null
          drive_folder_url: string | null
          maps_url: string | null
          tour_360_url: string | null
          highlights: string | null
          usd_to_pyg_rate: number | null
          tipo_proyecto: 'residencial' | 'comercial' | 'mixto' | null
          precio_desde: number | null
          precio_hasta: number | null
          moneda: 'USD' | 'PYG'
          caracteristicas: string | null
          publicado_en_web: boolean
          badge_analisis: 'oportunidad' | 'estable' | 'a_evaluar' | null
          hero_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          location?: string | null
          ciudad?: string | null
          barrio?: string | null
          zona?: string | null
          direccion?: string | null
          status: 'en_pozo' | 'en_construccion' | 'entregado'
          delivery_date?: string | null
          developer_name?: string | null
          brochure_path?: string | null
          brochure_url?: string | null
          drive_folder_url?: string | null
          maps_url?: string | null
          tour_360_url?: string | null
          highlights?: string | null
          usd_to_pyg_rate?: number | null
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
          ciudad?: string | null
          barrio?: string | null
          zona?: string | null
          direccion?: string | null
          status?: 'en_pozo' | 'en_construccion' | 'entregado'
          delivery_date?: string | null
          developer_name?: string | null
          brochure_path?: string | null
          brochure_url?: string | null
          drive_folder_url?: string | null
          maps_url?: string | null
          tour_360_url?: string | null
          highlights?: string | null
          usd_to_pyg_rate?: number | null
          tipo_proyecto?: 'residencial' | 'comercial' | 'mixto' | null
          precio_desde?: number | null
          precio_hasta?: number | null
          moneda?: 'USD' | 'PYG'
          caracteristicas?: string | null
          publicado_en_web?: boolean
          badge_analisis?: 'oportunidad' | 'estable' | 'a_evaluar' | null
          hero_image_url?: string | null
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
          floor_plan: string | null
          images: string[]
          base_sim_params: Record<string, unknown> | null
          category: 'unidad' | 'cochera' | 'baulera'
          unit_type: string | null
          bathrooms: number | null
          features: string[]
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
          floor_plan?: string | null
          images?: string[]
          base_sim_params?: Record<string, unknown> | null
          category?: 'unidad' | 'cochera' | 'baulera'
          unit_type?: string | null
          bathrooms?: number | null
          features?: string[]
        }
        Update: {
          project_id?: string
          name?: string
          area_m2?: number
          price_usd?: number
          price_pyg?: number | null
          units_available?: number
          floor_plan_path?: string | null
          floor_plan?: string | null
          images?: string[]
          base_sim_params?: Record<string, unknown> | null
          category?: 'unidad' | 'cochera' | 'baulera'
          unit_type?: string | null
          bathrooms?: number | null
          features?: string[]
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
          assigned_to: string | null
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
          assigned_to?: string | null
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
          assigned_to?: string | null
        }
        Relationships: []
      }
      project_amenities: {
        Row: {
          id:         string
          project_id: string
          name:       string
          categoria:  string
          icon:       string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          project_id: string
          name:       string
          categoria?: string
          icon?:      string | null
          sort_order?: number
        }
        Update: {
          name?:       string
          categoria?:  string
          icon?:       string | null
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
          simulador_publico: boolean
          pwa_icon_url: string | null
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
          simulador_publico?: boolean
          pwa_icon_url?: string | null
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
          simulador_publico?: boolean
          pwa_icon_url?: string | null
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
          financiacion: boolean
          amoblado: boolean
          ciudad: string | null
          barrio: string | null
          zona: string | null
          direccion: string | null
          latitud: number | null
          longitud: number | null
          amenities: string[]
          foto_portada: string | null
          assigned_to: string | null
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
          financiacion?: boolean
          amoblado?: boolean
          ciudad?: string | null
          barrio?: string | null
          zona?: string | null
          direccion?: string | null
          latitud?: number | null
          longitud?: number | null
          amenities?: string[]
          foto_portada?: string | null
          assigned_to?: string | null
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
          financiacion?: boolean
          amoblado?: boolean
          ciudad?: string | null
          barrio?: string | null
          zona?: string | null
          direccion?: string | null
          latitud?: number | null
          longitud?: number | null
          amenities?: string[]
          foto_portada?: string | null
          assigned_to?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id:             string
          title:          string
          context:        'lead' | 'property' | 'admin' | 'marketing'
          lead_id:        string | null
          property_id:    string | null
          assigned_to:    string
          created_by:     string
          team_id:        string | null
          type:           'whatsapp' | 'call' | 'meeting' | 'email' | 'visit'
          status:         'pending' | 'contacted' | 'rescheduled' | 'closed'
          outcome:        'no_response' | 'interested' | 'not_interested' | null
          priority:       'low' | 'medium' | 'high'
          due_date:       string
          recurrence:     'none' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_day: number | null
          notes:          string | null
          escalated_to:   string | null
          meet_link:      string | null
          overdue_notified: boolean
          created_at:     string
          updated_at:     string
        }
        Insert: {
          title:          string
          due_date:       string
          assigned_to:    string
          created_by:     string
          context?:       'lead' | 'property' | 'admin' | 'marketing'
          lead_id?:       string | null
          property_id?:   string | null
          team_id?:       string | null
          type?:          'whatsapp' | 'call' | 'meeting' | 'email' | 'visit'
          status?:        'pending' | 'contacted' | 'rescheduled' | 'closed'
          outcome?:       'no_response' | 'interested' | 'not_interested' | null
          priority?:      'low' | 'medium' | 'high'
          recurrence?:    'none' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_day?: number | null
          notes?:         string | null
          escalated_to?:  string | null
          meet_link?:     string | null
        }
        Update: {
          title?:         string
          due_date?:      string
          assigned_to?:   string
          context?:       'lead' | 'property' | 'admin' | 'marketing'
          lead_id?:       string | null
          property_id?:   string | null
          team_id?:       string | null
          type?:          'whatsapp' | 'call' | 'meeting' | 'email' | 'visit'
          status?:        'pending' | 'contacted' | 'rescheduled' | 'closed'
          outcome?:       'no_response' | 'interested' | 'not_interested' | null
          priority?:      'low' | 'medium' | 'high'
          recurrence?:    'none' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_day?: number | null
          notes?:         string | null
          escalated_to?:  string | null
          meet_link?:     string | null
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
      notes: {
        Row: {
          id: string
          content: string
          location: string
          is_flagged: boolean
          tags: string[]
          reminder_date: string | null
          client_id: string | null
          project_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          content?: string
          location?: string
          is_flagged?: boolean
          tags?: string[]
          reminder_date?: string | null
          client_id?: string | null
          project_id?: string | null
        }
        Update: {
          content?: string
          location?: string
          is_flagged?: boolean
          tags?: string[]
          reminder_date?: string | null
          client_id?: string | null
          project_id?: string | null
        }
        Relationships: []
      }
      agentes: {
        Row: {
          id: string
          nombre: string
          porcentaje_comision: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          nombre: string
          porcentaje_comision: number
          activo?: boolean
        }
        Update: {
          nombre?: string
          porcentaje_comision?: number
          activo?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'agente'
          created_at: string
          is_owner: boolean
        }
        Insert: {
          user_id: string
          role: 'admin' | 'agente'
          is_owner?: boolean
        }
        Update: {
          role?: 'admin' | 'agente'
          is_owner?: boolean
        }
        Relationships: [
          { foreignKeyName: "user_roles_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          telegram_chat_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          telegram_chat_id?: string | null
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          telegram_chat_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "profiles_id_fkey"; columns: ["id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      commissions: {
        Row: {
          id: string
          proyecto_vendido: string
          project_id: string | null
          valor_venta: number | null
          porcentaje_comision: number | null
          importe_comision: number
          fecha_cierre: string | null
          tipo: 'venta' | 'alquiler'
          co_broker: boolean
          co_broker_nombre: string | null
          propietario: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          proyecto_vendido: string
          importe_comision: number
          project_id?: string | null
          valor_venta?: number | null
          porcentaje_comision?: number | null
          fecha_cierre?: string | null
          tipo?: 'venta' | 'alquiler'
          co_broker?: boolean
          co_broker_nombre?: string | null
          propietario?: string | null
          assigned_to?: string | null
        }
        Update: {
          proyecto_vendido?: string
          project_id?: string | null
          valor_venta?: number | null
          porcentaje_comision?: number | null
          importe_comision?: number
          fecha_cierre?: string | null
          tipo?: 'venta' | 'alquiler'
          co_broker?: boolean
          co_broker_nombre?: string | null
          propietario?: string | null
          assigned_to?: string | null
        }
        Relationships: [
          { foreignKeyName: "commissions_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] }
        ]
      }
      commission_splits: {
        Row: {
          id: string
          commission_id: string
          agente_id: string
          agente_nombre: string
          porcentaje: number
          monto: number
          facturada: boolean
          numero_factura: string | null
          fecha_factura: string | null
          created_at: string
        }
        Insert: {
          commission_id: string
          agente_id: string
          agente_nombre: string
          porcentaje: number
          monto: number
          facturada?: boolean
          numero_factura?: string | null
          fecha_factura?: string | null
        }
        Update: {
          facturada?: boolean
          numero_factura?: string | null
          fecha_factura?: string | null
        }
        Relationships: [
          { foreignKeyName: "commission_splits_commission_id_fkey"; columns: ["commission_id"]; referencedRelation: "commissions"; referencedColumns: ["id"] },
          { foreignKeyName: "commission_splits_agente_id_fkey"; columns: ["agente_id"]; referencedRelation: "agentes"; referencedColumns: ["id"] }
        ]
      }
      commission_clients: {
        Row: {
          id: string
          commission_id: string
          client_id: string
          tipo: 'vendedor' | 'comprador' | null
          created_at: string
        }
        Insert: {
          commission_id: string
          client_id: string
          tipo?: 'vendedor' | 'comprador' | null
        }
        Update: {
          tipo?: 'vendedor' | 'comprador' | null
        }
        Relationships: [
          { foreignKeyName: "commission_clients_commission_id_fkey"; columns: ["commission_id"]; referencedRelation: "commissions"; referencedColumns: ["id"] },
          { foreignKeyName: "commission_clients_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] }
        ]
      }
      commission_incomes: {
        Row: {
          id: string
          commission_id: string
          titulo: string
          fecha_ingreso: string
          monto_ingresado: number
          medio_pago: 'transferencia' | 'efectivo' | null
          created_at: string
        }
        Insert: {
          commission_id: string
          titulo: string
          fecha_ingreso: string
          monto_ingresado: number
          medio_pago?: 'transferencia' | 'efectivo' | null
        }
        Update: {
          titulo?: string
          fecha_ingreso?: string
          monto_ingresado?: number
          medio_pago?: 'transferencia' | 'efectivo' | null
        }
        Relationships: [
          { foreignKeyName: "commission_incomes_commission_id_fkey"; columns: ["commission_id"]; referencedRelation: "commissions"; referencedColumns: ["id"] }
        ]
      }
      push_subscriptions: {
        Row: {
          id:         string
          user_id:    string
          endpoint:   string
          p256dh:     string
          auth_key:   string
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          endpoint:   string
          p256dh:     string
          auth_key:   string
          created_at?: string
        }
        Update: {
          endpoint?:  string
          p256dh?:    string
          auth_key?:  string
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
