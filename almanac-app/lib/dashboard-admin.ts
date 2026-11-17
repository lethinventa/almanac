import { isPessoal, type Encomenda, type EncomendaStatus } from "@/lib/repositories/encomendas";
import type { AllPagamentos } from "@/lib/fluxo-caixa";

// Métricas do painel administrativo (dashboard). Funções puras: recebem os dados
// já carregados e a data de referência, para facilitar teste e reuso.

const ENCERRADAS: EncomendaStatus[] = ["entregue", "cancelado"];
const DIAS_PROXIMAS = 7;
const MESES_GRAFICO = 6;

export interface ResumoEncomenda {
  encomenda: Encomenda;
  recebido: number;
  aReceber: number;
}

export interface PainelAdmin {
  // Operação
  abertas: number;
  porStatus: Record<EncomendaStatus, number>;
  atrasadas: ResumoEncomenda[];
  proximas: ResumoEncomenda[];
  // Financeiro
  aReceberTotal: number;
  aReceber: ResumoEncomenda[];
  ticketMedioMes: number;
  pedidosMes: number;
  margemMediaMes: number; // 0–1
  // Gráfico: faturamento por pedido nos últimos meses
  faturamentoMensal: { mes: string; valor: number }[];
  // Produtos mais vendidos no mês
  maisVendidos: { nome: string; quantidade: number; receita: number }[];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dataISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function somarDias(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

export function calcularPainelAdmin(
  encomendas: Encomenda[],
  pagamentos: AllPagamentos,
  nomesProdutos: Map<string, string>,
  hoje = new Date()
): PainelAdmin {
  const hojeISO = dataISO(hoje);
  const limiteProximas = dataISO(somarDias(hoje, DIAS_PROXIMAS));
  const mesAtual = hojeISO.slice(0, 7);

  // Encomendas de cliente (pessoal não é venda nem gera cobrança).
  const clientes = encomendas.filter((e) => !isPessoal(e));

  const porStatus: Record<EncomendaStatus, number> = {
    aguardando: 0, em_producao: 0, pronto: 0, entregue: 0, cancelado: 0,
  };
  const resumos: ResumoEncomenda[] = clientes.map((e) => {
    porStatus[e.status] += 1;
    const recebido = (pagamentos[e.id] ?? []).reduce((s, p) => s + p.valor, 0);
    // Cancelada não é cobrada; entregue ou não, o que falta receber é o saldo.
    const aReceber = e.status === "cancelado" ? 0 : Math.max(e.totalCobrado - recebido, 0);
    return { encomenda: e, recebido, aReceber };
  });

  const abertasLista = resumos.filter((r) => !ENCERRADAS.includes(r.encomenda.status));
  const atrasadas = abertasLista
    .filter((r) => r.encomenda.dataEntrega && r.encomenda.dataEntrega < hojeISO)
    .sort((a, b) => a.encomenda.dataEntrega.localeCompare(b.encomenda.dataEntrega));
  const proximas = abertasLista
    .filter((r) => r.encomenda.dataEntrega >= hojeISO && r.encomenda.dataEntrega <= limiteProximas)
    .sort((a, b) => a.encomenda.dataEntrega.localeCompare(b.encomenda.dataEntrega));

  const aReceber = resumos
    .filter((r) => r.aReceber > 0.005)
    .sort((a, b) => b.aReceber - a.aReceber);
  const aReceberTotal = aReceber.reduce((s, r) => s + r.aReceber, 0);

  // Mês atual: pedidos feitos no mês, sem cancelados
  const doMes = clientes.filter((e) => e.dataPedido.startsWith(mesAtual) && e.status !== "cancelado");
  const receitaMes = doMes.reduce((s, e) => s + e.totalCobrado, 0);
  const custoMes = doMes.reduce((s, e) => s + e.custoProducao, 0);
  const ticketMedioMes = doMes.length ? receitaMes / doMes.length : 0;
  const margemMediaMes = receitaMes > 0 ? (receitaMes - custoMes) / receitaMes : 0;

  // Faturamento por mês (pedidos não cancelados), últimos N meses incluindo o atual
  const faturamentoMensal: { mes: string; valor: number }[] = [];
  for (let i = MESES_GRAFICO - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const valor = clientes
      .filter((e) => e.status !== "cancelado" && e.dataPedido.startsWith(chave))
      .reduce((s, e) => s + e.totalCobrado, 0);
    faturamentoMensal.push({ mes: chave, valor });
  }

  // Produtos mais vendidos no mês
  const agregado = new Map<string, { nome: string; quantidade: number; receita: number }>();
  for (const e of doMes) {
    for (const item of e.itens) {
      const chave = item.produtoId || `desc:${item.descricao ?? "Item avulso"}`;
      const nome = item.produtoId
        ? nomesProdutos.get(item.produtoId) ?? item.descricao ?? "Produto removido"
        : item.descricao ?? "Item avulso";
      const atual = agregado.get(chave) ?? { nome, quantidade: 0, receita: 0 };
      atual.quantidade += item.quantidade;
      atual.receita += item.quantidade * item.precoUnitario;
      agregado.set(chave, atual);
    }
  }
  const maisVendidos = [...agregado.values()]
    .sort((a, b) => b.quantidade - a.quantidade || b.receita - a.receita)
    .slice(0, 5);

  return {
    abertas: abertasLista.length,
    porStatus,
    atrasadas,
    proximas,
    aReceberTotal,
    aReceber,
    ticketMedioMes,
    pedidosMes: doMes.length,
    margemMediaMes,
    faturamentoMensal,
    maisVendidos,
  };
}
