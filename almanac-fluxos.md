# Almanac — Fluxos de Usuário

---

## 1. Cadastro de insumo

```
Usuário acessa "Insumos"
  → Clica em "Novo insumo"
  → Preenche: nome, categoria (visível / invisível / ferramenta / maquinário), unidade de medida
  → [Se rotativo] Informa preço unitário e quantidade inicial em estoque
  → [Se rotativo] Define estoque mínimo para alerta
  → [Opcional] Informa fornecedor
  → Salva
  → Sistema registra data + preço no histórico de preços
  → Insumo aparece disponível para uso em receitas
```

**Fluxo alternativo — atualização de preço:**
```
Usuário acessa insumo existente
  → Clica em "Atualizar preço"
  → Informa novo preço unitário
  → Sistema salva com data e preserva histórico anterior
  → Custo de produção de todos os produtos que usam esse insumo é recalculado
```

---

## 2. Montagem de produto (receita)

```
Usuário acessa "Produtos"
  → Clica em "Novo produto"
  → Preenche: nome, categoria do produto
  → Informa tempo de produção (minutos)
  → Adiciona insumos à receita:
      → Seleciona insumo da lista
      → Informa quantidade utilizada por unidade produzida
      → Repete até completar a receita
  → Sistema exibe custo de produção calculado em tempo real
  → Sistema exibe preço de venda sugerido (custo + rateio indireto + mão de obra + margem)
  → Usuário revisa e confirma
  → Salva produto
```

**Fluxo alternativo — edição de receita:**
```
Usuário acessa produto existente
  → Edita quantidades ou adiciona/remove insumos
  → Sistema recalcula custo e preço sugerido
  → Salva alterações
```

---

## 3. Registro de encomenda

```
Usuário acessa "Encomendas"
  → Clica em "Nova encomenda"
  → Preenche: nome do cliente, canal (WhatsApp / Presencial)
  → Informa data de entrega prevista
  → Adiciona itens:
      → Seleciona produto da lista
      → Informa quantidade
      → Sistema preenche preço unitário sugerido (editável)
      → Linha exibe subtotal (quantidade × preço unitário)
      → Repete para cada produto
  → [Opcional] Aplica desconto (valor fixo R$ ou percentual %)
  → Sistema exibe:
      → Subtotal por item
      → Desconto
      → Custo total de produção (calculado por receita)
      → Total cobrado do cliente
      → Margem da encomenda
  → [Opcional] Adiciona observações
  → Salva encomenda com status "Aguardando"
```

---

## 4. Progressão de status da encomenda

```
Aguardando
  → Usuário muda para "Em produção"
      → Nenhuma ação automática
  → Usuário muda para "Pronto"
      → Nenhuma ação automática
  → Usuário muda para "Entregue"
      → Sistema deduz insumos utilizados do estoque (por receita × quantidade)
      → Sistema registra movimentação no log de estoque
      → Sistema registra receita no financeiro
  → Usuário muda para "Cancelado" (de qualquer status anterior a Entregue)
      → Nenhuma dedução de estoque
      → Nenhum registro financeiro
```

**Alerta durante progressão:**
```
  → Se algum insumo necessário estiver abaixo do estoque mínimo
      → Sistema exibe aviso antes de confirmar mudança de status
      → Usuário pode prosseguir mesmo assim
```

---

## 5. Entrada de estoque (compra de insumos)

```
Usuário acessa insumo
  → Clica em "Registrar entrada"
  → Informa quantidade adquirida
  → [Opcional] Informa valor pago (atualiza preço unitário)
  → Salva
  → Sistema soma quantidade ao estoque atual
  → Sistema registra movimentação no log (tipo: "entrada / compra")
  → Sistema registra valor investido no financeiro
```

---

## 6. Ajuste manual de estoque

```
Usuário acessa insumo
  → Clica em "Ajuste manual"
  → Informa nova quantidade (ou diferença + / -)
  → Informa motivo (perda, erro de contagem, doação...)
  → Salva
  → Sistema atualiza quantidade
  → Sistema registra movimentação no log (tipo: "ajuste manual" + motivo)
```

---

## Resumo de ações automáticas do sistema

| Gatilho | Ação automática |
|---|---|
| Novo preço cadastrado em insumo | Recalcula custo de produção de todos os produtos que o usam |
| Encomenda marcada como "Entregue" | Deduz insumos do estoque + registra receita no financeiro |
| Estoque de insumo ≤ mínimo definido | Exibe alerta visual na tela de insumos e no dashboard |
| Entrada de compra registrada | Soma ao estoque + registra investimento no financeiro |
