# Almanac — Backend Supabase: Design

**Data:** 2026-06-29  
**Status:** Aprovado  
**Escopo:** Migração completa do sistema de dados mock + localStorage para Supabase (banco de dados + autenticação)

---

## 1. Contexto

O Almanac é um sistema interno de gestão para papelaria criativa personalizada. Na v1, todos os dados são mocks estáticos em `lib/data.ts` e a sessão de login é salva em `localStorage`. Não há persistência real — dados se perdem ao trocar de dispositivo ou limpar o navegador.

Este spec define a migração para o Supabase como backend: banco de dados PostgreSQL na nuvem + autenticação real por email e senha.

**O que não muda:** interface visual, design system Atlas, rotas, comportamento das telas.

---

## 2. Stack e pacotes

- **Supabase** (projeto já criado pela usuária)
- `@supabase/supabase-js` — cliente JS
- `@supabase/ssr` — suporte ao Next.js App Router
- Next.js 16 App Router, TypeScript (sem mudança)

---

## 3. Arquitetura

```
Tela (React Client Component)
          ↕
Repositório (lib/repositories/*.ts)
          ↕
Supabase Client (lib/supabase/client.ts)
          ↕
Supabase Cloud (banco PostgreSQL + Auth)
```

### 3.1 Arquivos de infraestrutura

| Arquivo | Responsabilidade |
|---|---|
| `lib/supabase/client.ts` | Cria e exporta o cliente Supabase para uso no browser |
| `lib/supabase/types.ts` | Tipos TypeScript espelhando o schema do banco (seção 4) |
| `middleware.ts` | Verifica sessão em cada request; redireciona para `/login` se não autenticado |

### 3.2 Repositórios (um por módulo)

| Arquivo | Funções exportadas |
|---|---|
| `lib/repositories/insumos.ts` | `buscarInsumos`, `criarInsumo`, `editarInsumo`, `deletarInsumo`, `registrarPreco` |
| `lib/repositories/produtos.ts` | `buscarProdutos`, `criarProduto`, `editarProduto`, `deletarProduto`, `registrarLote` |
| `lib/repositories/encomendas.ts` | `buscarEncomendas`, `buscarEncomenda`, `criarEncomenda`, `editarEncomenda`, `atualizarStatus` |
| `lib/repositories/pagamentos.ts` | `registrarPagamento`, `estornarPagamento` |
| `lib/repositories/pronta-entrega.ts` | `buscarProdutosPE`, `criarProdutoPE`, `editarProdutoPE`, `deletarProdutoPE` |
| `lib/repositories/financeiro.ts` | `buscarCustosIndiretos`, `criarCusto`, `editarCusto`, `deletarCusto` |
| `lib/repositories/configuracoes.ts` | `buscarConfiguracoes`, `salvarConfiguracoes` |

### 3.3 Padrão de uso nas telas

Antes:
```ts
import { insumos } from "@/lib/data"
```

Depois:
```ts
import { buscarInsumos } from "@/lib/repositories/insumos"
const insumos = await buscarInsumos()
```

---

## 4. Schema do banco de dados

### 4.1 Tabelas

#### `insumos`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK, gerado automaticamente |
| nome | text | NOT NULL |
| categoria | text | `visivel` \| `invisivel` \| `ferramenta` \| `maquinario` |
| unidade | text | |
| preco_atual | numeric | |
| estoque | numeric | NULL para ferramentas/maquinário |
| estoque_min | numeric | NULL para ferramentas/maquinário |
| fornecedor | text | NULL |
| created_at | timestamptz | padrão Supabase |

#### `insumo_historico_preco`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| insumo_id | uuid | FK → insumos.id |
| data | date | |
| preco | numeric | |

#### `produtos`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nome | text | NOT NULL |
| categoria | text | |
| tempo_producao | integer | minutos |
| custo | numeric | calculado |
| preco_sugerido | numeric | calculado |
| margem | numeric | |
| foto | text | URL |
| pronto_estoque | integer | NULL |
| pronto_estoque_min | integer | NULL |
| created_at | timestamptz | |

#### `produto_receita`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| produto_id | uuid | FK → produtos.id |
| insumo_id | uuid | FK → insumos.id |
| quantidade | numeric | |

#### `produto_etapas_3d`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| produto_id | uuid | FK → produtos.id, UNIQUE |
| impressao | integer | minutos, NULL |
| modelagem | integer | minutos, NULL |
| acabamento | integer | minutos, NULL |

#### `lotes_producao`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| produto_id | uuid | FK → produtos.id |
| quantidade | integer | |
| data | date | |
| observacao | text | NULL |

