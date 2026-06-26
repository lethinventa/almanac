# Almanac — Vision and Scope

**Versão:** 1.1  
**Data:** Junho 2026  
**Autor:** Mateus Nascimento

> Esta versão reconcilia o documento original (v1.0) com o que foi efetivamente implementado na v1.

---

## 1. Requisitos de Negócio

### 1.1 Contexto

A Almanac é um sistema interno de gestão desenvolvido para um negócio de papelaria criativa
personalizada. Antes do sistema, o controle operacional era conduzido em ferramentas genéricas
(Notion, Google Sheets), adaptadas manualmente para representar a lógica de insumos, receitas,
encomendas e financeiro. Essa adaptação resultava em estruturas complexas, difíceis de manter e
propensas a inconsistências.

### 1.2 Motivadores de Negócio

- Ferramentas genéricas (Notion, Google Sheets) não suportam o fluxo da operação de forma natural —
  adaptar a lógica do negócio a essas ferramentas é trabalhoso e engessado.
- A complexidade das estruturas necessárias facilita erros e incentiva fazer as coisas pela metade.
- O resultado é inconsistência nos dados: estoque desatualizado, custos imprecisos, histórico
  fragmentado.
- Esse cenário consome tempo, gera perda financeira indireta e prejudica a organização e a
  tranquilidade da proprietária.

### 1.3 Objetivos de Negócio

- Centralizar em um único sistema o controle de insumos, produtos, encomendas, estoque e financeiro
  do negócio.
- Eliminar a necessidade de adaptar ferramentas genéricas, reduzindo erros e inconsistências
  operacionais.
- Dar à proprietária visibilidade real sobre custos, margens e fluxo financeiro para embasar
  decisões de precificação e operação.

### 1.4 Métricas de Sucesso

> **[TBD]** A ser definido em revisão futura do documento.

### 1.5 Declaração de Visão

Para **makers de papelaria criativa personalizada** que precisam de controle preciso sobre insumos,
custos e encomendas sem a fricção de adaptar ferramentas genéricas, o **Almanac** é um **sistema
interno de gestão** que centraliza toda a operação do negócio — do estoque de insumos ao financeiro
— em um fluxo coerente com a realidade da produção artesanal. Ao contrário de **Notion e Google
Sheets adaptados**, o Almanac foi construído especificamente para esse fluxo, eliminando a
complexidade de manutenção e as inconsistências que ferramentas de propósito geral introduzem.

### 1.6 Riscos de Negócio

> _Não capturado nesta versão do documento._

### 1.7 Premissas e Dependências

- O sistema opera com dados persistidos localmente via `localStorage` e mocks em memória. Não há
  banco de dados ou backend na v1 — os dados não sobrevivem a uma limpeza de navegador.
- Um único perfil de usuário (`proprietária`) é suportado na v1. Autenticação é via credenciais
  simples com sessão em `localStorage`.

---

## 2. Escopo e Limitações

### 2.1 Funcionalidades Principais

| ID   | Funcionalidade       | Descrição                                                                                                                                                                                                                                                                    |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-1 | Insumos              | Cadastro e controle de insumos em quatro categorias: rotativos visíveis, rotativos invisíveis, ferramentas e maquinário. Inclui histórico de preços e alertas visuais de estoque mínimo para insumos rotativos.                                                              |
| FE-2 | Produtos / Receitas  | Cadastro de produtos com lista de insumos e quantidades (receita), tempo de produção e categoria. Exibe custo de produção calculado e preço de venda sugerido com base no multiplicador de preço configurado.                                                                 |
| FE-3 | Custos Indiretos     | Registro e edição de custos fixos mensais (luz, aluguel, internet, assinaturas) diretamente no módulo Financeiro. A taxa horária é derivada automaticamente como `custos indiretos totais ÷ horas trabalhadas por mês`, sem entrada manual de valor/hora.                    |
| FE-4 | Encomendas           | Registro de pedidos com cliente, canal de origem (WhatsApp ou presencial), itens (produto, quantidade, preço unitário editável), desconto, prazo e status. Progressão de status com ação explícita (aguardando → em produção → pronto → entregue). Observações do cliente e internas, foto do pedido, arquivos/links úteis e timeline de eventos por encomenda. |
| FE-5 | Estoque de Insumos   | Controle de quantidade atual e mínima de insumos rotativos. Alertas visuais de estoque baixo no módulo de Insumos e no Dashboard.                                                                                                                                            |
| FE-6 | Financeiro           | Duas visões: **Visão Geral** — DRE do mês corrente (receita bruta, custo variável, lucro bruto, custos fixos, lucro líquido) e histórico mensal; **Fluxo de Caixa** — movimentações automáticas (pagamentos de encomendas, custos fixos mensais) e manuais, com filtro por período (semana, mês, mês anterior, personalizado). |
| FE-7 | Configurações        | Parâmetros de precificação: horas trabalhadas por mês e multiplicador de preço global. A tela exibe a taxa horária derivada e um exemplo de cálculo de preço sugerido. Custos indiretos são gerenciados no módulo Financeiro.                                                 |
| FE-8 | Pronta Entrega       | Módulo para produtos acabados disponíveis para venda imediata, independente do fluxo de encomendas. Inclui cadastro de produtos com preço de venda, estoque atual e mínimo, alertas de estoque baixo e sem estoque, e tela de detalhe por produto.                           |
| FE-9 | Controle de Pagamento | Painel de pagamento por encomenda com registro de múltiplos recebimentos (sinal, saldo), forma de pagamento (Pix, dinheiro, cartão, outro), observação por transação e estorno com motivo. Status consolidado: sem pagamento, sinal recebido, paga, paga a maior. Integrado ao Fluxo de Caixa do módulo Financeiro. |

