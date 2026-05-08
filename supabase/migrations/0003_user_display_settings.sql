alter table public.categories
add column if not exists emoji text;

update public.categories
set emoji = case slug
  when 'sleep' then '😴'
  when 'meal' then '🍽️'
  when 'move' then '🚇'
  when 'work' then '👩‍💻'
  when 'exercise' then '🏃'
  when 'leisure' then '🎮'
  else '📌'
end
where emoji is null;

alter table public.categories
alter column emoji set not null;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  timeline_start_hour int not null default 5 check (timeline_start_hour >= 0 and timeline_start_hour <= 23),
  timeline_end_hour int not null default 24 check (timeline_end_hour >= 1 and timeline_end_hour <= 24),
  category_palette_id text not null default 'default',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (timeline_end_hour > timeline_start_hour)
);

alter table public.user_settings enable row level security;

drop policy if exists "User settings are user owned" on public.user_settings;
create policy "User settings are user owned" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
before update on public.user_settings
for each row execute function public.touch_updated_at();

create or replace function public.seed_default_categories_for_user(target_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.categories (user_id, slug, label, icon, emoji, color, tint, stroke, sort_order)
  values
    (target_user, 'sleep', '수면', 'Moon', '😴', '#657895', '#e9edf3', '#40536f', 10),
    (target_user, 'meal', '식사', 'Utensils', '🍽️', '#bc7a52', '#f7ecdf', '#8f5739', 20),
    (target_user, 'move', '이동', 'Train', '🚇', '#72906a', '#edf3e9', '#536f4a', 30),
    (target_user, 'work', '업무', 'Laptop', '👩‍💻', '#4f7b68', '#e5eee8', '#2f4f40', 40),
    (target_user, 'exercise', '운동', 'Dumbbell', '🏃', '#b76661', '#f4e4e1', '#884844', 50),
    (target_user, 'leisure', '여가', 'Gamepad2', '🎮', '#806c9f', '#eee8f5', '#5b4a78', 60),
    (target_user, 'other', '기타', 'Circle', '📌', '#7a776f', '#efebe2', '#5c584f', 70)
  on conflict (user_id, slug) do nothing;
$$;
