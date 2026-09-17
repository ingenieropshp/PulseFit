-- ============================================================================
-- PulseFit — Ajustes de seguridad (lints del advisor de Supabase)
-- Migración: 0003_security_fixes
-- ============================================================================

-- 1. set_updated_at: solo necesita tocar NEW, no requiere privilegios
-- elevados. Se fija search_path para evitar hijacking por esquemas falsos.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Ninguna de las dos funciones de trigger debe poder invocarse como RPC
-- pública (/rest/v1/rpc/...). El grant que hereda anon/authenticated viene
-- del rol PUBLIC, así que hay que revocarlo ahí (no alcanza con revocar
-- solo de anon/authenticated).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
