create or replace function public.salvar_perfil_com_preferencias(
  p_perfil jsonb,
  p_preferencias jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_comarca_atual_id bigint;
  v_preferencias_count integer;
  v_ids_distintos integer;
begin
  if v_user_id is null then raise exception 'Sessão inválida. Entre novamente para salvar seu perfil.'; end if;
  if p_perfil is null or jsonb_typeof(p_perfil) <> 'object' then raise exception 'Dados do perfil inválidos.'; end if;
  if p_preferencias is null or jsonb_typeof(p_preferencias) <> 'array' or jsonb_array_length(p_preferencias) = 0 then
    raise exception 'Cadastre pelo menos uma comarca desejada para manter a busca ativa.';
  end if;
  if coalesce(nullif(btrim(p_perfil->>'nome'), ''), '') = ''
     or coalesce(nullif(btrim(p_perfil->>'cargo'), ''), '') = ''
     or coalesce(nullif(btrim(p_perfil->>'email'), ''), '') = '' then
    raise exception 'Preencha nome, cargo e e-mail para salvar o perfil.';
  end if;

  v_comarca_atual_id := nullif(p_perfil->>'comarca_atual_id', '')::bigint;
  if v_comarca_atual_id is null or not exists (select 1 from public.comarcas_tjsp c where c.id = v_comarca_atual_id) then
    raise exception 'Selecione uma comarca atual válida.';
  end if;

  select count(*), count(distinct (x.value->>'comarca_destino_id')::bigint)
    into v_preferencias_count, v_ids_distintos
  from jsonb_array_elements(p_preferencias) as x(value);
  if v_preferencias_count = 0 or v_preferencias_count <> v_ids_distintos then
    raise exception 'As comarcas desejadas são inválidas ou estão duplicadas.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_preferencias) as x(value)
    left join public.comarcas_tjsp c on c.id = (x.value->>'comarca_destino_id')::bigint
    where c.id is null
  ) then raise exception 'Uma ou mais comarcas desejadas não existem no cadastro.'; end if;

  if exists (select 1 from public.perfis p where p.id = v_user_id and coalesce(p.em_match, false) = true) then
    raise exception 'Não é possível alterar localização ou preferências enquanto houver uma permuta confirmada.';
  end if;

  insert into public.perfis (
    id, nome, cargo, telefone, situacao_tjsp, teams,
    mostrar_telefone, mostrar_teams, mostrar_email, email, comarca_atual_id, updated_at
  )
  values (
    v_user_id, btrim(p_perfil->>'nome'), btrim(p_perfil->>'cargo'),
    nullif(btrim(coalesce(p_perfil->>'telefone', '')), ''),
    nullif(btrim(p_perfil->>'situacao_tjsp'), ''),
    nullif(btrim(coalesce(p_perfil->>'teams', '')), ''),
    coalesce((p_perfil->>'mostrar_telefone')::boolean, false),
    coalesce((p_perfil->>'mostrar_teams')::boolean, false),
    coalesce((p_perfil->>'mostrar_email')::boolean, false),
    lower(btrim(p_perfil->>'email')), v_comarca_atual_id, now()
  )
  on conflict (id) do update set
    nome = excluded.nome,
    cargo = excluded.cargo,
    telefone = excluded.telefone,
    situacao_tjsp = coalesce(excluded.situacao_tjsp, public.perfis.situacao_tjsp),
    teams = excluded.teams,
    mostrar_telefone = excluded.mostrar_telefone,
    mostrar_teams = excluded.mostrar_teams,
    mostrar_email = coalesce((p_perfil->>'mostrar_email')::boolean, public.perfis.mostrar_email),
    email = excluded.email,
    comarca_atual_id = excluded.comarca_atual_id,
    updated_at = now();

  delete from public.preferencias_movimentacao where perfil_id = v_user_id;
  insert into public.preferencias_movimentacao (perfil_id, comarca_destino_id, prioridade, ativo, tipo_preferencia)
  select v_user_id, (x.value->>'comarca_destino_id')::bigint,
         coalesce(nullif(x.value->>'prioridade', '')::integer, x.ordinality::integer),
         true, 'mudanca'
  from jsonb_array_elements(p_preferencias) with ordinality as x(value, ordinality)
  order by coalesce(nullif(x.value->>'prioridade', '')::integer, x.ordinality::integer);

  return v_user_id;
end;
$function$;

revoke all on function public.salvar_perfil_com_preferencias(jsonb, jsonb) from public;
revoke all on function public.salvar_perfil_com_preferencias(jsonb, jsonb) from anon;
grant execute on function public.salvar_perfil_com_preferencias(jsonb, jsonb) to authenticated;