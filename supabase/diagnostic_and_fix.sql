-- =============================================================
-- Seiyalaam – Auth Diagnostic & Permanent Trigger Fix
-- supabase/diagnostic_and_fix.sql
-- =============================================================

-- 1. Create debug table to capture triggers and runtime errors
create table if not exists public.auth_debug_log (
  id serial primary key,
  step text,
  user_id text,
  error_message text,
  created_at timestamptz default now()
);

grant all on table public.auth_debug_log to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant usage, select on sequence public.auth_debug_log_id_seq to postgres, anon, authenticated, service_role, supabase_auth_admin;

alter table public.auth_debug_log enable row level security;
drop policy if exists "anyone read debug log" on public.auth_debug_log;
create policy "anyone read debug log" on public.auth_debug_log for select using (true);
drop policy if exists "anyone insert debug log" on public.auth_debug_log;
create policy "anyone insert debug log" on public.auth_debug_log for insert with check (true);

-- 2. Log all existing triggers on auth.users before cleaning
insert into public.auth_debug_log (step, error_message)
select 'pre_existing_trigger', tgname || ' (function: ' || proname || ')'
from pg_trigger
join pg_proc on pg_trigger.tgfoid = pg_proc.oid
where tgrelid = 'auth.users'::regclass;

-- 3. Ensure public.profiles table exists with all permissions
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null,
  area          text,
  language      text not null default 'en' check (language in ('en', 'ta')),
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on table public.profiles to postgres, service_role, supabase_auth_admin;
grant select, update, insert on table public.profiles to authenticated;
grant select on table public.profiles to anon;

-- 4. RLS policies on public.profiles
drop policy if exists "profiles: users read own row" on public.profiles;
create policy "profiles: users read own row" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles: users update own row (not role)" on public.profiles;
create policy "profiles: users update own row (not role)" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "profiles: users insert own row" on public.profiles;
create policy "profiles: users insert own row" on public.profiles for insert with check (auth.uid() = id);

-- 5. Create instrumented handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_display_name text;
  v_area text;
  v_language text;
begin
  insert into public.auth_debug_log (step, user_id, error_message)
  values ('1_trigger_entered', new.id::text, 'Email: ' || coalesce(new.email, 'none'));

  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(split_part(new.email, '@', 1)), ''),
    'Maker'
  );

  v_area := nullif(trim(new.raw_user_meta_data->>'area'), '');
  if (new.raw_user_meta_data->>'language') in ('en', 'ta') then
    v_language := new.raw_user_meta_data->>'language';
  else
    v_language := 'en';
  end if;

  insert into public.profiles (id, display_name, area, language, role, created_at)
  values (new.id, v_display_name, v_area, v_language, 'user', now())
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
    area = coalesce(excluded.area, public.profiles.area),
    language = coalesce(excluded.language, public.profiles.language);

  insert into public.auth_debug_log (step, user_id, error_message)
  values ('2_profile_inserted_success', new.id::text, 'Profile created for ' || v_display_name);

  return new;
exception when others then
  insert into public.auth_debug_log (step, user_id, error_message)
  values ('trigger_exception_caught', new.id::text, 'SQLSTATE: ' || sqlstate || ' - ' || sqlerrm);
  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;
grant execute on function public.handle_new_user() to service_role, postgres, supabase_auth_admin;

-- 6. Dynamically drop all obsolete non-internal triggers on auth.users
do $$
declare
  trg record;
begin
  for trg in (
    select tgname
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) loop
    execute format('drop trigger if exists %I on auth.users;', trg.tgname);
  end loop;
end $$;

-- 7. Attach single, official trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. Log final installed triggers
insert into public.auth_debug_log (step, error_message)
select 'installed_trigger', tgname || ' (function: ' || proname || ')'
from pg_trigger
join pg_proc on pg_trigger.tgfoid = pg_proc.oid
where tgrelid = 'auth.users'::regclass;
