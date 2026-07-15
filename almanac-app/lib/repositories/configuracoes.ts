import { createSingletonStore } from "@/lib/mock-store";
import { configuracoesSeed } from "@/lib/data";

export interface Configuracoes {
  horasTrabalhoMes: number;
  multiplicadorPreco: number;
  custoHoraBambu: number;
}

const store = createSingletonStore<Configuracoes>("almanac_configuracoes", configuracoesSeed);

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  return store.get();
}

export async function salvarConfiguracoes(config: Partial<Configuracoes>): Promise<void> {
  store.set(config);
}
