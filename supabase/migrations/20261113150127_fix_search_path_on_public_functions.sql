
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    where p.pronamespace='public'::regnamespace
      and p.prokind='f'
      and (
        p.proconfig is null
        or not exists (
          select 1 from unnest(p.proconfig) setting
          where setting like 'search_path=%'
        )
      )
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.signature);
  end loop;
end
$$;

