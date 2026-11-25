-- Almanac → site (gingastudio.com.br)
-- Rode este arquivo uma vez no SQL Editor do Supabase (depois do schema.sql).
--
-- A tabela `registros` continua fechada (RLS: só a dona lê). Esta função é a única
-- porta pública: devolve SÓ os produtos marcados "Publicar no site" e SÓ os campos
-- do site (nome, foto principal e o objeto `site`). Custo, receita, margem,
-- clientes e encomendas não saem daqui.

create or replace function public.produtos_site()
returns table (id text, nome text, foto text, site jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.dados->>'nome', r.dados->>'foto', r.dados->'site'
  from public.registros r
  where r.tabela = 'produtos'
    and coalesce((r.dados->'site'->>'publicar')::boolean, false)
  order by r.dados->>'nome';
$$;

revoke all on function public.produtos_site() from public;
grant execute on function public.produtos_site() to anon, authenticated;
