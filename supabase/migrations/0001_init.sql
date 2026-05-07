create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  slug text not null check (slug in ('sleep', 'meal', 'move', 'work', 'exercise', 'leisure', 'other')),
  label text not null,
  icon text,
  color text not null,
  tint text not null,
  stroke text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (user_id, slug)
);

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid not null references public.categories on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (ends_at > starts_at)
);

create index time_blocks_user_starts_at_idx on public.time_blocks (user_id, starts_at);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid not null references public.categories on delete cascade,
  daily_minutes int not null check (daily_minutes > 0),
  unique (user_id, category_id)
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.time_blocks enable row level security;
alter table public.goals enable row level security;

create policy "Profiles are user owned" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "Categories are user owned" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Time blocks are user owned" on public.time_blocks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Goals are user owned" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger time_blocks_touch_updated_at
before update on public.time_blocks
for each row execute function public.touch_updated_at();

create or replace function public.seed_default_categories_for_user(target_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.categories (user_id, slug, label, icon, color, tint, stroke, sort_order)
  values
    (target_user, 'sleep', '수면', 'Moon', '#5b6ea8', '#e8ebf5', '#3f5191', 10),
    (target_user, 'meal', '식사', 'Utensils', '#c4823f', '#f7ecdc', '#9c6829', 20),
    (target_user, 'move', '이동', 'Train', '#6c8f5d', '#e6eee0', '#4f6f43', 30),
    (target_user, 'work', '업무', 'Laptop', '#0f6cbd', '#ebf3fc', '#0c3b5e', 40),
    (target_user, 'exercise', '운동', 'Dumbbell', '#a85a5a', '#f4e2e2', '#7a3e3e', 50),
    (target_user, 'leisure', '여가', 'Gamepad2', '#8156a4', '#efe6f5', '#5e3a7a', 60),
    (target_user, 'other', '기타', 'Circle', '#707070', '#f0f0f0', '#525252', 70)
  on conflict (user_id, slug) do nothing;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  perform public.seed_default_categories_for_user(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
