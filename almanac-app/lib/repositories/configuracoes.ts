import { createRemoteSingleton } from "@/lib/remote-store";
import { configuracoesSeed } from "@/lib/data";

export interface Configuracoes {
  horasTrabalhoMes: number;
  multiplicadorPreco: number;
  custoHoraBambu: number;
}

const store = createRemoteSingleton<Configuracoes>("configuracoes", configuracoesSeed);

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  return store.get();
}

export async function salvarConfiguracoes(config: Partial<Configuracoes>): Promise<void> {
  await store.set(config);
}
