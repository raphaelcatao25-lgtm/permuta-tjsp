
REVOKE EXECUTE ON FUNCTION public.buscar_arestas_matching_v2()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.calcular_score_localizacao_v2(uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;

