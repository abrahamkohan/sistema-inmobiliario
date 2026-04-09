# Módulo Marketing — Roadmap & Especificación

> **CRM SaaS Inmobiliario** · Kohan & Campos Real Estate  
> Última actualización: Abril 2026

---

## La idea central — tu diferencial

Otros CRMs inmobiliarios en Paraguay tienen: contactos, propiedades, reportes básicos.

**Lo que este módulo ofrece:** un motor de contenido con IA integrado al negocio. El broker abre el CRM y en 3 clics tiene el resumen del mercado, la descripción de la propiedad lista para publicar, el script del Reel y el mensaje de WhatsApp. Sin salir del sistema.

---

## Stack técnico

| Servicio | Uso | Costo |
|----------|-----|-------|
| **Tavily API** | Búsqueda de noticias reales con links | Gratis · 1,000 búsquedas/mes |
| **Groq API** | Llama 3 70B · generación de texto | Gratis · 30 req/min |
| **Supabase** | Caché de digests · tabla `market_digests` | Gratis · compatible con RLS |
| **Supabase Edge Functions** | API que orquesta Tavily + Groq | Gratis · sin timeout real |
| **Vercel** | Deploy del frontend React | Gratis |

**Costo operativo total: $0/mes** al volumen actual (~2 llamadas por día).

---

## Roadmap por fases

### Fase 1 — Inteligencia de Mercado *(1 semana · 3 archivos)*

| Feature | Descripción |
|---------|-------------|
| News Digest diario | Tavily busca noticias → Groq resume → se guarda en Supabase |
| Caché de 12 horas | Si ya existe digest reciente, no llama APIs externas |
| Histórico navegable | Digests anteriores accesibles por fecha |
| Toggle "Publicar" | Campo `is_public` → el digest aparece en el blog de la web |
| Multi-tenant | `consultant_id` en `market_digests` · cada cliente ve solo los suyos |

**Archivos a crear:**
```
supabase/migrations/market_digests.sql
supabase/functions/market-digest/index.ts
src/pages/marketing/InteligenciaMercadoPage.tsx
```

---

### Fase 2 — Generador de Contenido IA *(2 semanas)*

| Feature | Input | Output |
|---------|-------|--------|
| Descripción de propiedad | Datos de la unidad (m², piso, amenities) | Texto listo para publicar en portales |
| Script de Reel | Proyecto + duración + objetivo | Guión 15/30/60 seg con hook, desarrollo y CTA |
| Mensaje WhatsApp | Cliente + propiedad + etapa | Template personalizado de seguimiento |
| Post Instagram | Propiedad o proyecto | Caption + hashtags en español/inglés/portugués |
| Email de campaña | Lista de contactos + proyecto | Email HTML personalizado |

**Archivos a crear:**
```
src/pages/marketing/GeneradorContenidoPage.tsx
supabase/functions/content-generator/index.ts
src/components/marketing/ContentResult.tsx
```

---

### Fase 3 — Blog & SEO Automático *(1 semana)*

| Feature | Descripción |
|---------|-------------|
| Blog público | Digests con `is_public = true` aparecen en `kohancampos.com.py/mercado` |
| URL por fecha | `/mercado/2026-04-09` · indexable por Google |
| SEO metadata | Title, description, OG image generados automáticamente |
| Sitemap dinámico | Se actualiza al publicar cada digest |
| CTA al final de cada post | "¿Querés invertir en Paraguay? → Consultá gratis" |
| Captura de email | Formulario de suscripción al newsletter semanal |

**Archivos a crear (en kohancampos.com.py):**
```
pages/mercado/index.tsx        ← lista de posts
pages/mercado/[fecha].tsx      ← post individual
pages/api/sitemap.ts           ← sitemap dinámico
```

---

### Fase 4 — Campañas *(3 semanas)*

| Feature | Descripción |
|---------|-------------|
| Lista de difusión WhatsApp | Selección de contactos + template IA + envío vía Evolution API |
| Newsletter semanal | Email generado desde los 5 mejores digests de la semana · enviado por Resend |
| Seguimiento de campaña | Aperturas, respuestas, conversiones por campaña |
| Programación | Elegir día y hora de envío |

---

## UI — CRM: Módulo Marketing

