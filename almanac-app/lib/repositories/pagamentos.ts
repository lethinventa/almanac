import { createRemoteStore, newId } from "@/lib/remote-store";

export interface Pagamento {
  id: string;
  encomendaId: string;
  valor: number;
  metodo: "pix" | "dinheiro" | "cartao";
  data: string;
  tipo: "recebimento" | "estorno";
  observacao?: string;
  motivoEstorno?: string;
  // Preenchido apenas em estornos: id do recebimento que foi estornado
  estornoDeId?: string;
}

export interface PagamentoInput {
  encomendaId: string;
  valor: number;
  metodo: "pix" | "dinheiro" | "cartao";
  data: string;
  observacao?: string;
}

const store = createRemoteStore<Pagamento>("pagamentos");

export async function buscarPagamentos(encomendaId: string): Promise<Pagamento[]> {
  return (await store.list()).filter((p) => p.encomendaId === encomendaId);
}

export async function registrarPagamento(dados: PagamentoInput): Promise<Pagamento> {
  const pagamento: Pagamento = {
    id: newId(),
    encomendaId: dados.encomendaId,
    valor: dados.valor,
    metodo: dados.metodo,
    data: dados.data,
    tipo: "recebimento",
    observacao: dados.observacao,
  };
  return store.insert(pagamento);
}

export async function buscarTodosPagamentos(): Promise<
  Record<string, Array<{ id: string; valor: number; data: string; forma: string; observacao?: string }>>
> {
  const result: Record<string, Array<{ id: string; valor: number; data: string; forma: string; observacao?: string }>> = {};
  for (const p of await store.list()) {
    if (!result[p.encomendaId]) result[p.encomendaId] = [];
    result[p.encomendaId].push({ id: p.id, valor: p.valor, data: p.data, forma: p.metodo, observacao: p.observacao ?? p.motivoEstorno });
  }
  return result;
}

// Remove todos os registros de pagamento de uma encomenda (usado ao excluí-la).
export async function excluirPagamentosDaEncomenda(encomendaId: string): Promise<void> {
  for (const p of await buscarPagamentos(encomendaId)) {
    await store.remove(p.id);
  }
}

// Exclui o lançamento (ex.: valor digitado errado). Não gera saída no caixa.
// Excluir um recebimento também remove os estornos antigos ligados a ele.
export async function excluirPagamento(pagamentoId: string): Promise<void> {
  const todos = await store.list();
  const alvo = todos.find((p) => p.id === pagamentoId);
  if (!alvo) throw new Error("Pagamento não encontrado");
  const remover = alvo.tipo === "recebimento" ? todos.filter((p) => p.id === pagamentoId || p.estornoDeId === pagamentoId) : [alvo];
  for (const p of remover) {
    await store.remove(p.id);
  }
}
