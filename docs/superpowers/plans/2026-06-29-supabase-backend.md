# Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o Almanac de dados mock em `lib/data.ts` + `localStorage` para Supabase (PostgreSQL + Auth), mantendo toda a interface visual intacta.

**Architecture:** Camada de repositórios (`lib/repositories/*.ts`) encapsula todas as chamadas ao Supabase — as telas param de importar do mock e passam a chamar funções assíncronas dos repositórios. O `AuthProvider` é reescrito para usar `supabase.auth`, e um middleware Next.js protege todas as rotas server-side.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, Supabase PostgreSQL + Auth

## Global Constraints

- Todas as páginas são `"use client"` — usar apenas o browser client do Supabase para data fetching
- Design system Atlas: não alterar nenhum CSS, className, ou estrutura de JSX visual
- Não remover `lib/data.ts` até a Task 10 (mantém mocks durante a migração)
- Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (configuradas em `almanac-app/.env.local`)
- Working directory para todos os comandos: `almanac-app/`
- Commit após cada task completa

---

## File Map

**Novos arquivos:**
- `almanac-app/.env.local` — variáveis de ambiente (não commitado)
- `almanac-app/middleware.ts` — proteção de rotas server-side
- `almanac-app/lib/supabase/client.ts` — browser client Supabase
- `almanac-app/lib/supabase/types.ts` — tipos TypeScript do schema
- `almanac-app/lib/repositories/configuracoes.ts`
- `almanac-app/lib/repositories/financeiro.ts`
- `almanac-app/lib/repositories/insumos.ts`
- `almanac-app/lib/repositories/produtos.ts`
- `almanac-app/lib/repositories/pronta-entrega.ts`
- `almanac-app/lib/repositories/encomendas.ts`
- `almanac-app/lib/repositories/pagamentos.ts`

**Arquivos modificados:**
- `almanac-app/package.json` — adicionar dependências Supabase
- `almanac-app/contexts/auth-context.tsx` — substituir localStorage auth por Supabase Auth
- `almanac-app/app/login/page.tsx` — login assíncrono real
- `almanac-app/app/layout.tsx` — remover dependência de `lib/auth.ts`
- `almanac-app/app/configuracoes/page.tsx`
- `almanac-app/app/financeiro/page.tsx`
- `almanac-app/app/insumos/page.tsx`
- `almanac-app/app/produtos/page.tsx`
- `almanac-app/app/pronta-entrega/page.tsx`
- `almanac-app/app/pronta-entrega/[id]/page.tsx`
- `almanac-app/app/encomendas/page.tsx`
- `almanac-app/app/encomendas/[id]/page.tsx`
- `almanac-app/app/page.tsx` (dashboard)

**Removido na Task 10:**
- `almanac-app/lib/data.ts` — substituído pelos repositórios
- `almanac-app/lib/auth.ts` — substituído por Supabase Auth

---

## Task 1: Instalar dependências + Supabase client

**Files:**
- Modify: `almanac-app/package.json`
- Create: `almanac-app/lib/supabase/client.ts`
- Create: `almanac-app/.env.local`

**Interfaces:**
- Produces: `createClient()` → `SupabaseClient<Database>` — usado por todos os repositórios e pelo auth-context

- [ ] **Step 1: Instalar pacotes Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected output: packages added to `node_modules/` e `package.json` atualizado.

- [ ] **Step 2: Criar `.env.local` com as credenciais do Supabase**

Crie o arquivo `almanac-app/.env.local` com o seguinte conteúdo (substituindo pelos valores reais do painel do Supabase em Project Settings → API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

> **Nota:** Este arquivo não deve ser commitado. Verifique que `.env.local` está no `.gitignore`.

- [ ] **Step 3: Criar o browser client**

Crie `almanac-app/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Verificar que o Next.js inicia sem erros**

```bash
npm run dev
```

Expected: servidor rodando em `http://localhost:3001` sem erros de compilação. Parar com Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/supabase/client.ts
git commit -m "feat: add Supabase client setup"
```

---

## Task 2: Schema do banco de dados (SQL DDL + RLS)

**Files:**
- Nenhum arquivo no repo — SQL executado diretamente no Supabase SQL Editor

**Interfaces:**
- Produces: 13 tabelas no Supabase com RLS habilitado

- [ ] **Step 1: Abrir o Supabase SQL Editor**

No painel do Supabase, clique em **SQL Editor** → **New query**.

- [ ] **Step 2: Executar o SQL de criação das tabelas**

Cole e execute o seguinte SQL:

```sql
-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ── Insumos ──────────────────────────────────────────────────
create table insumos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text not null check (categoria in ('visivel', 'invisivel', 'ferramenta', 'maquinario')),
  unidade text not null,
  preco_atual numeric not null default 0,
  estoque numeric,
  estoque_min numeric,
  fornecedor text,
  created_at timestamptz default now()
);

create table insumo_historico_preco (
  id uuid primary key default uuid_generate_v4(),
  insumo_id uuid not null references insumos(id) on delete cascade,
  data date not null,
  preco numeric not null
);

-- ── Produtos ─────────────────────────────────────────────────
create table produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text not null,
  tempo_producao integer not null default 0,
  custo numeric not null default 0,
  preco_sugerido numeric not null default 0,
  margem numeric not null default 0,
  foto text,
  pronto_estoque integer,
  pronto_estoque_min integer,
  created_at timestamptz default now()
);

create table produto_receita (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  insumo_id uuid not null references insumos(id) on delete restrict,
  quantidade numeric not null
);

create table produto_etapas_3d (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null unique references produtos(id) on delete cascade,
  impressao integer,
  modelagem integer,
  acabamento integer
);

create table lotes_producao (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  quantidade integer not null,
  data date not null,
  observacao text
);

-- ── Encomendas ───────────────────────────────────────────────
create table encomendas (
  id uuid primary key default uuid_generate_v4(),
  cliente text not null,
  canal text not null check (canal in ('whatsapp', 'presencial')),
  status text not null default 'aguardando' check (status in ('aguardando', 'em_producao', 'pronto', 'entregue', 'cancelado')),
  data_pedido date not null,
  data_entrega date not null,
  desconto numeric not null default 0,
  total_cobrado numeric not null default 0,
  custo_producao numeric not null default 0,
  margem numeric not null default 0,
  observacoes text,
  observacoes_internas text,
  foto text,
  created_at timestamptz default now()
);

create table encomenda_itens (
  id uuid primary key default uuid_generate_v4(),
  encomenda_id uuid not null references encomendas(id) on delete cascade,
  produto_id uuid not null references produtos(id) on delete restrict,
  quantidade integer not null,
  preco_unitario numeric not null
);

create table encomenda_pagamentos (
  id uuid primary key default uuid_generate_v4(),
  encomenda_id uuid not null references encomendas(id) on delete cascade,
  valor numeric not null,
  metodo text not null check (metodo in ('pix', 'dinheiro', 'cartao')),
  data date not null,
  tipo text not null check (tipo in ('recebimento', 'estorno')),
  motivo_estorno text,
  created_at timestamptz default now()
);

create table encomenda_links_uteis (
  id uuid primary key default uuid_generate_v4(),
  encomenda_id uuid not null references encomendas(id) on delete cascade,
  label text not null,
  url text not null
);

-- ── Pronta Entrega ───────────────────────────────────────────
create table produtos_pe (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  foto text,
  preco_venda numeric not null default 0,
  estoque_atual integer not null default 0,
  estoque_min integer not null default 0,
  created_at timestamptz default now()
);

-- ── Financeiro ───────────────────────────────────────────────
create table custos_indiretos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  valor_mensal numeric not null default 0
);