#### `encomendas`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| cliente | text | NOT NULL |
| canal | text | `whatsapp` \| `presencial` |
| status | text | `aguardando` \| `em_producao` \| `pronto` \| `entregue` \| `cancelado` |
| data_pedido | date | |
| data_entrega | date | |
| desconto | numeric | padrão 0 |
| total_cobrado | numeric | |
| custo_producao | numeric | |
| margem | numeric | |
| observacoes | text | NULL |
| observacoes_internas | text | NULL |
| foto | text | NULL, URL |
| created_at | timestamptz | |

#### `encomenda_itens`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| encomenda_id | uuid | FK → encomendas.id |
| produto_id | uuid | FK → produtos.id |
| quantidade | integer | |
| preco_unitario | numeric | |

#### `encomenda_pagamentos`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| encomenda_id | uuid | FK → encomendas.id |
| valor | numeric | |
| metodo | text | `pix` \| `dinheiro` \| `cartao` |
| data | date | |
| tipo | text | `recebimento` \| `estorno` |
| motivo_estorno | text | NULL |
| created_at | timestamptz | |

#### `encomenda_links_uteis`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| encomenda_id | uuid | FK → encomendas.id |
| label | text | |
| url | text | |

#### `produtos_pe`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nome | text | NOT NULL |
| descricao | text | NULL |
| foto | text | NULL, URL |
| preco_venda | numeric | |
| estoque_atual | integer | |
| estoque_min | integer | |
| created_at | timestamptz | |

#### `custos_indiretos`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nome | text | NOT NULL |
| valor_mensal | numeric | |

#### `configuracoes`
| Coluna | Tipo | Notas |
|---|---|---|
| id | integer | PK = 1 (singleton — só uma linha) |
| horas_trabalho_mes | numeric | padrão 160 |
| multiplicador_preco | numeric | padrão 3 |
| custo_hora_bambu | numeric | padrão 4.5 |

### 4.2 Relacionamentos

```
insumos ←── insumo_historico_preco
insumos ←── produto_receita ──→ produtos
produtos ←── produto_etapas_3d
produtos ←── lotes_producao
produtos ←── encomenda_itens ──→ encomendas
encomendas ←── encomenda_pagamentos
encomendas ←── encomenda_links_uteis
```

---

## 5. Autenticação

### 5.1 Supabase Auth

- Provider: email + senha
- Usuário criado diretamente no painel do Supabase (sem tela de cadastro no app)
- Sessão gerenciada pelo Supabase SSR (cookie seguro)

### 5.2 Mudanças na tela `/login`

| Antes | Depois |
|---|---|
| Verifica credenciais hard-coded | Chama `supabase.auth.signInWithPassword({ email, password })` |
| Salva usuário em `localStorage` | Supabase gerencia a sessão via cookie |
| `clearSession()` no logout | Chama `supabase.auth.signOut()` |

### 5.3 Proteção de rotas

Um middleware Next.js (`middleware.ts`) verifica a sessão em cada request. Se não houver sessão ativa, redireciona para `/login`.

### 5.4 Row Level Security (RLS)

Todas as tabelas terão RLS habilitado com política: **só usuários autenticados podem ler e escrever**. Isso garante que os dados só são acessíveis com login válido, mesmo que as chaves do Supabase sejam expostas no frontend.

---

## 6. Ordem de migração

A migração é incremental — cada fase é validada antes de avançar. O app permanece funcional durante todo o processo.

| Fase | Escopo | Entregável |
|---|---|---|
| 1 | Setup + Supabase Auth | Login real funcionando; middleware de proteção de rotas |
| 2 | Configurações | Tabela `configuracoes` lida/salva no Supabase |
| 3 | Custos Indiretos | Tabela `custos_indiretos` com CRUD completo |
| 4 | Insumos | Tabelas `insumos` + `insumo_historico_preco` com CRUD e histórico |
| 5 | Produtos + Receitas | Tabelas `produtos`, `produto_receita`, `produto_etapas_3d`, `lotes_producao` |
| 6 | Pronta Entrega | Tabela `produtos_pe` com CRUD |
| 7 | Encomendas + Pagamentos | Tabelas `encomendas`, `encomenda_itens`, `encomenda_pagamentos`, `encomenda_links_uteis` |
| 8 | Dashboard + Financeiro | Leituras agregadas das tabelas já migradas; remoção do `lib/data.ts` |

---

## 7. Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anon>
```

Estas chaves ficam no arquivo `.env.local` (não commitado no git) e também configuradas no Vercel para o deploy em produção.

---

## 8. O que fica fora deste escopo

- Upload de fotos para o Supabase Storage (as fotos permanecem como URL externa por ora)
- Perfil parceiro (segundo usuário com permissões restritas) — definido como fora de escopo na v1
- Sincronização em tempo real (Supabase Realtime) — não necessário para usuária única
- Backup e restore — gerenciado automaticamente pelo Supabase no plano gratuito
