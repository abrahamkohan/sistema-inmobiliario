# SPEC — Panel de Configuración + Brand Engine
> sistema-inmobiliario · Última actualización: 2026-04-03

---

## Estado actual del sistema

### Tabla `consultora_config` (singleton id = 1)

| Campo | Tipo | Estado |
|---|---|---|
| `id` | number | ✅ existe |
| `nombre` | text | ✅ existe |
| `logo_url` | text | ✅ existe |
| `pwa_icon_url` | text | ✅ existe → usar como favicon |
| `telefono` | text | ✅ existe |
| `email` | text | ✅ existe |
| `whatsapp` | text | ✅ existe |
| `instagram` | text | ✅ existe |
| `sitio_web` | text | ✅ existe |
| `simulador_publico` | boolean | ✅ existe |
| `market_data` | jsonb | ✅ existe |
| `updated_at` | timestamp | ✅ existe |
| `logo_light_url` | text | ❌ **falta — migration** |
| `slogan` | text | ❌ **falta — migration** |
| `color_primary` | text | ❌ **falta — migration** |
| `color_secondary` | text | ❌ **falta — migration** |
| `color_accent` | text | ❌ **falta — migration** |
| `version` | integer | ❌ **falta — migration** (cache busting) |

### Qué ya funciona en `ConfiguracionPage.tsx`

- Identidad: nombre, logo_url, pwa_icon_url
- Contacto: teléfono, email, whatsapp
- Redes: instagram, sitio_web, toggle simulador_publico
- Google Calendar (OAuth via Supabase Edge Function)
- Equipo (user_roles + invitaciones magic link)

### Componentes que consumen datos de branding hoy

| Componente | Consume | Cómo |
|---|---|---|
| `Sidebar.tsx` | nombre, logo_url | `useConsultoraConfig()` |
| `AppShell.tsx` | nombre, logo_url | `useConsultoraConfig()` |
| `PublicHeader.tsx` | nombre, logo_url | prop `config` |
| `ConfiguracionPage.tsx` | todos los campos | `useConsultoraConfig()` |
| `RecursosPage.tsx` | logo_url, market_data | hook + mutation |
| `PropiedadLandingPage.tsx` | logo_url, nombre, whatsapp… | `getConsultoraPublic()` |
| `ProyectoLandingPage.tsx` | idem | `getConsultoraPublic()` |
| `CatalogoCoverPage.tsx` | logo_url, nombre | `getConsultoraPublic()` |
| `PropiedadesCatalogoPage.tsx` | idem | `getConsultoraPublic()` |
| `ProyectosCatalogoPage.tsx` | idem | `getConsultoraPublic()` |
| `PropiedadFichaPage.tsx` | nombre, logo_url | `getConsultoraBranding()` |
| `ProyectoFichaPage.tsx` | idem | `getConsultoraBranding()` |
| `ReporteHtmlPage.tsx` | logo_url, nombre | via query |
| `PresupuestoPdfPage.tsx` | logo_url | `getConsultoraPublic()` |
| `FlipPrintPage.tsx` | logo_url | via query |
| `pdfService.tsx` | nombre, logo_url, tel, email | `getConsultoraConfig()` |
| `ContactPickerSheet.tsx` | nombre | via query |

> **15+ componentes consumen `consultora_config` directamente via React Query — sin contexto centralizado.**

---

## Decisiones de arquitectura

### ❌ NO crear tabla `brand_settings` separada
`consultora_config` ya está cableada en 15+ componentes con hooks, mutations y funciones públicas. Crear una tabla nueva duplica toda la capa de datos sin ganancia real. **Solución: extender `consultora_config` con columnas nuevas.**

### ❌ NO implementar BrandContext/Provider en Fase 1
Refactorizar 15 componentes para usar un contexto centralizado es lo correcto a largo plazo, pero hacerlo antes de estabilizar el schema genera doble refactor. **Orden correcto: schema → UI → BrandContext.**

### ❌ NO implementar tabla `assets` en Fase 1
Es el sistema más complejo (jerarquía, usages, storage dual). Bloquea todo lo demás si se intenta ahora. **Hoy alcanza con URLs en `consultora_config`. Assets va en Fase 3.**

### ✅ `pwa_icon_url` ya es el favicon
No se necesita campo nuevo. Es el mismo concepto — reusar y renombrar en la UI únicamente.

