# NexoCRM — Playbook para Construir Módulos Nuevos

> **Propósito:** Antes de escribir UNA SOLA línea de código de un módulo nuevo,
> pasá por este playbook. Cada pregunta sin responder es una deuda técnica futura.
> El orden importa: base de datos primero, UI al final.

---

## FASE 0 — DISCOVERY (antes de tocar código)

### Preguntas obligatorias

**Sobre el negocio:**
1. ¿Qué problema de negocio resuelve este módulo?
2. ¿Quién lo usa? (owner, admin, agente, cliente externo)
3. ¿Con qué otros módulos se conecta?
4. ¿Hay un flujo de estados? (ej: lead → contactado → cerrado)
5. ¿Genera notificaciones o alertas?
6. ¿Tiene reportes o exportación de datos?

**Sobre los datos:**
1. ¿Qué entidades principales maneja?
2. ¿Cuál es la relación entre ellas? (1:1, 1:N, N:M)
3. ¿Qué campos son requeridos vs opcionales?
4. ¿Hay campos calculados (no se guardan, se derivan)?
5. ¿Los datos tienen historial / auditoría?
6. ¿Hay archivos/imágenes asociados?

**Sobre los permisos:**
1. ¿Qué rol puede CREAR?
2. ¿Qué rol puede EDITAR?
3. ¿Qué rol puede ELIMINAR?
4. ¿Un agente ve sus propios registros o todos los del tenant?
5. ¿Hay datos que son públicos (visible sin login)?

**Sobre la UX:**
1. ¿Es un listado + detalle, o un listado + modal?
2. ¿La edición es inline (auto-save) o por formulario (botón Guardar)?
3. ¿Necesita búsqueda/filtros?
4. ¿Necesita paginación o scroll infinito?
5. ¿Hay acciones en bulk (seleccionar varios y eliminar)?

### Entregable de esta fase
Antes de continuar, debés tener escrito:
```
Módulo: [Nombre]
Problema que resuelve: [1 párrafo]
Entidades: [lista]
Roles con acceso: [create: X, read: Y, update: Z, delete: W]
Flujo de estados: [si aplica]
Conectado con: [otros módulos]
Archivos: [sí/no, tipo]
```

---

## FASE 1 — BASE DE DATOS

> Regla de oro: **la DB define el contrato**. Si la DB está bien diseñada,
> todo lo demás es más fácil. Si está mal diseñada, todo lo demás duele.

### Paso 1.1 — Definir el schema

```sql
-- Template de tabla para NexoCRM
CREATE TABLE [nombre_modulo] (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id),  -- SIEMPRE para multi-tenant
  
  -- Campos de negocio
  nombre        TEXT NOT NULL,
  estado        TEXT NOT NULL DEFAULT 'activo' 
                CHECK (estado IN ('activo', 'inactivo')),  -- enum con CHECK
  descripcion   TEXT,
  
  -- Relaciones
  assigned_to   UUID REFERENCES auth.users(id),
  cliente_id    UUID REFERENCES clients(id),
  
  -- Auditoría (siempre incluir)
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX [nombre]_consultant_id_idx ON [nombre_modulo](consultant_id);
CREATE INDEX [nombre]_assigned_to_idx ON [nombre_modulo](assigned_to);

-- Trigger para updated_at automático
CREATE TRIGGER trg_[nombre]_updated_at
  BEFORE UPDATE ON [nombre_modulo]
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Checklist de schema:**
- [ ] ¿Tiene `id` UUID con `DEFAULT gen_random_uuid()`?
- [ ] ¿Tiene `consultant_id` para multi-tenant?
- [ ] ¿Tiene `created_at` y `updated_at`?
- [ ] ¿Los enums usan `CHECK` constraint (no TEXT libre)?
- [ ] ¿Las relaciones tienen `ON DELETE` definido (CASCADE vs RESTRICT)?
- [ ] ¿Hay índices en las columnas de búsqueda frecuente?

### Paso 1.2 — RLS (Row Level Security)

> RLS va SIEMPRE. Sin excepción. Es la única garantía de aislamiento multi-tenant.

```sql
-- 1. Habilitar RLS
ALTER TABLE [nombre_modulo] ENABLE ROW LEVEL SECURITY;

-- 2. Política SELECT
CREATE POLICY "[nombre]_select" ON [nombre_modulo]
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id());

-- 3. Política INSERT
CREATE POLICY "[nombre]_insert" ON [nombre_modulo]
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

