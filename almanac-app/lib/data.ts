import type { Insumo } from "@/lib/repositories/insumos";
import type { Produto } from "@/lib/repositories/produtos";
import type { Encomenda } from "@/lib/repositories/encomendas";
import type { Pagamento } from "@/lib/repositories/pagamentos";
import type { ProdutoPE } from "@/lib/repositories/pronta-entrega";
import type { CustoIndireto } from "@/lib/repositories/financeiro";
import type { Configuracoes } from "@/lib/repositories/configuracoes";

// Seeds de dados começam vazios: o sistema é usado em produção real.
// configuracoesSeed mantém valores padrão porque são usados nos cálculos de preço.

export const insumosSeed: Insumo[] = [];

export const produtosSeed: Produto[] = [];

export const encomendasSeed: Encomenda[] = [];

export const pagamentosSeed: Pagamento[] = [];

export const produtosPeSeed: ProdutoPE[] = [];

export const custosIndiretosSeed: CustoIndireto[] = [];

export const configuracoesSeed: Configuracoes = {
  horasTrabalhoMes: 160,
  multiplicadorPreco: 3,
  custoHoraBambu: 4.5,
  nomeLoja: "Ginga",
  telefone: "",
  instagram: "",
  endereco: "",
  validadeDias: 7,
};