### ✅ Agregar `version` a `consultora_config`
Necesario para cache busting en landing pages y PDFs. Cuando se guarda un logo nuevo, los navegadores no van a mostrar el logo viejo cacheado. Se incrementa en cada `upsert`.

---

## Preguntas definidas

### ¿La sección Assets/Media va en Fase 1 o Fase 3?
**Fase 3.** Las imágenes ya funcionan (se guardan URLs directamente en propiedades y proyectos). No hay urgencia. El sistema de assets jerárquico con `asset_usages` es complejo y bloquea el resto si se intenta ahora.

### ¿Los permisos de finanzas son para uso interno o para un contador externo?
**Definir antes de implementar.** Si es contador externo: necesita reportes más granulares (exportar, filtrar por período, ver comisiones detalladas). Si es interno: alcanza con acceso de lectura al módulo Finanzas. Esta decisión cambia el alcance del rol `finanzas`.

### ¿El módulo Marketing incluye qué exactamente?
**Fase 1 — solo landings y catálogos** (lo que ya existe). Email, automatización y campañas van en fases posteriores. Ver nota sobre campo `campana` en leads más abajo.

---

## Hoja de ruta por fases

```
FASE 1 — Schema + UI (esta semana)
  └── Migration 6 columnas en consultora_config (incluye version)
  └── Campo campana en leads (tracking básico de campaña)
  └── Rewrite ConfiguracionPage con secciones ordenadas
  └── Live preview de colores en tiempo real
  └── Soporte logo light (URL externa)

FASE 2 — BrandContext (próxima semana)
  └── BrandProvider + useBrand hook
  └── BrandEngine (getLogo, getTheme, getColors, getAssetUrl)
  └── Migrar 15 componentes al contexto centralizado
  └── Subida de archivos a Supabase Storage
  └── Permisos JSONB por usuario (user_roles.permisos)

FASE 3 — Assets / Media (cuando el brand esté estable)
  └── Tabla assets con jerarquía (type, subtipo)
  └── Tabla asset_usages (muchos a muchos)
  └── Galería de assets en ConfiguracionPage
  └── Validación: no borrar assets en uso
```

---

## Fase 1 — Migration SQL completa

Correr en el SQL Editor de Supabase:

```sql
-- Extensión de consultora_config
ALTER TABLE consultora_config
  ADD COLUMN IF NOT EXISTS logo_light_url  TEXT,
  ADD COLUMN IF NOT EXISTS slogan          TEXT,
  ADD COLUMN IF NOT EXISTS color_primary   TEXT DEFAULT '#C9A34E',
  ADD COLUMN IF NOT EXISTS color_secondary TEXT DEFAULT '#1E3A5F',
  ADD COLUMN IF NOT EXISTS color_accent    TEXT DEFAULT '#C9A34E',
  ADD COLUMN IF NOT EXISTS version         INTEGER DEFAULT 1;

-- Tracking básico de campaña en leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS campana TEXT;
```

> **`version`**: se incrementa en cada save de configuración. Permite hacer `logo_url?v=3` para forzar recarga sin cache en navegadores y PDFs.

> **`campana`**: aunque no haya UTM todavía, el campo existe. Cuando llegue un lead de FB o Google Ads, se puede registrar de qué campaña vino. Se completa manualmente o via query param en el futuro.

---

## Fase 1 — Estructura de archivos

```
src/
├── pages/
│   └── ConfiguracionPage.tsx              ← rewrite organizado por secciones
├── lib/
│   └── consultoraConfig.ts                ← agregar campos nuevos al upsert
└── components/
    └── configuracion/                     ← carpeta nueva
        ├── SeccionIdentidad.tsx           ← nombre, slogan, logos, favicon
        ├── SeccionColores.tsx             ← color pickers + live preview
        ├── ColorPreview.tsx               ← componente preview en vivo (ver spec abajo)
        ├── SeccionContacto.tsx            ← whatsapp, tel, email, redes
        ├── SeccionIntegraciones.tsx       ← Google Calendar, simulador toggle
        └── SeccionEquipo.tsx              ← extraído del page actual
```

---

## Fase 1 — Secciones del panel (orden definitivo)

> **Criterio de orden**: branding visual primero, datos comerciales después, administración al final. Las integraciones se agrupan en una sola sección — cuando haya 4+ integraciones reales se separan en secciones propias.

