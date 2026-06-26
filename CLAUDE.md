# Almanac — CLAUDE.md

Especificação completa: [`.spec/vision-and-scope.md`](.spec/vision-and-scope.md)

---

## O que é o Almanac

Sistema interno de gestão para um negócio de papelaria criativa personalizada. Substitui Notion e
Google Sheets adaptados. Usuária única: a proprietária do negócio.

## Stack

Next.js 15 (App Router), TypeScript, CSS customizado (design system Atlas). Sem backend — dados
persistidos em `localStorage` e mocks em `lib/data.ts`.

## Módulos implementados (v1)

| Rota                  | Módulo              | O que faz                                                                                   |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `/`                   | Dashboard           | Resumo do mês, alertas de estoque, kanban de encomendas abertas, ações rápidas              |
| `/insumos`            | Insumos             | CRUD de insumos em 4 categorias (rotativo visível/invisível, ferramenta, maquinário); alertas de estoque mínimo; histórico de preço |
| `/produtos`           | Produtos/Receitas   | Cadastro com receita de insumos; custo calculado; preço sugerido via multiplicador          |
| `/encomendas`         | Encomendas          | Lista e kanban por status (aguardando → em produção → pronto → entregue)                    |
| `/encomendas/[id]`    | Detalhe da encomenda | Itens editáveis, painel de pagamento, observações do cliente/internas, foto, arquivos, timeline |
| `/financeiro`         | Financeiro          | DRE mensal + histórico; CRUD de custos fixos; fluxo de caixa com filtro de período         |
| `/configuracoes`      | Configurações       | Horas trabalhadas/mês e multiplicador de preço; exibe taxa horária derivada                 |
| `/pronta-entrega`     | Pronta Entrega      | Produtos prontos para venda imediata, independente de encomendas; alertas de estoque        |
| `/pronta-entrega/[id]`| Detalhe PE          | Detalhes do produto de pronta entrega                                                       |
| `/login`              | Auth                | Login simples; sessão em localStorage; único perfil: proprietária                          |

## Modelo de precificação

Preço sugerido = `(custo de material + custo de tempo) × multiplicadorPreco`  
Taxa horária = `total de custos indiretos mensais ÷ horasTrabalhoMes`  
Ambos os parâmetros são configuráveis em `/configuracoes`. Custos indiretos são gerenciados em `/financeiro`.

## Controle de pagamento (por encomenda)

`PainelPagamento` em `/encomendas/[id]`: múltiplos registros de recebimento (Pix, dinheiro,
cartão), estorno com motivo, status consolidado (sem pagamento / sinal / paga / paga a maior).
Integrado ao fluxo de caixa em `/financeiro`.

## O que ainda não foi implementado

- Log de movimentações de estoque de insumos (entrada/saída/ajuste manual)
- Dedução automática de estoque ao entregar encomenda
- Perfil parceiro (segundo usuário com acesso restrito)
- Backend / persistência real (tudo é mock + localStorage na v1)
