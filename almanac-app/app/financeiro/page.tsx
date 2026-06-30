"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Check, ArrowDown, ArrowUp } from "lucide-react";
import {
  encomendas,
  formatBRL,
  formatDate,
} from "@/lib/data";
import {
  buscarCustosIndiretos,
  criarCustoIndireto,
  editarCustoIndireto,
  deletarCustoIndireto,
  type CustoIndireto,
} from "@/lib/repositories/financeiro";

// ── Types ─────────────────────────────────────────────────────
type MovCategoria =
  | "pagamento_encomenda"
  | "entrada_avulsa"
  | "compra_insumo"
  | "custo_fixo"
  | "saida_avulsa";

interface Movimentacao {
  id: string;
  tipo: "entrada" | "saida";
  valor: number;
  data: string;
  categoria: MovCategoria;
  descricao: string;
  vinculada?: boolean;
}

type Periodo = "semana" | "mes" | "mes_ant" | "custom";

// ── localStorage helpers ─────────────────────────────────────

function loadManuais(): Movimentacao[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem("almanac_manuais");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveManuaisLS(items: Movimentacao[]) {
  localStorage.setItem("almanac_manuais", JSON.stringify(items));
}

// ── DRE data ─────────────────────────────────────────────────
const encEntregues = encomendas.filter((e) => e.status === "entregue");
const receitaJun = encEntregues.reduce((s, e) => s + e.totalCobrado, 0);
const custoVarJun = encEntregues.reduce((s, e) => s + e.custoProducao, 0);

// ── Histórico mock ────────────────────────────────────────────
const HISTORICO = [
  { mes: "Jan/26", receita: 1240.0, custoVar: 148.0 },
  { mes: "Fev/26", receita: 1580.0, custoVar: 195.0 },
  { mes: "Mar/26", receita: 2100.0, custoVar: 264.0 },
  { mes: "Abr/26", receita: 1890.0, custoVar: 237.5 },
  { mes: "Mai/26", receita: 2380.0, custoVar: 312.0 },
];

// ── Fluxo de caixa helpers ────────────────────────────────────
const CAT_LABEL: Record<MovCategoria, string> = {
  pagamento_encomenda: "Encomenda",
  entrada_avulsa: "Entrada avulsa",
  compra_insumo: "Compra de insumo",
  custo_fixo: "Custo fixo",
  saida_avulsa: "Saída avulsa",
};

const FORM_CAT_ENTRADA: { value: MovCategoria; label: string }[] = [
  { value: "pagamento_encomenda", label: "Pagamento de encomenda" },
  { value: "entrada_avulsa", label: "Entrada avulsa" },
];

const FORM_CAT_SAIDA: { value: MovCategoria; label: string }[] = [
  { value: "compra_insumo", label: "Compra de insumo" },
  { value: "custo_fixo", label: "Custo fixo" },
  { value: "saida_avulsa", label: "Saída avulsa" },
];

type AllPagamentos = Record<
  string,
  Array<{ id: string; valor: number; data: string; forma: string; observacao?: string }>
>;

function loadAllPagamentos(): AllPagamentos {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem("almanac_pagamentos");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function gerarAutoMovimentacoes(
  custos: CustoIndireto[],
  allPagamentos: AllPagamentos
): Movimentacao[] {
  const result: Movimentacao[] = [];

  // Entradas: usa pagamentos reais quando existem, senão totalCobrado (só entregues)
  encomendas
    .filter((e) => e.status !== "cancelado")
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

function getPeriodRange(
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

// ── DRERow ────────────────────────────────────────────────────
function DRERow({
  label,
  value,
  deduction,
  bold,
  highlight,
}: {
  label: string;
  value: number;
  deduction?: boolean;
  bold?: boolean;
  highlight?: "success" | "error";
}) {
  const color =
    highlight === "success"
      ? "var(--status-success)"
      : highlight === "error"
      ? "var(--status-error)"
      : "var(--text-primary)";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "7px 0",
        borderTop: bold ? "1px solid var(--border-default)" : undefined,
        marginTop: bold ? 2 : 0,
      }}
    >
      <span
        style={{
          fontSize: 13,
          paddingLeft: deduction ? 16 : 0,
          color: deduction ? "var(--text-secondary)" : "var(--text-primary)",
          fontWeight: bold ? 600 : 400,
        }}
      >
        {deduction ? `(−) ${label}` : label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: bold ? 700 : 400,
          fontSize: bold ? 14 : 13,
          color,
        }}
      >
        {deduction ? `− ${formatBRL(value)}` : formatBRL(value)}
      </span>
    </div>
  );
}

