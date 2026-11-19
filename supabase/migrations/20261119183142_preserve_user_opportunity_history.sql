create table if not exists public.historico_oportunidades_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null check (tipo in ('direta','ciclo_3','ciclo_4')),
  assinatura text not null,
  participantes jsonb not null,
  status text not null default 'indisponivel' check (status in ('ativa','indisponivel')),
  primeira_encontrada_em timestamptz not null default now(),
  ultima_encontrada_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, tipo, assinatura)
);

create index if not exists idx_historico_oportunidades_usuario_data
  on public.historico_oportunidades_usuario (usuario_id, ultima_encontrada_em desc);

alter table public.historico_oportunidades_usuario enable row level security;
revoke all on public.historico_oportunidades_usuario from public, anon;
revoke all on public.historico_oportunidades_usuario from authenticated;
grant select on public.historico_oportunidades_usuario to authenticated;

drop policy if exists historico_oportunidades_usuario_select_own
  on public.historico_oportunidades_usuario;
create policy historico_oportunidades_usuario_select_own
  on public.historico_oportunidades_usuario
  for select to authenticated
  using (usuario_id = (select auth.uid()));

grant all on public.historico_oportunidades_usuario to service_role;

create or replace function public.registrar_oportunidades_ciclo4_lote(p_perfis_ids uuid[])
 returns table(perfis_analisados integer, ciclos_unicos_encontrados integer, hashes_lote text[])
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_perfil record;
  v_ciclo record;
  v_ids_ordenados uuid[];
  v_hash text;
  v_hashes text[] := array[]::text[];
  v_perfis integer := 0;
  v_usuario uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Não autorizado.';
  end if;

  if p_perfis_ids is null or cardinality(p_perfis_ids) = 0 then
    return query select 0, 0, array[]::text[];
    return;
  end if;

  for v_perfil in
    select p.id
    from public.perfis p
    where p.id = any(p_perfis_ids)
      and p.busca_pausada = false
      and p.em_match = false
    order by p.id
  loop
    v_perfis := v_perfis + 1;

    for v_ciclo in
      select *
      from public.buscar_ciclos_4_preferencias(v_perfil.id, 10)
    loop
      if cardinality(v_ciclo.participantes_ids) <> 4 then
        continue;
      end if;

      select array_agg(distinct u.id order by u.id)
      into v_ids_ordenados
      from unnest(v_ciclo.participantes_ids) as u(id);

      if cardinality(v_ids_ordenados) <> 4 then
        continue;
      end if;

      v_hash := encode(
        sha256(convert_to(array_to_string(v_ids_ordenados, '--'), 'UTF8')),
        'hex'
      );

      if not (v_hash = any(v_hashes)) then
        insert into public.historico_oportunidades_ciclo4 (
          assinatura_hash, primeira_encontrada_em, ultima_encontrada_em
        )
        values (v_hash, now(), now())
        on conflict (assinatura_hash)
        do update set ultima_encontrada_em = excluded.ultima_encontrada_em;

        v_hashes := array_append(v_hashes, v_hash);
      end if;

      foreach v_usuario in array v_ids_ordenados
      loop
        insert into public.historico_oportunidades_usuario (
          usuario_id, tipo, assinatura, participantes, status,
          primeira_encontrada_em, ultima_encontrada_em, updated_at
        )
        values (
          v_usuario, 'ciclo_4', v_hash, v_ciclo.participantes, 'ativa',
          now(), now(), now()
        )
        on conflict (usuario_id, tipo, assinatura)
        do update set
          participantes = excluded.participantes,
          status = 'ativa',
          ultima_encontrada_em = excluded.ultima_encontrada_em,
          updated_at = excluded.updated_at;
      end loop;
    end loop;
  end loop;

  return query select v_perfis, cardinality(v_hashes), v_hashes;
end;
$function$;

revoke all on function public.registrar_oportunidades_ciclo4_lote(uuid[]) from public, anon, authenticated;
grant execute on function public.registrar_oportunidades_ciclo4_lote(uuid[]) to service_role;
