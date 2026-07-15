# Almanac — UI/UX do Wizard de Cadastro de Produto

## Contexto pro Claude Code
Esse é um mockup de front-end (sem lógica de back real) pra uma funcionalidade nova dentro do
Almanac (sistema já em desenvolvimento). A funcionalidade é bem diferente do resto do sistema
em formato — é um wizard conversacional, não uma tela de CRUD tradicional.

**Antes de implementar:** olhe os componentes, tokens de cor, tipografia e convenções já usados
no restante do Almanac (se houver código/design system existente no repo) e reaproveite o que
fizer sentido — inputs, botões, cores de marca, etc. Mas essa tela específica pode fugir do
padrão de layout do resto do sistema (não precisa ser um CRUD com tabela/formulário tradicional).
O objetivo é inovar no formato dessa tela sem destoar visualmente do resto do produto.

Ver spec funcional completa em: `almanac_wizard_cadastro_produto.md` (fluxo de perguntas, cálculos,
parâmetros). Este documento aqui é só sobre a experiência de tela — como isso aparece pro usuário.

---

## 1. Padrão de referência
**Typeform + resumo lateral tipo checkout.**

- Uma pergunta por tela (estilo Typeform): foco total, sem poluição visual, transição suave entre perguntas.
- Painel de resumo fixo (estilo carrinho de checkout / TurboTax): mostra o cálculo sendo montado em tempo real conforme o usuário responde.

Não é um form tradicional com todos os campos visíveis de uma vez. É sequencial.

---

## 2. Estrutura da tela

### Layout geral
```
┌─────────────────────────────────────────────────┐
│  [progresso: step 2 de 6]                    [X] │
├───────────────────────────────┬───────────────────┤
│                               │                   │
│                               │   RESUMO          │
│      PERGUNTA ATUAL           │   (fixo, lateral  │
│      (centralizada,           │   ou rodapé no    │
│      grande, uma por vez)     │   mobile)         │
│                               │                   │
│      [input/opções]           │   Insumo: R$ 2,60 │
│                               │   Energia: R$ 0,15│
│      [Continuar →]            │   ────────────    │
│                               │   Total: R$ 2,75  │
│                               │                   │
└───────────────────────────────┴───────────────────┘
```

- **Desktop**: pergunta centralizada à esquerda/centro, resumo fixo à direita (sticky).
- **Mobile**: pergunta ocupa a tela toda, resumo vira um card colapsável ou barra fixa no rodapé (tipo "ver resumo ↑") — não pode brigar por espaço com a pergunta.

### Barra de progresso
Topo, simples, indica step atual sobre o total (ex: "2 de 6"). Não precisa mostrar nome de cada etapa — só a posição.

### Botão de fechar/sair
Sempre visível (canto superior direito), com confirmação se já tiver progresso ("Sair sem salvar?").

---

## 3. Comportamento pergunta a pergunta

- Cada resposta, ao ser confirmada, anima a entrada de uma nova linha no painel de resumo (ex: fade-in + leve slide).
- O valor total do resumo atualiza com uma transição numérica suave (não troca de número seco).
- Transição entre perguntas: a pergunta atual sai (fade/slide pra cima) e a próxima entra — sem reload de página, sem sensação de "form longo".
- Perguntas condicionais (ex: "usou corte na Cricut?" sim/não) — se não, pula direto pra próxima etapa sem mostrar campo extra.

### Tipos de input por etapa (ref: spec funcional)
- Texto simples (nome do produto)
- Select com busca (insumo, embalagem) — lista pode ser longa, precisa filtro
- Número (gramas, minutos, quantidade)
- Sim/não como dois botões grandes lado a lado (não checkbox, não select) — reforça o clima conversacional

---

## 4. Primeira pergunta (bifurcação)
"É impressão 3D ou papelaria?" — duas opções grandes, tipo cards clicáveis (não dropdown), já que é a decisão mais importante do fluxo e define tudo que vem depois.

---

## 5. Tela final
- Resumo completo do cálculo (mesmo painel lateral, agora ocupando mais destaque ou centralizado)
- Preço sugerido em destaque (número grande)
- Campo de preço final editável (usuário pode sobrescrever o sugerido)
- Botão "Salvar produto"

---

## 6. Estados a considerar no mockup
- Estado vazio (step 1, nada preenchido ainda)
- Estado em progresso (meio do wizard, resumo parcial)
- Estado de erro simples (campo obrigatório vazio ao tentar avançar)
- Estado final (resumo completo + preço editável)

---

## 7. Fora de escopo deste mockup
- Lógica de cálculo real (usar valores mockados/fixos pra popular o resumo)
- Integração com dados reais de insumos/embalagens (usar lista fake)
- Responsividade pixel-perfect — foco é validar o padrão de interação, não polimento final
