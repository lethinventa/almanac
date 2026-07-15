import { createStore, newId } from "@/lib/mock-store";
import { produtosPeSeed } from "@/lib/data";

export interface ProdutoPE {
  id: string;
  nome: string;
  descricao?: string;
  foto?: string;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMin: number;
}

export interface ProdutoPEInput {
  nome: string;
  descricao?: string;
  foto?: string;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMin: number;
}

const store = createStore<ProdutoPE>("almanac_produtos_pe", produtosPeSeed);

export async function buscarProdutosPE(): Promise<ProdutoPE[]> {
  return store.list().slice().sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function buscarProdutoPE(id: string): Promise<ProdutoPE | null> {
  return store.find(id);
}

export async function criarProdutoPE(dados: ProdutoPEInput): Promise<ProdutoPE> {
  const produto: ProdutoPE = {
    id: newId(),
    nome: dados.nome,
    descricao: dados.descricao,
    foto: dados.foto,
    precoVenda: dados.precoVenda,
    estoqueAtual: dados.estoqueAtual,
    estoqueMin: dados.estoqueMin,
  };
  return store.insert(produto);
}

export async function editarProdutoPE(id: string, dados: Partial<ProdutoPEInput>): Promise<ProdutoPE> {
  const patch: Partial<ProdutoPE> = {};
  if (dados.nome !== undefined) patch.nome = dados.nome;
  if ("descricao" in dados) patch.descricao = dados.descricao;
  if ("foto" in dados) patch.foto = dados.foto;
  if (dados.precoVenda !== undefined) patch.precoVenda = dados.precoVenda;
  if (dados.estoqueAtual !== undefined) patch.estoqueAtual = dados.estoqueAtual;
  if (dados.estoqueMin !== undefined) patch.estoqueMin = dados.estoqueMin;

  const updated = store.update(id, patch);
  if (!updated) throw new Error("Produto PE não encontrado");
  return updated;
}

export async function deletarProdutoPE(id: string): Promise<void> {
  store.remove(id);
}