```
1. 🏠 Mi Inmobiliaria
2. 🎨 Colores
3. 📞 Contacto
4. 🔗 Integraciones
   ├── Google Calendar (OAuth)
   └── Simulador público (toggle)
5. 👥 Mi Equipo
6. 🔒 Seguridad
```

### 1. 🏠 Mi Inmobiliaria
- Nombre de la empresa
- Slogan / tagline
- Logo principal `logo_url` — para fondos oscuros (CRM, PDF, sidebar)
- Logo secundario `logo_light_url` — para fondos claros (landing, email)
- Favicon `pwa_icon_url` — ícono PWA y pestaña del navegador
- Input: pegar URL externa *(Supabase Storage upload en Fase 2)*

#### Guía de specs de logos (bloque visible en la UI, después de los inputs)

```
┌────────────────────────────────────┐
│ 📐 Guía para subir logos           │
│                                    │
│  • PNG con fondo transparente      │
│  • 400 × 150 px máximo             │
│  • Menos de 100 KB                 │
│  • Horizontal (isotipo + nombre)   │
│                                    │
│  Logo principal  → fondo oscuro    │
│  Logo secundario → fondo claro     │
└────────────────────────────────────┘
```

### 2. 🎨 Colores del sistema
- Color picker nativo HTML + input HEX manual
- **Preview en tiempo real** (ver spec de `ColorPreview` abajo)

| Campo | Default | Dónde se usa |
|---|---|---|
| `color_primary` | `#C9A34E` | Botones principales, CTAs |
| `color_secondary` | `#1E3A5F` | Header del CRM, fondos oscuros |
| `color_accent` | `#C9A34E` | Links, highlights, iconos |

> **Nota técnica — contraste de texto**: NO se agregan campos `color_text_light` / `color_text_dark` al schema. El color de texto sobre un fondo se computa en código según la luminosidad del fondo (texto blanco sobre oscuro, texto oscuro sobre claro). Es una función de 3 líneas, no un campo de DB.

#### Spec del componente `ColorPreview`

```
┌─────────────────────────────────┐
│ PREVIEW                         │
│ ┌─────────────────────────────┐ │
│ │ 🏠 Kohan & Campos          │ │  ← fondo color_secondary, texto auto
│ └─────────────────────────────┘ │
│                                 │
│ [  Botón principal  ]           │  ← fondo color_primary
│                                 │
│  Ver más detalles →             │  ← color color_accent
└─────────────────────────────────┘
```

El preview se actualiza mientras el usuario mueve el color picker, **antes de guardar**. No requiere persistir para ver el efecto.

### 3. 📞 Contacto
- WhatsApp principal
- Teléfono
- Email
- Instagram
- Sitio web

### 4. 🔗 Integraciones

> Google Calendar es una integración OAuth (conexión externa). Simulador público es un feature flag interno. Son conceptos distintos pero en Fase 1 van agrupados — cuando haya más integraciones se separan en secciones propias.

**Integraciones externas:**
- Google Calendar — conectar / desconectar *(ya funciona)*
- WhatsApp Business *(futuro)*
- Otras APIs *(futuro)*

**Feature flags:**
- Simulador público — toggle on/off *(ya funciona)*

### 5. 👥 Mi Equipo

#### El problema con roles simples

Los roles solos no alcanzan. El CM es el caso más claro:

```
CM necesita:
  ✓ Cargar imágenes de propiedades y proyectos
  ✓ Gestionar marketing (landings, catálogos)
  ✗ NO ver finanzas
  ✗ NO editar precios ni cambiar estado de propiedades
  ✗ NO borrar nada
```

Eso no es un rol — es **acceso a módulos con nivel de permiso distinto por módulo**.

#### Módulos del sistema

| # | Módulo | Descripción |
|---|---|---|
| 1 | CRM | Leads, contactos, pipeline |
| 2 | Propiedades | Listado, detalle, precios, estado |
| 3 | Proyectos | Listado, detalle, tipologías |
| 4 | **Media** | Imágenes de propiedades y proyectos *(sub-módulo independiente)* |
| 5 | Finanzas | Ventas, comisiones, reportes económicos |
| 6 | Marketing | Landings, catálogos, simulador público *(Fase 1: solo esto)* |
| 7 | Tareas | Agenda, calendario |
| 8 | Reportes | Simulador, fichas PDF |
| 9 | Configuración | Solo admin |

