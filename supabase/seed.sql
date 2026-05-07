-- Optional demo data should be inserted after creating an auth user.
-- Replace :user_id with a real auth.users.id before running manually.
select public.seed_default_categories_for_user(:user_id);