-- ── Configurações (singleton) ────────────────────────────────
create table configuracoes (
  id integer primary key default 1 check (id = 1),
  horas_trabalho_mes numeric not null default 160,
  multiplicador_preco numeric not null default 3,
  custo_hora_bambu numeric not null default 4.5
);

insert into configuracoes (id) values (1) on conflict do nothing;
```

Expected: "Success. No rows returned."

- [ ] **Step 3: Executar o SQL de RLS (Row Level Security)**

Nova query no SQL Editor:

```sql
-- Habilitar RLS em todas as tabelas
alter table insumos enable row level security;
alter table insumo_historico_preco enable row level security;
alter table produtos enable row level security;
alter table produto_receita enable row level security;
alter table produto_etapas_3d enable row level security;
alter table lotes_producao enable row level security;
alter table encomendas enable row level security;
alter table encomenda_itens enable row level security;
alter table encomenda_pagamentos enable row level security;
alter table encomenda_links_uteis enable row level security;
alter table produtos_pe enable row level security;
alter table custos_indiretos enable row level security;
alter table configuracoes enable row level security;

-- Políticas: só usuários autenticados podem ler e escrever
create policy "auth_all" on insumos for all to authenticated using (true) with check (true);
create policy "auth_all" on insumo_historico_preco for all to authenticated using (true) with check (true);
create policy "auth_all" on produtos for all to authenticated using (true) with check (true);
create policy "auth_all" on produto_receita for all to authenticated using (true) with check (true);
create policy "auth_all" on produto_etapas_3d for all to authenticated using (true) with check (true);
create policy "auth_all" on lotes_producao for all to authenticated using (true) with check (true);
create policy "auth_all" on encomendas for all to authenticated using (true) with check (true);
create policy "auth_all" on encomenda_itens for all to authenticated using (true) with check (true);
create policy "auth_all" on encomenda_pagamentos for all to authenticated using (true) with check (true);
create policy "auth_all" on encomenda_links_uteis for all to authenticated using (true) with check (true);
create policy "auth_all" on produtos_pe for all to authenticated using (true) with check (true);
create policy "auth_all" on custos_indiretos for all to authenticated using (true) with check (true);
create policy "auth_all" on configuracoes for all to authenticated using (true) with check (true);
```

Expected: "Success. No rows returned."

- [ ] **Step 4: Criar usuário no Supabase Auth**

No painel do Supabase: **Authentication** → **Users** → **Add user** → **Create new user**.
Preencher com o e-mail e senha que a usuária vai usar para fazer login no Almanac.

- [ ] **Step 5: Verificar tabelas no Table Editor**

No painel do Supabase, clique em **Table Editor** e confirme que as 13 tabelas aparecem: `insumos`, `insumo_historico_preco`, `produtos`, `produto_receita`, `produto_etapas_3d`, `lotes_producao`, `encomendas`, `encomenda_itens`, `encomenda_pagamentos`, `encomenda_links_uteis`, `produtos_pe`, `custos_indiretos`, `configuracoes`.

> Nenhum commit necessário nesta task — as mudanças são no Supabase, não no código.

---

## Task 3: Tipos TypeScript + Supabase Auth

**Files:**
- Create: `almanac-app/lib/supabase/types.ts`
- Create: `almanac-app/middleware.ts`
- Modify: `almanac-app/contexts/auth-context.tsx`
- Modify: `almanac-app/app/login/page.tsx`

**Interfaces:**
- Consumes: `createClient()` de `lib/supabase/client.ts`
- Produces: `useAuth()` → `{ user, ready, logout }` — mesmo contrato que antes, compatível com `app-shell` e demais componentes que já usam `useAuth()`

- [ ] **Step 1: Criar `lib/supabase/types.ts`**

```ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      insumos: {
        Row: {
          id: string
          nome: string
          categoria: 'visivel' | 'invisivel' | 'ferramenta' | 'maquinario'
          unidade: string
          preco_atual: number
          estoque: number | null
          estoque_min: number | null
          fornecedor: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['insumos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['insumos']['Insert']>
      }
      insumo_historico_preco: {
        Row: { id: string; insumo_id: string; data: string; preco: number }
        Insert: Omit<Database['public']['Tables']['insumo_historico_preco']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['insumo_historico_preco']['Insert']>
      }
      produtos: {
        Row: {
          id: string
          nome: string
          categoria: string
          tempo_producao: number
          custo: number
          preco_sugerido: number
          margem: number
          foto: string | null
          pronto_estoque: number | null
          pronto_estoque_min: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['produtos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produtos']['Insert']>
      }
      produto_receita: {
        Row: { id: string; produto_id: string; insumo_id: string; quantidade: number }
        Insert: Omit<Database['public']['Tables']['produto_receita']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produto_receita']['Insert']>
      }
      produto_etapas_3d: {
        Row: { id: string; produto_id: string; impressao: number | null; modelagem: number | null; acabamento: number | null }
        Insert: Omit<Database['public']['Tables']['produto_etapas_3d']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produto_etapas_3d']['Insert']>
      }
      lotes_producao: {
        Row: { id: string; produto_id: string; quantidade: number; data: string; observacao: string | null }
        Insert: Omit<Database['public']['Tables']['lotes_producao']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['lotes_producao']['Insert']>
      }
      encomendas: {
        Row: {
          id: string
          cliente: string
          canal: 'whatsapp' | 'presencial'
          status: 'aguardando' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado'
          data_pedido: string
          data_entrega: string
          desconto: number
          total_cobrado: number
          custo_producao: number
          margem: number
          observacoes: string | null
          observacoes_internas: string | null
          foto: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['encomendas']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomendas']['Insert']>
      }
      encomenda_itens: {
        Row: { id: string; encomenda_id: string; produto_id: string; quantidade: number; preco_unitario: number }
        Insert: Omit<Database['public']['Tables']['encomenda_itens']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomenda_itens']['Insert']>
      }
      encomenda_pagamentos: {
        Row: {
          id: string
          encomenda_id: string
          valor: number
          metodo: 'pix' | 'dinheiro' | 'cartao'
          data: string
          tipo: 'recebimento' | 'estorno'
          motivo_estorno: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['encomenda_pagamentos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomenda_pagamentos']['Insert']>
      }
      encomenda_links_uteis: {
        Row: { id: string; encomenda_id: string; label: string; url: string }
        Insert: Omit<Database['public']['Tables']['encomenda_links_uteis']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomenda_links_uteis']['Insert']>
      }
      produtos_pe: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          foto: string | null
          preco_venda: number
          estoque_atual: number
          estoque_min: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['produtos_pe']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produtos_pe']['Insert']>
      }
      custos_indiretos: {
        Row: { id: string; nome: string; valor_mensal: number }
        Insert: Omit<Database['public']['Tables']['custos_indiretos']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['custos_indiretos']['Insert']>
      }
      configuracoes: {
        Row: { id: number; horas_trabalho_mes: number; multiplicador_preco: number; custo_hora_bambu: number }
        Insert: Partial<Database['public']['Tables']['configuracoes']['Row']>
        Update: Partial<Database['public']['Tables']['configuracoes']['Row']>
      }
    }
  }
}
```

- [ ] **Step 2: Criar `middleware.ts`**

Crie `almanac-app/middleware.ts` (na raiz de `almanac-app/`, mesmo nível que `package.json`):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 3: Substituir `contexts/auth-context.tsx`**

Reescreva o arquivo por completo:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session && pathname !== "/login") router.replace("/login");
      if (session && pathname === "/login") router.replace("/");
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, ready, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 4: Substituir `app/login/page.tsx`**

Reescreva o arquivo por completo. A estrutura visual (JSX, classes CSS) não muda — só a lógica de submit:

```tsx
"use client";

import { useState, FormEvent } from "react";
import { BookMarked } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-raised)",
              border: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookMarked size={22} strokeWidth={1.5} style={{ color: "var(--text-primary)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Almanac</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>Papelaria criativa</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>Entrar</div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">E-mail</label>
            <input
              className="atlas-input"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Senha</label>
            <input
              className="atlas-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <div style={{ fontSize: 12, color: "var(--status-error)", padding: "6px 10px", background: "rgba(244,71,71,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(244,71,71,0.2)" }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="atlas-btn atlas-btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verificar que `app-shell` ainda compila**

O `app-shell` usa `useAuth()` para exibir nome do usuário e botão de logout. Como o contrato de `useAuth()` mudou (`user` agora é `User | null` do Supabase em vez de `{ nome, email, role }`), precisamos verificar quais propriedades o shell usa.

Ler `almanac-app/components/shell/app-shell.tsx` e ajustar referências a `user.nome` → `user.email` (o Supabase Auth não tem campo `nome` por padrão). Se o shell exibir iniciais ou nome, usar `user.email?.split('@')[0]` como fallback.

- [ ] **Step 6: Iniciar o servidor e testar login**

```bash
npm run dev
```

1. Acessar `http://localhost:3001` — deve redirecionar para `/login`
2. Tentar entrar com credenciais erradas — deve exibir "E-mail ou senha incorretos."
3. Entrar com e-mail e senha criados no Supabase Auth (Task 2, Step 4) — deve redirecionar para `/`
4. Recarregar a página — deve manter sessão ativa sem redirecionar para `/login`
5. Fazer logout — deve voltar para `/login`

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/types.ts middleware.ts contexts/auth-context.tsx app/login/page.tsx
git commit -m "feat: replace localStorage auth with Supabase Auth"
```

---

## Task 4: Repositório de Configurações

**Files:**
- Create: `almanac-app/lib/repositories/configuracoes.ts`
- Modify: `almanac-app/app/configuracoes/page.tsx`

**Interfaces:**
- Consumes: `createClient()` de `lib/supabase/client.ts`
- Produces:
  - `buscarConfiguracoes(): Promise<Configuracoes>` — retorna linha singleton da tabela `configuracoes`
  - `salvarConfiguracoes(config: Partial<Configuracoes>): Promise<void>` — faz upsert na linha id=1

- [ ] **Step 1: Criar `lib/repositories/configuracoes.ts`**

```ts
import { createClient } from '@/lib/supabase/client'

export interface Configuracoes {
  horasTrabalhoMes: number
  multiplicadorPreco: number
  custoHoraBambu: number
}

const DEFAULTS: Configuracoes = {
  horasTrabalhoMes: 160,
  multiplicadorPreco: 3,
  custoHoraBambu: 4.5,
}

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) return DEFAULTS

  return {
    horasTrabalhoMes: data.horas_trabalho_mes,
    multiplicadorPreco: data.multiplicador_preco,
    custoHoraBambu: data.custo_hora_bambu,
  }
}

export async function salvarConfiguracoes(config: Partial<Configuracoes>): Promise<void> {
  const supabase = createClient()
  const update: Record<string, number> = {}
  if (config.horasTrabalhoMes !== undefined) update.horas_trabalho_mes = config.horasTrabalhoMes
  if (config.multiplicadorPreco !== undefined) update.multiplicador_preco = config.multiplicadorPreco
  if (config.custoHoraBambu !== undefined) update.custo_hora_bambu = config.custoHoraBambu

  await supabase.from('configuracoes').upsert({ id: 1, ...update })
}
```

- [ ] **Step 2: Atualizar `app/configuracoes/page.tsx`**

Substituir as funções `loadConfig`/`saveConfig` (que usam `localStorage`) pelas funções do repositório. Também remover a importação de `totalCustosIndiretos` de `lib/data.ts` — o valor real virá do repositório de financeiro. Por ora, usar `0` como placeholder até a Task 5 migrar os custos indiretos.

Localizar no arquivo as importações:
```ts
import {
  totalCustosIndiretos,
  DEFAULT_CONFIGURACOES,
  type Configuracoes,
  formatBRL,
} from "@/lib/data";
```

Substituir por:
```ts
import { buscarConfiguracoes, salvarConfiguracoes, type Configuracoes } from "@/lib/repositories/configuracoes";
import { buscarTotalCustosIndiretos } from "@/lib/repositories/financeiro";
import { formatBRL } from "@/lib/data";
```

> **Nota:** `buscarTotalCustosIndiretos` será criado na Task 5. Por ora, crie uma função stub temporária em `lib/repositories/financeiro.ts`:
> ```ts
> export async function buscarTotalCustosIndiretos(): Promise<number> { return 0 }
> ```

Substituir as funções locais `loadConfig` e `saveConfig` e o `useEffect` inicial:

```ts
// Remover:
function loadConfig(): Configuracoes { ... }
function saveConfig(config: Configuracoes) { ... }

// Adicionar no componente, substituindo o useEffect atual:
const [totalCustos, setTotalCustos] = useState(0);

useEffect(() => {
  buscarConfiguracoes().then(setConfig);
  buscarTotalCustosIndiretos().then(setTotalCustos);
}, []);
```

Substituir `totalCustosIndiretos` (constante do mock) por `totalCustos` (state) no cálculo de `hourlyRate`:
```ts
const hourlyRate = config.horasTrabalhoMes > 0 ? totalCustos / config.horasTrabalhoMes : 0;
```

Substituir a função `handleSave`:
```ts
async function handleSave() {
  await salvarConfiguracoes(config);
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
}
```

Marcar o componente como `async`-compatible: o `handleSave` agora é `async`, então o botão onClick deve ser `onClick={handleSave}` (sem mudança de JSX).

- [ ] **Step 3: Verificar a página de Configurações**

```bash
npm run dev
```

1. Acessar `http://localhost:3001/configuracoes`
2. Os campos devem exibir os valores padrão (160h, ×3, R$4,50)
3. Alterar um valor e clicar "Salvar" — deve exibir feedback de salvo
4. Recarregar a página — os valores alterados devem persistir (vindos do Supabase)
5. Confirmar no Supabase Table Editor que a linha `id=1` da tabela `configuracoes` foi atualizada

- [ ] **Step 4: Commit**

```bash
git add lib/repositories/configuracoes.ts lib/repositories/financeiro.ts app/configuracoes/page.tsx
git commit -m "feat: migrate configuracoes to Supabase"
```

---

## Task 5: Repositório de Custos Indiretos (Financeiro)

**Files:**
- Modify: `almanac-app/lib/repositories/financeiro.ts` (substituir stub por implementação real)
- Modify: `almanac-app/app/financeiro/page.tsx`

**Interfaces:**
- Consumes: `createClient()` de `lib/supabase/client.ts`
- Produces:
  - `buscarCustosIndiretos(): Promise<CustoIndireto[]>`
  - `buscarTotalCustosIndiretos(): Promise<number>`
  - `criarCustoIndireto(dados: { nome: string; valorMensal: number }): Promise<CustoIndireto>`
  - `editarCustoIndireto(id: string, dados: { nome?: string; valorMensal?: number }): Promise<CustoIndireto>`
  - `deletarCustoIndireto(id: string): Promise<void>`

- [ ] **Step 1: Implementar `lib/repositories/financeiro.ts`**

Substituir o stub criado na Task 4 pela implementação completa:

```ts
import { createClient } from '@/lib/supabase/client'

export interface CustoIndireto {
  id: string
  nome: string
  valorMensal: number
}

export async function buscarCustosIndiretos(): Promise<CustoIndireto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custos_indiretos')
    .select('*')
    .order('nome')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    nome: row.nome,
    valorMensal: row.valor_mensal,
  }))
}

export async function buscarTotalCustosIndiretos(): Promise<number> {
  const custos = await buscarCustosIndiretos()
  return custos.reduce((sum, c) => sum + c.valorMensal, 0)
}

export async function criarCustoIndireto(dados: { nome: string; valorMensal: number }): Promise<CustoIndireto> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custos_indiretos')
    .insert({ nome: dados.nome, valor_mensal: dados.valorMensal })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao criar custo indireto')

  return { id: data.id, nome: data.nome, valorMensal: data.valor_mensal }
}

export async function editarCustoIndireto(
  id: string,
  dados: { nome?: string; valorMensal?: number }
): Promise<CustoIndireto> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if (dados.valorMensal !== undefined) update.valor_mensal = dados.valorMensal

  const { data, error } = await supabase
    .from('custos_indiretos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao editar custo indireto')

  return { id: data.id, nome: data.nome, valorMensal: data.valor_mensal }
}

export async function deletarCustoIndireto(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('custos_indiretos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Ler `app/financeiro/page.tsx` para entender estrutura atual**

Antes de editar, ler o arquivo completo para mapear: onde `custosIndiretos` e `totalCustosIndiretos` são importados do mock, onde são usados no state, e onde as funções de CRUD estão.

- [ ] **Step 3: Migrar `app/financeiro/page.tsx`**

Localizar as importações do mock:
```ts
import { custosIndiretos as custosIndiretosMock, totalCustosIndiretos, ... } from "@/lib/data"
```

Substituir por:
```ts
import {
  buscarCustosIndiretos,
  criarCustoIndireto,
  editarCustoIndireto,
  deletarCustoIndireto,
  type CustoIndireto,
} from "@/lib/repositories/financeiro"
```

Substituir inicialização de state de `custosIndiretos` (atualmente inicializado com o mock) por array vazio + carregamento via `useEffect`:

```ts
const [custos, setCustos] = useState<CustoIndireto[]>([])

useEffect(() => {
  buscarCustosIndiretos().then(setCustos)
}, [])

const totalCustosIndiretos = custos.reduce((sum, c) => sum + c.valorMensal, 0)
```

Substituir as funções de CRUD locais (que manipulavam arrays em memória) por chamadas assíncronas ao repositório, seguidas de `buscarCustosIndiretos().then(setCustos)` para re-sincronizar o state.

Exemplo para a função de criar:
```ts
async function handleCriarCusto(nome: string, valorMensal: number) {
  await criarCustoIndireto({ nome, valorMensal })
  buscarCustosIndiretos().then(setCustos)
}
```

Aplicar o mesmo padrão para editar e deletar.

- [ ] **Step 4: Verificar a seção de Custos Indiretos no Financeiro**

```bash
npm run dev
```

1. Acessar `http://localhost:3001/financeiro`
2. A lista de custos deve aparecer vazia (banco vazio) ou com os dados que existirem no Supabase
3. Criar um custo indireto (ex: "Energia elétrica", R$110) — deve aparecer na lista
4. Editar o custo — deve refletir a mudança
5. Deletar o custo — deve sumir da lista
6. Confirmar no Supabase Table Editor que os dados estão sendo persistidos

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/financeiro.ts app/financeiro/page.tsx
git commit -m "feat: migrate custos indiretos to Supabase"
```

---

## Task 6: Repositório de Insumos

**Files:**
- Create: `almanac-app/lib/repositories/insumos.ts`
- Modify: `almanac-app/app/insumos/page.tsx`

**Interfaces:**
- Produces:
  - `buscarInsumos(): Promise<Insumo[]>` — retorna todos os insumos com histórico de preço
  - `criarInsumo(dados: InsumoInput): Promise<Insumo>`
  - `editarInsumo(id: string, dados: Partial<InsumoInput>): Promise<Insumo>`
  - `deletarInsumo(id: string): Promise<void>`
  - `registrarPreco(insumoId: string, preco: number, data: string): Promise<void>`

- [ ] **Step 1: Criar `lib/repositories/insumos.ts`**

```ts
import { createClient } from '@/lib/supabase/client'

export type InsumoCategoria = 'visivel' | 'invisivel' | 'ferramenta' | 'maquinario'

export interface Insumo {
  id: string
  nome: string
  categoria: InsumoCategoria
  unidade: string
  precoAtual: number
  estoque: number | null
  estoqueMin: number | null
  fornecedor?: string
  historico: { data: string; preco: number }[]
}

export interface InsumoInput {
  nome: string
  categoria: InsumoCategoria
  unidade: string
  precoAtual: number
  estoque?: number | null
  estoqueMin?: number | null
  fornecedor?: string
}

export async function buscarInsumos(): Promise<Insumo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .select(`*, insumo_historico_preco(id, data, preco)`)
    .order('nome')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    nome: row.nome,
    categoria: row.categoria as InsumoCategoria,
    unidade: row.unidade,
    precoAtual: row.preco_atual,
    estoque: row.estoque,
    estoqueMin: row.estoque_min,
    fornecedor: row.fornecedor ?? undefined,
    historico: (row.insumo_historico_preco ?? [])
      .sort((a: { data: string }, b: { data: string }) => a.data.localeCompare(b.data))
      .map((h: { data: string; preco: number }) => ({ data: h.data, preco: h.preco })),
  }))
}

