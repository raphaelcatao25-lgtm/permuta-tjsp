
REVOKE ALL PRIVILEGES ON TABLE
  public.circunscricoes,
  public.circunscricoes_old,
  public.circunscricoes_tjsp,
  public.circunscricoes_v2,
  public.comarcas_v2,
  public.rajs_v2,
  public.unidades_importacao,
  public.varas_importacao
FROM anon, authenticated;

