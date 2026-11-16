CREATE OR REPLACE FUNCTION public.resumo_oportunidades_por_tipo()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'diretas',
    (
      SELECT count(DISTINCT assinatura)::bigint
      FROM public.alertas_oportunidades_email
      WHERE tipo = 'direta'
    ),
    'ciclos3',
    (
      SELECT count(DISTINCT assinatura)::bigint
      FROM public.alertas_oportunidades_email
      WHERE tipo = 'ciclo_3'
    ),
    'ciclos4',
    (
      SELECT count(*)::bigint
      FROM public.historico_oportunidades_ciclo4
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.resumo_oportunidades_por_tipo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resumo_oportunidades_por_tipo() TO anon, authenticated, service_role;