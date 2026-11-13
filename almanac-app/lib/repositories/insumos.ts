import { createRemoteStore, newId } from "@/lib/remote-store";
import { listarProdutos } from "@/lib/repositories/produtos-registro";

export type InsumoCategoria = "visivel" | "invisivel" | "ferramenta" | "maquinario" | "embalagem";

export interface Insumo {
  id: string;
  nome: string;
  categoria: InsumoCategoria;
  unidade: string;
  precoAtual: number;
  estoque: number | null;
  estoqueMin: number | null;
  fornecedor?: string;
  historico: { data: string; preco: number }[];
}

export interface InsumoInput {
  nome: string;
  categoria: InsumoCategoria;
  unidade: string;
  precoAtual: number;
  estoque?: number | null;
  estoqueMin?: number | null;
  fornecedor?: string;
}

const store = createRemoteStore<Insumo>("insumos");

function sortedHistorico(historico: Insumo["historico"]) {
  return [...historico].sort((a, b) => a.data.localeCompare(b.data));
}

export async function buscarInsumos(): Promise<Insumo[]> {
  return (await store.list())
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((i) => ({ ...i, historico: sortedHistorico(i.historico) }));
}

export async function criarInsumo(dados: InsumoInput): Promise<Insumo> {
  const insumo: Insumo = {
    id: newId(),
    nome: dados.nome,
    categoria: dados.categoria,
    unidade: dados.unidade,
    precoAtual: dados.precoAtual,
    estoque: dados.estoque ?? null,
    estoqueMin: dados.estoqueMin ?? null,
    fornecedor: dados.fornecedor,
    historico:
      dados.precoAtual > 0 ? [{ data: new Date().toISOString().slice(0, 10), preco: dados.precoAtual }] : [],
  };
  return store.insert(insumo);
}

export async function editarInsumo(id: string, dados: Partial<InsumoInput>): Promise<Insumo> {
  const atual = await store.find(id);
  if (!atual) throw new Error("Insumo não encontrado");

  const patch: Partial<Insumo> = {};
  if (dados.nome !== undefined) patch.nome = dados.nome;
  if (dados.categoria !== undefined) patch.categoria = dados.categoria;
  if (dados.unidade !== undefined) patch.unidade = dados.unidade;
  if ("estoque" in dados) patch.estoque = dados.estoque ?? null;
  if ("estoqueMin" in dados) patch.estoqueMin = dados.estoqueMin ?? null;
  if ("fornecedor" in dados) patch.fornecedor = dados.fornecedor;

  if (dados.precoAtual !== undefined) {
    patch.precoAtual = dados.precoAtual;
    patch.historico = [
      ...atual.historico,
      { data: new Date().toISOString().slice(0, 10), preco: dados.precoAtual },
    ];
  }

  const updated = await store.update(id, patch);
  if (!updated) throw new Error("Erro ao editar insumo");
  return { ...updated, historico: sortedHistorico(updated.historico) };
}

export async function deletarInsumo(id: string): Promise<void> {
  const emUso = (await listarProdutos()).filter((p) => p.receita.some((r) => r.insumoId === id));
  if (emUso.length > 0) {
    throw new Error(`Este insumo está na receita de: ${emUso.map((p) => p.nome).join(", ")}.`);
  }
  await store.remove(id);
}

export async function registrarPreco(insumoId: string, preco: number, data: string): Promise<void> {
  const atual = await store.find(insumoId);
  if (!atual) throw new Error("Insumo não encontrado");
  await store.update(insumoId, { historico: [...atual.historico, { data, preco }] });
}
