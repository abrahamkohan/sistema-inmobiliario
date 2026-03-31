# PR — Catálogo y publicación pública dentro del CRM

## Título sugerido

`feat: agregar catálogo público de propiedades y proyectos dentro del CRM`

---

## Resumen

Esta PR cierra la fase de **catálogo/publicación** dentro de `sistema-inmobiliario`.

El objetivo de esta etapa fue permitir que el CRM publique propiedades y proyectos como landings públicas compartibles, manteniendo el branding base de la consultora y herramientas operativas para publicar, despublicar y compartir links.

---

## Qué se implementó

### Catálogo público
- landing pública de propiedades dentro del CRM
- landing pública de proyectos dentro del CRM
- rutas públicas sin autenticación para compartir inventario

### Publicación y compartición
- botón **Ver landing** en propiedades
- botón **Copiar link** en propiedades
- botón **Ver landing** en proyectos
- botón **Copiar link** en proyectos

### Control de publicación
- toggle de `publicado_en_web` en detalle de propiedades
- toggle de `publicado_en_web` en detalle de proyectos
- toggle de publicación web directamente en la lista de proyectos (desktop y mobile)

### Branding base
- branding dinámico desde `consultora_config`
- soporte para nombre/logo de consultora en páginas públicas
- base preparada para evolucionar hacia dominio personalizado / white-label

---

## Qué NO entra en esta PR

- módulo de leads
- captación desde pauta o Meta Ads
- módulo de marketing
- embudos de conversión
- landing general institucional
- white-label avanzado

---

## Decisión de producto

Esta fase queda definida como **catálogo/publicación**, no como módulo de captación.

Las landings actuales sirven para:
- ordenar inventario
- compartir propiedades y proyectos con colegas o clientes
- mostrar catálogo con branding propio
- sentar la base para publicación pública y futura marca blanca

La captación por pauta y campañas pagas se resolverá más adelante en un módulo separado de **Marketing**.

---

## Próximos pasos sugeridos

1. catálogo público por sección:
   - `/propiedades`
   - `/proyectos`
2. PDF limpio sin datos personales para compartir con colegas
3. mejora visual del branding/membrete en landings
4. dominios personalizados
5. white-label futuro
6. módulo Marketing separado para campañas y Meta Ads

---

## Notas

- En desarrollo local se corrigió la construcción de URLs públicas para no depender del dominio de producción.
- Se mantuvo el enfoque dentro de `sistema-inmobiliario`, sin depender de `kohancampos-web`.
- La fase fue validada funcionalmente como catálogo compartible.
