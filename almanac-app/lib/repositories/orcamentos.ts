import { createRemoteStore, newId } from "@/lib/remote-store";
import { criarEncomenda, type Encomenda } from "@/lib/repositories/encomendas";

// Orçamento enviado ao cliente. Os itens são um snapshot do que foi enviado:
// mudanças depois no cálculo ou nos insumos não alteram o orçamento registrado.

export type OrcamentoStatus = "enviado" | "aprovado" | "recusado";

export interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  custoUnitario: number;
}

export interface Orcamento {
  id: string;
  cliente: string;
  prazo: string;
  enviadoEm: string; // ISO datetime
  status: OrcamentoStatus;
  itens: OrcamentoItem[];
  subtotal: number;
  desconto: number;
  total: number;
  custoTotal: number;
  margem: number;
  encomendaId?: string;
}

export type OrcamentoInput = Omit<Orcamento, "id" | "status" | "encomendaId">;

const store = createRemoteStore<Orcamento>("orcamentos");

export async function listarOrcamentos(): Promise<Orcamento[]> {
  return (await store.list()).sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm));
}

export async function registrarOrcamentoEnviado(dados: OrcamentoInput): Promise<Orcamento> {
  return store.insert({ id: newId(), status: "enviado", ...dados });
}

export async function recusarOrcamento(id: string): Promise<void> {
  const atualizado = await store.update(id, { status: "recusado" });
  if (!atualizado) throw new Error("Orçamento não encontrado");
}

// Cliente aprovou: cria a encomenda já em produção e liga as duas.
export async function aprovarOrcamento(orcamento: Orcamento, dataEntrega: string): Promise<Encomenda> {
  const hoje = new Date().toISOString().slice(0, 10);
  const encomenda = await criarEncomenda({
    cliente: orcamento.cliente.trim() || "Sem nome",
    canal: "whatsapp",
    status: "em_producao",
    dataPedido: hoje,
    dataEntrega,
    itens: orcamento.itens.map((i) => ({
      produtoId: "",
      descricao: i.descricao,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      custoUnitario: i.custoUnitario,
    })),
    desconto: orcamento.desconto,
    totalCobrado: orcamento.total,
    custoProducao: orcamento.custoTotal,
    margem: orcamento.margem,
    observacoes: orcamento.prazo ? `Prazo combinado no orçamento: ${orcamento.prazo}` : undefined,
  });
  const atualizado = await store.update(orcamento.id, { status: "aprovado", encomendaId: encomenda.id });
  if (!atualizado) throw new Error("Orçamento não encontrado");
  return encomenda;
}