> `Media` es la clave — sub-módulo de Propiedades/Proyectos con acceso independiente. Resuelve el problema del CM sin darle acceso completo a la gestión de propiedades.

#### Niveles de acceso por módulo

| Nivel | Descripción |
|---|---|
| `—` | Sin acceso, no aparece en el menú |
| `read` | Solo lectura |
| `write` | Crear y editar |
| `full` | Crear, editar, eliminar |

#### Tabla de roles (presets)

| Módulo | admin | asesor | cm | finanzas | viewer |
|---|---|---|---|---|---|
| CRM | full | full | — | — | read |
| Propiedades | full | write | — | — | read |
| Proyectos | full | write | — | — | read |
| **Media** | full | write | **write** | — | read |
| Finanzas | full | read | — | full | — |
| Marketing | full | — | full | — | — |
| Tareas | full | full | write | — | — |
| Reportes | full | full | — | read | — |
| Configuración | full | — | — | — | — |

> El CM tiene `write` en **Media** solamente — puede subir fotos pero no puede cambiar precio, estado ni eliminar una propiedad.

#### UI del panel de equipo

```
┌──────────────────────────────────────────────────────┐
│ EQUIPO                                               │
│                                                      │
│  Abraham Kohan       admin      ● activo            │
│  María González      asesor     ● activo    [⚙]    │
│  Carlos López        cm         ● activo    [⚙]    │
│  Ana Martínez        finanzas   ○ inactivo  [⚙]    │
│                                                      │
│  [+ Invitar usuario]                                 │
└──────────────────────────────────────────────────────┘

Al abrir [⚙] de un usuario:
┌──────────────────────────────────────────────────────┐
│ Carlos López — Editar permisos                       │
│                                                      │
│  Rol base:  [cm ▾]                                   │
│                                                      │
│  Personalizar módulos (opcional):                    │
│  CRM              ○ sin acceso  ● lectura  ○ escritura │
│  Media            ○ sin acceso  ○ lectura  ● escritura │
│  Marketing        ○ sin acceso  ○ lectura  ● completo  │
│                                                      │
│  [Guardar]        [Desactivar usuario]               │
└──────────────────────────────────────────────────────┘
```

> **Etiquetas para Media en la UI** — usar lenguaje claro, no técnico:
> ```
> Media (propiedades/proyectos)
>   ○ Sin acceso
>   ● Subir imágenes
>   ○ Editar todo
> ```

#### Implementación técnica — Equipo

**DB — Fase 1** (roles simples, defaults hardcodeados en frontend):
```sql
-- Ya existe user_roles con: user_id, role
-- Sin cambios — la tabla de permisos vive en el código
```

**DB — Fase 2** (personalización por usuario):
```sql
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS permisos JSONB DEFAULT '{}';

-- Cuando permisos = {} → se usan los defaults del rol
-- Ejemplo valor personalizado:
-- { "media": "write", "marketing": "full", "crm": "none" }
```

**Hook en frontend:**
```ts
// Devuelve true/false según rol + overrides del usuario
function usePermiso(modulo: Modulo, nivel: NivelAcceso): boolean
```

**Botones condicionales en la UI:**
```tsx
{usePermiso('propiedades', 'full') && <Button variant="destructive">Eliminar</Button>}
{usePermiso('propiedades', 'write') && <Button>Editar precio</Button>}
```

#### Hoja de ruta — Equipo

| Fase | Qué implementar |
|---|---|
| **Fase 1** | Roles fijos con tabla de permisos hardcodeada en frontend. Cubre el 90% de los casos. |
| **Fase 2** | Columna `permisos JSONB` en `user_roles` + UI de personalización por usuario. Se activa cuando alguien no encaja en ningún rol. |

### 6. 🔒 Seguridad

> Sección de uso poco frecuente — va al final por ser la más técnica.

- **Cambiar contraseña** — via Supabase Auth (envía email de reset)
- **2FA** *(futuro — requiere activar MFA en Supabase Auth)*
- **Sesiones activas** *(futuro — requiere tabla de sesiones)*

> En Fase 1 solo se implementa "Cambiar contraseña" (es un email trigger, no requiere UI compleja).

