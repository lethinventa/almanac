import { createRemoteStore, newId } from "@/lib/remote-store";

export type EncomendaStatus = "aguardando" | "em_producao" | "pronto" | "entregue" | "cancelado";

export interface EncomendaItem {
  // Vazio quando o item veio de um orçamento sem produto cadastrado.
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  // Usados só nos itens sem produto (vindos de orçamento).
  descricao?: string;
  custoUnitario?: number;
}

export interface LinkUtil {
  id: string;
  label: string;
  url: string;
}

export interface Encomenda {
  id: string;
  cliente: string;
  canal: "whatsapp" | "presencial";
  status: EncomendaStatus;
  dataPedido: string;
  dataEntrega: string;
  itens: EncomendaItem[];
  desconto: number;
  totalCobrado: number;
  custoProducao: number;
  margem: number;
  observacoes?: string;
  observacoesInternas?: string;
  foto?: string;
  linksUteis: LinkUtil[];
}

export interface EncomendaInput {
  cliente: string;
  canal: "whatsapp" | "presencial";
  status?: EncomendaStatus;
  dataPedido: string;
  dataEntrega: string;
  itens: EncomendaItem[];
  desconto?: number;
  totalCobrado: number;
  custoProducao: number;
  margem: number;
  observacoes?: string;
  observacoesInternas?: string;
  foto?: string;
}

const store = createRemoteStore<Encomenda>("encomendas");

export async function buscarEncomendas(): Promise<Encomenda[]> {
  return (await store.list()).reverse();
}

export async function buscarEncomenda(id: string): Promise<Encomenda | null> {
  return store.find(id);
}

export async function criarEncomenda(dados: EncomendaInput): Promise<Encomenda> {
  const encomenda: Encomenda = {
    id: newId(),
    cliente: dados.cliente,
    canal: dados.canal,
    status: dados.status ?? "aguardando",
    dataPedido: dados.dataPedido,
    dataEntrega: dados.dataEntrega,
    itens: dados.itens,
    desconto: dados.desconto ?? 0,
    totalCobrado: dados.totalCobrado,
    custoProducao: dados.custoProducao,
    margem: dados.margem,
    observacoes: dados.observacoes,
    observacoesInternas: dados.observacoesInternas,
    foto: dados.foto,
    linksUteis: [],
  };
  return store.insert(encomenda);
}

export async function editarEncomenda(id: string, dados: Partial<EncomendaInput>): Promise<Encomenda> {
  const patch: Partial<Encomenda> = {};
  if (dados.cliente !== undefined) patch.cliente = dados.cliente;
  if (dados.canal !== undefined) patch.canal = dados.canal;
  if (dados.status !== undefined) patch.status = dados.status;
  if (dados.dataPedido !== undefined) patch.dataPedido = dados.dataPedido;
  if (dados.dataEntrega !== undefined) patch.dataEntrega = dados.dataEntrega;
  if (dados.itens !== undefined) patch.itens = dados.itens;
  if (dados.desconto !== undefined) patch.desconto = dados.desconto;
  if (dados.totalCobrado !== undefined) patch.totalCobrado = dados.totalCobrado;
  if (dados.custoProducao !== undefined) patch.custoProducao = dados.custoProducao;
  if (dados.margem !== undefined) patch.margem = dados.margem;
  if ("observacoes" in dados) patch.observacoes = dados.observacoes;
  if ("observacoesInternas" in dados) patch.observacoesInternas = dados.observacoesInternas;
  if ("foto" in dados) patch.foto = dados.foto;

  const updated = await store.update(id, patch);
  if (!updated) throw new Error("Encomenda não encontrada");
  return updated;
}

export async function atualizarStatus(id: string, status: EncomendaStatus): Promise<void> {
  await store.update(id, { status });
}

export async function adicionarLink(encomendaId: string, link: { label: string; url: string }): Promise<void> {
  const atual = await store.find(encomendaId);
  if (!atual) throw new Error("Encomenda não encontrada");
  const novoLink: LinkUtil = { id: newId(), label: link.label, url: link.url };
  await store.update(encomendaId, { linksUteis: [...atual.linksUteis, novoLink] });
}

export async function removerLink(linkId: string): Promise<void> {
  const encomenda = (await store.list()).find((e) => e.linksUteis.some((l) => l.id === linkId));
  if (!encomenda) return;
  await store.update(encomenda.id, { linksUteis: encomenda.linksUteis.filter((l) => l.id !== linkId) });
}