### 2.2 Escopo da v1

A v1 entrega as nove funcionalidades acima como sistema web para um único usuário (proprietária).
Telas implementadas:

1. **Dashboard** — visão geral: receita do mês, lucro bruto, encomendas abertas, alertas de
   estoque de insumos e de pronta entrega; ações rápidas (nova encomenda, novo insumo, novo
   produto); kanban de encomendas em aberto; lucro líquido estimado do mês
2. **Insumos** — listagem com alertas de estoque, cadastro por categoria, histórico de preço
3. **Produtos** — listagem, montagem de receita, visualização de custo e preço sugerido
4. **Encomendas** — lista e kanban por status, cadastro, tela de detalhe completa
5. **Financeiro** — DRE + histórico mensal; CRUD de custos fixos; fluxo de caixa com filtro de período
6. **Configurações** — horas trabalhadas/mês e multiplicador de preço; exibe taxa horária derivada
7. **Pronta Entrega** — listagem com alertas de estoque, cadastro, tela de detalhe
8. **Login** — autenticação simples com sessão em localStorage

### 2.3 Escopo de Versões Futuras

Funcionalidades planejadas para versões futuras, sem data definida:

- **Log de movimentações de estoque** — histórico de entradas (compra), saídas (encomenda
  entregue) e ajustes manuais para insumos rotativos; dedução automática de estoque ao marcar
  encomenda como "Entregue"
- **Perfil parceiro** — segundo perfil de usuário com acesso restrito (sem precificação e
  financeiro)
- **Orçamento para cliente** — geração de link público com itens, valores e prazo a partir de uma
  encomenda
- **Emissão de nota fiscal**
- **Integração com meios de pagamento**
- **Relatórios exportáveis (PDF/Excel)**
- **App mobile nativo**
- **Amortização automática de ferramentas e maquinário**
- **Backend e persistência real** — substituição do modelo atual (mock + localStorage) por banco de
  dados com autenticação robusta

### 2.4 Limitações e Exclusões

- Não há sincronização entre dispositivos; dados ficam no navegador da máquina onde o sistema é
  acessado.
- Não há suporte a múltiplos usuários simultâneos na v1.
- O módulo de Pronta Entrega é independente do estoque de insumos — lotes de produção de produtos
  prontos não deduzem insumos automaticamente na v1.

---

## 3. Contexto de Negócio

### 3.1 Perfis de Stakeholders

| Perfil       | Papel                              | Acesso                                                                    | Interesse Principal                                                                       |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Proprietária | Usuária principal, dona do negócio | Total: cadastros, precificação, encomendas, financeiro, pronta entrega    | Visibilidade real sobre custos e margens; organização das encomendas; controle financeiro |
| Mateus       | Desenvolvedor                      | Nenhum (externo ao sistema)                                               | Construção e manutenção do sistema                                                        |

### 3.2 Considerações de Implantação

> **[TBD]** Ambiente de hospedagem, estratégia de deploy e migração de dados não foram definidos
> nesta versão do documento.