export async function criarInsumo(dados: InsumoInput): Promise<Insumo> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .insert({
      nome: dados.nome,
      categoria: dados.categoria,
      unidade: dados.unidade,
      preco_atual: dados.precoAtual,
      estoque: dados.estoque ?? null,
      estoque_min: dados.estoqueMin ?? null,
      fornecedor: dados.fornecedor ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao criar insumo')

  if (dados.precoAtual > 0) {
    await registrarPreco(data.id, dados.precoAtual, new Date().toISOString().slice(0, 10))
  }

  return {
    id: data.id,
    nome: data.nome,
    categoria: data.categoria as InsumoCategoria,
    unidade: data.unidade,
    precoAtual: data.preco_atual,
    estoque: data.estoque,
    estoqueMin: data.estoque_min,
    fornecedor: data.fornecedor ?? undefined,
    historico: dados.precoAtual > 0
      ? [{ data: new Date().toISOString().slice(0, 10), preco: dados.precoAtual }]
      : [],
  }
}

export async function editarInsumo(id: string, dados: Partial<InsumoInput>): Promise<Insumo> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if (dados.categoria !== undefined) update.categoria = dados.categoria
  if (dados.unidade !== undefined) update.unidade = dados.unidade
  if (dados.precoAtual !== undefined) update.preco_atual = dados.precoAtual
  if ('estoque' in dados) update.estoque = dados.estoque ?? null
  if ('estoqueMin' in dados) update.estoque_min = dados.estoqueMin ?? null
  if ('fornecedor' in dados) update.fornecedor = dados.fornecedor ?? null

  const { data, error } = await supabase
    .from('insumos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao editar insumo')

  if (dados.precoAtual !== undefined) {
    await registrarPreco(id, dados.precoAtual, new Date().toISOString().slice(0, 10))
  }

  const insumos = await buscarInsumos()
  return insumos.find(i => i.id === id)!
}

