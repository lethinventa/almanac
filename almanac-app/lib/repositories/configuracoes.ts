import { createRemoteSingleton } from "@/lib/remote-store";
import { configuracoesSeed } from "@/lib/data";

export interface Configuracoes {
  horasTrabalhoMes: number;
  multiplicadorPreco: number;
  custoHoraBambu: number;
  // Quanto vale a sua hora de trabalho (R$/h), cobrado além dos custos indiretos
  valorHoraTrabalho: number;
  // Dados que aparecem no orçamento enviado ao cliente
  nomeLoja: string;
  telefone: string;
  email: string;
  instagram: string;
  endereco: string;
  validadeDias: number;
}

const store = createRemoteSingleton<Configuracoes>("configuracoes", configuracoesSeed);

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  return store.get();
}

export async function salvarConfiguracoes(config: Partial<Configuracoes>): Promise<void> {
  await store.set(config);
}