### Vista principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  KOHAN & CAMPOS CRM          sistema.kohancampos.com.py/marketing   │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                       │
│  General     │  Marketing                                            │
│  Inicio      │                                                       │
│  Clientes    │  ┌─────────────────────────────────────────────────┐  │
│  Tareas      │  │  🧠 Inteligencia de Mercado                     │  │
│              │  │  📝 Generador de Contenido                      │  │
│  Inventario  │  │  📢 Campañas                                    │  │
│  Propiedades │  │  🌐 Blog Público                                │  │
│  Proyectos   │  └─────────────────────────────────────────────────┘  │
│  Ventas      │                                                       │
│              │                                                       │
│  Análisis    │                                                       │
│  Simulador   │                                                       │
│              │                                                       │
│  Sistema     │                                                       │
│▶ Marketing   │                                                       │
│  Recursos    │                                                       │
│  Config      │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

### Sub-módulo: Inteligencia de Mercado

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Marketing   /   Inteligencia de Mercado                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Mercado Inmobiliario                         [↻ Actualizar]        │
│  Miércoles 9 de abril, 2026 · Actualizado 09:14                     │
│                                              [🌐 Publicar en blog]  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RESUMEN EJECUTIVO                                                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ El mercado de Asunción muestra incremento sostenido en        │  │
│  │ consultas de unidades off-plan en la zona CIT de Luque.       │  │
│  │ Inversores de Argentina y Brasil siguen posicionando          │  │
│  │ Paraguay como destino por estabilidad cambiaria y             │  │
│  │ rentabilidades del 8–12% anual en dólares.                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  TITULARES DEL DÍA                                                  │
│  01  Inversiones en CIT Luque superan USD 40M en Q1  ↗             │
│  02  Demanda de alquileres sube 8% en zona norte      ↗             │
│  03  Paraguay lidera rentabilidad del Cono Sur        ↗             │
│                                                                     │
│  SEÑAL PARA EL INVERSOR                                             │
│  ✦ Momento para posicionar off-plan en Luque antes de Q2           │
│  ✦ Seguridad jurídica estable · ideal para inversores extranjeros  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  HISTÓRICO    [Abr 8]  [Abr 7]  [Abr 6]  [Abr 5]  [Abr 4]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Sub-módulo: Generador de Contenido IA

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Marketing   /   Generador de Contenido                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ¿Qué querés crear?                                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  📋          │  │  🎬          │  │  💬          │              │
│  │  Descripción │  │  Script      │  │  WhatsApp    │              │
│  │  propiedad   │  │  de Reel     │  │  seguimiento │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │  📱          │  │  📧          │                                 │
│  │  Post        │  │  Email       │                                 │
│  │  Instagram   │  │  campaña     │                                 │
│  └──────────────┘  └──────────────┘                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [SELECCIONADO: Script de Reel]                                     │
│                                                                     │
│  Proyecto    [Urban Domus — Luque CIT          ▼]                   │
│  Duración    ( ) 15 seg   (•) 30 seg   ( ) 60 seg                  │
│  Objetivo    ( ) Venta    (•) Inversión ( ) Alquiler                │
│  Idioma      (•) Español  ( ) Inglés   ( ) Portugués                │
│                                                                     │
│                              [✨ Generar con IA]                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RESULTADO                                       [📋 Copiar]        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🎬 HOOK (0–3s)                                                │  │
│  │ "¿Sabías que podés invertir en Paraguay desde USD 30.000      │  │
│  │  y ganar 10% anual en dólares?"                               │  │
│  │                                                               │  │
│  │ 📍 DESARROLLO (3–20s)                                         │  │
│  │ Urban Domus en Luque CIT. Unidades desde 45m². Entrega 2027. │  │
│  │ Financiación directa con desarrolladora. Sin banco.           │  │
│  │                                                               │  │
│  │ 💥 CTA (20–30s)                                               │  │
│  │ "Link en bio para recibir la info completa. Sin compromiso."  │  │
│  │                                                               │  │
│  │ #Paraguay #InversionInmobiliaria #Luque #RealEstate           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## UI — kohancampos.com.py: Blog Público