export async function deletarInsumo(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function registrarPreco(insumoId: string, preco: number, data: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('insumo_historico_preco').insert({ insumo_id: insumoId, preco, data })
}
```

- [ ] **Step 2: Ler `app/insumos/page.tsx` para mapear uso do mock**

Ler o arquivo completo e identificar: onde `insumos` é importado, como é usado no state, e onde as funções de CRUD estão definidas.

- [ ] **Step 3: Migrar `app/insumos/page.tsx`**

Substituir a importação do mock:
```ts
// Remover:
import { insumos as insumosMock, ... } from "@/lib/data"

// Adicionar:
import {
  buscarInsumos,
  criarInsumo,
  editarInsumo,
  deletarInsumo,
  registrarPreco,
  type Insumo,
  type InsumoInput,
  type InsumoCategoria,
} from "@/lib/repositories/insumos"
```

Substituir inicialização de state:
```ts
// Remover:
const [insumos, setInsumos] = useState(insumosMock)

// Adicionar:
const [insumos, setInsumos] = useState<Insumo[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  buscarInsumos().then(data => { setInsumos(data); setLoading(false) })
}, [])
```

Substituir operações de CRUD locais (que mutavam arrays em memória) por chamadas ao repositório seguidas de `buscarInsumos().then(setInsumos)`.

Manter o `formatBRL`, `categoriaLabel`, `statusBadge` importados de `lib/data.ts` — esses helpers de formatação podem continuar lá por enquanto.

- [ ] **Step 4: Verificar a página de Insumos**

```bash
npm run dev
```

1. Acessar `http://localhost:3001/insumos` — lista deve aparecer vazia
2. Criar um insumo (ex: "Papel A4 premium", rotativo visível, folha, R$0,15)
3. Verificar que aparece na lista
4. Editar o preço — histórico de preços deve ser registrado
5. Deletar o insumo — deve sumir
6. Confirmar no Supabase Table Editor

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/insumos.ts app/insumos/page.tsx
git commit -m "feat: migrate insumos to Supabase"
```

---

## Task 7: Repositório de Produtos + Receitas

**Files:**
- Create: `almanac-app/lib/repositories/produtos.ts`
- Modify: `almanac-app/app/produtos/page.tsx`

**Interfaces:**
- Consumes: `buscarInsumos()` de `lib/repositories/insumos.ts` (para montar a receita com dados do insumo)
- Produces:
  - `buscarProdutos(): Promise<Produto[]>` — produtos com receita, etapas 3D e lotes
  - `criarProduto(dados: ProdutoInput): Promise<Produto>`
  - `editarProduto(id: string, dados: Partial<ProdutoInput>): Promise<Produto>`
  - `deletarProduto(id: string): Promise<void>`
  - `registrarLote(produtoId: string, lote: { quantidade: number; data: string; observacao?: string }): Promise<void>`

- [ ] **Step 1: Criar `lib/repositories/produtos.ts`**

```ts
import { createClient } from '@/lib/supabase/client'

