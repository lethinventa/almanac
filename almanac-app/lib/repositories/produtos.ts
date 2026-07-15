import { createStore, newId } from "@/lib/mock-store";
import { produtosSeed } from "@/lib/data";

export interface InsumoReceita {
  insumoId: string;
  quantidade: number;
}

export interface Etapas3D {
  impressao?: number;
  modelagem?: number;
  acabamento?: number;
}

export interface LoteProducao {
  id: string;
  produtoId: string;
  quantidade: number;
  data: string;
  observacao?: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  receita: InsumoReceita[];
  tempoProducao: number;
  custo: number;
  precoSugerido: number;
  margem: number;
  foto?: string;
  prontoEstoque?: number;
  prontoEstoqueMin?: number;
  etapas3D?: Etapas3D;
  historicoLotes?: LoteProducao[];
}

export interface ProdutoInput {
  nome: string;
  categoria: string;
  receita: InsumoReceita[];
  tempoProducao: number;
  custo: number;
  precoSugerido: number;
  margem: number;
  foto?: string;
  prontoEstoque?: number | null;
  prontoEstoqueMin?: number | null;
  etapas3D?: Etapas3D | null;
}

const store = createStore<Produto>("almanac_produtos", produtosSeed);

function withSortedLotes(produto: Produto): Produto {
  return {
    ...produto,
    historicoLotes: (produto.historicoLotes ?? []).slice().sort((a, b) => b.data.localeCompare(a.data)),
  };
}

export async function buscarProdutos(): Promise<Produto[]> {
  return store.list().slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(withSortedLotes);
}

export async function criarProduto(dados: ProdutoInput): Promise<Produto> {
  const produto: Produto = {
    id: newId(),
    nome: dados.nome,
    categoria: dados.categoria,
    receita: dados.receita,
    tempoProducao: dados.tempoProducao,
    custo: dados.custo,
    precoSugerido: dados.precoSugerido,
    margem: dados.margem,
    foto: dados.foto,
    prontoEstoque: dados.prontoEstoque ?? undefined,
    prontoEstoqueMin: dados.prontoEstoqueMin ?? undefined,
    etapas3D: dados.etapas3D ?? undefined,
    historicoLotes: [],
  };
  return store.insert(produto);
}

export async function editarProduto(id: string, dados: Partial<ProdutoInput>): Promise<Produto> {
  const patch: Partial<Produto> = {};
  if (dados.nome !== undefined) patch.nome = dados.nome;
  if (dados.categoria !== undefined) patch.categoria = dados.categoria;
  if (dados.receita !== undefined) patch.receita = dados.receita;
  if (dados.tempoProducao !== undefined) patch.tempoProducao = dados.tempoProducao;
  if (dados.custo !== undefined) patch.custo = dados.custo;
  if (dados.precoSugerido !== undefined) patch.precoSugerido = dados.precoSugerido;
  if (dados.margem !== undefined) patch.margem = dados.margem;
  if ("foto" in dados) patch.foto = dados.foto ?? undefined;
  if ("prontoEstoque" in dados) patch.prontoEstoque = dados.prontoEstoque ?? undefined;
  if ("prontoEstoqueMin" in dados) patch.prontoEstoqueMin = dados.prontoEstoqueMin ?? undefined;
  if ("etapas3D" in dados) patch.etapas3D = dados.etapas3D ?? undefined;

  const updated = store.update(id, patch);
  if (!updated) throw new Error("Produto não encontrado");
  return withSortedLotes(updated);
}

export async function deletarProduto(id: string): Promise<void> {
  store.remove(id);
}

export async function registrarLote(
  produtoId: string,
  lote: { quantidade: number; data: string; observacao?: string }
): Promise<void> {
  const atual = store.find(produtoId);
  if (!atual) throw new Error("Produto não encontrado");
  const novoLote: LoteProducao = { id: newId(), produtoId, quantidade: lote.quantidade, data: lote.data, observacao: lote.observacao };
  store.update(produtoId, { historicoLotes: [...(atual.historicoLotes ?? []), novoLote] });
}
