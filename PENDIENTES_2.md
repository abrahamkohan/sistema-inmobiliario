# Pendientes 2 — Clonación por instancia

## Objetivo
Dejar el CRM preparado para poder replicarlo de forma prolija para colegas o clientes, evitando dependencias manuales, hardcodeos y configuraciones dispersas.

## 1. Variables de entorno por instancia
- [ ] Definir listado completo de variables requeridas por instancia
- [ ] Separar variables públicas (`VITE_*`) de variables sensibles
- [ ] Revisar qué valores hoy están hardcodeados y deberían salir de `.env`
- [ ] Preparar un `.env.example` realmente completo y actualizado
- [ ] Documentar qué cambia entre instancia propia, demo y cliente

## 2. Branding configurable
- [ ] Centralizar nombre comercial, logo, ícono PWA, WhatsApp, email y dominio
- [ ] Revisar textos hardcodeados en landings, PDFs, catálogos y mensajes
- [ ] Detectar colores o estilos que convenga volver configurables por instancia
- [ ] Separar qué branding vive en base de datos y qué branding vive en variables de entorno

## 3. Base inicial / seed
- [ ] Definir datos mínimos para levantar una nueva instancia
- [ ] Preparar seed inicial para consultora_config
- [ ] Preparar seed opcional para agentes, roles y datos demo
- [ ] Separar seed técnico de seed comercial/demo
- [ ] Documentar el orden correcto: migraciones → seed → configuración inicial

## 4. Checklist de provisión de nueva instancia
- [ ] Crear nuevo proyecto Supabase
- [ ] Configurar autenticación y usuarios iniciales
- [ ] Configurar storage buckets necesarios
- [ ] Configurar variables de entorno del frontend
- [ ] Configurar dominio / subdominio
- [ ] Configurar deploy
- [ ] Cargar branding inicial
- [ ] Verificar funcionamiento básico: login, tareas, propiedades, proyectos, presupuestos

## 5. Guía o script de clonación
- [ ] Definir si la clonación será manual guiada o semiautomática
- [ ] Evaluar script base para bootstrap de instancia nueva
- [ ] Documentar pasos para crear repo nuevo o plantilla base
- [ ] Documentar conexión a Supabase nuevo
- [ ] Documentar checklist post-clonación

## 6. Hardcodeos a eliminar o revisar
- [ ] URLs base fijas
- [ ] nombres de marca embebidos en componentes o helpers
- [ ] mensajes de WhatsApp con branding fijo
- [ ] defaults de email, teléfono o links públicos
- [ ] textos visibles en páginas públicas que asuman una sola consultora

## 7. Integraciones futuras por instancia
- [ ] Definir cuáles integraciones son globales de la consultora y cuáles personales por usuario
- [ ] Separar integraciones de empresa vs integraciones del agente
- [ ] Pensar ubicación correcta para Google Calendar: configuración global o preferencias personales
- [ ] Revisar futura compatibilidad con WhatsApp, Meta Ads, Gmail y Google Calendar

## 8. Documentación operativa
- [ ] Crear guía de “alta de nueva instancia” paso a paso
- [ ] Crear guía de “qué revisar antes de entregar a un cliente”
- [ ] Crear guía de backup y recuperación
- [ ] Crear guía de actualización entre instancias

## Orden recomendado
1. Inventario de hardcodeos y variables de entorno
2. Branding configurable
3. Seed/base inicial
4. Checklist de provisión
5. Guía/script de clonación
6. Documentación operativa final

## Nota
No avanzar a multi-tenant todavía. Primero consolidar un modelo single-tenant replicable, claro y mantenible.