export interface InsumoReceita {
  insumoId: string
  quantidade: number
}

export interface Etapas3D {
  impressao?: number
  modelagem?: number
  acabamento?: number
}

export interface LoteProducao {
  id: string
  produtoId: string
  quantidade: number
  data: string
  observacao?: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  receita: InsumoReceita[]
  tempoProducao: number
  custo: number
  precoSugerido: number
  margem: number
  foto?: string
  prontoEstoque?: number
  prontoEstoqueMin?: number
  etapas3D?: Etapas3D
  historicoLotes?: LoteProducao[]
}

export interface ProdutoInput {
  nome: string
  categoria: string
  receita: InsumoReceita[]
  tempoProducao: number
  custo: number
  precoSugerido: number
  margem: number
  foto?: string
  prontoEstoque?: number | null
  prontoEstoqueMin?: number | null
  etapas3D?: Etapas3D | null
}

export async function buscarProdutos(): Promise<Produto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      *,
      produto_receita(insumo_id, quantidade),
      produto_etapas_3d(impressao, modelagem, acabamento),
      lotes_producao(id, quantidade, data, observacao)
    `)
    .order('nome')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    receita: (row.produto_receita ?? []).map((r: { insumo_id: string; quantidade: number }) => ({
      insumoId: r.insumo_id,
      quantidade: r.quantidade,
    })),
    tempoProducao: row.tempo_producao,
    custo: row.custo,
    precoSugerido: row.preco_sugerido,
    margem: row.margem,
    foto: row.foto ?? undefined,
    prontoEstoque: row.pronto_estoque ?? undefined,
    prontoEstoqueMin: row.pronto_estoque_min ?? undefined,
    etapas3D: row.produto_etapas_3d?.[0]
      ? {
          impressao: row.produto_etapas_3d[0].impressao ?? undefined,
          modelagem: row.produto_etapas_3d[0].modelagem ?? undefined,
          acabamento: row.produto_etapas_3d[0].acabamento ?? undefined,
        }
      : undefined,
    historicoLotes: (row.lotes_producao ?? [])
      .sort((a: { data: string }, b: { data: string }) => b.data.localeCompare(a.data))
      .map((l: { id: string; quantidade: number; data: string; observacao: string | null }) => ({
        id: l.id,
        produtoId: row.id,
        quantidade: l.quantidade,
        data: l.data,
        observacao: l.observacao ?? undefined,
      })),
  }))
}

export async function criarProduto(dados: ProdutoInput): Promise<Produto> {
  const supabase = createClient()

  const { data: produto, error } = await supabase
    .from('produtos')
    .insert({
      nome: dados.nome,
      categoria: dados.categoria,
      tempo_producao: dados.tempoProducao,
      custo: dados.custo,
      preco_sugerido: dados.precoSugerido,
      margem: dados.margem,
      foto: dados.foto ?? null,
      pronto_estoque: dados.prontoEstoque ?? null,
      pronto_estoque_min: dados.prontoEstoqueMin ?? null,
    })
    .select()
    .single()

  if (error || !produto) throw new Error(error?.message ?? 'Erro ao criar produto')

  if (dados.receita.length > 0) {
    await supabase.from('produto_receita').insert(
      dados.receita.map(r => ({ produto_id: produto.id, insumo_id: r.insumoId, quantidade: r.quantidade }))
    )
  }

  if (dados.etapas3D) {
    await supabase.from('produto_etapas_3d').insert({
      produto_id: produto.id,
      impressao: dados.etapas3D.impressao ?? null,
      modelagem: dados.etapas3D.modelagem ?? null,
      acabamento: dados.etapas3D.acabamento ?? null,
    })
  }

  const produtos = await buscarProdutos()
  return produtos.find(p => p.id === produto.id)!
}

export async function editarProduto(id: string, dados: Partial<ProdutoInput>): Promise<Produto> {
  const supabase = createClient()

  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if (dados.categoria !== undefined) update.categoria = dados.categoria
  if (dados.tempoProducao !== undefined) update.tempo_producao = dados.tempoProducao
  if (dados.custo !== undefined) update.custo = dados.custo
  if (dados.precoSugerido !== undefined) update.preco_sugerido = dados.precoSugerido
  if (dados.margem !== undefined) update.margem = dados.margem
  if ('foto' in dados) update.foto = dados.foto ?? null
  if ('prontoEstoque' in dados) update.pronto_estoque = dados.prontoEstoque ?? null
  if ('prontoEstoqueMin' in dados) update.pronto_estoque_min = dados.prontoEstoqueMin ?? null

  if (Object.keys(update).length > 0) {
    await supabase.from('produtos').update(update).eq('id', id)
  }

  if (dados.receita !== undefined) {
    await supabase.from('produto_receita').delete().eq('produto_id', id)
    if (dados.receita.length > 0) {
      await supabase.from('produto_receita').insert(
        dados.receita.map(r => ({ produto_id: id, insumo_id: r.insumoId, quantidade: r.quantidade }))
      )
    }
  }

  if ('etapas3D' in dados) {
    await supabase.from('produto_etapas_3d').delete().eq('produto_id', id)
    if (dados.etapas3D) {
      await supabase.from('produto_etapas_3d').insert({
        produto_id: id,
        impressao: dados.etapas3D.impressao ?? null,
        modelagem: dados.etapas3D.modelagem ?? null,
        acabamento: dados.etapas3D.acabamento ?? null,
      })
    }
  }

  const produtos = await buscarProdutos()
  return produtos.find(p => p.id === id)!
}

export async function deletarProduto(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function registrarLote(
  produtoId: string,
  lote: { quantidade: number; data: string; observacao?: string }
): Promise<void> {
  const supabase = createClient()
  await supabase.from('lotes_producao').insert({
    produto_id: produtoId,
    quantidade: lote.quantidade,
    data: lote.data,
    observacao: lote.observacao ?? null,
  })
}
```

