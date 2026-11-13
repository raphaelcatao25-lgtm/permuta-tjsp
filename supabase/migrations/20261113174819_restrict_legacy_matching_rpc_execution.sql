DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.proname ~ '^buscar_arestas_.*_v[0-9]+$'
        OR p.proname ~ '^buscar_ciclos_v[0-9]+$'
        OR p.proname ~ '^buscar_ciclos_3_permuta_v[0-9]+(_final|_[0-9]+)?$'
        OR p.proname ~ '^buscar_ciclos_3_permuta_oficial_(backup|v[0-9]+)$'
        OR p.proname ~ '^gerar_matches_v[0-9]+$'
        OR p.proname = 'gerar_matches_ciclo_3_v2'
        OR p.proname ~ '^selecionar_melhores_ciclos_v[0-9]+$'
        OR p.proname ~ '^selecionar_ciclos_finais_v[0-9]+$'
        OR p.proname ~ '^calcular_score_localizacao_v[0-9]+$'
        OR p.proname = 'gerar_matches_ciclo_3_lote'
      )
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      r.signature
    );
  END LOOP;
END
$$;
