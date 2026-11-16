import { createRemoteStore } from "@/lib/remote-store";

export interface Cliente {
  id: string;
  nome: string;
}

const store = createRemoteStore<Cliente>("clientes");

export async function buscarClientes(): Promise<Cliente[]> {
  const lista = await store.list();
  return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
