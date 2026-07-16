# Almanac — Spec de Cadastro de Produto

## 1. Formato de tela
Cadastro de produto é uma **página própria** (ex: `/produtos/novo`), não modal. Motivo: form
tem múltiplos campos + resumo lateral + variações — precisa de espaço horizontal real, e não
tem caso de uso que exija ver a lista de produtos por trás enquanto cadastra.

## 2. Visão geral do fluxo

Cadastro de produto tem 2 momentos distintos:

1. **Bifurcação de categoria** (tela única, obrigatória, decide tudo que vem depois)
2. **Form de receita** (uma página só, campos variam conforme a categoria escolhida)

Não é mais wizard step-by-step completo — só a bifurcação inicial é isolada. O resto é form
tradicional numa tela, com resumo de custo lateral atualizando em tempo real. Motivo: cadastro
de produto é ação recorrente (dezenas de vezes), não esporádica — wizard longo gera fricção e
risco de abandono em uso repetido.

---

## 3. Etapa 1 — Bifurcação de categoria

Tela única: **"É impressão 3D ou papelaria?"**
Dois cards grandes clicáveis (não dropdown, não select) — decisão mais importante do fluxo,
define os campos da etapa 2.

---

## 4. Etapa 2 — Form de receita (por categoria)

Uma tela só, todos os campos visíveis, ordem livre de preenchimento. Resumo de custo fixo
(lateral no desktop / colapsável no mobile) soma em tempo real conforme os campos são preenchidos.

### 4.1 Impressão 3D
| Campo | Tipo | Efeito no cálculo |
|---|---|---|
| Nome do produto | texto | — |
| Filamento usado (qual + gramas) | select insumo + número | `gramas × preço/g do insumo` |
| Tempo de impressão (minutos) | número | `min × R$0,00123` (energia) + `min × R$0,008` (depreciação) |
| Pós-processamento (lixar, pintar, montar) | sim/não → se sim: minutos | `min × valor_hora` |
| Embalagem | select + custo | soma direta |
| Preço sugerido | número, pré-preenchido, editável | `custo_total + margem%` |

### 4.2 Papelaria
| Campo | Tipo | Efeito no cálculo |
|---|---|---|
| Nome do produto | texto | — |
| Insumos usados | multi-select + quantidade cada | soma `quantidade × preço unitário` |
| Quantas impressões usou? | número (frente/verso conta 2) | `número × custo por impressão` |
| Corte na Cricut? Quantos cortes? | sim/não → se sim: número | `número × custo por corte` |
| Embalagem | select + custo | soma direta |
| Preço sugerido | número, pré-preenchido, editável | `custo_total + margem%` |

---

## 5. Variações de produto (options)

### 5.1 Problema que resolve
Produtos com a mesma receita/estrutura, mudando só 1 insumo específico (ex: cor), não devem
virar cadastros separados. Exemplo: "Chaveiro Batom" não vira "Chaveiro Batom Azul" +
"Chaveiro Batom Rosa" — é 1 produto com uma variação de cor.

### 5.2 Modelo (inspirado em Shopify, adaptado para puxar custo do insumo)
- Ao montar a receita (etapa 2), qualquer insumo pode ser marcado como **"variável"**.
- Ao marcar um insumo como variável, o usuário cria uma **option** (ex: "Cor") e, para cada
  valor da option (ex: Azul, Rosa), **linka um insumo cadastrado correspondente**
  (Azul → Filamento PLA Azul R$0,13/g; Rosa → Filamento PLA Rosa R$0,15/g).
- O sistema gera automaticamente as variantes do produto (uma por valor da option), cada uma
  com preço calculado a partir do insumo linkado — sem precisar editar preço na mão por variante.
- **Quantidade do insumo variável é sempre a mesma entre variações** (não muda gramatura/nº de
  folhas por causa da cor — só troca o insumo usado).

### 5.3 Fluxo de cadastro com variação
1. No campo de insumo da receita, usuário marca "Esse insumo varia? (ex: cor, acabamento)"
2. Sistema pede nome da option (ex: "Cor")
3. Usuário adiciona os valores da option, um a um, cada um linkado a um insumo já cadastrado
   (ex: "Azul" → Filamento PLA Azul)
4. Ao salvar o produto, o sistema já mostra as variantes geradas com preço individual calculado
5. Cada variante pode ter o preço final sobrescrito manualmente, se necessário

### 5.4 Limitação assumida
- Suporta 1 option por produto no MVP (ex: só "Cor"). Combinação de múltiplas options
  (ex: Cor + Tamanho) fica pra v2.
- **Tamanho não é variação/option — é produto separado.** Se o produto muda de tamanho, ele
  também muda quantidade de insumo, então não se encaixa no modelo de option (que assume
  quantidade fixa entre variações). Decisão: cada tamanho é cadastrado como produto próprio.

### 5.5 Preço sugerido quando há variantes
O preço sugerido do produto (mostrado na lista/preview antes de entrar no detalhe) é baseado
no **custo mais alto entre as variantes** — ou seja, a variante mais cara define o preço base
sugerido, evitando prejuízo se o sistema mostrasse a variante mais barata como referência.
Cada variante mantém seu próprio preço editável individualmente dentro do produto.

---

## 6. Duplicar produto (mitigação de abandono/fricção operacional)
A partir do 3º-4º produto cadastrado, oferecer atalho **"Duplicar produto"** — sem form
intermediário, estilo Notion: clicou, cria uma cópia idêntica do produto (nome + "(cópia)",
mesma receita, mesmas variantes) já na lista, e o usuário edita direto na página do produto
duplicado. Não existe tela de "o que copiar" — é copy 1:1, editável depois.

---

## 7. Fora de escopo (decisão já tomada)
- Ferramentas genéricas (cola, tesoura, régua): não entram como campo. Custo absorvido no
  overhead fixo dos parâmetros gerais do negócio.
- Combinação de múltiplas options no mesmo produto (ex: Cor + Tamanho): fica pra v2.
- Taxa de imposto/marketplace: fora por enquanto.
