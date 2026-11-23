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

// Corrige um orçamento já registrado (cliente, prazo, itens, desconto).
// Totais, custo e margem são recalculados a partir dos itens editados.
// Orçamento aprovado não pode ser editado: já virou encomenda.
export async function editarOrcamento(
  id: string,
  dados: { cliente: string; prazo: string; desconto: number; itens: OrcamentoItem[] }
): Promise<Orcamento> {
  const atual = await store.list().then((l) => l.find((o) => o.id === id));
  if (!atual) throw new Error("Orçamento não encontrado");
  if (atual.status === "aprovado") throw new Error("Orçamento aprovado não pode ser editado: edite a encomenda.");

  const subtotal = dados.itens.reduce((s, i) => s + i.subtotal, 0);
  const custoTotal = dados.itens.reduce((s, i) => s + i.custoUnitario * i.quantidade, 0);
  const desconto = Math.min(Math.max(dados.desconto || 0, 0), subtotal);
  const total = Math.round((subtotal - desconto) * 100) / 100;
  const margem = total > 0 ? ((total - custoTotal) / total) * 100 : 0;

  const atualizado = await store.update(id, {
    cliente: dados.cliente.trim(),
    prazo: dados.prazo.trim(),
    itens: dados.itens,
    subtotal,
    desconto,
    total,
    custoTotal,
    margem,
  });
  if (!atualizado) throw new Error("Orçamento não encontrado");
  return atualizado;
}

export async function recusarOrcamento(id: string): Promise<void> {
  const atualizado = await store.update(id, { status: "recusado" });
  if (!atualizado) throw new Error("Orçamento não encontrado");
}

// Cliente aprovou: cria a encomenda já em produção e liga as duas.
export async function aprovarOrcamento(orcamento: Orcamento, dataEntrega: string, orcamentoImagem: string): Promise<Encomenda> {
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
    orcamentoImagem,
  });
  const atualizado = await store.update(orcamento.id, { status: "aprovado", encomendaId: encomenda.id });
  if (!atualizado) throw new Error("Orçamento não encontrado");
  return encomenda;
}
