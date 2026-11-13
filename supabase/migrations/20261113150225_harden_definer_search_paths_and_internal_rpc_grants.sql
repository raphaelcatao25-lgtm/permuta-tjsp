
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    where p.pronamespace='public'::regnamespace
      and p.prokind='f'
      and p.prosecdef
      and exists (
        select 1 from unnest(p.proconfig) setting
        where setting = 'search_path=public'
      )
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.signature);
  end loop;
end
$$;

-- Estas três funções são auxiliares internas chamadas por RPCs protegidas.
-- Usuários não precisam executá-las diretamente.
revoke execute on function public.cargos_compativeis_permuta(uuid,uuid) from authenticated;
revoke execute on function public.todos_mesmo_cargo_permuta(uuid[]) from authenticated;
revoke execute on function public.validar_cargos_permuta_manual(uuid[]) from authenticated;

