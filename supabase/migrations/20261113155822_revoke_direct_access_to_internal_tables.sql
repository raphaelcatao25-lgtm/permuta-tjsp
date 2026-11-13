
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relkind='r'
      AND (
        c.relname LIKE 'backup\_%' ESCAPE '\'
        OR c.relname LIKE 'ranking\_%' ESCAPE '\'
        OR c.relname LIKE '%\_cache' ESCAPE '\'
        OR c.relname IN (
          'alertas_oportunidades_email',
          'ciclo3_mapeamento_interno',
          'ciclos_gerados_202',
          'controle_geracao_ciclos3',
          'controle_lote_ciclo3_202',
          'controle_trocas_diretas',
          'resultado_final_ciclo3_202',
          'usuarios_ciclo3_interno'
        )
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated',
      r.relname
    );
  END LOOP;
END $$;
