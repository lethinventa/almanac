import { buscarInsumos, type Insumo } from "@/lib/repositories/insumos";
import { buscarConfiguracoes, type Configuracoes } from "@/lib/repositories/configuracoes";
import { buscarTotalCustosIndiretos } from "@/lib/repositories/financeiro";
import { buscarEncomendas } from "@/lib/repositories/encomendas";
import * as registro from "@/lib/repositories/produtos-registro";
import { calcPrecoSugerido, calcPreco3D } from "@/lib/produto-calculos";

export type { Produto, ProdutoInput, InsumoReceita, Etapas3D } from "@/lib/repositories/produtos-registro";
import type { Produto } from "@/lib/repositories/produtos-registro";

// Produto com valores derivados: custo = soma dos insumos da receita aos preços atuais;
// preço sugerido e margem seguem a configuração atual (multiplicador do produto ou global).
export interface ProdutoCalculado extends Produto {
  custo: number;
  precoSugerido: number;
  // Preço de venda vigente: o definido pela proprietária ou, se não houver, o sugerido.
  precoVendaEfetivo: number;
  margem: number;
  multiplicador: number;
}

function calcularProduto(
  produto: Produto,
  insumos: Map<string, Insumo>,
  config: Configuracoes,
  totalCustos: number
): ProdutoCalculado {
  const custo = produto.receita.reduce((soma, r) => {
    const insumo = insumos.get(r.insumoId);
    return insumo ? soma + insumo.precoAtual * r.quantidade : soma;
  }, 0);

  const multiplicador = produto.multiplicador ?? config.multiplicadorPreco;
  const configProduto = { ...config, multiplicadorPreco: multiplicador };

  const precoSugerido =
    produto.categoria === "Impressão 3D" && produto.etapas3D
      ? calcPreco3D(custo, produto.etapas3D, configProduto, totalCustos).precoSugerido
      : calcPrecoSugerido(custo, produto.tempoProducao, configProduto, totalCustos);

  const precoVendaEfetivo = produto.precoVenda && produto.precoVenda > 0 ? produto.precoVenda : precoSugerido;
  const margem = precoVendaEfetivo > 0 ? ((precoVendaEfetivo - custo) / precoVendaEfetivo) * 100 : 0;

  return { ...produto, custo, precoSugerido, precoVendaEfetivo, margem, multiplicador };
}

export async function buscarProdutos(): Promise<ProdutoCalculado[]> {
  const [produtos, insumos, config, totalCustos] = await Promise.all([
    registro.listarProdutos(),
    buscarInsumos(),
    buscarConfiguracoes(),
    buscarTotalCustosIndiretos(),
  ]);
  const mapaInsumos = new Map(insumos.map((i) => [i.id, i]));
  return produtos
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((p) => calcularProduto(p, mapaInsumos, config, totalCustos));
}

export async function criarProduto(dados: registro.ProdutoInput): Promise<Produto> {
  return registro.criarProduto(dados);
}

export async function editarProduto(id: string, dados: Partial<registro.ProdutoInput>): Promise<Produto> {
  return registro.editarProduto(id, dados);
}

export async function deletarProduto(id: string): Promise<void> {
  const encomendas = await buscarEncomendas();
  const emEncomenda = encomendas.some((e) => e.itens.some((i) => i.produtoId === id));
  if (emEncomenda) {
    throw new Error("Este produto já está em encomendas e não pode ser excluído.");
  }
  await registro.removerProduto(id);
}
