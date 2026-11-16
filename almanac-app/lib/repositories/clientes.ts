import { createRemoteStore, newId } from "@/lib/remote-store";

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  observacoes?: string;
}

export interface ClienteInput {
  nome: string;
  telefone?: string;
  observacoes?: string;
}

const store = createRemoteStore<Cliente>("clientes");

export async function buscarClientes(): Promise<Cliente[]> {
  const lista = await store.list();
  return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function criarCliente(dados: ClienteInput): Promise<Cliente> {
  const cliente: Cliente = {
    id: newId(),
    nome: dados.nome.trim(),
    telefone: dados.telefone?.trim() || undefined,
    observacoes: dados.observacoes?.trim() || undefined,
  };
  return store.insert(cliente);
}

export async function editarCliente(id: string, dados: ClienteInput): Promise<Cliente> {
  const updated = await store.update(id, {
    nome: dados.nome.trim(),
    telefone: dados.telefone?.trim() || undefined,
    observacoes: dados.observacoes?.trim() || undefined,
  });
  if (!updated) throw new Error("Cliente não encontrado");
  return updated;
}

// Encomendas guardam o nome do cliente (um retrato no momento do pedido),
// então excluir o cadastro não altera pedidos já feitos.
export async function excluirCliente(id: string): Promise<void> {
  await store.remove(id);
}
