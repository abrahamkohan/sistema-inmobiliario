// src/lib/brand/BrandEngine.ts

export type BrandContext = 'crm' | 'landing' | 'pdf' | 'modal' | 'email'

export interface BrandSettings {
  nombre:          string
  logo_url:        string | null
  logo_light_url: string | null
  color_primary:   string | null
  color_secondary: string | null
  color_accent:    string | null
  version:         number
}

const DEFAULTS = {
  color_primary:   '#C9A34E',
  color_secondary: '#1E3A5F',
  color_accent:    '#C9A34E',
} as const

// Tema por contexto — determina qué logo usar
const CONTEXT_THEME: Record<BrandContext, 'light' | 'dark'> = {
  crm:     'dark',   // sidebar/header azul marino → logo oscuro
  landing: 'light',  // fondo blanco → logo claro
  pdf:     'light',  // papel blanco → logo claro
  modal:   'light',
  email:   'light',
}

/**
 * Clase que encapsula la lógica de branding.
 * Usa la configuración de consultora (incluye version) para cache busting.
 */
export class BrandEngine {
  private version: number

  constructor(private settings: BrandSettings) {
    this.version = settings.version ?? 1
  }

  /**
   * Devuelve la URL del logo correcta para el contexto.
   * Si el contexto es 'light' pero no hay logo_light_url, cae a logo_url.
   */
  getLogo(context: BrandContext): string {
    const dark  = this.settings.logo_url       ?? ''
    const light = this.settings.logo_light_url ?? ''
    if (CONTEXT_THEME[context] === 'dark') return dark
    return light || dark
  }

  /**
   * Cuando no existe logo_light_url se invierte el logo oscuro via CSS filter.
   * Retorna el valor del filter o undefined si no aplica.
   */
  getLogoFilter(context: BrandContext): string | undefined {
    if (
      CONTEXT_THEME[context] === 'light' &&
      !this.settings.logo_light_url &&
      this.settings.logo_url
    ) {
      return 'brightness(0) invert(1)'
    }
    return undefined
  }

  /** Tema (light/dark) según el contexto */
  getTheme(context: BrandContext): 'light' | 'dark' {
    return CONTEXT_THEME[context]
  }

  /** Colores primario, secundario y accent */
  getColors() {
    return {
      primary:   this.settings.color_primary   ?? DEFAULTS.color_primary,
      secondary: this.settings.color_secondary ?? DEFAULTS.color_secondary,
      accent:    this.settings.color_accent    ?? DEFAULTS.color_accent,
    }
  }

  /** Agrega ?v=N para forzar recarga de assets cacheados */
  getAssetUrl(url: string): string {
    if (!url) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}v=${this.version}`
  }
}
