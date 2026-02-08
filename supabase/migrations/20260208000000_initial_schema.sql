-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamptz default now() not null
);

create index idx_categories_user_id on public.categories(user_id);
alter table public.categories add constraint categories_user_name_unique unique (user_id, name);

alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- CATEGORY RULES
-- ============================================================
create table public.category_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  pattern text not null,
  created_at timestamptz default now() not null
);

create index idx_category_rules_user_id on public.category_rules(user_id);
create index idx_category_rules_category_id on public.category_rules(category_id);
alter table public.category_rules add constraint category_rules_user_pattern_unique unique (user_id, pattern);

alter table public.category_rules enable row level security;

create policy "Users can view own category_rules"
  on public.category_rules for select
  using (auth.uid() = user_id);

create policy "Users can insert own category_rules"
  on public.category_rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own category_rules"
  on public.category_rules for update
  using (auth.uid() = user_id);

create policy "Users can delete own category_rules"
  on public.category_rules for delete
  using (auth.uid() = user_id);

-- ============================================================
-- STATEMENTS
-- ============================================================
create table public.statements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_type text,
  storage_path text,
  upload_date timestamptz default now() not null,
  period_start date,
  period_end date
);

create index idx_statements_user_id on public.statements(user_id);

alter table public.statements enable row level security;

create policy "Users can view own statements"
  on public.statements for select
  using (auth.uid() = user_id);

create policy "Users can insert own statements"
  on public.statements for insert
  with check (auth.uid() = user_id);

create policy "Users can update own statements"
  on public.statements for update
  using (auth.uid() = user_id);

create policy "Users can delete own statements"
  on public.statements for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  statement_id uuid references public.statements(id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null,
  type text not null check (type in ('credit', 'debit')),
  category_id uuid references public.categories(id) on delete set null,
  raw_text text,
  created_at timestamptz default now() not null
);

create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_statement_id on public.transactions(statement_id);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_transactions_date on public.transactions(date);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- SEED DEFAULT CATEGORIES FOR NEW USERS
-- ============================================================
create or replace function public.seed_user_categories()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, color) values
    (new.id, 'Food & Dining', '#ef4444'),
    (new.id, 'Transportation', '#f59e0b'),
    (new.id, 'Shopping', '#8b5cf6'),
    (new.id, 'Bills & Utilities', '#3b82f6'),
    (new.id, 'Healthcare', '#10b981'),
    (new.id, 'Entertainment', '#ec4899'),
    (new.id, 'Travel', '#06b6d4'),
    (new.id, 'Income', '#22c55e'),
    (new.id, 'Transfer', '#a3a3a3'),
    (new.id, 'Other', '#6b7280');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.seed_user_categories();
