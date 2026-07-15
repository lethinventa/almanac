# Almanac — Cadastro de Produto (Wizard) + Parâmetros de Setup

## Contexto
Hoje o cálculo de preço de produto depende de insumos + recursos de máquina + ferramentas.
Ferramentas genéricas (cola, tesoura, régua) têm custo irrisório e não entram no wizard —
esse custo é absorvido no overhead fixo configurado nos parâmetros gerais, não perguntado por produto.

---

## 1. Parâmetros de setup (configurados uma vez, antes de cadastrar produtos)

### 1.1 Custos gerais do negócio
| Parâmetro | Tipo | Descrição |
|---|---|---|
| Quanto quer ganhar por mês | número (R$) | valor líquido desejado |
| Horas trabalhadas por dia | número | |
| Dias trabalhados por semana | número | |
| Custo fixo mensal | número (R$) | aluguel, internet, etc. |
| Margem de lucro padrão | select | presets: Baixa (20%) / Média (40%) / Alta (60%) / Personalizado |

**Cálculo derivado:**
```
horas_mes = horas_por_dia × dias_por_semana × 4,33
valor_hora = (ganho_desejado_mes + custo_fixo_mensal) / horas_mes
```

### 1.2 Recursos de máquina — Impressão 3D
| Parâmetro | Valor padrão |
|---|---|
| Custo de energia | R$ 0,00123/min |
| Depreciação da impressora | R$ 0,008/min (base: R$2.400 / 5.000h) |

> Filamento **não** entra aqui — é cadastrado individualmente em Insumos (preço por grama varia por tipo/cor).

### 1.3 Recursos de máquina — Papelaria
Valores informados diretamente pelo usuário (input livre, não calculado pelo sistema):

| Parâmetro | Tipo | Ajuda contextual (texto de apoio na UI) |
|---|---|---|
| Custo por impressão (R$/unidade) | número (R$) | "Dica: preço do cartucho/toner ÷ rendimento estimado em páginas" |
| Custo por corte na Cricut (R$/unidade) | número (R$) | "Dica: (preço da máquina ÷ vida útil estimada em nº de cortes) + custo médio de lâmina" |

O sistema não calcula esses valores — só sugere a lógica como texto de apoio pra o usuário chegar no número sozinho.

### 1.4 Cadastros de apoio (não são parâmetro único, são listas)
- **Insumos**: papel, cartolina, tinta, filamento etc. — preço de compra + unidade de medida (R$/folha, R$/g, R$/ml)
- **Embalagens**: tipos com custo unitário

---

## 2. Wizard de cadastro de produto

Interativo, step-by-step, com cálculo de custo sendo exibido em tempo real a cada resposta. Preço final sugerido (custo + margem configurada) aparece no fim, editável pelo usuário.

### 2.1 Fluxo — Impressão 3D
| Step | Pergunta | Input | Efeito no cálculo |
|---|---|---|---|
| 1 | Nome do produto | texto | — |
| 2 | Filamento usado (qual + gramas) | select insumo + número | `gramas × preço/g do insumo selecionado` |
| 3 | Tempo de impressão (minutos) | número | `min × R$0,00123` (energia) + `min × R$0,008` (depreciação) |
| 4 | Precisa de pós-processamento? (lixar, pintar, montar) | sim/não → se sim: minutos | `min × valor_hora` |
| 5 | Embalagem | select + custo | soma direta |
| 6 | Preço sugerido (editável) | número, pré-preenchido | `custo_total + margem%` |

### 2.2 Fluxo — Papelaria
| Step | Pergunta | Input | Efeito no cálculo |
|---|---|---|---|
| 1 | Nome do produto | texto | — |
| 2 | Insumos usados | multi-select + quantidade cada | soma `quantidade × preço unitário` de cada insumo |
| 3 | Quantas impressões usou? | número (frente/verso = conta 2) | `número × custo por impressão` |
| 4 | Usou corte na Cricut? Quantos cortes? | sim/não → se sim: número | `número × custo por corte` |
| 5 | Embalagem | select + custo | soma direta |
| 6 | Preço sugerido (editável) | número, pré-preenchido | `custo_total + margem%` |

### 2.3 Regra de entrada do wizard
Primeira pergunta sempre: **"É impressão 3D ou papelaria?"** — define qual dos dois fluxos acima roda.

---

## 3. Fora de escopo deste wizard (decisão já tomada)
- Ferramentas genéricas (cola, tesoura, régua, fita): não entram como pergunta. Custo é absorvido no overhead fixo dos parâmetros gerais.
- Taxa de imposto/marketplace: fora por enquanto, complexidade maior, tratar depois separado.

---

## 4. Pendências
Nenhuma pendência bloqueante — todos os parâmetros de 1.3 agora são input direto do usuário, sem depender de valor pré-calculado.
