import { createStore, newId } from "@/lib/mock-store";
import { custosIndiretosSeed } from "@/lib/data";

export interface CustoIndireto {
  id: string;
  nome: string;
  valorMensal: number;
}

const store = createStore<CustoIndireto>("almanac_custos_indiretos", custosIndiretosSeed);

export async function buscarCustosIndiretos(): Promise<CustoIndireto[]> {
  return store.list().slice().sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function buscarTotalCustosIndiretos(): Promise<number> {
  const custos = await buscarCustosIndiretos();
  return custos.reduce((sum, c) => sum + c.valorMensal, 0);
}

export async function criarCustoIndireto(dados: { nome: string; valorMensal: number }): Promise<CustoIndireto> {
  return store.insert({ id: newId(), nome: dados.nome, valorMensal: dados.valorMensal });
}

export async function editarCustoIndireto(
  id: string,
  dados: { nome?: string; valorMensal?: number }
): Promise<CustoIndireto> {
  const patch: Partial<CustoIndireto> = {};
  if (dados.nome !== undefined) patch.nome = dados.nome;
  if (dados.valorMensal !== undefined) patch.valorMensal = dados.valorMensal;

  const updated = store.update(id, patch);
  if (!updated) throw new Error("Custo indireto não encontrado");
  return updated;
}

export async function deletarCustoIndireto(id: string): Promise<void> {
  store.remove(id);
}
