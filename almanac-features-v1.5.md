# Almanac — Features v1.5: Orçamento, Pagamento e Fluxo de Caixa

---

## 1. Orçamento para cliente

### Problema
Hoje a encomenda é registrada internamente mas o cliente não recebe nada formal. O orçamento é comunicado verbalmente ou por mensagem avulsa no WhatsApp.

### Comportamento esperado
A partir de uma encomenda criada, o usuário gera um orçamento com link público (sem login) que o cliente acessa para visualizar os itens, valores e prazo.

### Fluxo

```
Usuário acessa encomenda com status "Aguardando"
  → Clica em "Gerar orçamento"
  → Sistema cria link único público (ex: almanac.app/orcamento/abc123)
  → Usuário copia link e envia pro cliente (WhatsApp, etc.)
  → Cliente acessa o link e visualiza:
      → Nome da loja / maker
      → Lista de itens + quantidade + preço unitário + subtotal
      → Desconto (se houver)
      → Total
      → Data de validade do orçamento
      → Prazo de entrega previsto
      → Observações
  → [Opcional] Cliente confirma interesse pelo próprio link
      → Sistema notifica o usuário
      → Status da encomenda muda para "Em produção"
```

### Atributos do orçamento

| Campo | Origem |
|---|---|
| Itens + valores | Puxado da encomenda |
| Validade | Configurável (padrão: 7 dias) |
| Prazo de entrega | Data de entrega da encomenda |
| Nome da loja | Configurações globais |
| Observações | Campo livre na geração |

### Regras

1. O link expira na data de validade — após isso exibe mensagem de orçamento expirado
2. O usuário pode regenerar o orçamento (novo link, link anterior desativado)
3. O orçamento não atualiza automaticamente se a encomenda for editada após geração — usuário precisa regenerar
4. Confirmação pelo cliente é opcional — usuário pode avançar o status manualmente

### Fora de escopo
- PDF para download (v2)
- Assinatura digital
- Múltiplas versões de orçamento por encomenda

---

## 2. Controle de pagamento da encomenda

### Problema
Encomendas de personalizados frequentemente envolvem pagamento parcial: sinal no fechamento e saldo na entrega. Hoje não há registro disso.

### Comportamento esperado
Cada encomenda tem um painel de pagamento com o total cobrado, os recebimentos registrados e o saldo em aberto.

### Fluxo

```
Usuário acessa encomenda
  → Vê painel de pagamento:
      → Total da encomenda
      → Total recebido
      → Saldo em aberto
      → Lista de pagamentos registrados
  → Clica em "Registrar pagamento"
  → Preenche:
      → Valor
      → Data de recebimento
      → Forma de pagamento (Pix / Dinheiro / Cartão / Outro)
      → [Opcional] Observação
  → Salva
  → Sistema atualiza total recebido e saldo em aberto
  → Quando saldo = 0, encomenda é marcada como "Paga"
```

### Estados de pagamento

| Estado | Condição |
|---|---|
| Sem pagamento | Nenhum recebimento registrado |
| Sinal recebido | Pelo menos 1 pagamento, saldo > 0 |
| Paga | Saldo = 0 |
| Paga a maior | Total recebido > total da encomenda |

### Regras

1. Uma encomenda pode ter N pagamentos registrados
2. O status de pagamento é independente do status de produção (encomenda pode estar "Entregue" e "Sem pagamento")
3. O financeiro só conta a receita pelo valor efetivamente recebido, não pelo total da encomenda
4. Pagamentos registrados não podem ser deletados — apenas estornados (novo registro com valor negativo + motivo)

### Visibilidade no dashboard
- Total a receber (encomendas pagas parcialmente ou sem pagamento)
- Encomendas entregues com saldo em aberto (alerta)

---

## 3. Fluxo de caixa

### Problema
O painel financeiro atual mostra totais acumulados. Não é possível ver como o dinheiro entrou e saiu ao longo do tempo, nem projetar o período seguinte.

### Comportamento esperado
Visão cronológica de todas as movimentações financeiras — entradas (pagamentos recebidos) e saídas (compras de insumo e custos fixos).

### Movimentações registradas automaticamente

| Tipo | Gatilho | Natureza |
|---|---|---|
| Entrada | Pagamento de encomenda registrado | Receita |
| Saída | Entrada de insumo com valor informado | Custo variável |
| Saída | Custo fixo mensal (luz, aluguel...) | Custo fixo |

### Movimentações manuais
O usuário pode registrar entradas ou saídas avulsas não vinculadas a encomenda ou insumo (ex: taxa, ferramenta comprada, venda fora do sistema).

```
Usuário acessa "Financeiro" → aba "Fluxo de Caixa"
  → Clica em "Nova movimentação"
  → Preenche: tipo (entrada/saída), valor, data, categoria, descrição
  → Salva
```

### Visão do fluxo de caixa

- Filtro por período (semana / mês / intervalo customizado)
- Lista cronológica de movimentações com tipo, valor, origem e data
- Saldo do período (entradas − saídas)
- Saldo acumulado até a data

### Categorias de movimentação

**Entradas:**
- Pagamento de encomenda
- Entrada avulsa

**Saídas:**
- Compra de insumo
- Custo fixo (luz, aluguel, internet...)
- Saída avulsa

### Regras

1. Movimentações vinculadas a encomenda ou insumo não podem ser deletadas manualmente — seguem o ciclo do objeto de origem
2. Movimentações avulsas podem ser deletadas com confirmação
3. Custos fixos mensais configurados em "Configurações" geram movimentação automática no primeiro dia de cada mês
4. O saldo exibido é sempre baseado em valores efetivamente recebidos/pagos, não em valores previstos

### Resumo no dashboard

| Indicador | Descrição |
|---|---|
| Entradas do mês | Total recebido no mês corrente |
| Saídas do mês | Total gasto no mês corrente |
| Saldo do mês | Entradas − saídas |
| A receber | Saldo em aberto de encomendas ativas |

---

## Impacto em telas existentes

| Tela | O que muda |
|---|---|
| Encomendas | Adiciona painel de pagamento + botão "Gerar orçamento" |
| Financeiro | Adiciona aba "Fluxo de Caixa" + indicadores de a receber no resumo |
| Dashboard | Adiciona alertas de encomendas entregues sem pagamento + saldo do mês |
| Configurações | Adiciona nome da loja, validade padrão de orçamento, custos fixos mensais |