### Lista de posts (`/mercado`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  kohancampos.com.py/mercado                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  KOHAN & CAMPOS REAL ESTATE          Inicio  Proyectos  Contacto   │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Inteligencia de Mercado Inmobiliario                               │
│  Análisis diario del mercado paraguayo para inversores              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📅 Miércoles 9 de abril, 2026                   NUEVO ●    │    │
│  │                                                             │    │
│  │  Paraguay mantiene rentabilidad 8–12% anual en USD          │    │
│  │  mientras inversores regionales consolidan posiciones        │    │
│  │                                                             │    │
│  │  El mercado de Asunción muestra incremento sostenido en     │    │
│  │  consultas de unidades off-plan en la zona CIT de Luque...  │    │
│  │                                                  ↗ Leer     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐               │
│  │  📅 8 de abril        │  │  📅 7 de abril        │               │
│  │                       │  │                       │               │
│  │  Demanda de alquiler  │  │  CIT Luque supera     │               │
│  │  sube 8% en zona      │  │  USD 40M en Q1        │               │
│  │  norte de Asunción    │  │                       │               │
│  │             ↗ Leer    │  │             ↗ Leer    │               │
│  └───────────────────────┘  └───────────────────────┘               │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  📧 Recibí el análisis semanal en tu email                          │
│  ┌───────────────────────────────┐  ┌─────────────────┐             │
│  │  tu@email.com                 │  │  Suscribirme →  │             │
│  └───────────────────────────────┘  └─────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Post individual (`/mercado/2026-04-09`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  kohancampos.com.py/mercado/2026-04-09                              │
│  title: "Mercado Inmobiliario Paraguay — 9 abril 2026"              │
│  description: "Análisis ejecutivo: rentabilidad 8-12% USD,          │
│               CIT Luque, inversores regionales"                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ← Volver al blog                                                   │
│                                                                     │
│  Mercado Inmobiliario Paraguay                                      │
│  9 de abril de 2026                                                 │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RESUMEN EJECUTIVO                                                  │
│  El mercado de Asunción muestra incremento sostenido en             │
│  consultas de unidades off-plan en la zona CIT de Luque...         │
│                                                                     │
│  TITULARES DEL DÍA                                                  │
│  01  Inversiones en CIT Luque superan USD 40M en Q1  ↗ abc.com.py  │
│  02  Demanda de alquileres sube 8% en zona norte     ↗ lanacion.py  │
│  03  Paraguay lidera rentabilidad del Cono Sur       ↗ infobae.com  │
│                                                                     │
│  SEÑAL PARA EL INVERSOR                                             │
│  ✦ Momento para posicionar off-plan en Luque antes de Q2           │
│  ✦ Seguridad jurídica estable · ideal para inversores extranjeros  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ¿Querés invertir en Paraguay?                                      │
│  Agendá una consulta gratuita con nuestros asesores.               │
│                                                                     │
│                     [ Quiero saber más → ]                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Diferencial SaaS — Planes

```
┌─────────────────────────────────────────────────────────────────────┐
│  PLAN FREE         PLAN PRO              PLAN AGENCY                │
│  ──────────        ─────────             ────────────               │
│  CRM básico        + Inteligencia        + Todo PRO                 │
│  Contactos           de Mercado          + Blog público propio      │
│  Propiedades       + Generador IA        + Newsletter automático    │
│  Ventas              (descripciones,     + Campañas WhatsApp        │
│                       WhatsApp,          + SEO por zona/proyecto    │
│                       Reels,             + Dominio propio           │
│                       Instagram)         + Histórico ilimitado      │
│                    + Histórico 30 días                              │
│                                                                     │
│  $0/mes            $XX/mes               $XX/mes                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Orden de implementación sugerido

| # | Feature | Tiempo estimado | Impacto |
|---|---------|-----------------|---------|
| 1 | Inteligencia de Mercado (CRM) | 1 semana | Alto |
| 2 | Toggle "Publicar en blog" | 1 día | SEO inmediato |
| 3 | Blog público kohancampos.com.py | 1 semana | SEO alto |
| 4 | Generador de Scripts de Reel | 1 semana | Diferencial clave |
| 5 | Generador de WhatsApp | 3 días | Productividad |
| 6 | Generador de descripciones | 3 días | Conectado a Propiedades |
| 7 | Newsletter semanal (Resend) | 3 días | Lead gen |
| 8 | Campañas WhatsApp masivas | 3 semanas | Fase 4 |

---

## Variables de entorno necesarias

```env
TAVILY_API_KEY=   # tavily.com · plan free
GROQ_API_KEY=     # console.groq.com · plan free
```

---

## Schema Supabase

```sql
create table market_digests (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  summary        text,
  sources        jsonb,   -- [{title, url, snippet}]
  queries        text[],
  model          text,
  consultant_id  uuid references consultants(id),
  is_public      boolean default false
);

-- RLS: cada consultant ve solo sus digests
alter table market_digests enable row level security;

create policy "tenant isolation"
  on market_digests for all
  using (consultant_id = get_consultant_id());

-- Lectura pública para el blog
create policy "public blog read"
  on market_digests for select
  using (is_public = true);
```

---

*Kohan & Campos Real Estate · CRM SaaS · Abril 2026*
