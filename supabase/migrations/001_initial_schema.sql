-- =============================================================
-- Seiyalaam – Initial Schema Migration
-- 001_initial_schema.sql
-- Run: supabase db push  (or via Supabase dashboard SQL editor)
-- =============================================================

-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null,
  area          text,
  language      text not null default 'en' check (language in ('en', 'ta')),
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

-- Trigger: auto-create profile on signup
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

  return new;
exception when others then
  raise warning 'handle_new_user warning for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Public display_name view (no personal data)
create or replace view public_profiles as
  select id, display_name, area from profiles;

-- ─────────────────────────────────────────────
-- COMPONENTS  (reference data)
-- ─────────────────────────────────────────────
create table if not exists components (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,
  category        text not null,
  weight_g        numeric not null default 0,
  voltage         numeric,
  max_current_ma  numeric,
  safety_tags     text[] not null default '{}',
  substitutes     text[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- DEVICES  (salvageable device types)
-- ─────────────────────────────────────────────
create table if not exists devices (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  difficulty  text not null check (difficulty in ('easy','medium','hard')),
  warnings    text[] not null default '{}',
  parts       jsonb not null default '[]',
  checklist   jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- PROJECTS  (reuse projects)
-- ─────────────────────────────────────────────
create table if not exists projects (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text not null,
  category        text not null check (category in ('educational','creative','practical')),
  difficulty      text not null check (difficulty in ('easy','medium','hard')),
  steps           jsonb not null default '[]',
  requirements    jsonb not null default '[]',
  safety_notes    text,
  created_by      uuid references profiles(id) on delete set null,
  is_ai_generated boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- INVENTORY ITEMS
-- ─────────────────────────────────────────────
create table if not exists inventory_items (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  component_id      uuid not null references components(id) on delete cascade,
  quantity          integer not null default 1 check (quantity >= 0),
  condition         text not null default 'untested' check (condition in ('tested','untested','partial','faulty')),
  available_to_share boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (user_id, component_id)
);

-- ─────────────────────────────────────────────
-- OWNED DEVICES
-- ─────────────────────────────────────────────
create table if not exists owned_devices (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  device_id     uuid not null references devices(id) on delete cascade,
  device_class  text not null check (device_class in ('A','B','C','D','E')),
  answers       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- TEARDOWNS
-- ─────────────────────────────────────────────
create table if not exists teardowns (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  device_id   uuid not null references devices(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- LISTINGS  (community board)
-- ─────────────────────────────────────────────
create table if not exists listings (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id) on delete cascade,
  title               text not null,
  device_or_component text not null,
  quantity            integer not null default 1 check (quantity >= 1),
  device_class        text check (device_class in ('A','B','C','D','E')),
  offer_type          text not null check (offer_type in ('free','swap','donate')),
  area                text not null,
  photo_url           text,
  status              text not null default 'available' check (status in ('available','requested','taken')),
  created_at          timestamptz not null default now()
);

-- NOTE: Contact details are intentionally NOT stored in listings.
-- Contact is shared only through the accepted-request flow (see requests table).

-- ─────────────────────────────────────────────
-- REQUESTS  (on listings)
-- ─────────────────────────────────────────────
create table if not exists requests (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references listings(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  message      text not null,
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique (listing_id, requester_id)
);

-- ─────────────────────────────────────────────
-- USER PROJECTS
-- ─────────────────────────────────────────────
create table if not exists user_projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  status      text not null default 'planned' check (status in ('planned','built')),
  built_at    timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, project_id)
);

-- ─────────────────────────────────────────────
-- IMPACT EVENTS
-- ─────────────────────────────────────────────
create table if not exists impact_events (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  kind           text not null,
  grams_diverted numeric not null default 0,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- AI USAGE LOG
-- ─────────────────────────────────────────────
create table if not exists ai_usage (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  action      text not null,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table profiles       enable row level security;
alter table components     enable row level security;
alter table devices        enable row level security;
alter table projects       enable row level security;
alter table inventory_items enable row level security;
alter table owned_devices  enable row level security;
alter table teardowns      enable row level security;
alter table listings       enable row level security;
alter table requests       enable row level security;
alter table user_projects  enable row level security;
alter table impact_events  enable row level security;
alter table ai_usage       enable row level security;

-- ─────────────────────────────────────────────
-- PROFILES policies
-- ─────────────────────────────────────────────
create policy "profiles: users read own row"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: users update own row (not role)"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Block users from changing their own role:
    and role = (select role from profiles where id = auth.uid())
  );

-- SECURITY TEST: user A cannot read user B's profile
-- select * from profiles where id = '<user_b_id>';  → 0 rows for user A

-- ─────────────────────────────────────────────
-- COMPONENTS policies
-- ─────────────────────────────────────────────
create policy "components: anyone can select"
  on components for select
  using (true);

create policy "components: admin insert"
  on components for insert
  with check ((select role from profiles where id = auth.uid()) = 'admin');

create policy "components: admin update"
  on components for update
  using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "components: admin delete"
  on components for delete
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- ─────────────────────────────────────────────
-- DEVICES policies
-- ─────────────────────────────────────────────
create policy "devices: anyone can select"
  on devices for select
  using (true);

create policy "devices: admin insert"
  on devices for insert
  with check ((select role from profiles where id = auth.uid()) = 'admin');

create policy "devices: admin update"
  on devices for update
  using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "devices: admin delete"
  on devices for delete
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- ─────────────────────────────────────────────
-- PROJECTS policies
-- ─────────────────────────────────────────────
create policy "projects: anyone can select"
  on projects for select
  using (true);

create policy "projects: admin insert"
  on projects for insert
  with check ((select role from profiles where id = auth.uid()) = 'admin');

create policy "projects: admin update"
  on projects for update
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- AI-generated projects inserted by the user themselves
create policy "projects: auth user insert ai-generated"
  on projects for insert
  with check (
    is_ai_generated = true
    and created_by = auth.uid()
  );

-- ─────────────────────────────────────────────
-- INVENTORY_ITEMS policies
-- ─────────────────────────────────────────────
create policy "inventory: own rows only"
  on inventory_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- OWNED_DEVICES policies
-- ─────────────────────────────────────────────
create policy "owned_devices: own rows only"
  on owned_devices for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- TEARDOWNS policies
-- ─────────────────────────────────────────────
create policy "teardowns: own rows only"
  on teardowns for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- LISTINGS policies
-- ─────────────────────────────────────────────
create policy "listings: authenticated can select"
  on listings for select
  using (auth.role() = 'authenticated');

create policy "listings: insert own"
  on listings for insert
  with check (user_id = auth.uid());

create policy "listings: owner update"
  on listings for update
  using (user_id = auth.uid());

create policy "listings: owner delete"
  on listings for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- REQUESTS policies
-- ─────────────────────────────────────────────
create policy "requests: requester or listing owner can select"
  on requests for select
  using (
    requester_id = auth.uid()
    or exists (
      select 1 from listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

create policy "requests: requester inserts own"
  on requests for insert
  with check (requester_id = auth.uid());

create policy "requests: listing owner updates status"
  on requests for update
  using (
    exists (
      select 1 from listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- USER_PROJECTS policies
-- ─────────────────────────────────────────────
create policy "user_projects: own rows only"
  on user_projects for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- IMPACT_EVENTS policies
-- ─────────────────────────────────────────────
create policy "impact_events: own rows only"
  on impact_events for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- AI_USAGE policies
-- ─────────────────────────────────────────────
create policy "ai_usage: own rows only"
  on ai_usage for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================
-- STORAGE BUCKET
-- =============================================================

-- Run in Supabase dashboard or via CLI:
-- supabase storage create listing-photos
-- The bucket policies below need to run after bucket creation.

-- Policy: authenticated upload to own folder only
-- (These are storage policies – set via Supabase dashboard or Storage API)
-- insert: auth.uid()::text = (storage.foldername(name))[1]
-- select: true (public read)
-- File size limit: 2MB, image/* only – set in bucket settings

-- =============================================================
-- SEED DATA
-- =============================================================

-- ─────────────────────────────────────────────
-- 30 Components
-- ─────────────────────────────────────────────
insert into components (name, category, weight_g, voltage, max_current_ma, safety_tags, substitutes) values
  ('Arduino Uno',          'microcontroller',  25,  5,    500,  '{}',                     '{"Arduino Nano","Arduino Mega"}'),
  ('Arduino Nano',         'microcontroller',  7,   5,    200,  '{}',                     '{"Arduino Uno"}'),
  ('Raspberry Pi',         'microcontroller',  45,  5,    2500, '{}',                     '{}'),
  ('DC Motor (small)',     'motor',            30,  6,    200,  '{}',                     '{"DC Motor (large)","Gear Motor"}'),
  ('DC Motor (large)',     'motor',            80,  12,   500,  '{}',                     '{"DC Motor (small)"}'),
  ('Servo Motor',          'motor',            14,  5,    900,  '{}',                     '{}'),
  ('Gear Motor',           'motor',            45,  6,    300,  '{}',                     '{"DC Motor (small)"}'),
  ('Stepper Motor',        'motor',            200, 12,   1000, '{}',                     '{}'),
  ('Ultrasonic Sensor',    'sensor',           8,   5,    15,   '{}',                     '{"IR Sensor"}'),
  ('IR Sensor',            'sensor',           5,   5,    20,   '{}',                     '{"Ultrasonic Sensor"}'),
  ('DHT11 Sensor',         'sensor',           3,   3.3,  2.5,  '{}',                     '{"DHT22 Sensor"}'),
  ('DHT22 Sensor',         'sensor',           3,   3.3,  2.5,  '{}',                     '{"DHT11 Sensor"}'),
  ('LDR Sensor',           'sensor',           1,   5,    10,   '{}',                     '{}'),
  ('PIR Sensor',           'sensor',           10,  5,    65,   '{}',                     '{}'),
  ('LED Strip (WS2812)',   'display',          50,  5,    2000, '{}',                     '{"LED Strip (Plain)"}'),
  ('LED Strip (Plain)',    'display',          30,  12,   1000, '{}',                     '{"LED Strip (WS2812)"}'),
  ('LCD Display (16x2)',   'display',          40,  5,    20,   '{}',                     '{"OLED Display"}'),
  ('OLED Display',         'display',          5,   3.3,  20,   '{}',                     '{"LCD Display (16x2)"}'),
  ('Speaker (small)',      'audio',            20,  5,    200,  '{}',                     '{"Buzzer"}'),
  ('Buzzer',               'audio',            5,   5,    30,   '{}',                     '{"Speaker (small)"}'),
  ('Relay Module',         'power',            15,  5,    70,   '{"mains_voltage"}',      '{}'),
  ('18650 Li-ion Battery', 'power',            45,  3.7,  3000, '{"lithium","rechargeable"}', '{"LiPo Battery","Phone Battery"}'),
  ('LiPo Battery',         'power',            25,  3.7,  2000, '{"lithium","rechargeable"}', '{"18650 Li-ion Battery"}'),
  ('Phone Battery',        'power',            40,  3.8,  3000, '{"lithium","rechargeable"}', '{"18650 Li-ion Battery","LiPo Battery"}'),
  ('Jumper Wires (set)',   'wiring',           15,  null, null, '{}',                     '{}'),
  ('Breadboard',           'prototyping',      40,  null, null, '{}',                     '{}'),
  ('L298N Motor Driver',   'driver',           20,  5,    2000, '{}',                     '{"L293D Motor Driver"}'),
  ('L293D Motor Driver',   'driver',           5,   5,    600,  '{}',                     '{"L298N Motor Driver"}'),
  ('NRF24L01 Module',      'wireless',         2,   3.3,  115,  '{}',                     '{"HC-05 Bluetooth"}'),
  ('HC-05 Bluetooth',      'wireless',         10,  3.3,  40,   '{}',                     '{"NRF24L01 Module"}')
on conflict (name) do nothing;

-- ─────────────────────────────────────────────
-- 12 Devices
-- ─────────────────────────────────────────────
insert into devices (name, difficulty, warnings, parts, checklist) values
(
  'Old Smartphone', 'medium',
  ARRAY['lithium battery – check for swelling', 'do not short battery terminals'],
  '[
    {"name":"Phone Battery","qty":1},
    {"name":"Speaker (small)","qty":1},
    {"name":"OLED Display","qty":1},
    {"name":"Buzzer","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does the main function (calls/apps) work?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Old Laptop', 'hard',
  ARRAY['mains adapter – unplug before opening', 'lithium battery – check for swelling'],
  '[
    {"name":"18650 Li-ion Battery","qty":3},
    {"name":"Speaker (small)","qty":2},
    {"name":"LCD Display (16x2)","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does the OS boot normally?","safety":false},
    {"id":"physical_damage","question":"Is there visible cracking or damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Printer', 'medium',
  ARRAY['mains-powered – unplug before opening'],
  '[
    {"name":"Stepper Motor","qty":2},
    {"name":"DC Motor (small)","qty":1},
    {"name":"IR Sensor","qty":2}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does it print at all?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Remote Control', 'easy',
  ARRAY[]::text[],
  '[
    {"name":"IR Sensor","qty":1},
    {"name":"Buzzer","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on (with fresh batteries)?","safety":false},
    {"id":"main_function","question":"Does it control its device?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Toy Car', 'easy',
  ARRAY[]::text[],
  '[
    {"name":"DC Motor (small)","qty":2},
    {"name":"IR Sensor","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Do the motors run?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Electric Fan', 'medium',
  ARRAY['mains-powered – unplug before opening', 'large capacitor – discharge before touching'],
  '[
    {"name":"DC Motor (large)","qty":1},
    {"name":"Relay Module","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does the fan spin?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Wireless Router', 'hard',
  ARRAY['mains-powered'],
  '[
    {"name":"HC-05 Bluetooth","qty":1},
    {"name":"NRF24L01 Module","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does it broadcast WiFi?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Alarm Clock', 'easy',
  ARRAY[],
  '[
    {"name":"Buzzer","qty":1},
    {"name":"LCD Display (16x2)","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does the alarm function work?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'RC Drone', 'hard',
  ARRAY['lithium battery – check for swelling', 'spinning blades – handle with care'],
  '[
    {"name":"DC Motor (small)","qty":4},
    {"name":"LiPo Battery","qty":1},
    {"name":"NRF24L01 Module","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Do all motors spin?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Baby Monitor', 'medium',
  ARRAY['mains-powered adapter'],
  '[
    {"name":"Speaker (small)","qty":1},
    {"name":"PIR Sensor","qty":1},
    {"name":"HC-05 Bluetooth","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does audio/video transmission work?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Digital Camera', 'medium',
  ARRAY['lithium battery'],
  '[
    {"name":"Phone Battery","qty":1},
    {"name":"OLED Display","qty":1}
  ]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Can it take photos?","safety":false},
    {"id":"physical_damage","question":"Is the lens or body damaged?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
),
(
  'Microwave Oven', 'hard',
  ARRAY['mains-powered','high-voltage capacitor – DANGEROUS, do not open unless trained'],
  '[]'::jsonb,
  '[
    {"id":"powers_on","question":"Does it power on?","safety":false},
    {"id":"main_function","question":"Does it heat food?","safety":false},
    {"id":"physical_damage","question":"Is there visible physical damage?","safety":false},
    {"id":"swollen_battery","question":"Is the battery swollen or leaking?","safety":true},
    {"id":"burn_marks","question":"Are there burn marks or water damage?","safety":true},
    {"id":"mains_caps","question":"Does it contain mains capacitors?","safety":true}
  ]'::jsonb
)
on conflict (name) do nothing;

-- ─────────────────────────────────────────────
-- 20 Projects
-- ─────────────────────────────────────────────
insert into projects (title, description, category, difficulty, steps, requirements, safety_notes, created_by, is_ai_generated) values
(
  'Smart Plant Watering System',
  'An automated plant watering system that monitors soil moisture and waters plants when needed. Great for learning about sensors and automation.',
  'practical', 'medium',
  '[
    {"step":1,"title":"Set up Arduino","desc":"Connect the Arduino Uno to your computer via USB."},
    {"step":2,"title":"Wire the moisture sensor","desc":"Connect the soil moisture sensor to analog pin A0."},
    {"step":3,"title":"Add the relay and pump","desc":"Wire a relay module to pin D7 and connect a small pump."},
    {"step":4,"title":"Upload the code","desc":"Upload the watering sketch and test the threshold."},
    {"step":5,"title":"Install in pot","desc":"Place sensor in soil and secure the setup."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"Relay Module","qty":1,"critical":true,"substitutes":[]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]},
    {"component":"DC Motor (small)","qty":1,"critical":false,"substitutes":["DC Motor (large)"]}
  ]'::jsonb,
  'Relay switches mains if using a mains pump – use a 5V USB pump instead for safety.',
  null, false
),
(
  'Obstacle Avoiding Robot',
  'Build a robot that navigates around obstacles using ultrasonic sensing and DC motors. A classic intro to robotics.',
  'educational', 'medium',
  '[
    {"step":1,"title":"Chassis assembly","desc":"Mount two DC motors on the chassis."},
    {"step":2,"title":"Wire motor driver","desc":"Connect L298N driver to motors and Arduino."},
    {"step":3,"title":"Attach ultrasonic sensor","desc":"Mount HC-SR04 on front and wire to Arduino."},
    {"step":4,"title":"Program logic","desc":"Upload obstacle avoidance sketch."},
    {"step":5,"title":"Test and tune","desc":"Adjust thresholds and test on a flat surface."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"DC Motor (small)","qty":2,"critical":true,"substitutes":["Gear Motor"]},
    {"component":"L298N Motor Driver","qty":1,"critical":true,"substitutes":["L293D Motor Driver"]},
    {"component":"Ultrasonic Sensor","qty":1,"critical":true,"substitutes":["IR Sensor"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'Keep fingers clear of moving wheels during testing.',
  null, false
),
(
  'LED Mood Lamp',
  'Create a customizable ambient lamp with colour-changing LEDs controlled by a microcontroller. Perfect for creative spaces.',
  'creative', 'easy',
  '[
    {"step":1,"title":"Connect LED strip","desc":"Wire WS2812 LED strip data line to Arduino pin D6."},
    {"step":2,"title":"Power the strip","desc":"Use external 5V 2A supply for the LEDs."},
    {"step":3,"title":"Upload code","desc":"Install FastLED library and upload a colour-cycle sketch."},
    {"step":4,"title":"Enclose in diffuser","desc":"Place inside a frosted jar or PVC tube."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"LED Strip (WS2812)","qty":1,"critical":true,"substitutes":["LED Strip (Plain)"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'Do not run the full LED strip from the Arduino 5V pin – use a separate power supply.',
  null, false
),
(
  'Digital Weather Station',
  'Display real-time temperature and humidity on an LCD screen. Great for learning about environmental sensing.',
  'educational', 'easy',
  '[
    {"step":1,"title":"Wire DHT sensor","desc":"Connect DHT11 data pin to Arduino D2."},
    {"step":2,"title":"Connect LCD","desc":"Wire 16x2 LCD to Arduino with I2C backpack."},
    {"step":3,"title":"Upload code","desc":"Use DHT and LiquidCrystal_I2C libraries."},
    {"step":4,"title":"Box it up","desc":"Mount in a vented enclosure."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"DHT11 Sensor","qty":1,"critical":true,"substitutes":["DHT22 Sensor"]},
    {"component":"LCD Display (16x2)","qty":1,"critical":true,"substitutes":["OLED Display"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Smart Night Light',
  'An automatic night light that turns on when it gets dark. Uses a light sensor and LED to save energy.',
  'practical', 'easy',
  '[
    {"step":1,"title":"Wire LDR","desc":"Connect LDR in voltage divider to analog pin A0."},
    {"step":2,"title":"Connect LED","desc":"Wire LED with resistor to pin D9."},
    {"step":3,"title":"Upload code","desc":"Upload a threshold-based on/off sketch."},
    {"step":4,"title":"Test","desc":"Cover the LDR and confirm LED switches on."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"LDR Sensor","qty":1,"critical":true,"substitutes":[]},
    {"component":"LED Strip (Plain)","qty":1,"critical":false,"substitutes":["LED Strip (WS2812)"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Motion-Activated Alarm',
  'A security alarm that triggers a buzzer when motion is detected. Learn about PIR sensors and alert systems.',
  'practical', 'easy',
  '[
    {"step":1,"title":"Connect PIR sensor","desc":"Wire PIR output to Arduino digital pin D3."},
    {"step":2,"title":"Add buzzer","desc":"Connect buzzer to pin D8 via transistor."},
    {"step":3,"title":"Program logic","desc":"Upload motion-detection and alarm sketch."},
    {"step":4,"title":"Mount and test","desc":"Fix PIR at door height and test with movement."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"PIR Sensor","qty":1,"critical":true,"substitutes":[]},
    {"component":"Buzzer","qty":1,"critical":true,"substitutes":["Speaker (small)"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Bluetooth Speaker',
  'Salvage the speaker from an old device and build a portable Bluetooth audio receiver. Great upcycling project.',
  'creative', 'medium',
  '[
    {"step":1,"title":"Extract speaker","desc":"Carefully desolder the speaker from old device."},
    {"step":2,"title":"Wire amplifier","desc":"Connect a PAM8403 amplifier module to the speaker."},
    {"step":3,"title":"Add Bluetooth module","desc":"Wire HC-05 or BT audio module to the amplifier input."},
    {"step":4,"title":"Power and test","desc":"Power with a 5V supply and pair your phone."},
    {"step":5,"title":"Enclose","desc":"Mount in a wooden box or repurposed tin."}
  ]'::jsonb,
  '[
    {"component":"Speaker (small)","qty":1,"critical":true,"substitutes":[]},
    {"component":"HC-05 Bluetooth","qty":1,"critical":true,"substitutes":[]},
    {"component":"18650 Li-ion Battery","qty":1,"critical":false,"substitutes":["Phone Battery","LiPo Battery"]}
  ]'::jsonb,
  'Check battery condition before use – do not use swollen or leaking batteries.',
  null, false
),
(
  'IR Remote Control Car',
  'Build a simple remote-controlled car using salvaged motors and an IR remote. Fun intro to wireless control.',
  'educational', 'medium',
  '[
    {"step":1,"title":"Build chassis","desc":"Attach motors to a cardboard or 3D-printed chassis."},
    {"step":2,"title":"Wire driver","desc":"Connect L293D driver between Arduino and motors."},
    {"step":3,"title":"Add IR receiver","desc":"Wire IR sensor to Arduino D11."},
    {"step":4,"title":"Map remote","desc":"Upload IR decoding sketch and map buttons to directions."},
    {"step":5,"title":"Test drive","desc":"Test in an open area and tune speed."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"DC Motor (small)","qty":2,"critical":true,"substitutes":["Gear Motor"]},
    {"component":"L293D Motor Driver","qty":1,"critical":true,"substitutes":["L298N Motor Driver"]},
    {"component":"IR Sensor","qty":1,"critical":true,"substitutes":[]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Digital Dice',
  'An electronic dice using LEDs and a button. Great beginner project for learning about random numbers and I/O.',
  'educational', 'easy',
  '[
    {"step":1,"title":"Wire 7 LEDs","desc":"Wire LEDs in dice pattern connected to Arduino pins."},
    {"step":2,"title":"Add button","desc":"Connect push button to pin D2 with pull-up resistor."},
    {"step":3,"title":"Program","desc":"Upload random number generator with LED display logic."},
    {"step":4,"title":"Box it","desc":"Mount in a small enclosure."}
  ]'::jsonb,
  '[
    {"component":"Arduino Nano","qty":1,"critical":true,"substitutes":["Arduino Uno"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Servo-Controlled Pan/Tilt Camera Mount',
  'Build a motorized camera or sensor mount that pans and tilts. Useful for security or photography.',
  'creative', 'medium',
  '[
    {"step":1,"title":"3D print or cut bracket","desc":"Create bracket for two servos to hold camera module."},
    {"step":2,"title":"Mount servos","desc":"Attach pan servo to base, tilt servo on arm."},
    {"step":3,"title":"Wire to Arduino","desc":"Connect servo signal wires to pins D9 and D10."},
    {"step":4,"title":"Control with joystick or remote","desc":"Upload control sketch and test movement."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"Servo Motor","qty":2,"critical":true,"substitutes":[]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'OLED Clock',
  'A compact digital clock displayed on a salvaged OLED screen, powered by the Arduino real-time clock module.',
  'educational', 'easy',
  '[
    {"step":1,"title":"Wire OLED","desc":"Connect OLED via I2C (SDA to A4, SCL to A5)."},
    {"step":2,"title":"Add DS3231 RTC","desc":"Wire RTC module on same I2C bus."},
    {"step":3,"title":"Upload code","desc":"Use U8g2 and RTClib libraries."},
    {"step":4,"title":"Set time","desc":"Set current time in setup() and upload."},
    {"step":5,"title":"Enclose","desc":"Fit in a small 3D-printed stand."}
  ]'::jsonb,
  '[
    {"component":"Arduino Nano","qty":1,"critical":true,"substitutes":["Arduino Uno"]},
    {"component":"OLED Display","qty":1,"critical":true,"substitutes":["LCD Display (16x2)"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Wireless Sensor Network Node',
  'Create a battery-powered sensor node that transmits temperature and humidity data wirelessly. Learn IoT basics.',
  'educational', 'hard',
  '[
    {"step":1,"title":"Set up transmitter node","desc":"Wire Arduino + DHT22 + NRF24L01 as sender."},
    {"step":2,"title":"Set up receiver","desc":"Wire second Arduino + NRF24L01 + LCD as receiver."},
    {"step":3,"title":"Program both","desc":"Upload sender and receiver sketches."},
    {"step":4,"title":"Test range","desc":"Move nodes apart and verify data reception."},
    {"step":5,"title":"Power optimise","desc":"Add sleep mode for battery saving."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":2,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"NRF24L01 Module","qty":2,"critical":true,"substitutes":[]},
    {"component":"DHT22 Sensor","qty":1,"critical":true,"substitutes":["DHT11 Sensor"]},
    {"component":"LCD Display (16x2)","qty":1,"critical":false,"substitutes":["OLED Display"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'NRF24L01 requires 3.3V – do not connect to 5V.',
  null, false
),
(
  'Repurposed Fan Speed Controller',
  'Add variable speed control to a salvaged DC fan using PWM from an Arduino. Practical and energy-efficient.',
  'practical', 'easy',
  '[
    {"step":1,"title":"Check fan voltage","desc":"Identify fan voltage (usually 5V or 12V)."},
    {"step":2,"title":"Wire transistor","desc":"Connect TIP120 transistor between Arduino and fan."},
    {"step":3,"title":"Add potentiometer","desc":"Wire pot to analog pin A0 for speed control."},
    {"step":4,"title":"Upload PWM code","desc":"Upload analogWrite fan speed sketch."},
    {"step":5,"title":"Test safety","desc":"Confirm fan does not overheat at low speeds."}
  ]'::jsonb,
  '[
    {"component":"Arduino Nano","qty":1,"critical":true,"substitutes":["Arduino Uno"]},
    {"component":"DC Motor (large)","qty":1,"critical":true,"substitutes":["DC Motor (small)"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'If the fan runs on mains voltage, do NOT connect to Arduino – use a dedicated mains PWM controller.',
  null, false
),
(
  'Stepper Motor Plotter',
  'Build a simple 2-axis drawing machine (pen plotter) using salvaged stepper motors from an old printer.',
  'creative', 'hard',
  '[
    {"step":1,"title":"Extract steppers","desc":"Carefully remove stepper motors from old printer."},
    {"step":2,"title":"Build frame","desc":"Construct XY gantry from cardboard or MDF."},
    {"step":3,"title":"Wire drivers","desc":"Connect stepper drivers to Arduino."},
    {"step":4,"title":"Add pen mount","desc":"Attach servo to lift pen."},
    {"step":5,"title":"Upload firmware","desc":"Use GRBL or custom plotter firmware."},
    {"step":6,"title":"Test and calibrate","desc":"Draw test patterns and calibrate steps/mm."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":[]},
    {"component":"Stepper Motor","qty":2,"critical":true,"substitutes":[]},
    {"component":"Servo Motor","qty":1,"critical":true,"substitutes":[]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'Ensure moving parts cannot trap fingers during testing.',
  null, false
),
(
  'Bike Safety Light',
  'Build a bright rechargeable LED tail-light for cycling, powered by a salvaged phone battery.',
  'practical', 'easy',
  '[
    {"step":1,"title":"Select LEDs","desc":"Choose high-brightness red LEDs or an LED strip section."},
    {"step":2,"title":"Add charger board","desc":"Wire a TP4056 charger to the phone battery."},
    {"step":3,"title":"Add switch","desc":"Include an on/off and blink mode switch."},
    {"step":4,"title":"Enclose","desc":"Mount in a weatherproof case."}
  ]'::jsonb,
  '[
    {"component":"Phone Battery","qty":1,"critical":true,"substitutes":["18650 Li-ion Battery","LiPo Battery"]},
    {"component":"LED Strip (Plain)","qty":1,"critical":true,"substitutes":["LED Strip (WS2812)"]}
  ]'::jsonb,
  'Use only undamaged, non-swollen batteries. Include a fuse.',
  null, false
),
(
  'Clap-Activated Switch',
  'Control a light or fan with a clap using a sound sensor and relay. Classic home automation project.',
  'practical', 'easy',
  '[
    {"step":1,"title":"Wire sound sensor","desc":"Connect KY-038 mic to Arduino A0."},
    {"step":2,"title":"Add relay","desc":"Connect relay module to pin D7."},
    {"step":3,"title":"Program clap detection","desc":"Upload a double-clap detection sketch."},
    {"step":4,"title":"Wire appliance","desc":"Connect a low-voltage LED lamp through the relay."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"Relay Module","qty":1,"critical":true,"substitutes":[]},
    {"component":"Buzzer","qty":1,"critical":false,"substitutes":[]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'Never connect mains voltage through the relay yourself – get a qualified electrician.',
  null, false
),
(
  'Retro Game Console',
  'Transform a Raspberry Pi into a retro gaming console with a salvaged phone battery for portability.',
  'creative', 'hard',
  '[
    {"step":1,"title":"Install RetroPie","desc":"Flash RetroPie image to microSD card."},
    {"step":2,"title":"Set up power bank circuit","desc":"Wire phone battery + TP4056 + boost converter."},
    {"step":3,"title":"Connect display","desc":"Wire a small TFT or OLED display to Raspberry Pi."},
    {"step":4,"title":"Add controls","desc":"Connect GPIO buttons or a small gamepad."},
    {"step":5,"title":"Enclose","desc":"3D-print or carve a handheld case."}
  ]'::jsonb,
  '[
    {"component":"Raspberry Pi","qty":1,"critical":true,"substitutes":[]},
    {"component":"Phone Battery","qty":1,"critical":true,"substitutes":["LiPo Battery","18650 Li-ion Battery"]},
    {"component":"OLED Display","qty":1,"critical":false,"substitutes":["LCD Display (16x2)"]}
  ]'::jsonb,
  'Battery + boost converter combination requires care – ensure protection circuitry is in place.',
  null, false
),
(
  'Soil Erosion Monitor',
  'A sensor array that monitors soil moisture at multiple depths to study erosion or guide irrigation.',
  'educational', 'hard',
  '[
    {"step":1,"title":"Array wiring","desc":"Connect three moisture sensors to A0, A1, A2."},
    {"step":2,"title":"Add display","desc":"Show readings on LCD or serial plotter."},
    {"step":3,"title":"Add data logging","desc":"Log to SD card with timestamps."},
    {"step":4,"title":"Waterproof sensors","desc":"Apply conformal coating to sensor traces."},
    {"step":5,"title":"Field install","desc":"Insert sensors at different soil depths."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Raspberry Pi"]},
    {"component":"DHT22 Sensor","qty":1,"critical":false,"substitutes":["DHT11 Sensor"]},
    {"component":"LCD Display (16x2)","qty":1,"critical":false,"substitutes":["OLED Display"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'Waterproof all exposed electronics in outdoor installations.',
  null, false
),
(
  'Talking Distance Meter',
  'An ultrasonic distance meter that announces measurements through a speaker. Good for visual-impairment aids.',
  'practical', 'medium',
  '[
    {"step":1,"title":"Wire ultrasonic sensor","desc":"Connect HC-SR04 to Arduino D9 (trig) and D10 (echo)."},
    {"step":2,"title":"Add speaker","desc":"Wire speaker via small amplifier to Arduino."},
    {"step":3,"title":"Program voice output","desc":"Use a TTS chip or pre-recorded audio clips."},
    {"step":4,"title":"Enclose","desc":"Fit in a handheld enclosure."}
  ]'::jsonb,
  '[
    {"component":"Arduino Uno","qty":1,"critical":true,"substitutes":["Arduino Nano"]},
    {"component":"Ultrasonic Sensor","qty":1,"critical":true,"substitutes":[]},
    {"component":"Speaker (small)","qty":1,"critical":true,"substitutes":["Buzzer"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  null,
  null, false
),
(
  'Electronic Compost Monitor',
  'Monitor temperature and moisture inside a compost bin to optimise decomposition rates.',
  'practical', 'medium',
  '[
    {"step":1,"title":"Waterproof sensor","desc":"Coat DHT22 and soil probe in epoxy for moisture protection."},
    {"step":2,"title":"Wire Arduino","desc":"Connect sensors to Arduino analog and digital pins."},
    {"step":3,"title":"Add display","desc":"Show temp and moisture on OLED."},
    {"step":4,"title":"Power","desc":"Use a solar panel + battery for outdoor power."},
    {"step":5,"title":"Mount","desc":"Insert probe in compost heap and fix display on lid."}
  ]'::jsonb,
  '[
    {"component":"Arduino Nano","qty":1,"critical":true,"substitutes":["Arduino Uno"]},
    {"component":"DHT22 Sensor","qty":1,"critical":true,"substitutes":["DHT11 Sensor"]},
    {"component":"OLED Display","qty":1,"critical":false,"substitutes":["LCD Display (16x2)"]},
    {"component":"18650 Li-ion Battery","qty":1,"critical":false,"substitutes":["LiPo Battery"]},
    {"component":"Jumper Wires (set)","qty":1,"critical":false,"substitutes":[]}
  ]'::jsonb,
  'Seal all electronics from moisture. Do not submerge the Arduino.',
  null, false
)
on conflict do nothing;

-- ─────────────────────────────────────────────
-- Mock listings (8) – uses placeholder UUIDs
-- In production, these are created by real users.
-- These seed rows reference a fixed demo user profile that must be
-- inserted BEFORE the listings. Replace the UUID below with a real
-- auth.users id if testing locally.
-- ─────────────────────────────────────────────
-- (Listings seed intentionally omitted to avoid foreign-key issues;
--  run the app and create listings through the UI, or insert them
--  after creating a real user profile.)

-- ─────────────────────────────────────────────
-- SECURITY TESTS (run as different users to verify RLS)
-- ─────────────────────────────────────────────
-- Test 1: User A cannot read User B's inventory
--   As user A: select * from inventory_items where user_id = '<user_b_id>';
--   Expected: 0 rows
--
-- Test 2: User A cannot change their own role
--   As user A: update profiles set role = 'admin' where id = auth.uid();
--   Expected: ERROR - violates RLS policy (role column check)
--
-- Test 3: User A cannot update User B's listing
--   As user A: update listings set status = 'taken' where user_id = '<user_b_id>';
--   Expected: 0 rows updated
--
-- Test 4: User A cannot accept a request on User B's listing
--   As user A: update requests set status = 'accepted' where listing_id = '<user_b_listing>';
--   Expected: 0 rows updated (listing owner check fails)
--
-- Test 5: Anon user can read components and projects
--   As anon: select count(*) from components;
--   Expected: > 0
--
-- Test 6: Anon user cannot read listings
--   As anon: select * from listings;
--   Expected: 0 rows (requires authenticated)
