-- =============================================================
-- Seiyalaam – Migration 002: Fix Auth User Profile Trigger
-- supabase/migrations/002_fix_auth_profile_trigger.sql
-- Fixes: "Database error saving new user"
-- =============================================================

-- 1. Ensure public.profiles table exists with exact schema
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null,
  area          text,
  language      text not null default 'en' check (language in ('en', 'ta')),
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

-- 2. Ensure Row Level Security is active on profiles
alter table public.profiles enable row level security;

-- 3. Grant schema and table permissions
grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on table public.profiles to postgres, service_role, supabase_auth_admin;
grant select, update, insert on table public.profiles to authenticated;
grant select on table public.profiles to anon;

-- 4. Configure robust RLS policies on public.profiles
do $$
begin
  -- Policy: Users can read their own profile row
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles: users read own row'
  ) then
    create policy "profiles: users read own row"
      on public.profiles for select
      using (auth.uid() = id);
  end if;

  -- Policy: Users can update their own profile row (not role)
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles: users update own row (not role)'
  ) then
    create policy "profiles: users update own row (not role)"
      on public.profiles for update
      using (auth.uid() = id)
      with check (
        auth.uid() = id
        and role = (select role from public.profiles where id = auth.uid())
      );
  end if;

  -- Policy: Users can insert their own profile row (strictly restricted to their own auth.uid())
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles: users insert own row'
  ) then
    create policy "profiles: users insert own row"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;
end $$;

-- 5. Create robust, security definer trigger function with explicit schema and search_path
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
  -- Safely extract and sanitize display name with fallbacks
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(split_part(new.email, '@', 1)), ''),
    'Maker'
  );

  -- Safely extract optional area
  v_area := nullif(trim(new.raw_user_meta_data->>'area'), '');

  -- Validate language against check constraint
  if (new.raw_user_meta_data->>'language') in ('en', 'ta') then
    v_language := new.raw_user_meta_data->>'language';
  else
    v_language := 'en';
  end if;

  -- Insert profile row with conflict resolution
  insert into public.profiles (
    id,
    display_name,
    area,
    language,
    role,
    created_at
  )
  values (
    new.id,
    v_display_name,
    v_area,
    v_language,
    'user',
    now()
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
    area = coalesce(excluded.area, public.profiles.area),
    language = coalesce(excluded.language, public.profiles.language);

  return new;
exception when others then
  -- In case of any unexpected internal error, log a warning rather than failing the transaction
  raise warning 'handle_new_user warning for auth.user %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- Explicitly ensure function ownership is postgres (superuser)
alter function public.handle_new_user() owner to postgres;

-- Grant execution permissions
grant execute on function public.handle_new_user() to service_role, postgres, supabase_auth_admin;

-- 6. Dynamically drop all obsolete/duplicate non-internal triggers on auth.users
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

-- 7. Attach single, robust trigger cleanly to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
