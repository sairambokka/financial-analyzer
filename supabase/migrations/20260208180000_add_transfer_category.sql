-- Add "Transfer" category for existing users who don't have it
insert into public.categories (user_id, name, color)
select u.id, 'Transfer', '#a3a3a3'
from auth.users u
where not exists (
  select 1 from public.categories c
  where c.user_id = u.id and c.name = 'Transfer'
);