-- 4. Política UPDATE
CREATE POLICY "[nombre]_update" ON [nombre_modulo]
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

-- 5. Política DELETE (más restrictiva — solo admin)
CREATE POLICY "[nombre]_delete" ON [nombre_modulo]
  FOR DELETE TO authenticated
  USING (
    consultant_id = current_consultant_id()
    AND is_current_user_admin()
  );

-- 6. Si necesita lectura pública (landing page)
CREATE POLICY "[nombre]_anon_select" ON [nombre_modulo]
  FOR SELECT TO anon
  USING (true);  -- o con condición: USING (publicado = true)
```

**Si la tabla NO tiene `consultant_id` propio (tabla hija):**
```sql
-- Hacer JOIN a la tabla padre que sí lo tiene
CREATE POLICY "[nombre]_select" ON [tabla_hija]
  FOR SELECT TO authenticated
  USING (
    parent_id IN (
      SELECT id FROM [tabla_padre]
      WHERE consultant_id = current_consultant_id()
    )
  );
```

### Paso 1.3 — Trigger de auto-populate

```sql
-- El frontend NO debe mandar consultant_id — el trigger lo setea
CREATE OR REPLACE FUNCTION auto_set_[nombre]_consultant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultant_id IS NULL THEN
    SELECT consultant_id INTO NEW.consultant_id
    FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_[nombre]_consultant_id
  BEFORE INSERT ON [nombre_modulo]
  FOR EACH ROW EXECUTE FUNCTION auto_set_[nombre]_consultant_id();
```

### Paso 1.4 — Crear el archivo de migration

```
supabase/migrations/YYYYMMDDHHMMSS_create_[nombre_modulo].sql
```

**Antes de mergear a main, verificar:**
```sql
-- La migration es idempotente (puede correr dos veces sin romper)
-- Usar: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS, etc.

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = '[nombre_modulo]';

-- Verificar policies creadas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = '[nombre_modulo]';
```

---

## FASE 2 — CAPA DE DATOS (lib + hooks)

> Regla: **la UI no toca Supabase directamente**. Todo pasa por `lib/` y `hooks/`.

### Paso 2.1 — Crear `src/lib/[nombreModulo].ts`

```typescript
import { supabase } from './supabase'
import type { Database } from '@/types/database'

// 1. Tipos derivados del schema (NUNCA definir tipos manualmente)
export type [Nombre]Row    = Database['public']['Tables']['[nombre_modulo]']['Row']
export type [Nombre]Insert = Database['public']['Tables']['[nombre_modulo]']['Insert']
export type [Nombre]Update = Database['public']['Tables']['[nombre_modulo]']['Update']

// 2. CRUD básico
export async function get[Nombre]s(): Promise<[Nombre]Row[]> {
  const { data, error } = await supabase
    .from('[nombre_modulo]')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as [Nombre]Row[]
}

export async function get[Nombre](id: string): Promise<[Nombre]Row> {
  const { data, error } = await supabase
    .from('[nombre_modulo]')
    .select('*')
    .eq('id', id as any)
    .single()
  if (error) throw error
  return data as unknown as [Nombre]Row
}

export async function create[Nombre](input: [Nombre]Insert): Promise<[Nombre]Row> {
  const { data, error } = await supabase
    .from('[nombre_modulo]')
    .insert(input as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as [Nombre]Row
}

export async function update[Nombre](id: string, input: [Nombre]Update): Promise<[Nombre]Row> {
  const { data, error } = await supabase
    .from('[nombre_modulo]')
    .update(input as any)
    .eq('id', id as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as [Nombre]Row
}

export async function delete[Nombre](id: string): Promise<void> {
  const { error } = await supabase
    .from('[nombre_modulo]')
    .delete()
    .eq('id', id as any)
  if (error) throw error
}
```

### Paso 2.2 — Crear `src/hooks/use[Nombre].ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  get[Nombre]s, get[Nombre], create[Nombre], update[Nombre], delete[Nombre]
} from '@/lib/[nombreModulo]'
import type { [Nombre]Insert, [Nombre]Update } from '@/lib/[nombreModulo]'

// Query key centralizado (evita typos)
const QUERY_KEY = '[nombre_modulo]' as const

export function use[Nombre]s() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: get[Nombre]s,
  })
}

export function use[Nombre](id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => get[Nombre](id),
    enabled: !!id,
  })
}