// ── SummaryCard ───────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="atlas-card" style={{ padding: 0 }}>
      <div className="atlas-card-body" style={{ padding: "12px 14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {label}
          </span>
          <Icon size={13} strokeWidth={1.5} style={{ color }} />
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color,
          }}
        >
          {formatBRL(value)}
        </div>
      </div>
    </div>
  );
}

// ── FluxoCaixaTab ─────────────────────────────────────────────
function FluxoCaixaTab({ custos }: { custos: CustoIndireto[] }) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [filtro, setFiltro] = useState<Periodo>("mes");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [manuais, setManuais] = useState<Movimentacao[]>([]);
  const [allPagamentos, setAllPagamentos] = useState<AllPagamentos>({});
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [fTipo, setFTipo] = useState<"entrada" | "saida">("entrada");
  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(hoje);
  const [fCategoria, setFCategoria] = useState<MovCategoria>("entrada_avulsa");
  const [fDesc, setFDesc] = useState("");

  useEffect(() => {
    setManuais(loadManuais());
    setAllPagamentos(loadAllPagamentos());
  }, []);

  const autoMovs = useMemo(
    () => gerarAutoMovimentacoes(custos, allPagamentos),
    [custos, allPagamentos]
  );

  const todas = useMemo(
    () =>
      [...autoMovs, ...manuais].sort((a, b) => b.data.localeCompare(a.data)),
    [autoMovs, manuais]
  );

  const { inicio, fim } = getPeriodRange(filtro, customInicio, customFim);

  const filtradas = useMemo(
    () => todas.filter((m) => m.data >= inicio && m.data <= fim),
    [todas, inicio, fim]
  );

  const totalEntradas = filtradas
    .filter((m) => m.tipo === "entrada")
    .reduce((s, m) => s + m.valor, 0);
  const totalSaidas = filtradas
    .filter((m) => m.tipo === "saida")
    .reduce((s, m) => s + m.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  function handleSaveManuais(items: Movimentacao[]) {
    setManuais(items);
    saveManuaisLS(items);
  }

  function handleAddManual() {
    const valor = parseFloat(fValor);
    if (!valor || valor <= 0 || !fDesc.trim() || !fData) return;
    const nova: Movimentacao = {
      id: `manual-${Date.now()}`,
      tipo: fTipo,
      valor,
      data: fData,
      categoria: fCategoria,
      descricao: fDesc.trim(),
      vinculada: false,
    };
    handleSaveManuais([...manuais, nova]);
    setShowForm(false);
    setFValor("");
    setFDesc("");
    setFData(hoje);
    setFTipo("entrada");
    setFCategoria("entrada_avulsa");
  }

  function handleDelete(id: string) {
    handleSaveManuais(manuais.filter((m) => m.id !== id));
    setConfirmDeleteId(null);
  }

  const PERIODOS: { key: Periodo; label: string }[] = [
    { key: "semana", label: "Esta semana" },
    { key: "mes", label: "Este mês" },
    { key: "mes_ant", label: "Mês anterior" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Period filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              className={`atlas-btn atlas-btn-sm ${
                filtro === p.key ? "atlas-btn-secondary" : "atlas-btn-ghost"
              }`}
              onClick={() => setFiltro(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {filtro === "custom" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              className="atlas-input"
              type="date"
              style={{ height: 28, fontSize: 12 }}
              value={customInicio}
              onChange={(e) => setCustomInicio(e.target.value)}
            />
            <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>até</span>
            <input
              className="atlas-input"
              type="date"
              style={{ height: 28, fontSize: 12 }}
              value={customFim}
              onChange={(e) => setCustomFim(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <SummaryCard
          label="Entradas"
          value={totalEntradas}
          color="var(--status-success)"
          icon={ArrowDown}
        />
        <SummaryCard
          label="Saídas"
          value={totalSaidas}
          color="var(--status-error)"
          icon={ArrowUp}
        />
        <SummaryCard
          label="Saldo do período"
          value={saldo}
          color={saldo >= 0 ? "var(--status-success)" : "var(--status-error)"}
          icon={saldo >= 0 ? ArrowDown : ArrowUp}
        />
      </div>

      {/* Movimentações */}
      <div className="atlas-card">
        <div
          className="atlas-card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="atlas-panel-title">Movimentações</span>
            <span className="atlas-badge">{filtradas.length}</span>
          </div>
          {!showForm && (
            <button
              className="atlas-btn atlas-btn-secondary atlas-btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              onClick={() => setShowForm(true)}
            >
              <Plus size={13} strokeWidth={1.5} />
              Nova movimentação
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border-default)",
              background: "var(--bg-input)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                Nova movimentação
              </span>
              <button
                className="atlas-btn-icon"
                style={{ marginLeft: "auto", width: 24, height: 24 }}
                onClick={() => setShowForm(false)}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>

            {/* Tipo toggle */}
            <div style={{ display: "flex", gap: 6 }}>
              {(["entrada", "saida"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setFTipo(t);
                    setFCategoria(t === "entrada" ? "entrada_avulsa" : "saida_avulsa");
                  }}
                  style={{
                    flex: 1,
                    height: 30,
                    border: `1px solid ${
                      fTipo === t
                        ? t === "entrada"
                          ? "var(--status-success)"
                          : "var(--status-error)"
                        : "var(--border-default)"
                    }`,
                    borderRadius: "var(--radius-md, 4px)",
                    background:
                      fTipo === t
                        ? t === "entrada"
                          ? "rgba(72,199,142,0.1)"
                          : "rgba(244,71,71,0.1)"
                        : "transparent",
                    color:
                      fTipo === t
                        ? t === "entrada"
                          ? "var(--status-success)"
                          : "var(--status-error)"
                        : "var(--text-tertiary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t === "entrada" ? "↓ Entrada" : "↑ Saída"}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="alm-field" style={{ margin: 0 }}>
                <label className="alm-label">Data</label>
                <input
                  className="atlas-input"
                  type="date"
                  value={fData}
                  onChange={(e) => setFData(e.target.value)}
                />
              </div>
              <div className="alm-field" style={{ margin: 0 }}>
                <label className="alm-label">Valor (R$)</label>
                <input
                  className="atlas-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={fValor}
                  onChange={(e) => setFValor(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="alm-field" style={{ margin: 0 }}>
                <label className="alm-label">Categoria</label>
                <select
                  className="alm-select"
                  style={{ height: 32 }}
                  value={fCategoria}
                  onChange={(e) => setFCategoria(e.target.value as MovCategoria)}
                >
                  {(fTipo === "entrada" ? FORM_CAT_ENTRADA : FORM_CAT_SAIDA).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="alm-field" style={{ margin: 0 }}>
                <label className="alm-label">Descrição</label>
                <input
                  className="atlas-input"
                  placeholder="Ex: venda feira"
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                onClick={handleAddManual}
                disabled={!fValor || !fDesc.trim()}
                style={{ opacity: !fValor || !fDesc.trim() ? 0.4 : 1 }}
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {filtradas.length === 0 ? (
          <div className="atlas-empty" style={{ padding: "32px 0" }}>
            <div className="atlas-empty-title">Nenhuma movimentação no período</div>
            <div className="atlas-empty-desc">
              Adicione uma movimentação manual ou ajuste o período.
            </div>
          </div>
        ) : (
          <div className="atlas-card-body" style={{ padding: 0 }}>
            <table className="atlas-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th className="num">Valor</th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {filtradas.map((m) => {
                  const isManual = !m.vinculada;
                  const isConfirm = confirmDeleteId === m.id;

                  if (isConfirm) {
                    return (
                      <tr
                        key={m.id}
                        style={{
                          cursor: "default",
                          background: "rgba(244,71,71,0.04)",
                        }}
                      >
                        <td
                          colSpan={4}
                          style={{ fontSize: 12, color: "var(--text-secondary)" }}
                        >
                          Excluir <strong>{m.descricao}</strong>?
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="atlas-btn atlas-btn-sm"
                              style={{
                                background: "var(--status-error)",
                                color: "#fff",
                                border: "none",
                                fontSize: 11,
                              }}
                              onClick={() => handleDelete(m.id)}
                            >
                              Excluir
                            </button>
                            <button
                              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Não
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={m.id} style={{ cursor: "default" }}>
                      <td
                        style={{
                          color: "var(--text-tertiary)",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(m.data)}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background:
                                m.tipo === "entrada"
                                  ? "var(--status-success)"
                                  : "var(--status-error)",
                            }}
                          />
                          <span style={{ fontWeight: 500 }}>{m.descricao}</span>
                          {m.vinculada && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--text-tertiary)",
                                fontStyle: "italic",
                              }}
                            >
                              auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="atlas-badge">{CAT_LABEL[m.categoria]}</span>
                      </td>
                      <td className="num">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color:
                              m.tipo === "entrada"
                                ? "var(--status-success)"
                                : "var(--status-error)",
                          }}
                        >
                          {m.tipo === "entrada" ? "+" : "−"} {formatBRL(m.valor)}
                        </span>
                      </td>
                      <td style={{ padding: "0 8px 0 0" }}>
                        {isManual ? (
                          <button
                            className="atlas-btn-icon"
                            title="Excluir"
                            style={{ width: 28, height: 28, color: "var(--text-tertiary)" }}
                            onClick={() => setConfirmDeleteId(m.id)}
                            onMouseEnter={(e) =>
                              ((e.currentTarget as HTMLElement).style.color =
                                "var(--status-error)")
                            }
                            onMouseLeave={(e) =>
                              ((e.currentTarget as HTMLElement).style.color =
                                "var(--text-tertiary)")
                            }
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <div style={{ width: 28 }} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const [tab, setTab] = useState<"visao_geral" | "fluxo">("visao_geral");
  const [custos, setCustos] = useState<CustoIndireto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Omit<CustoIndireto, "id">>({
    nome: "",
    valorMensal: 0,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    buscarCustosIndiretos().then(setCustos);
  }, []);

  const totalFixo = custos.reduce((s, c) => s + c.valorMensal, 0);
  const lucroBruto = receitaJun - custoVarJun;
  const lucroLiquido = lucroBruto - totalFixo;

  function startEdit(item: CustoIndireto) {
    setEditingId(item.id);
    setEditBuf({ nome: item.nome, valorMensal: item.valorMensal });
    setConfirmDeleteId(null);
  }

  function startNovo() {
    setEditingId("__novo__");
    setEditBuf({ nome: "", valorMensal: 0 });
    setConfirmDeleteId(null);
  }

  async function saveEdit() {
    if (!editBuf.nome.trim()) return;
    if (editingId === "__novo__") {
      await criarCustoIndireto({ nome: editBuf.nome.trim(), valorMensal: editBuf.valorMensal });
    } else if (editingId) {
      await editarCustoIndireto(editingId, { nome: editBuf.nome.trim(), valorMensal: editBuf.valorMensal });
    }
    buscarCustosIndiretos().then(setCustos);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function deleteCusto(id: string) {
    await deletarCustoIndireto(id);
    buscarCustosIndiretos().then(setCustos);
    setConfirmDeleteId(null);
  }

  const TABS = [
    { key: "visao_geral" as const, label: "Visão geral" },
    { key: "fluxo" as const, label: "Fluxo de caixa" },
  ];

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Financeiro</h1>
          <p className="alm-page-subtitle">Junho 2026</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-default)",
          gap: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color:
                tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                tab === t.key ? "var(--accent-primary, #7c6fef)" : "transparent"
              }`,
              cursor: "pointer",
              marginBottom: -1,
              transition: "color 120ms ease, border-color 120ms ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Visão geral ──────────────────────────────────────── */}
      {tab === "visao_geral" && (
        <>
          {/* DRE do mês */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">DRE — Junho 2026</span>
            </div>
            <div className="atlas-card-body">
              <DRERow label="Receita bruta" value={receitaJun} bold />
              <DRERow label="Custo de produção" value={custoVarJun} deduction />
              <DRERow
                label="Lucro bruto"
                value={lucroBruto}
                bold
                highlight={lucroBruto >= 0 ? "success" : "error"}
              />
              <DRERow label="Custos fixos mensais" value={totalFixo} deduction />
              <DRERow
                label="Lucro líquido"
                value={lucroLiquido}
                bold
                highlight={lucroLiquido >= 0 ? "success" : "error"}
              />
            </div>
          </div>

          {/* Custos fixos CRUD */}
          <div className="atlas-card">
            <div
              className="atlas-card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="atlas-panel-title">Custos fixos mensais</span>
              {editingId !== "__novo__" && (
                <button
                  className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={startNovo}
                >
                  <Plus size={13} strokeWidth={1.5} />
                  Adicionar
                </button>
              )}
            </div>
            <div className="atlas-card-body" style={{ padding: 0 }}>
              <table className="atlas-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th className="num">Valor/mês</th>
                    <th style={{ width: 88 }} />
                  </tr>
                </thead>
                <tbody>
                  {custos.map((item) => {
                    const isEditing = editingId === item.id;
                    const isConfirm = confirmDeleteId === item.id;

                    if (isEditing) {
                      return (
                        <tr key={item.id} style={{ cursor: "default" }}>
                          <td>
                            <input
                              className="atlas-input"
                              style={{ fontSize: 12 }}
                              value={editBuf.nome}
                              autoFocus
                              onChange={(e) =>
                                setEditBuf((b) => ({ ...b, nome: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                          </td>
                          <td className="num">
                            <input
                              className="atlas-input"
                              type="number"
                              step="0.01"
                              min="0"
                              style={{ fontSize: 12, width: 96, textAlign: "right" }}
                              value={editBuf.valorMensal || ""}
                              placeholder="0,00"
                              onChange={(e) =>
                                setEditBuf((b) => ({
                                  ...b,
                                  valorMensal: parseFloat(e.target.value) || 0,
                                }))
                              }
                            />
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="atlas-btn atlas-btn-icon atlas-btn-sm"
                                title="Salvar"
                                onClick={saveEdit}
                              >
                                <Check
                                  size={13}
                                  strokeWidth={1.5}
                                  style={{ color: "var(--status-success)" }}
                                />
                              </button>
                              <button
                                className="atlas-btn atlas-btn-icon atlas-btn-sm"
                                title="Cancelar"
                                onClick={cancelEdit}
                              >
                                <X size={13} strokeWidth={1.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (isConfirm) {
                      return (
                        <tr
                          key={item.id}
                          style={{
                            cursor: "default",
                            background: "rgba(244,71,71,0.04)",
                          }}
                        >
                          <td
                            colSpan={2}
                            style={{ fontSize: 12, color: "var(--text-secondary)" }}
                          >
                            Excluir <strong>{item.nome}</strong>?
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="atlas-btn atlas-btn-sm"
                                style={{
                                  background: "var(--status-error)",
                                  color: "#fff",
                                  border: "none",
                                  fontSize: 11,
                                }}
                                onClick={() => deleteCusto(item.id)}
                              >
                                Excluir
                              </button>
                              <button
                                className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} style={{ cursor: "default" }}>
                        <td style={{ fontWeight: 500 }}>{item.nome}</td>
                        <td
                          className="num"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatBRL(item.valorMensal)}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              className="atlas-btn atlas-btn-icon atlas-btn-sm"
                              title="Editar"
                              onClick={() => startEdit(item)}
                            >
                              <Pencil size={12} strokeWidth={1.5} />
                            </button>
                            <button
                              className="atlas-btn atlas-btn-icon atlas-btn-sm"
                              title="Excluir"
                              onClick={() => {
                                setConfirmDeleteId(item.id);
                                setEditingId(null);
                              }}
                            >
                              <Trash2 size={12} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {editingId === "__novo__" && (
                    <tr style={{ cursor: "default" }}>
                      <td>
                        <input
                          className="atlas-input"
                          style={{ fontSize: 12 }}
                          value={editBuf.nome}
                          autoFocus
                          placeholder="Nome do custo"
                          onChange={(e) =>
                            setEditBuf((b) => ({ ...b, nome: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      </td>
                      <td className="num">
                        <input
                          className="atlas-input"
                          type="number"
                          step="0.01"
                          min="0"
                          style={{ fontSize: 12, width: 96, textAlign: "right" }}
                          value={editBuf.valorMensal || ""}
                          placeholder="0,00"
                          onChange={(e) =>
                            setEditBuf((b) => ({
                              ...b,
                              valorMensal: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="atlas-btn atlas-btn-icon atlas-btn-sm"
                            title="Salvar"
                            onClick={saveEdit}
                          >
                            <Check
                              size={13}
                              strokeWidth={1.5}
                              style={{ color: "var(--status-success)" }}
                            />
                          </button>
                          <button
                            className="atlas-btn atlas-btn-icon atlas-btn-sm"
                            title="Cancelar"
                            onClick={cancelEdit}
                          >
                            <X size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr style={{ cursor: "default", background: "var(--bg-hover)" }}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>Total mensal</td>
                    <td
                      className="num"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {formatBRL(totalFixo)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico mensal */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Histórico mensal</span>
            </div>
            <div className="atlas-card-body" style={{ padding: 0 }}>
              <table className="atlas-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th className="num">Receita</th>
                    <th className="num">Custo variável</th>
                    <th className="num">Custo fixo</th>
                    <th className="num">Lucro líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {HISTORICO.map((h) => {
                    const ll = h.receita - h.custoVar - totalFixo;
                    return (
                      <tr key={h.mes} style={{ cursor: "default" }}>
                        <td style={{ fontWeight: 500 }}>{h.mes}</td>
                        <td
                          className="num"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatBRL(h.receita)}
                        </td>
                        <td
                          className="num"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {formatBRL(h.custoVar)}
                        </td>
                        <td
                          className="num"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {formatBRL(totalFixo)}
                        </td>
                        <td className="num">
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              color:
                                ll >= 0
                                  ? "var(--status-success)"
                                  : "var(--status-error)",
                            }}
                          >
                            {formatBRL(ll)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  <tr style={{ cursor: "default", background: "var(--bg-hover)" }}>
                    <td style={{ fontWeight: 600 }}>
                      Jun/26{" "}
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-tertiary)",
                          fontWeight: 400,
                        }}
                      >
                        atual
                      </span>
                    </td>
                    <td
                      className="num"
                      style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                    >
                      {formatBRL(receitaJun)}
                    </td>
                    <td
                      className="num"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {formatBRL(custoVarJun)}
                    </td>
                    <td
                      className="num"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {formatBRL(totalFixo)}
                    </td>
                    <td className="num">
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color:
                            lucroLiquido >= 0
                              ? "var(--status-success)"
                              : "var(--status-error)",
                        }}
                      >
                        {formatBRL(lucroLiquido)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Fluxo de caixa ──────────────────────────────────── */}
      {tab === "fluxo" && <FluxoCaixaTab custos={custos} />}
    </div>
  );
}