---

## Fase 2 — BrandEngine (diseño)

```ts
// src/lib/brand/BrandEngine.ts

type BrandContext = 'crm' | 'landing' | 'pdf' | 'modal' | 'email'

interface BrandEngine {
  getLogo(context: BrandContext): string
  getTheme(context: BrandContext): 'light' | 'dark'
  getColors(): { primary: string; secondary: string; accent: string }
  getAssetUrl(asset: string): string  // appends ?v=version para cache busting
}
```

| Contexto | Theme | Logo | Color header |
|---|---|---|---|
| `crm` | dark | `logo_url` | `color_secondary` |
| `landing` | light | `logo_light_url` | `#FFFFFF` |
| `pdf` | light | `logo_light_url` | `#FFFFFF` |
| `modal` | inherit | auto | inherit |
| `email` | light | `logo_light_url` | `#FFFFFF` |

**Fallback**: si `logo_light_url` no está cargado → usar `logo_url` con CSS `filter: brightness(0) invert(1)`.

**Cache busting en práctica:**
```ts
// En BrandEngine
getAssetUrl(url: string): string {
  return `${url}?v=${this.settings.version}`
}

// En PDFs — logo siempre fresco
const logoUrl = brand.getAssetUrl(brand.getLogo('pdf'))
```

---

## Fase 3 — Assets / Media (diseño)

```sql
CREATE TABLE assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  storage_type  TEXT CHECK (storage_type IN ('supabase', 'external')),
  external_url  TEXT,
  type          TEXT NOT NULL CHECK (type IN ('brand', 'property', 'project', 'document')),
  subtipo       TEXT NOT NULL CHECK (subtipo IN (
                  'logo', 'logo_light', 'favicon', 'hero',
                  'gallery', 'floor_plan', 'brochure', 'contract', 'other'
                )),
  nombre        TEXT NOT NULL,
  alt_text      TEXT,
  activo        BOOLEAN DEFAULT true,
  version       INTEGER DEFAULT 1,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE asset_usages (
  asset_id    UUID REFERENCES assets(id),
  usage_type  TEXT NOT NULL CHECK (usage_type IN ('property', 'project', 'landing', 'brand')),
  usage_id    TEXT NOT NULL,
  PRIMARY KEY (asset_id, usage_type, usage_id)
);

CREATE INDEX idx_assets_type_subtipo ON assets(type, subtipo);
CREATE INDEX idx_assets_usages_lookup ON asset_usages(usage_type, usage_id);
```

**Regla de negocio**: no se puede eliminar un asset que tenga registros en `asset_usages`.

---

## Checklist por fase

### Fase 1
- [ ] Migration SQL corrida en Supabase (6 columnas + campo `campana` en leads)
- [ ] `consultoraConfig.ts` actualizado con campos nuevos + incremento de `version`
- [ ] `ConfiguracionPage.tsx` reescrito con orden de secciones definido
- [ ] `SeccionIdentidad.tsx` — nombre, slogan, logos, favicon
- [ ] `SeccionColores.tsx` + `ColorPreview.tsx` — pickers + preview en tiempo real
- [ ] `SeccionContacto.tsx` — whatsapp, tel, email, redes
- [ ] `SeccionIntegraciones.tsx` — Google Calendar, simulador toggle
- [ ] `SeccionEquipo.tsx` — extraído del page actual, tabla de roles hardcodeada
- [ ] Mobile-first validado en todas las secciones

### Fase 2
- [ ] `BrandProvider` + `useBrand` hook implementados
- [ ] `BrandEngine` con getLogo / getTheme / getColors / getAssetUrl
- [ ] 15 componentes migrados al contexto centralizado
- [ ] Subida de archivos a Supabase Storage (no solo URLs externas)
- [ ] `usePermiso(modulo, nivel)` hook implementado
- [ ] Columna `permisos JSONB` en `user_roles`
- [ ] UI de personalización de permisos por usuario

### Fase 3
- [ ] Tabla `assets` y `asset_usages` creadas
- [ ] Galería de assets en ConfiguracionPage
- [ ] Validación: bloquear borrado de assets en uso
- [ ] Filtros por `type` y `subtipo`
- [ ] `alt_text` obligatorio para SEO

---

*Archivo de especificación · sistema-inmobiliario · No refleja estado de implementación*
