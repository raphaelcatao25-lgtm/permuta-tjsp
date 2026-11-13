
REVOKE ALL PRIVILEGES ON TABLE
  public.historico_permutas,
  public.historico_permutas_manuais,
  public.historico_permutas_manuais_participantes,
  public.match_historico,
  public.match_participantes,
  public.match_tipos,
  public.matches,
  public.matches_ciclo_3,
  public.comarcas_alertas,
  public.distribuicao_sp_aplicacao
FROM anon, authenticated;

