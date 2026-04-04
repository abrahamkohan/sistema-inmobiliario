-- ============================================================
-- SCRIPT DE BACKUP MANUAL
-- Ejecutar ANTES de la migración multi-tenant
-- Plan Free - Exportar datos como backup
-- ============================================================

-- IMPORTANTE: Eliminar backups viejos primero (si existen)
DROP TABLE IF EXISTS backup_clients;
DROP TABLE IF EXISTS backup_properties;
DROP TABLE IF EXISTS backup_tasks;
DROP TABLE IF EXISTS backup_projects;
DROP TABLE IF EXISTS backup_notes;
DROP TABLE IF EXISTS backup_presupuestos;
DROP TABLE IF EXISTS backup_simulations;
DROP TABLE IF EXISTS backup_agentes;
DROP TABLE IF EXISTS backup_profiles;
DROP TABLE IF EXISTS backup_user_roles;
DROP TABLE IF EXISTS backup_commissions;
DROP TABLE IF EXISTS backup_commission_splits;
DROP TABLE IF EXISTS backup_commission_clients;
DROP TABLE IF EXISTS backup_commission_incomes;
DROP TABLE IF EXISTS backup_commercial_allies;
DROP TABLE IF EXISTS backup_assets;
DROP TABLE IF EXISTS backup_push_subscriptions;
DROP TABLE IF EXISTS backup_consultora_config;

-- ============================================================
-- CREAR BACKUPS CON TIMESTAMP
-- ============================================================

CREATE TABLE backup_clients AS 
SELECT *, NOW() as backup_created_at FROM clients;

CREATE TABLE backup_properties AS 
SELECT *, NOW() as backup_created_at FROM properties;

CREATE TABLE backup_tasks AS 
SELECT *, NOW() as backup_created_at FROM tasks;

CREATE TABLE backup_projects AS 
SELECT *, NOW() as backup_created_at FROM projects;

CREATE TABLE backup_notes AS 
SELECT *, NOW() as backup_created_at FROM notes;

CREATE TABLE backup_presupuestos AS 
SELECT *, NOW() as backup_created_at FROM presupuestos;

CREATE TABLE backup_simulations AS 
SELECT *, NOW() as backup_created_at FROM simulations;

CREATE TABLE backup_agentes AS 
SELECT *, NOW() as backup_created_at FROM agentes;

CREATE TABLE backup_profiles AS 
SELECT *, NOW() as backup_created_at FROM profiles;

CREATE TABLE backup_user_roles AS 
SELECT *, NOW() as backup_created_at FROM user_roles;

CREATE TABLE backup_commissions AS 
SELECT *, NOW() as backup_created_at FROM commissions;

CREATE TABLE backup_commission_splits AS 
SELECT *, NOW() as backup_created_at FROM commission_splits;

CREATE TABLE backup_commission_clients AS 
SELECT *, NOW() as backup_created_at FROM commission_clients;

CREATE TABLE backup_commission_incomes AS 
SELECT *, NOW() as backup_created_at FROM commission_incomes;

CREATE TABLE backup_commercial_allies AS 
SELECT *, NOW() as backup_created_at FROM commercial_allies;

CREATE TABLE backup_assets AS 
SELECT *, NOW() as backup_created_at FROM assets;

CREATE TABLE backup_push_subscriptions AS 
SELECT *, NOW() as backup_created_at FROM push_subscriptions;

CREATE TABLE backup_consultora_config AS 
SELECT *, NOW() as backup_created_at FROM consultora_config;

-- ============================================================
-- VERIFICAR QUE SE EXPORTÓ BIEN
-- ============================================================

SELECT 
  'backup_clients' as table_name,
  (SELECT COUNT(*) FROM backup_clients) as rows,
  (SELECT MAX(backup_created_at) FROM backup_clients) as backup_time
UNION ALL
SELECT 'backup_properties', (SELECT COUNT(*) FROM backup_properties), (SELECT MAX(backup_created_at) FROM backup_properties)
UNION ALL
SELECT 'backup_tasks', (SELECT COUNT(*) FROM backup_tasks), (SELECT MAX(backup_created_at) FROM backup_tasks)
UNION ALL
SELECT 'backup_projects', (SELECT COUNT(*) FROM backup_projects), (SELECT MAX(backup_created_at) FROM backup_projects)
UNION ALL
SELECT 'backup_notes', (SELECT COUNT(*) FROM backup_notes), (SELECT MAX(backup_created_at) FROM backup_notes)
UNION ALL
SELECT 'backup_presupuestos', (SELECT COUNT(*) FROM backup_presupuestos), (SELECT MAX(backup_created_at) FROM backup_presupuestos)
UNION ALL
SELECT 'backup_simulations', (SELECT COUNT(*) FROM backup_simulations), (SELECT MAX(backup_created_at) FROM backup_simulations)
UNION ALL
SELECT 'backup_agentes', (SELECT COUNT(*) FROM backup_agentes), (SELECT MAX(backup_created_at) FROM backup_agentes)
UNION ALL
SELECT 'backup_profiles', (SELECT COUNT(*) FROM backup_profiles), (SELECT MAX(backup_created_at) FROM backup_profiles)
UNION ALL
SELECT 'backup_user_roles', (SELECT COUNT(*) FROM backup_user_roles), (SELECT MAX(backup_created_at) FROM backup_user_roles)
UNION ALL
SELECT 'backup_commissions', (SELECT COUNT(*) FROM backup_commissions), (SELECT MAX(backup_created_at) FROM backup_commissions)
UNION ALL
SELECT 'backup_commission_splits', (SELECT COUNT(*) FROM backup_commission_splits), (SELECT MAX(backup_created_at) FROM backup_commission_splits)
UNION ALL
SELECT 'backup_commission_clients', (SELECT COUNT(*) FROM backup_commission_clients), (SELECT MAX(backup_created_at) FROM backup_commission_clients)
UNION ALL
SELECT 'backup_commission_incomes', (SELECT COUNT(*) FROM backup_commission_incomes), (SELECT MAX(backup_created_at) FROM backup_commission_incomes)
UNION ALL
SELECT 'backup_commercial_allies', (SELECT COUNT(*) FROM backup_commercial_allies), (SELECT MAX(backup_created_at) FROM backup_commercial_allies)
UNION ALL
SELECT 'backup_assets', (SELECT COUNT(*) FROM backup_assets), (SELECT MAX(backup_created_at) FROM backup_assets)
UNION ALL
SELECT 'backup_push_subscriptions', (SELECT COUNT(*) FROM backup_push_subscriptions), (SELECT MAX(backup_created_at) FROM backup_push_subscriptions)
UNION ALL
SELECT 'backup_consultora_config', (SELECT COUNT(*) FROM backup_consultora_config), (SELECT MAX(backup_created_at) FROM backup_consultora_config);

-- ============================================================
-- PARA RESTAURAR (si algo falla):
-- DELETE FROM tabla;
-- INSERT INTO tabla SELECT * FROM backup_tabla;
-- ============================================================
