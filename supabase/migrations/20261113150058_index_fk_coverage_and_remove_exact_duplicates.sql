
do $$
declare r record;
declare cols text;
declare idx_name text;
begin
  for r in
    select con.oid, con.conrelid, con.conkey, c.relname as table_name, n.nspname as schema_name,
           con.conname
    from pg_constraint con
    join pg_class c on c.oid=con.conrelid
    join pg_namespace n on n.oid=c.relnamespace
    where con.contype='f'
      and n.nspname='public'
      and not exists (
        select 1 from pg_index i
        where i.indrelid=con.conrelid
          and i.indisvalid
          and i.indpred is null
          and (
            select array_agg(i.indkey[s]::smallint order by s)
            from generate_series(0,cardinality(con.conkey)-1) s
          )=con.conkey
      )
  loop
    select string_agg(format('%I',a.attname), ', ' order by k.ord)
      into cols
    from unnest(r.conkey) with ordinality k(attnum,ord)
    join pg_attribute a on a.attrelid=r.conrelid and a.attnum=k.attnum;

    idx_name := 'idx_fk_' || substr(md5(r.oid::text),1,12) || '_' || left(r.table_name,30);
    execute format('create index %I on %I.%I (%s)', idx_name, r.schema_name, r.table_name, cols);
  end loop;
end
$$;

-- Remove somente índices comuns que duplicam exatamente uma chave única/primária.
drop index if exists public.idx_comarcas_desejadas_usuario_comarca;
drop index if exists public.idx_historico_permutas_manuais_ciclo;
drop index if exists public.idx_cache_perfil_id;
drop index if exists public.idx_cache_preferencia_id;

