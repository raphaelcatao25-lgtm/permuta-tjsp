-- Restrict legacy match RPCs that should not be exposed to public clients.
REVOKE ALL ON FUNCTION public.aceitar_match(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aceitar_match(uuid) TO service_role;

-- The cycle discovery RPC is authenticated-only; internal definer-owned jobs
-- continue to work as the function owner.
REVOKE ALL ON FUNCTION public.buscar_ciclos(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_ciclos(uuid, integer) TO authenticated, service_role;