export function useCreate[Nombre]() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: [Nombre]Insert) => create[Nombre](input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdate[Nombre]() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: [Nombre]Update }) =>
      update[Nombre](id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, id] })
    },
  })
}

export function useDelete[Nombre]() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => delete[Nombre](id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
```

---

## FASE 3 — SCHEMA DE VALIDACIÓN

> Regla: **un solo schema Zod, usado en create Y edit**. Nunca dos schemas distintos.

```typescript
// src/components/[nombre]/[Nombre]Form.tsx

import { z } from 'zod'

export const [nombre]Schema = z.object({
  // Campos de texto
  nombre:      z.string().min(1, 'Requerido').max(200),
  descripcion: z.string().optional(),
  
  // Campos numéricos: SIEMPRE z.coerce.number()
  // (Supabase devuelve numeric como string)
  precio:      z.coerce.number().positive('Debe ser mayor a 0').optional(),
  cantidad:    z.coerce.number().int().min(0).optional(),
  
  // Enums
  estado:      z.enum(['activo', 'inactivo']).default('activo'),
  
  // Booleanos
  publicado:   z.boolean().default(false),
  
  // Fechas
  fecha:       z.string().optional(),  // ISO string del input date
})

export type [Nombre]FormValues = z.infer<typeof [nombre]Schema>
```

**Checklist de schema:**
- [ ] ¿Campos numéricos usan `z.coerce.number()` (no `z.number()`)?
- [ ] ¿Los strings tienen `.max()` para evitar datos gigantes?
- [ ] ¿Los enums están tipados con `z.enum()` (no `z.string()`)?
- [ ] ¿Los campos opcionales tienen `.optional()` explícito?
- [ ] ¿Los defaults están en el schema (no solo en el form)?

---

## FASE 4 — COMPONENTES UI

### Paso 4.1 — Estructura de carpetas

```
src/
  components/
    [nombre]/
      [Nombre]List.tsx      ← listado/tabla
      [Nombre]Card.tsx      ← card individual (si aplica)
      [Nombre]Form.tsx      ← formulario compartido create/edit
      [Nombre]Detail.tsx    ← vista de detalle (si aplica)
  pages/
    [Nombre]sPage.tsx       ← página de listado
    [Nombre]NuevoPage.tsx   ← página de creación
    [Nombre]EditarPage.tsx  ← página de edición
```

### Paso 4.2 — Formulario unificado (create + edit)

```typescript
// [Nombre]Form.tsx — UN SOLO COMPONENTE para crear y editar

interface [Nombre]FormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<[Nombre]Row>  // solo en edit
  onSubmit: (values: [Nombre]FormValues) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

export function [Nombre]Form({ mode, defaultValues, onSubmit, onCancel, isSaving }: [Nombre]FormProps) {
  const form = useForm<[Nombre]FormValues>({
    resolver: zodResolver([nombre]Schema),
    defaultValues: {
      nombre:      defaultValues?.nombre      ?? '',
      descripcion: defaultValues?.descripcion ?? '',
      estado:      defaultValues?.estado      ?? 'activo',
      // ... todos los campos con su default
    },
  })

  const handleSubmit = form.handleSubmit(
    async (values) => {
      await onSubmit(values)
    },
    (errors) => {
      // Scroll al primer error si está fuera de viewport
      const firstKey = Object.keys(errors)[0]
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({
        behavior: 'smooth', block: 'center'
      })
    }
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Campos aquí */}
      
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

**Checklist del formulario:**
- [ ] ¿El mismo componente se usa para create y edit (prop `mode`)?
- [ ] ¿El modo edit carga los `defaultValues` de la DB?
- [ ] ¿El botón de submit es `type="submit"` dentro del `<form>`?
- [ ] ¿Los botones dentro del form que NO son submit tienen `type="button"`?
- [ ] ¿El form NO está anidado dentro de otro `<form>`?
- [ ] ¿Los errores de validación son visibles en pantalla (no solo en consola)?
- [ ] ¿El botón está deshabilitado mientras guarda?

### Paso 4.3 — Páginas

```typescript
// [Nombre]NuevoPage.tsx
export function [Nombre]NuevoPage() {
  const navigate = useNavigate()
  const create = useCreate[Nombre]()

  async function handleSubmit(values: [Nombre]FormValues) {
    await create.mutateAsync(values)  // lanza si hay error
    toast.success('[Nombre] creado')
    navigate('/[nombre]s')
  }

  return (
    <[Nombre]Form
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => navigate('/[nombre]s')}
      isSaving={create.isPending}
    />
  )
}

// [Nombre]EditarPage.tsx
export function [Nombre]EditarPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading } = use[Nombre](id!)
  const update = useUpdate[Nombre]()

  async function handleSubmit(values: [Nombre]FormValues) {
    await update.mutateAsync({ id: id!, input: values })
    toast.success('Cambios guardados')
  }

  if (isLoading) return <Skeleton />

  return (
    <[Nombre]Form
      mode="edit"
      defaultValues={item}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/[nombre]s/${id}`)}
      isSaving={update.isPending}
    />
  )
}
```

---

## FASE 5 — RUTAS

```typescript
// src/router.tsx o donde tengas el router

