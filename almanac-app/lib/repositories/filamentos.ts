import { createRemoteStore, newId } from "@/lib/remote-store";

export const MATERIAIS_FILAMENTO = ["PLA", "PETG", "ABS", "TPU", "ASA", "Outro"] as const;
export type MaterialFilamento = (typeof MATERIAIS_FILAMENTO)[number];

export const PESO_ROLO_PADRAO = 1000;

export interface Filamento {
  id: string;
  cor: string;
  corHex: string;
  material: MaterialFilamento;
  marca?: string;
  pesoRolo: number; // gramas do rolo cheio
  gramasRestantes: number; // gramas restantes em cada rolo
  quantidade: number; // quantos rolos iguais a este tenho
  observacoes?: string;
}

export interface FilamentoInput {
  cor: string;
  corHex: string;
  material: MaterialFilamento;
  marca?: string;
  pesoRolo: number;
  gramasRestantes: number;
  quantidade: number;
  observacoes?: string;
}

const store = createRemoteStore<Filamento>("filamentos");

export async function buscarFilamentos(): Promise<Filamento[]> {
  // Registros antigos (sem quantidade) contam como 1 rolo.
  return (await store.list())
    .map((f) => ({ ...f, quantidade: f.quantidade ?? 1 }))
    .sort(
    (a, b) => a.material.localeCompare(b.material) || a.cor.localeCompare(b.cor),
  );
}

export async function criarFilamento(dados: FilamentoInput): Promise<Filamento> {
  return store.insert({ id: newId(), ...dados });
}

export async function editarFilamento(id: string, dados: Partial<FilamentoInput>): Promise<Filamento> {
  const atualizado = await store.update(id, dados);
  if (!atualizado) throw new Error("Filamento não encontrado");
  return atualizado;
}

export async function deletarFilamento(id: string): Promise<void> {
  await store.remove(id);
}
