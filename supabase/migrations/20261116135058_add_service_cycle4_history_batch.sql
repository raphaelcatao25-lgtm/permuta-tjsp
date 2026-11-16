ALTER TABLE public.historico_oportunidades_ciclo4
  DROP CONSTRAINT IF EXISTS historico_oportunidades_ciclo4_assinatura_hash_check;

ALTER TABLE public.historico_oportunidades_ciclo4
  ADD CONSTRAINT historico_oportunidades_ciclo4_assinatura_hash_check
  CHECK (assinatura_hash ~ '^[0-9a-f]{64}$');

DROP FUNCTION IF EXISTS public.registrar_historico_oportunidade_ciclo4(text);

CREATE OR REPLACE FUNCTION public.registrar_oportunidades_ciclo4_lote()
RETURNS TABLE(perfis_analisados integer, ciclos_unicos_encontrados integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_perfil record;
  v_ciclo record;
  v_ids_ordenados uuid[];
  v_hash text;
  v_hashes text[] := ARRAY[]::text[];
  v_perfis integer := 0;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  FOR v_perfil IN
    SELECT p.id
    FROM public.perfis p
    WHERE p.busca_pausada = false
      AND p.em_match = false
    ORDER BY p.id
  LOOP
    v_perfis := v_perfis + 1;

    FOR v_ciclo IN
      SELECT *
      FROM public.buscar_ciclos_4_preferencias(v_perfil.id, 10)
    LOOP
      IF cardinality(v_ciclo.participantes_ids) <> 4 THEN
        CONTINUE;
      END IF;

      SELECT array_agg(DISTINCT u.id ORDER BY u.id)
      INTO v_ids_ordenados
      FROM unnest(v_ciclo.participantes_ids) AS u(id);

      IF cardinality(v_ids_ordenados) <> 4 THEN
        CONTINUE;
      END IF;

      v_hash := encode(
        sha256(convert_to(array_to_string(v_ids_ordenados, '--'), 'UTF8')),
        'hex'
      );

      IF NOT (v_hash = ANY(v_hashes)) THEN
        INSERT INTO public.historico_oportunidades_ciclo4 (
          assinatura_hash,
          primeira_encontrada_em,
          ultima_encontrada_em
        )
        VALUES (v_hash, now(), now())
        ON CONFLICT (assinatura_hash)
        DO UPDATE SET ultima_encontrada_em = EXCLUDED.ultima_encontrada_em;

        v_hashes := array_append(v_hashes, v_hash);
      END IF;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_perfis, cardinality(v_hashes);
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_oportunidades_ciclo4_lote() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_oportunidades_ciclo4_lote() TO service_role;
