
REVOKE ALL PRIVILEGES ON TABLE
  public.comarcas_referencia_tjsp,
  public.rajs,
  public.rajs_tjsp,
  public.regioes_tjsp,
  public.unidades_judiciais_tjsp
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.processar_unidades_importacao()
FROM PUBLIC, anon, authenticated;