- [ ] **Step 2: Migrar `app/produtos/page.tsx`**

Ler o arquivo completo. Substituir importações do mock por importações do repositório. Substituir state inicializado com mock por carregamento assíncrono:

```ts
const [produtos, setProdutos] = useState<Produto[]>([])

useEffect(() => {
  buscarProdutos().then(setProdutos)
}, [])
```

Adaptar CRUD local para chamadas assíncronas ao repositório + reload após cada operação.

- [ ] **Step 3: Verificar página de Produtos**

1. Acessar `http://localhost:3001/produtos`
2. Criar um produto com receita (requer insumos cadastrados na Task 6)
3. Editar a receita
4. Registrar um lote
5. Deletar o produto
6. Confirmar no Supabase Table Editor

- [ ] **Step 4: Commit**

```bash
git add lib/repositories/produtos.ts app/produtos/page.tsx
git commit -m "feat: migrate produtos and receitas to Supabase"
```

---

## Task 8: Repositório de Pronta Entrega

**Files:**
- Create: `almanac-app/lib/repositories/pronta-entrega.ts`
- Modify: `almanac-app/app/pronta-entrega/page.tsx`
- Modify: `almanac-app/app/pronta-entrega/[id]/page.tsx`

**Interfaces:**
- Produces:
  - `buscarProdutosPE(): Promise<ProdutoPE[]>`
  - `buscarProdutoPE(id: string): Promise<ProdutoPE | null>`
  - `criarProdutoPE(dados: ProdutoPEInput): Promise<ProdutoPE>`
  - `editarProdutoPE(id: string, dados: Partial<ProdutoPEInput>): Promise<ProdutoPE>`
  - `deletarProdutoPE(id: string): Promise<void>`

- [ ] **Step 1: Criar `lib/repositories/pronta-entrega.ts`**

```ts
import { createClient } from '@/lib/supabase/client'

export interface ProdutoPE {
  id: string
  nome: string
  descricao?: string
  foto?: string
  precoVenda: number
  estoqueAtual: number
  estoqueMin: number
}

export interface ProdutoPEInput {
  nome: string
  descricao?: string
  foto?: string
  precoVenda: number
  estoqueAtual: number
  estoqueMin: number
}

function mapRow(row: {
  id: string
  nome: string
  descricao: string | null
  foto: string | null
  preco_venda: number
  estoque_atual: number
  estoque_min: number
}): ProdutoPE {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    foto: row.foto ?? undefined,
    precoVenda: row.preco_venda,
    estoqueAtual: row.estoque_atual,
    estoqueMin: row.estoque_min,
  }
}

export async function buscarProdutosPE(): Promise<ProdutoPE[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('produtos_pe').select('*').order('nome')
  if (error || !data) return []
  return data.map(mapRow)
}

export async function buscarProdutoPE(id: string): Promise<ProdutoPE | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('produtos_pe').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapRow(data)
}

export async function criarProdutoPE(dados: ProdutoPEInput): Promise<ProdutoPE> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos_pe')
    .insert({
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      foto: dados.foto ?? null,
      preco_venda: dados.precoVenda,
      estoque_atual: dados.estoqueAtual,
      estoque_min: dados.estoqueMin,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao criar produto PE')
  return mapRow(data)
}

export async function editarProdutoPE(id: string, dados: Partial<ProdutoPEInput>): Promise<ProdutoPE> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if ('descricao' in dados) update.descricao = dados.descricao ?? null
  if ('foto' in dados) update.foto = dados.foto ?? null
  if (dados.precoVenda !== undefined) update.preco_venda = dados.precoVenda
  if (dados.estoqueAtual !== undefined) update.estoque_atual = dados.estoqueAtual
  if (dados.estoqueMin !== undefined) update.estoque_min = dados.estoqueMin

  const { data, error } = await supabase
    .from('produtos_pe')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao editar produto PE')
  return mapRow(data)
}

export async function deletarProdutoPE(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('produtos_pe').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Migrar `app/pronta-entrega/page.tsx` e `app/pronta-entrega/[id]/page.tsx`**

Em cada arquivo: ler o conteúdo, remover importações do mock, substituir por carregamento assíncrono com `buscarProdutosPE()` / `buscarProdutoPE(id)` em `useEffect`, e adaptar funções de CRUD.

- [ ] **Step 3: Verificar as páginas de Pronta Entrega**

1. Acessar `http://localhost:3001/pronta-entrega`
2. Criar, editar e deletar produtos PE
3. Verificar alertas de estoque baixo funcionando com dados reais

- [ ] **Step 4: Commit**

```bash
git add lib/repositories/pronta-entrega.ts app/pronta-entrega/page.tsx "app/pronta-entrega/[id]/page.tsx"
git commit -m "feat: migrate pronta entrega to Supabase"
```

---

## Task 9: Repositório de Encomendas + Pagamentos

**Files:**
- Create: `almanac-app/lib/repositories/encomendas.ts`
- Create: `almanac-app/lib/repositories/pagamentos.ts`
- Modify: `almanac-app/app/encomendas/page.tsx`
- Modify: `almanac-app/app/encomendas/[id]/page.tsx`

**Interfaces:**
- Produces (encomendas):
  - `buscarEncomendas(): Promise<Encomenda[]>`
  - `buscarEncomenda(id: string): Promise<Encomenda | null>`
  - `criarEncomenda(dados: EncomendaInput): Promise<Encomenda>`
  - `editarEncomenda(id: string, dados: Partial<EncomendaInput>): Promise<Encomenda>`
  - `atualizarStatus(id: string, status: EncomendaStatus): Promise<void>`
  - `adicionarLink(encomendaId: string, link: { label: string; url: string }): Promise<void>`
  - `removerLink(linkId: string): Promise<void>`
- Produces (pagamentos):
  - `buscarPagamentos(encomendaId: string): Promise<Pagamento[]>`
  - `registrarPagamento(dados: PagamentoInput): Promise<Pagamento>`
  - `estornarPagamento(pagamentoId: string, motivo: string): Promise<void>`

- [ ] **Step 1: Criar `lib/repositories/pagamentos.ts`**

