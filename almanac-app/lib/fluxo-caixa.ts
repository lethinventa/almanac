import type { CustoIndireto } from "@/lib/repositories/financeiro";
import type { Encomenda } from "@/lib/repositories/encomendas";

// ── Types ─────────────────────────────────────────────────────
export type MovCategoria =
  | "pagamento_encomenda"
  | "entrada_avulsa"
  | "compra_insumo"
  | "custo_fixo"
  | "saida_avulsa";

export interface Movimentacao {
  id: string;
  tipo: "entrada" | "saida";
  valor: number;
  data: string;
  categoria: MovCategoria;
  descricao: string;
  vinculada?: boolean;
}

export type Periodo = "semana" | "mes" | "mes_ant" | "custom";
export function loadManuais(): Movimentacao[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem("almanac_manuais");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveManuaisLS(items: Movimentacao[]) {
  localStorage.setItem("almanac_manuais", JSON.stringify(items));
}
export type AllPagamentos = Record<
  string,
  Array<{ id: string; valor: number; data: string; forma: string; observacao?: string }>
>;

export function gerarAutoMovimentacoes(
  custos: CustoIndireto[],
  allPagamentos: AllPagamentos,
  encomendasData: Encomenda[]
): Movimentacao[] {
  const result: Movimentacao[] = [];

  // Entradas: usa pagamentos reais quando existem, senão totalCobrado (só entregues).
  // Pagamentos de encomendas canceladas continuam contando: o dinheiro foi recebido.
  encomendasData
    .forEach((e) => {
      const pags = allPagamentos[e.id] ?? [];
      if (pags.length > 0) {
        pags.forEach((p) => {
          if (p.valor === 0) return;
          result.push({
            id: `pag-${p.id}`,
            tipo: p.valor > 0 ? "entrada" : "saida",
            valor: Math.abs(p.valor),
            data: p.data,
            categoria: "pagamento_encomenda",
            descricao: e.cliente,
            vinculada: true,
          });
        });
      } else if (e.status === "entregue") {
        result.push({
          id: `enc-${e.id}`,
          tipo: "entrada",
          valor: e.totalCobrado,
          data: e.dataEntrega,
          categoria: "pagamento_encomenda",
          descricao: e.cliente,
          vinculada: true,
        });
      }
    });

  // Custos fixos → saídas (último 6 meses)
  const hoje = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dataStr = `${ano}-${mes}-01`;
    custos.forEach((c) => {
      result.push({
        id: `custo-${c.id}-${ano}-${mes}`,
        tipo: "saida",
        valor: c.valorMensal,
        data: dataStr,
        categoria: "custo_fixo",
        descricao: c.nome,
        vinculada: true,
      });
    });
  }

  return result;
}
export function getPeriodRange(
  filtro: Periodo,
  customInicio: string,
  customFim: string
): { inicio: string; fim: string } {
  const hoje = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  if (filtro === "semana") {
    const start = new Date(hoje);
    start.setDate(hoje.getDate() - 6);
    return { inicio: toISO(start), fim: toISO(hoje) };
  }
  if (filtro === "mes") {
    return {
      inicio: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`,
      fim: toISO(hoje),
    };
  }
  if (filtro === "mes_ant") {
    const start = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const end = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return { inicio: toISO(start), fim: toISO(end) };
  }
  // custom
  const fim = customFim || toISO(hoje);
  const inicio = customInicio || fim;
  return { inicio, fim };
}

export function resumoDoPeriodo(movs: Movimentacao[], inicio: string, fim: string) {
  let entradas = 0;
  let saidas = 0;
  for (const m of movs) {
    if (m.data < inicio || m.data > fim) continue;
    if (m.tipo === "entrada") entradas += m.valor;
    else saidas += m.valor;
  }
  return { entradas, saidas, saldo: entradas - saidas };
}

// Encomendas entram no lucro assim que vão para a produção.
const EM_PRODUCAO_OU_DEPOIS = ["em_producao", "pronto", "entregue"];

// Lucro total acumulado desde a primeira encomenda iniciada: receita − custo de produção
// − custos fixos mensais por cada mês decorrido (inclusive o atual).
export function calcularLucroTotal(encs: Encomenda[], custosMensais: number, hoje = new Date()): number {
  const iniciadas = encs.filter((e) => EM_PRODUCAO_OU_DEPOIS.includes(e.status));
  if (iniciadas.length === 0) return 0;

  const receita = iniciadas.reduce((s, e) => s + e.totalCobrado, 0);
  const custo = iniciadas.reduce((s, e) => s + e.custoProducao, 0);

  const primeira = iniciadas.map((e) => e.dataPedido).sort()[0];
  const [anoP, mesP] = primeira.split("-").map(Number);
  const meses = (hoje.getFullYear() - anoP) * 12 + (hoje.getMonth() + 1 - mesP) + 1;

  return receita - custo - custosMensais * Math.max(meses, 0);
}