// Agregar:
{ path: '/[nombre]s',           element: <[Nombre]sPage /> },
{ path: '/[nombre]s/nuevo',     element: <[Nombre]NuevoPage /> },
{ path: '/[nombre]s/:id',       element: <[Nombre]DetailPage /> },
{ path: '/[nombre]s/:id/editar', element: <[Nombre]EditarPage /> },
```

---

## FASE 6 — CHECKLIST FINAL PRE-MERGE

Antes de mergear el módulo nuevo a `main`:

**Base de datos:**
- [ ] Migration creada y probada en DB de desarrollo
- [ ] RLS habilitado con las 4 policies (SELECT/INSERT/UPDATE/DELETE)
- [ ] Trigger de auto-populate `consultant_id` creado
- [ ] Types de TypeScript regenerados (`npx supabase gen types`)

**Código:**
- [ ] `lib/[nombre].ts` — CRUD completo
- [ ] `hooks/use[Nombre].ts` — queries y mutations
- [ ] Schema Zod con `z.coerce` para números
- [ ] Formulario único para create y edit
- [ ] Try/catch en todos los submit handlers
- [ ] Toast de éxito y error en todas las operaciones

**Seguridad:**
- [ ] Test de aislamiento multi-tenant (Tenant A no ve datos de Tenant B)
- [ ] Test de roles (agente no puede hacer lo que solo puede admin)
- [ ] No hay `consultant_id` hardcodeado en el código

**UX:**
- [ ] Formulario de edición carga TODOS los valores de la DB
- [ ] Mismos campos en create y edit
- [ ] Mensajes de validación visibles
- [ ] Loading state mientras guarda
- [ ] Redirect después de crear/guardar

**Build:**
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit` sin errores

---

## ROADMAP TEMPLATE

Cuando vayas a planificar un módulo, usá este formato:

```markdown
## Módulo: [Nombre]
**Estimación:** [X días]
**Prioridad:** Alta / Media / Baja
**Dependencias:** [módulos que deben existir primero]

### Fase 0 — Discovery (Día 1, 2h)
- [ ] Responder todas las preguntas del playbook
- [ ] Validar con el cliente/stakeholder

### Fase 1 — DB (Día 1, 2h)
- [ ] Schema SQL definido
- [ ] RLS policies escritas
- [ ] Migration file creado y testeado

### Fase 2 — Datos (Día 2, 3h)
- [ ] lib/[nombre].ts completo
- [ ] hooks/use[Nombre].ts completo
- [ ] Types regenerados

### Fase 3 — UI (Día 3-4, 4h)
- [ ] [Nombre]Form.tsx
- [ ] [Nombre]List.tsx
- [ ] Páginas Nuevo + Editar

### Fase 4 — Testing (Día 4, 2h)
- [ ] Checklist de auditoría del módulo
- [ ] Test de aislamiento multi-tenant

### Fase 5 — Deploy (Día 5, 1h)
- [ ] Migration aplicada en producción
- [ ] Smoke test en producción
```

---

## REGLAS QUE NUNCA SE ROMPEN

1. **DB primero, UI al final.** Si el schema cambia después de hacer la UI, todo se rompe.
2. **RLS siempre.** Sin excepción. No importa si "es solo interno".
3. **Un solo formulario para create y edit.** Si tenés dos, van a divergir.
4. **`z.coerce.number()` para todos los numéricos.** Supabase devuelve strings.
5. **Try/catch en todos los mutateAsync.** Los errores silenciosos no existen.
6. **No hay `consultant_id` hardcodeado.** El trigger lo setea siempre.
7. **Los tipos vienen de la DB.** Nunca definir interfaces manuales para filas de DB.

---

*Versión: 1.0 — Este documento evoluciona con el producto*