```ts
import { createClient } from '@/lib/supabase/client'

export interface Pagamento {
  id: string
  encomendaId: string
  valor: number
  metodo: 'pix' | 'dinheiro' | 'cartao'
  data: string
  tipo: 'recebimento' | 'estorno'
  motivoEstorno?: string
}

export interface PagamentoInput {
  encomendaId: string
  valor: number
  metodo: 'pix' | 'dinheiro' | 'cartao'
  data: string
}

export async function buscarPagamentos(encomendaId: string): Promise<Pagamento[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomenda_pagamentos')
    .select('*')
    .eq('encomenda_id', encomendaId)
    .order('created_at')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    encomendaId: row.encomenda_id,
    valor: row.valor,
    metodo: row.metodo as 'pix' | 'dinheiro' | 'cartao',
    data: row.data,
    tipo: row.tipo as 'recebimento' | 'estorno',
    motivoEstorno: row.motivo_estorno ?? undefined,
  }))
}

export async function registrarPagamento(dados: PagamentoInput): Promise<Pagamento> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomenda_pagamentos')
    .insert({
      encomenda_id: dados.encomendaId,
      valor: dados.valor,
      metodo: dados.metodo,
      data: dados.data,
      tipo: 'recebimento',
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao registrar pagamento')

  return {
    id: data.id,
    encomendaId: data.encomenda_id,
    valor: data.valor,
    metodo: data.metodo as 'pix' | 'dinheiro' | 'cartao',
    data: data.data,
    tipo: 'recebimento',
  }
}

export async function estornarPagamento(pagamentoId: string, motivo: string): Promise<void> {
  const supabase = createClient()
  const { data: original } = await supabase
    .from('encomenda_pagamentos')
    .select('*')
    .eq('id', pagamentoId)
    .single()

  if (!original) throw new Error('Pagamento não encontrado')

  await supabase.from('encomenda_pagamentos').insert({
    encomenda_id: original.encomenda_id,
    valor: -Math.abs(original.valor),
    metodo: original.metodo,
    data: new Date().toISOString().slice(0, 10),
    tipo: 'estorno',
    motivo_estorno: motivo,
  })
}
```

- [ ] **Step 2: Criar `lib/repositories/encomendas.ts`**

```ts
import { createClient } from '@/lib/supabase/client'

export type EncomendaStatus = 'aguardando' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado'

export interface EncomendaItem {
  produtoId: string
  quantidade: number
  precoUnitario: number
}

export interface LinkUtil {
  id: string
  label: string
  url: string
}

export interface Encomenda {
  id: string
  cliente: string
  canal: 'whatsapp' | 'presencial'
  status: EncomendaStatus
  dataPedido: string
  dataEntrega: string
  itens: EncomendaItem[]
  desconto: number
  totalCobrado: number
  custoProducao: number
  margem: number
  observacoes?: string
  observacoesInternas?: string
  foto?: string
  linksUteis?: LinkUtil[]
}

export interface EncomendaInput {
  cliente: string
  canal: 'whatsapp' | 'presencial'
  status?: EncomendaStatus
  dataPedido: string
  dataEntrega: string
  itens: EncomendaItem[]
  desconto?: number
  totalCobrado: number
  custoProducao: number
  margem: number
  observacoes?: string
  observacoesInternas?: string
  foto?: string
}

function mapRow(row: {
  id: string
  cliente: string
  canal: string
  status: string
  data_pedido: string
  data_entrega: string
  desconto: number
  total_cobrado: number
  custo_producao: number
  margem: number
  observacoes: string | null
  observacoes_internas: string | null
  foto: string | null
  encomenda_itens?: { produto_id: string; quantidade: number; preco_unitario: number }[]
  encomenda_links_uteis?: { id: string; label: string; url: string }[]
}): Encomenda {
  return {
    id: row.id,
    cliente: row.cliente,
    canal: row.canal as 'whatsapp' | 'presencial',
    status: row.status as EncomendaStatus,
    dataPedido: row.data_pedido,
    dataEntrega: row.data_entrega,
    itens: (row.encomenda_itens ?? []).map(i => ({
      produtoId: i.produto_id,
      quantidade: i.quantidade,
      precoUnitario: i.preco_unitario,
    })),
    desconto: row.desconto,
    totalCobrado: row.total_cobrado,
    custoProducao: row.custo_producao,
    margem: row.margem,
    observacoes: row.observacoes ?? undefined,
    observacoesInternas: row.observacoes_internas ?? undefined,
    foto: row.foto ?? undefined,
    linksUteis: (row.encomenda_links_uteis ?? []).map(l => ({
      id: l.id,
      label: l.label,
      url: l.url,
    })),
  }
}

const SELECT_FULL = `
  *,
  encomenda_itens(produto_id, quantidade, preco_unitario),
  encomenda_links_uteis(id, label, url)
`

export async function buscarEncomendas(): Promise<Encomenda[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomendas')
    .select(SELECT_FULL)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

export async function buscarEncomenda(id: string): Promise<Encomenda | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomendas')
    .select(SELECT_FULL)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapRow(data)
}

export async function criarEncomenda(dados: EncomendaInput): Promise<Encomenda> {
  const supabase = createClient()

  const { data: enc, error } = await supabase
    .from('encomendas')
    .insert({
      cliente: dados.cliente,
      canal: dados.canal,
      status: dados.status ?? 'aguardando',
      data_pedido: dados.dataPedido,
      data_entrega: dados.dataEntrega,
      desconto: dados.desconto ?? 0,
      total_cobrado: dados.totalCobrado,
      custo_producao: dados.custoProducao,
      margem: dados.margem,
      observacoes: dados.observacoes ?? null,
      observacoes_internas: dados.observacoesInternas ?? null,
      foto: dados.foto ?? null,
    })
    .select()
    .single()

  if (error || !enc) throw new Error(error?.message ?? 'Erro ao criar encomenda')

  if (dados.itens.length > 0) {
    await supabase.from('encomenda_itens').insert(
      dados.itens.map(i => ({
        encomenda_id: enc.id,
        produto_id: i.produtoId,
        quantidade: i.quantidade,
        preco_unitario: i.precoUnitario,
      }))
    )
  }

  return (await buscarEncomenda(enc.id))!
}

export async function editarEncomenda(id: string, dados: Partial<EncomendaInput>): Promise<Encomenda> {
  const supabase = createClient()

  const update: Record<string, unknown> = {}
  if (dados.cliente !== undefined) update.cliente = dados.cliente
  if (dados.canal !== undefined) update.canal = dados.canal
  if (dados.status !== undefined) update.status = dados.status
  if (dados.dataPedido !== undefined) update.data_pedido = dados.dataPedido
  if (dados.dataEntrega !== undefined) update.data_entrega = dados.dataEntrega
  if (dados.desconto !== undefined) update.desconto = dados.desconto
  if (dados.totalCobrado !== undefined) update.total_cobrado = dados.totalCobrado
  if (dados.custoProducao !== undefined) update.custo_producao = dados.custoProducao
  if (dados.margem !== undefined) update.margem = dados.margem
  if ('observacoes' in dados) update.observacoes = dados.observacoes ?? null
  if ('observacoesInternas' in dados) update.observacoes_internas = dados.observacoesInternas ?? null
  if ('foto' in dados) update.foto = dados.foto ?? null

  if (Object.keys(update).length > 0) {
    await supabase.from('encomendas').update(update).eq('id', id)
  }

  if (dados.itens !== undefined) {
    await supabase.from('encomenda_itens').delete().eq('encomenda_id', id)
    if (dados.itens.length > 0) {
      await supabase.from('encomenda_itens').insert(
        dados.itens.map(i => ({
          encomenda_id: id,
          produto_id: i.produtoId,
          quantidade: i.quantidade,
          preco_unitario: i.precoUnitario,
        }))
      )
    }
  }

  return (await buscarEncomenda(id))!
}

export async function atualizarStatus(id: string, status: EncomendaStatus): Promise<void> {
  const supabase = createClient()
  await supabase.from('encomendas').update({ status }).eq('id', id)
}

export async function adicionarLink(
  encomendaId: string,
  link: { label: string; url: string }
): Promise<void> {
  const supabase = createClient()
  await supabase.from('encomenda_links_uteis').insert({
    encomenda_id: encomendaId,
    label: link.label,
    url: link.url,
  })
}

export async function removerLink(linkId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('encomenda_links_uteis').delete().eq('id', linkId)
}
```

