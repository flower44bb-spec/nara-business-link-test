-- Allow one member to register multiple businesses.
-- Existing rows are preserved. Only a legacy one-business-per-user uniqueness
-- constraint/index is removed when present.

do $$
declare
  item record;
begin
  for item in
    select constraint_name
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'businesses'
      and constraint_type = 'UNIQUE'
      and constraint_name in (
        select tc.constraint_name
        from information_schema.table_constraints tc
        join information_schema.constraint_column_usage ccu
          on ccu.constraint_schema = tc.constraint_schema
         and ccu.constraint_name = tc.constraint_name
        where tc.table_schema = 'public'
          and tc.table_name = 'businesses'
        group by tc.constraint_name
        having count(*) = 1 and min(ccu.column_name) = 'user_id'
      )
  loop
    execute format('alter table public.businesses drop constraint %I', item.constraint_name);
  end loop;

  for item in
    select n.nspname as schema_name, c.relname as index_name
    from pg_index i
    join pg_class c on c.oid = i.indexrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = 'public.businesses'::regclass
      and i.indisunique
      and not i.indisprimary
    group by n.nspname, c.relname, i.indexrelid
    having count(*) = 1 and min(a.attname) = 'user_id'
  loop
    execute format('drop index if exists %I.%I', item.schema_name, item.index_name);
  end loop;
end $$;

create index if not exists businesses_user_id_idx on public.businesses(user_id);
