# Redesign — Tela de Detalhe da Encomenda

**Data:** 2026-06-25  
**Arquivo alvo:** `almanac-app/app/encomendas/[id]/page.tsx`  
**Modelo de dados:** `almanac-app/lib/data.ts`

---

## Objetivo

Redesenhar a tela de detalhe da encomenda para priorizar o fluxo operacional de produção. A imagem hero panorâmica é removida. A tela passa a suportar múltiplos produtos com foco em rastreamento de produção, não em visualização de arte.

---

## Decisões de escopo

| Item | Decisão |
|---|---|
| Personalização por produto (coluna) | **Removida** |
| Personalização geral (tema, ocasião) | **Removida** |
| Checklist de produção | **Removido** (fora do escopo desta iteração) |
| Vendedor | **Removido** |
| Número do cliente | **Removido** |
| Foto hero panorâmica (16/7) | **Removida** |
| Foto do kit (compacta) | **Mantida**, reposicionada na seção "Visual do pedido" |
| Arquivos + Links úteis | **Unificados** em "Arquivos do pedido" |
| Timeline | **Automática**, derivada de mudanças de status |

---

## Layout geral

```
┌─────────────────────────────── Header ──────────────────────────────────────┐
│ ← Voltar para encomendas              [Cancelar pedido] [▶ Iniciar produção]│
│ Pedido #2481                                                                 │
│ Luiz Eduardo Martins · WhatsApp                                             │
│ [AGUARDANDO PRODUÇÃO]  📅 Pedido em 22/06/2026  ·  📅 Entrega 02/07/2026   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────── Coluna principal (1fr) ─────────────────┐ ┌── Sidebar (300px) ──┐
│  [Produtos do pedido]                                    │ │  [Informações]      │
│  tabela com CRUD                                         │ │  [Financeiro]       │
│                                                          │ │  [Arquivos]         │
│  [Observações do cliente] [Observações internas]        │ │  [Timeline]         │
│                                                          │ └─────────────────────┘
│  [Visual do pedido]                                      │
│    foto do kit (compacta) + previews individuais         │
└──────────────────────────────────────────────────────────┘
```

---

## Header

### Estrutura (3 linhas)

**Linha 1 — Navegação e ações**
- Esquerda: botão `← Voltar para encomendas` (link para `/encomendas`)
- Direita: `[Cancelar pedido]` (ghost, vermelho) e `[▶ Iniciar produção]` (primary, verde)
- Lógica de ações igual à atual: `NEXT_STATUS` e `NEXT_LABEL` por status, confirmação de cancelamento inline

**Linha 2 — Identidade do pedido**
- Título grande: `Pedido #001` (derivado do id: `enc-1` → `#001`)
- Subtítulo: nome do cliente + ícone do canal (WhatsApp ou Presencial)

**Linha 3 — Info bar horizontal**
- Badge de status colorido (pill)
- Data do pedido
- Previsão de entrega (com indicador "faltam N dias" ou "atrasado" em vermelho)
- Canal

### Número do pedido

Derivado do campo `id` da encomenda. Exemplos:
- `enc-1` → `#001`
- `enc-10` → `#010`
- `enc-123` → `#123`

Função utilitária: extrair o número numérico do id e formatar com zeros à esquerda até 3 dígitos.

---

## Coluna principal

### 1. Tabela de produtos

Card com título "Produtos do pedido" e badge com contagem de itens.

**Colunas:**
| Coluna | Descrição |
|---|---|
| Produto | Thumbnail 32×32 + nome do produto |
| Qtd | Número, editável inline |
| Valor unit. | Moeda, editável inline |
| Subtotal | Calculado (qtd × valor unit.), somente leitura |
| ⋮ | Menu de ações por linha |

**Menu ⋮ (ações por linha):**
- Editar quantidade
- Editar preço unitário
- Remover produto do pedido

**Edição inline:** ao clicar em Qtd ou Valor unit., a célula vira `<input>`. Confirma com Enter ou blur.

**Rodapé da tabela:**
- Botão `+ Adicionar produto`: abre uma linha extra com select de produto + campos de qtd e preço
- `Subtotal dos itens: R$ XXX,XX` alinhado à direita

### 2. Observações

Dois cards lado a lado em grid 1:1.

**Observações do cliente**
- Campo `observacoes` (já existe no modelo)
- Exibição: texto estático com botão "Editar" que ativa textarea
- Se vazio: placeholder "Nenhuma observação do cliente"

**Observações internas**
- Campo `observacoesInternas` (novo no modelo)
- Mesmo padrão de edição
- Se vazio: placeholder "Nenhuma anotação interna"
- Visível apenas para a equipe (sem distinção visual especial nesta versão)