- [ ] **Step 3: Migrar `app/encomendas/page.tsx`**

Ler o arquivo. Substituir importação do mock por repositório. Carregar dados via `useEffect` + `buscarEncomendas()`. Adaptar CRUD e mudanças de status.

- [ ] **Step 4: Migrar `app/encomendas/[id]/page.tsx`**

Ler o arquivo. O `id` vem de `useParams()`. Substituir carregamento do mock por `buscarEncomenda(id)` em `useEffect`. Adaptar: edição de campos, mudança de status, adição/remoção de links, painel de pagamento.

Para pagamentos no detalhe da encomenda, importar de `lib/repositories/pagamentos.ts`:
```ts
import { buscarPagamentos, registrarPagamento, estornarPagamento } from "@/lib/repositories/pagamentos"
```

- [ ] **Step 5: Verificar páginas de Encomendas**

1. Acessar `http://localhost:3001/encomendas`
2. Criar uma encomenda (requer produtos cadastrados na Task 7)
3. Mudar status no kanban
4. Abrir o detalhe da encomenda
5. Registrar um pagamento e um estorno
6. Adicionar e remover um link útil
7. Confirmar tudo no Supabase Table Editor

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/encomendas.ts lib/repositories/pagamentos.ts app/encomendas/page.tsx "app/encomendas/[id]/page.tsx"
git commit -m "feat: migrate encomendas and pagamentos to Supabase"
```

---

## Task 10: Dashboard + Limpeza Final

**Files:**
- Modify: `almanac-app/app/page.tsx` (dashboard)
- Modify: `almanac-app/app/financeiro/page.tsx` (seção DRE — leitura de encomendas reais)
- Delete: `almanac-app/lib/data.ts`
- Delete: `almanac-app/lib/auth.ts`

**Interfaces:**
- Consumes: todos os repositórios anteriores
- Produces: dashboard e financeiro exibindo dados reais; remoção completa dos mocks

- [ ] **Step 1: Migrar `app/page.tsx` (dashboard)**

Ler o arquivo completo. O dashboard importa de `lib/data.ts`:
- `insumosEmAlerta` → substituir por `buscarInsumos()` + filtrar `estoque <= estoqueMin`
- `produtosComProntoAlerta` → `buscarProdutos()` + filtrar `prontoEstoque <= prontoEstoqueMin`
- `encomendasAbertas` → `buscarEncomendas()` + filtrar `status !== 'entregue' && status !== 'cancelado'`
- `receitaMes`, `lucroBruto`, `lucroLiquido` → calcular a partir de encomendas entregues no mês atual + `buscarTotalCustosIndiretos()`

Substituir toda a lógica de dados do dashboard por um `useEffect` que carrega tudo em paralelo:

```ts
useEffect(() => {
  Promise.all([
    buscarInsumos(),
    buscarProdutos(),
    buscarEncomendas(),
    buscarTotalCustosIndiretos(),
  ]).then(([ins, prods, encs, totalCustos]) => {
    setInsumosAlerta(ins.filter(i => i.estoque !== null && i.estoqueMin !== null && i.estoque <= i.estoqueMin))
    setProdutosAlerta(prods.filter(p => p.prontoEstoqueMin !== undefined && (p.prontoEstoque ?? 0) <= p.prontoEstoqueMin))
    const abertas = encs.filter(e => e.status !== 'entregue' && e.status !== 'cancelado')
    setEncomendasAbertas(abertas)
    const entregues = encs.filter(e => e.status === 'entregue')
    const receita = entregues.reduce((s, e) => s + e.totalCobrado, 0)
    const custo = entregues.reduce((s, e) => s + e.custoProducao, 0)
    setReceitaMes(receita)
    setLucroBruto(receita - custo)
    setLucroLiquido(receita - custo - totalCustos)
  })
}, [])
```

- [ ] **Step 2: Atualizar seção DRE do `app/financeiro/page.tsx`**

A seção de DRE mensal no financeiro exibe receita, custo e lucro. Substituir dados calculados do mock por cálculo a partir de `buscarEncomendas()` (filtrado por mês/período selecionado).

- [ ] **Step 3: Verificar `lib/data.ts` — checar se ainda é importado em algum arquivo**

```bash
grep -r "from.*lib/data" --include="*.tsx" --include="*.ts" .
```

Se houver arquivos ainda importando de `lib/data.ts`, migrar cada um. Os únicos imports que podem sobrar são os formatadores (`formatBRL`, `formatDate`, `statusLabels`, `statusBadge`, `categoriaLabel`) — esses podem ser movidos para `lib/utils.ts` antes de deletar `lib/data.ts`.

- [ ] **Step 4: Mover formatadores para `lib/utils.ts`**

Crie `almanac-app/lib/utils.ts` com o conteúdo dos formatadores de `lib/data.ts`:

```ts
import type { EncomendaStatus } from '@/lib/repositories/encomendas'
import type { InsumoCategoria } from '@/lib/repositories/insumos'

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export const statusLabels: Record<EncomendaStatus, string> = {
  aguardando: 'Aguardando',
  em_producao: 'Em produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const statusBadge: Record<EncomendaStatus, string> = {
  aguardando: 'atlas-badge',
  em_producao: 'atlas-badge atlas-badge-warning',
  pronto: 'atlas-badge atlas-badge-info',
  entregue: 'atlas-badge atlas-badge-success',
  cancelado: 'atlas-badge atlas-badge-error',
}

export const categoriaLabel: Record<InsumoCategoria, string> = {
  visivel: 'Rotativo visível',
  invisivel: 'Rotativo invisível',
  ferramenta: 'Ferramenta',
  maquinario: 'Maquinário',
}
```

Atualizar todos os arquivos que importam esses formatadores de `lib/data.ts` para importar de `lib/utils.ts`.

- [ ] **Step 5: Confirmar zero imports de `lib/data.ts` e deletar**

```bash
grep -r "from.*lib/data" --include="*.tsx" --include="*.ts" .
```

Expected output: nenhuma linha. Então:

```bash
Remove-Item lib/data.ts
Remove-Item lib/auth.ts
```

- [ ] **Step 6: Build final para garantir zero erros de TypeScript**

```bash
npm run build
```

Expected: build concluído sem erros. Se houver erros de tipo, corrigi-los antes de prosseguir.

- [ ] **Step 7: Commit final**

```bash
git add -A
git commit -m "feat: complete Supabase migration — remove mock data layer"
```

---

## Verificação end-to-end

Após a Task 10, testar o fluxo completo:

1. **Login** com credenciais reais do Supabase Auth
2. **Insumos:** criar, editar preço (histórico gerado), deletar
3. **Produtos:** criar com receita de insumos, registrar lote
4. **Encomendas:** criar encomenda com produtos, mover pelo kanban, abrir detalhe, registrar pagamento
5. **Pronta entrega:** criar produto PE, verificar alerta de estoque
6. **Financeiro:** criar custo indireto, ver DRE calculado com dados reais
7. **Configurações:** alterar multiplicador, recarregar página — valor persiste
8. **Dashboard:** verificar que alertas e métricas refletem dados reais
9. **Logout** e verificar redirecionamento para `/login`
10. **Segundo dispositivo/aba:** confirmar que dados aparecem após login
