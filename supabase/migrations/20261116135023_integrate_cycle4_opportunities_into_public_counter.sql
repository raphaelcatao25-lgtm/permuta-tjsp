CREATE TABLE IF NOT EXISTS public.historico_oportunidades_ciclo4 (
  assinatura_hash text PRIMARY KEY
    CHECK (assinatura_hash ~ '^[0-9a-f]{64}$'),
  primeira_encontrada_em timestamptz NOT NULL DEFAULT now(),
  ultima_encontrada_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_oportunidades_ciclo4 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.historico_oportunidades_ciclo4 FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.historico_oportunidades_ciclo4 TO service_role;

CREATE OR REPLACE FUNCTION public.buscar_ciclos_4_preferencias(
  p_perfil_id uuid,
  p_limite integer DEFAULT 10
)
RETURNS TABLE(
  assinatura text,
  participantes_ids uuid[],
  participantes jsonb,
  score_total integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and (auth.uid() is null or auth.uid() is distinct from p_perfil_id) then
    raise exception 'Usuário não autorizado.';
  end if;

  if not exists (
    select 1 from public.perfis p
    where p.id = p_perfil_id
      and coalesce(p.em_match, false) = false
      and coalesce(p.busca_pausada, false) = false
  ) then
    return;
  end if;

  return query
  with recursive caminhos as (
    select array[p_perfil_id]::uuid[] as ids,
           0::integer as profundidade,
           array[]::integer[] as prioridades
    union all
    select c.ids || prox.id,
           c.profundidade + 1,
           c.prioridades || coalesce(pref.prioridade, 99)
    from caminhos c
    join public.perfis atual
      on atual.id = c.ids[cardinality(c.ids)]
    join lateral (
      select p.id
      from public.perfis p
      where p.id <> all(c.ids)
        and p.cargo = atual.cargo
        and coalesce(p.em_match, false) = false
        and coalesce(p.busca_pausada, false) = false
        and exists (
          select 1
          from public.preferencias_movimentacao pm
          where pm.perfil_id = atual.id
            and coalesce(pm.ativo, true) = true
            and public.destino_compativel_ciclo3(
              pm.comarca_destino_id,
              pm.unidade_destino_id,
              p.comarca_atual_id,
              p.unidade_atual_id
            )
        )
      order by p.updated_at desc nulls last, p.id
      limit 15
    ) prox on true
    join lateral (
      select pm.prioridade
      from public.preferencias_movimentacao pm
      join public.perfis destino on destino.id = prox.id
      where pm.perfil_id = atual.id
        and coalesce(pm.ativo, true) = true
        and public.destino_compativel_ciclo3(
          pm.comarca_destino_id,
          pm.unidade_destino_id,
          destino.comarca_atual_id,
          destino.unidade_atual_id
        )
      order by pm.prioridade asc nulls last, pm.created_at asc
      limit 1
    ) pref on true
    where c.profundidade < 3
      and cardinality(c.ids) < 4
  ),
  ciclos as (
    select c.ids, c.prioridades, fechamento.prioridade as prioridade_fechamento
    from caminhos c
    join public.perfis ultimo on ultimo.id = c.ids[4]
    join public.perfis primeiro on primeiro.id = c.ids[1]
    join lateral (
      select pm.prioridade
      from public.preferencias_movimentacao pm
      where pm.perfil_id = ultimo.id
        and coalesce(pm.ativo, true) = true
        and public.destino_compativel_ciclo3(
          pm.comarca_destino_id,
          pm.unidade_destino_id,
          primeiro.comarca_atual_id,
          primeiro.unidade_atual_id
        )
      order by pm.prioridade asc nulls last, pm.created_at asc
      limit 1
    ) fechamento on true
    where c.profundidade = 3 and cardinality(c.ids) = 4
  ),
  enriquecidos as (
    select
      c.ids,
      array_to_string(c.ids, '>') as chave,
      (
        select jsonb_agg(
          jsonb_build_object(
            'ordem', x.ordem,
            'usuario_id', x.usuario_id,
            'nome', p.nome,
            'cargo', p.cargo,
            'origem_comarca_id', p.comarca_atual_id,
            'origem_comarca', co.nome,
            'origem_unidade_id', p.unidade_atual_id,
            'destino_comarca_id', prox.comarca_atual_id,
            'destino_comarca', cd.nome,
            'destino_unidade_id', prox.unidade_atual_id,
            'proximo_usuario_id', prox.id
          ) order by x.ordem
        )
        from unnest(c.ids) with ordinality as x(usuario_id, ordem)
        join public.perfis p on p.id = x.usuario_id
        join public.comarcas_tjsp co on co.id = p.comarca_atual_id
        join public.perfis prox
          on prox.id = case when x.ordem < 4 then c.ids[x.ordem + 1] else c.ids[1] end
        join public.comarcas_tjsp cd on cd.id = prox.comarca_atual_id
      ) as dados,
      (
        select coalesce(sum(100 - least(99, greatest(1, coalesce(v, 99)))), 0)::integer
        from unnest(c.prioridades || c.prioridade_fechamento) v
      ) as score
    from ciclos c
  )
  select e.chave, e.ids, e.dados, e.score
  from enriquecidos e
  order by e.score desc, e.chave
  limit least(greatest(coalesce(p_limite, 10), 1), 10);
end;
$function$;

REVOKE ALL ON FUNCTION public.buscar_ciclos_4_preferencias(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_ciclos_4_preferencias(uuid, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_historico_oportunidade_ciclo4(
  p_assinatura_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  IF p_assinatura_hash IS NULL OR p_assinatura_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Assinatura inválida.';
  END IF;

  INSERT INTO public.historico_oportunidades_ciclo4 (
    assinatura_hash,
    primeira_encontrada_em,
    ultima_encontrada_em
  )
  VALUES (
    p_assinatura_hash,
    now(),
    now()
  )
  ON CONFLICT (assinatura_hash)
  DO UPDATE SET ultima_encontrada_em = EXCLUDED.ultima_encontrada_em;
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_historico_oportunidade_ciclo4(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_historico_oportunidade_ciclo4(text) TO service_role;

CREATE OR REPLACE FUNCTION public.total_oportunidades_encontradas()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT count(DISTINCT chave)::bigint
  FROM (
    SELECT assinatura AS chave
    FROM public.alertas_oportunidades_email
    WHERE tipo IN ('direta', 'ciclo_3')
    UNION ALL
    SELECT 'ciclo_4:' || assinatura_hash AS chave
    FROM public.historico_oportunidades_ciclo4
  ) oportunidades;
$function$;

REVOKE ALL ON FUNCTION public.total_oportunidades_encontradas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.total_oportunidades_encontradas() TO anon, authenticated, service_role;