### 3. Visual do pedido

Card com título "Visual do pedido".

**Foto do kit (compacta)**
- Altura fixa: ~160px, largura 100%
- Campo `foto` existente no modelo (reproposto: de hero panorâmico para foto do kit)
- Upload por arquivo (PNG, JPG, até 10 MB)
- Quando preenchida: exibe imagem com botão "Trocar foto" sobreposto
- Quando vazia: área pontilhada com ícone `ImagePlus`, label "Adicionar foto do kit", hint "Foto gerada por IA com o conjunto do pedido"

**Previews individuais**
- Grid responsivo: 2 colunas padrão, mais colunas se houver mais produtos
- Um card por produto do pedido
- Cada card: imagem do produto (do cadastro) + nome + quantidade + botão "🔍 Ampliar imagem"
- "Ampliar imagem": abre lightbox (modal simples com `<img>` em tamanho maior)
- Se produto não tem foto: exibe placeholder com ícone de caixa

---

## Sidebar

### 1. Informações

| Rótulo | Valor |
|---|---|
| Canal | ícone + "WhatsApp" ou "Presencial" |
| Pedido em | data formatada (DD/MM/AAAA) |
| Entrega prevista | data formatada, vermelho se atrasado |
| Código do pedido | #001 (mesmo número do header) |

### 2. Financeiro

| Rótulo | Valor |
|---|---|
| Subtotal bruto | soma dos itens |
| Desconto | somente se > 0, em vermelho |
| Total cobrado | em negrito |
| Custo produção | — |
| Margem | colorido por faixa: verde ≥60%, amarelo ≥30%, vermelho <30% |

### 3. Arquivos do pedido

Unifica o antigo "Links úteis". Cada entrada tem:
- Ícone de tipo de arquivo (PDF, PNG, AI, genérico)
- Label/nome do arquivo
- URL do arquivo
- Botões: 👁 visualizar (abre link em nova aba) e ⬇ baixar

Formulário de adição: campo de rótulo + campo de URL + botão `+`.  
Botão `+ Adicionar arquivo` no rodapé do card.

### 4. Timeline do pedido

Eventos gerados automaticamente a partir das transições de status da encomenda.

**Mapeamento de status para eventos:**
| Status | Evento na timeline |
|---|---|
| `aguardando` | Pedido criado |
| `em_producao` | Produção iniciada |
| `pronto` | Marcado como pronto |
| `entregue` | Entregue ao cliente |
| `cancelado` | Pedido cancelado |

**Dados mock:** cada encomenda no mock terá um campo `timeline` com array de eventos `{ evento: string, data: string }`.  
Na implementação, os eventos podem ser derivados do status atual (mostrar apenas os estados anteriores ao status atual como "concluídos").

**Exibição:** máximo 4 eventos visíveis, botão "Ver todas as atualizações →" expande o card para exibir todos os eventos (toggle, sem navegação). Ícone de check verde para concluído, círculo âmbar para o estado atual.

---

## Mudanças no modelo de dados (`lib/data.ts`)

### Interface `Encomenda` — campos a adicionar

```ts
observacoesInternas?: string;
timeline?: TimelineEvento[];
```

### Nova interface

```ts
export interface TimelineEvento {
  evento: string;
  data: string; // ISO date string
}
```

### Campo renomeado conceptualmente

- `foto` permanece com o mesmo nome, mas seu propósito muda: não é mais a "Visualização final" e sim a "Foto do kit".

### Campo removido conceptualmente

- `linksUteis` é reproposto como "arquivos do pedido" — mesmo tipo `LinkUtil[]`, só muda o label na UI.

---

## Componentes a criar/refatorar

| Componente | Situação |
|---|---|
| `FotoHero` | Refatorar: manter lógica de upload, reduzir height para ~160px, atualizar labels |
| `LinksUteis` | Renomear para `ArquivosPedido`, adicionar ícones por tipo de arquivo |
| `InfoRow` | Manter como está |
| `TabelaProdutos` | Expandir: adicionar edição inline + menu ⋮ + linha de adição + rodapé com subtotal |
| `ObservacoesCard` | Novo: card reutilizável com modo view/edit (usado 2x: cliente e interna) |
| `PreviewsProdutos` | Novo: grid de cards com lightbox |
| `TimelinePedido` | Novo: lista de eventos com expand |

---

## O que NÃO muda

- Lógica de transição de status (`NEXT_STATUS`, `NEXT_LABEL`, `STATUS_COLOR`)
- Confirmação de cancelamento inline no header
- Cálculos financeiros (subtotal, desconto, total, margem)
- Navegação e roteamento
- Classes CSS do design system (`atlas-card`, `atlas-table`, `atlas-btn`, etc.)
