create table if not exists public.sunscreen_checks (
  check_date date primary key,
  done boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.sunscreen_checks enable row level security;

drop policy if exists "public read sunscreen checks" on public.sunscreen_checks;
create policy "public read sunscreen checks"
on public.sunscreen_checks for select
using (true);

drop policy if exists "public insert sunscreen checks" on public.sunscreen_checks;
create policy "public insert sunscreen checks"
on public.sunscreen_checks for insert
with check (true);

drop policy if exists "public update sunscreen checks" on public.sunscreen_checks;
create policy "public update sunscreen checks"
on public.sunscreen_checks for update
using (true)
with check (true);
