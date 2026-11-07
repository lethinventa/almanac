import type { Configuracoes } from "@/lib/repositories/configuracoes";
import type { Insumo } from "@/lib/repositories/insumos";
import { calcPrecoSugerido, taxaHoraria } from "@/lib/produto-calculos";

// Orçamento rápido: nenhum produto é cadastrado. Cada item é descrito na hora,
// com o custo de material vindo de insumos já cadastrados (receita rápida)
// e/ou de um valor avulso, e o preço segue a mesma fórmula de produtos.

export interface InsumoUso {
  insumoId: string;
  quantidade: number;
}

export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  insumos: InsumoUso[];
  // Material avulso por unidade (embalagem, fita, etc.) que não está nos insumos.
  materialAvulso: number;
  tempoMin: number;
  multiplicador: number;
  // Preço unitário digitado à mão. Quando null, usa o preço calculado.
  precoManual: number | null;
}

export interface ItemCalculado {
  custoMaterial: number;
  custoTempo: number;
  custoUnitario: number;
  precoCalculado: number;
  precoUnitario: number;
  subtotal: number;
  custoTotal: number;
  margem: number;
}

export interface ResumoOrcamento {
  subtotal: number;
  desconto: number;
  total: number;
  custoTotal: number;
  margem: number;
}

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

export function calcularItem(
  item: ItemOrcamento,
  insumos: Map<string, Insumo>,
  config: Configuracoes,
  totalCustos: number
): ItemCalculado {
  const custoInsumos = item.insumos.reduce((soma, uso) => {
    const insumo = insumos.get(uso.insumoId);
    return insumo ? soma + insumo.precoAtual * uso.quantidade : soma;
  }, 0);
  const custoMaterial = custoInsumos + (item.materialAvulso || 0);

  const custoTempo = (item.tempoMin / 60) * taxaHoraria(config, totalCustos);
  const custoUnitario = custoMaterial + custoTempo;

  const precoCalculado = arredondar(
    calcPrecoSugerido(
      custoMaterial,
      item.tempoMin,
      { ...config, multiplicadorPreco: item.multiplicador },
      totalCustos
    )
  );
  const precoUnitario = item.precoManual ?? precoCalculado;

  const subtotal = arredondar(precoUnitario * item.quantidade);
  const custoTotal = custoUnitario * item.quantidade;
  const margem = subtotal > 0 ? ((subtotal - custoTotal) / subtotal) * 100 : 0;

  return {
    custoMaterial,
    custoTempo,
    custoUnitario,
    precoCalculado,
    precoUnitario,
    subtotal,
    custoTotal,
    margem,
  };
}

export function calcularResumo(itens: ItemCalculado[], desconto: number): ResumoOrcamento {
  const subtotal = itens.reduce((soma, i) => soma + i.subtotal, 0);
  const custoTotal = itens.reduce((soma, i) => soma + i.custoTotal, 0);
  const descontoAplicado = Math.min(Math.max(desconto || 0, 0), subtotal);
  const total = arredondar(subtotal - descontoAplicado);
  const margem = total > 0 ? ((total - custoTotal) / total) * 100 : 0;
  return { subtotal, desconto: descontoAplicado, total, custoTotal, margem };
}

export function novoItem(multiplicadorPadrao: number, id: string): ItemOrcamento {
  return {
    id,
    descricao: "",
    quantidade: 1,
    insumos: [],
    materialAvulso: 0,
    tempoMin: 0,
    multiplicador: multiplicadorPadrao,
    precoManual: null,
  };
}

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Texto pronto para colar no WhatsApp.
export function textoOrcamento(
  cliente: string,
  prazo: string,
  itens: { item: ItemOrcamento; calc: ItemCalculado }[],
  resumo: ResumoOrcamento
): string {
  const linhas: string[] = [];
  linhas.push(cliente.trim() ? `Orçamento para ${cliente.trim()}` : "Orçamento");
  linhas.push("");
  for (const { item, calc } of itens) {
    const nome = item.descricao.trim() || "Item";
    linhas.push(`• ${item.quantidade}x ${nome} — ${moeda(calc.precoUnitario)} cada = ${moeda(calc.subtotal)}`);
  }
  linhas.push("");
  if (resumo.desconto > 0) {
    linhas.push(`Subtotal: ${moeda(resumo.subtotal)}`);
    linhas.push(`Desconto: − ${moeda(resumo.desconto)}`);
  }
  linhas.push(`*Total: ${moeda(resumo.total)}*`);
  if (prazo.trim()) {
    linhas.push("");
    linhas.push(`Prazo de entrega: ${prazo.trim()}`);
  }
  return linhas.join("\n");
}
