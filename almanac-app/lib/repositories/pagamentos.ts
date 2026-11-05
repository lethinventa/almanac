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

export async function estornarPagamento(pagamentoId: string, motivo: string): Promise<void> {
  const original = await store.find(pagamentoId);
  if (!original) throw new Error("Pagamento não encontrado");
  if (original.tipo !== "recebimento") throw new Error("Só é possível estornar um recebimento.");

  const jaEstornado = (await store.list()).some((p) => p.estornoDeId === pagamentoId);
  if (jaEstornado) throw new Error("Este pagamento já foi estornado.");

  await store.insert({
    id: newId(),
    encomendaId: original.encomendaId,
    valor: -Math.abs(original.valor),
    metodo: original.metodo,
    data: new Date().toISOString().slice(0, 10),
    tipo: "estorno",
    motivoEstorno: motivo,
    estornoDeId: pagamentoId,
  });
}
