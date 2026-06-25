# Almanac — Documento de Requisitos

**Versão:** 1.0  
**Data:** Junho 2026  
**Plataforma:** Web (browser)  
**Idioma:** Português  
**Usuários:** 2 (proprietária + parceiro)

---

## 1. Visão geral

Sistema interno de gestão para negócio de papelaria criativa personalizada. O Almanac centraliza o controle de insumos, precificação de produtos, estoque, encomendas e financeiro — substituindo o controle "no feeling" por dados reais.

---

## 2. Usuários

| Perfil | Descrição |
|---|---|
| Proprietária | Acesso total: cadastros, precificação, encomendas, financeiro |
| Parceiro | Acesso operacional: registro de vendas, consulta de estoque, encomendas |

> Autenticação e controle de permissões por perfil são requisitos de v1.

---

## 3. Módulos

### 3.1 Insumos

Quatro categorias com comportamentos distintos:

| Categoria | Exemplos | Controle de estoque | Custo |
|---|---|---|---|
| Insumo rotativo visível | Papel, filamento, vinil, metal chaveiro, embalagem | Sim (por unidade/peso/folha) | Unitário com histórico |
| Insumo rotativo invisível | Cola, fita, borracha, lápis | Estimado por uso | Unitário com histórico |
| Ferramenta | Tesoura, alicate, régua, cortador, estilete | Não | Custo único (amortização futura) |
| Maquinário | Bambu A1 Mini, Cricut Maker, impressora | Não | Custo único (amortização futura) |

**Atributos de insumo rotativo:**
- Nome
- Categoria (visível / invisível)
- Unidade de medida (g, ml, unidade, folha, metro...)
- Preço de custo por unidade
- Histórico de preço (data + valor)
- Quantidade em estoque
- Estoque mínimo (gatilho de alerta)
- Fornecedor (opcional)

**Atributos de ferramenta/maquinário:**
- Nome
- Categoria
- Valor de aquisição
- Data de compra

---

### 3.2 Produtos (Receitas)

Cada produto tem uma receita: lista de insumos + quantidades utilizadas.

**Atributos:**
- Nome do produto
- Categoria (ex: chaveiro, adesivo, tag, cartão...)
- Lista de insumos com quantidade por unidade produzida
- Tempo de produção (em minutos)
- Custo de produção calculado automaticamente

**Cálculo de custo de produção:**
```
custo_producao = Σ (quantidade_insumo × preço_unitário_atual)
```

**Sugestão automática de preço de venda:**
```
preço_sugerido = custo_producao + custo_indireto_rateado + mão_de_obra + margem_%
```
A margem padrão é configurável globalmente e por produto.

---

### 3.3 Custos Indiretos

Custos que entram no rateio do preço de venda.

**Tipos:**
- **Fixos mensais:** luz, aluguel, internet, assinaturas (valor mensal)
- **Mão de obra:** valor/hora da proprietária (configurável)

**Rateio:** distribuído proporcionalmente entre os produtos com base no tempo de produção ou volume — configurável.

---

### 3.4 Encomendas

Registro de pedidos recebidos via WhatsApp ou presencial.

**Atributos:**
- Nome do cliente
- Canal de origem (WhatsApp / Presencial)
- Data do pedido
- Data de entrega prevista
- Lista de produtos + quantidade
- Valor cobrado (preço de venda final)
- Status: `Aguardando` → `Em produção` → `Pronto` → `Entregue` → `Cancelado`
- Observações

**Ao confirmar entrega:**
- Estoque dos insumos utilizados é deduzido automaticamente
- Receita é registrada no financeiro

---

### 3.5 Estoque

- Quantidade atual de cada insumo rotativo
- Atualização automática ao registrar entrega de encomenda
- Atualização manual para entrada de novos insumos (compras)
- **Alerta de estoque baixo:** notificação visual quando quantidade ≤ estoque mínimo definido

---

### 3.6 Financeiro

**Painel de caixa:**
- Total investido em insumos (histórico de compras)
- Total em receita (vendas entregues)
- Lucro bruto (receita − custo dos produtos vendidos)
- Lucro líquido (lucro bruto − custos indiretos do período)

**Relatório de lucratividade por produto:**
- Filtro por produto e por período (semana / mês / intervalo customizado)
- Custo médio de produção vs. preço médio de venda vs. margem real

---

## 4. Regras de negócio

1. O preço de custo de um insumo sempre reflete o valor mais recente cadastrado. O histórico é preservado para consulta e análise de variação.
2. O custo de produção de um produto é recalculado automaticamente quando o preço de um insumo utilizado na receita é atualizado.
3. A dedução de estoque só ocorre ao marcar a encomenda como "Entregue".
4. Ferramentas e maquinário não afetam o estoque — são cadastros de referência.
5. Insumos invisíveis têm custo estimado por uso definido manualmente na receita (ex: "0,5g de cola").
6. A sugestão de preço de venda é um ponto de partida — o valor final cobrado na encomenda é sempre editável.
7. Dois usuários podem acessar simultaneamente — conflitos de edição devem ser tratados pelo backend.

---

## 5. Fora de escopo (v1)

- Emissão de nota fiscal
- Orçamento formal para cliente
- Integração com meios de pagamento
- App mobile nativo
- Relatório exportável (PDF/Excel)
- Amortização automática de ferramentas e maquinário
- Multi-empresa / multi-negócio

---

## 6. Telas previstas (v1)

1. **Dashboard** — visão geral: caixa, alertas de estoque, encomendas em aberto
2. **Insumos** — listagem, cadastro, histórico de preço, entrada de estoque
3. **Produtos** — listagem, montagem de receita, visualização de custo e preço sugerido
4. **Encomendas** — kanban ou lista por status, cadastro, detalhamento
5. **Financeiro** — painel de caixa + relatório de lucratividade
6. **Configurações** — custos indiretos, valor/hora, margem padrão, perfis de usuário

---

## 7. Decisões resolvidas

| Decisão | Definição |
|---|---|
| Rateio de custos indiretos | Por tempo de produção — produtos que demoram mais absorvem proporcionalmente mais custo |
| Amortização de maquinário | Fora de escopo em v1 — maquinário e ferramentas entram só como cadastro de referência |
| Histórico de estoque | Log completo de movimentações: entrada (compra), saída (encomenda entregue), ajuste manual |
| Autenticação | Email + senha simples, dois perfis fixos (proprietária / parceiro) |
