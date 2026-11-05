import { createRemoteStore, newId } from "@/lib/remote-store";

export interface CustoIndireto {
  id: string;
  nome: string;
  valorMensal: number;
}

const store = createRemoteStore<CustoIndireto>("custos_indiretos");

export async function buscarCustosIndiretos(): Promise<CustoIndireto[]> {
  return (await store.list()).sort((a, b) => a.nome.localeCompare(b.nome));
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

  const updated = await store.update(id, patch);
  if (!updated) throw new Error("Custo indireto não encontrado");
  return updated;
}

export async function deletarCustoIndireto(id: string): Promise<void> {
  await store.remove(id);
}
