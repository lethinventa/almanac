# Almanac — Feature: Pronta Entrega

**Status:** v1.5  
**Módulo:** novo (Pronta Entrega) + impacto em Produtos, Estoque e Financeiro

---

## Problema que resolve

Além de encomendas sob demanda, a maker produz itens em lote para venda imediata. Hoje não há controle de quantas unidades prontas existem nem registro formal dessas vendas.

---

## Conceitos

| Conceito | Descrição |
|---|---|
| Produto de pronta entrega | Qualquer produto do catálogo que tenha unidades prontas em estoque |
| Estoque de prontos | Quantidade de unidades acabadas disponíveis para venda imediata |
| Lote de produção | Registro de uma rodada de produção que abastece o estoque de prontos |
| Venda de pronta entrega | Encomenda com fluxo completo, mas baixa de estoque de prontos (não de insumos) |

> Um mesmo produto pode ser vendido como encomenda (produzido após o pedido) ou como pronta entrega (retirado do estoque de prontos). O produto em si é o mesmo — o que muda é o fluxo de estoque.

---

## 1. Estoque de produtos prontos

Cada produto do catálogo passa a ter um campo adicional:

| Campo | Descrição |
|---|---|
| Unidades disponíveis | Quantidade de itens acabados em estoque |
| Estoque mínimo de prontos | Gatilho de alerta (opcional) |

A tela de Produtos exibe uma coluna "Prontos em estoque" com badge de alerta quando abaixo do mínimo.

---

## 2. Registro de lote de produção

Quando a maker produz em lote, registra a entrada no estoque de prontos.

### Fluxo

```
Usuário acessa produto
  → Clica em "Registrar lote produzido"
  → Preenche:
      → Quantidade produzida
      → Data de produção
      → [Opcional] Observação (ex: "lote feira de junho")
  → Salva
  → Sistema:
      → Soma quantidade ao estoque de prontos do produto
      → Deduz insumos utilizados do estoque de insumos (quantidade × receita)
      → Registra movimentação no log de estoque de insumos
      → Registra lote no histórico de produção do produto
```

### Regras

1. A dedução de insumos ocorre no momento do registro do lote — não na venda
2. Se algum insumo estiver abaixo do necessário, sistema exibe aviso antes de confirmar
3. O histórico de lotes fica acessível na tela do produto

---

## 3. Venda de pronta entrega

Módulo independente de Encomendas — tela e fluxo próprios na navegação.

> Encomenda = produzido após o pedido, com prazo e acompanhamento.
> Pronta entrega = varejo imediato, produto já disponível em estoque.

### Tela própria na sidebar
"Pronta Entrega" aparece como item fixo na navegação, separado de "Encomendas". Os dois módulos podem compartilhar componentes (formulário de cliente, painel de pagamento) mas não estão acoplados.

### Fluxo

```
Usuário acessa "Pronta Entrega" na sidebar
  → Vê listagem de vendas realizadas
  → Clica em "Nova venda"
  → Preenche: cliente, canal, data
  → Adiciona itens:
      → Seleciona produto
      → Sistema verifica estoque de prontos disponível
      → Se estoque suficiente → permite adicionar
      → Se estoque insuficiente → avisa, mas permite prosseguir
      → Informa quantidade + preço (editável)
  → Desconto + total
  → Registra pagamento
  → Salva com status "Aguardando"
  → Ao marcar como "Entregue":
      → Sistema deduz do estoque de prontos
      → Registra receita no financeiro
```

### Status da venda de pronta entrega

```
Aguardando → Entregue → Cancelado
```

> Fluxo mais curto que encomenda — sem "Em produção" ou "Pronto", pois o item já existe.

---

## 4. Diferença de fluxo de estoque por tipo

| Evento | Encomenda sob demanda | Pronta entrega |
|---|---|---|
| Registro do pedido | Nenhuma dedução | Nenhuma dedução |
| Produção em lote | N/A | Deduz insumos |
| Entrega confirmada | Deduz insumos | Deduz estoque de prontos |

---

## 5. Impacto em telas existentes

| Tela | O que muda |
|---|---|
| Sidebar / navegação | Adiciona "Pronta Entrega" como item fixo, separado de "Encomendas" |
| Produtos | Adiciona coluna "Prontos em estoque" + botão "Registrar lote" + histórico de lotes |
| Encomendas | Nenhuma alteração — fluxos permanecem independentes |
| Estoque | Log de insumos passa a registrar saídas por lote de produção além de saídas por entrega |
| Financeiro | Receitas de pronta entrega entram no mesmo fluxo de caixa |
| Dashboard | Adiciona indicador de produtos com estoque de prontos baixo |

---

## Fora de escopo

- Precificação diferenciada por canal (loja física vs encomenda)
- Controle de validade de lote
- Rastreabilidade de qual lote foi usado em qual venda
