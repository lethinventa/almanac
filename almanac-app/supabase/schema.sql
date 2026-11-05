-- Almanac: tabela única de registros por usuário.
-- Rode este arquivo uma vez no SQL Editor do Supabase.

create table if not exists public.registros (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tabela text not null,
  id text not null,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, tabela, id)
);

alter table public.registros enable row level security;

drop policy if exists "dono acessa seus registros" on public.registros;
create policy "dono acessa seus registros"
  on public.registros
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
