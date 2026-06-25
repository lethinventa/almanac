"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  custosIndiretos as custosDefault,
  encomendas,
  formatBRL,
  type CustoIndireto,
} from "@/lib/data";

// ── localStorage helpers ─────────────────────────────────────
export function loadCustos(): CustoIndireto[] {
  if (typeof window === "undefined") return custosDefault;
  try {
    const saved = localStorage.getItem("almanac_custos");
    if (saved) return JSON.parse(saved);
  } catch {}
  return custosDefault;
}

function saveCustos(items: CustoIndireto[]) {
  localStorage.setItem("almanac_custos", JSON.stringify(items));
}

// ── DRE data ─────────────────────────────────────────────────
const encEntregues = encomendas.filter((e) => e.status === "entregue");
const receitaJun = encEntregues.reduce((s, e) => s + e.totalCobrado, 0);
const custoVarJun = encEntregues.reduce((s, e) => s + e.custoProducao, 0);

// ── Histórico mock ────────────────────────────────────────────
const HISTORICO = [
  { mes: "Jan/26", receita: 1240.0,  custoVar: 148.0  },
  { mes: "Fev/26", receita: 1580.0,  custoVar: 195.0  },
  { mes: "Mar/26", receita: 2100.0,  custoVar: 264.0  },
  { mes: "Abr/26", receita: 1890.0,  custoVar: 237.5  },
  { mes: "Mai/26", receita: 2380.0,  custoVar: 312.0  },
];

// ── Linha de resultado no DRE ─────────────────────────────────
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

// ── Página ────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const [custos, setCustos] = useState<CustoIndireto[]>(custosDefault);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Omit<CustoIndireto, "id">>({
    nome: "",
    valorMensal: 0,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setCustos(loadCustos());
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

  function saveEdit() {
    if (!editBuf.nome.trim()) return;
    let updated: CustoIndireto[];
    if (editingId === "__novo__") {
      updated = [
        ...custos,
        {
          id: `ci-${Date.now()}`,
          nome: editBuf.nome.trim(),
          valorMensal: editBuf.valorMensal,
        },
      ];
    } else {
      updated = custos.map((c) =>
        c.id === editingId ? { ...c, ...editBuf, nome: editBuf.nome.trim() } : c
      );
    }
    setCustos(updated);
    saveCustos(updated);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function deleteCusto(id: string) {
    const updated = custos.filter((c) => c.id !== id);
    setCustos(updated);
    saveCustos(updated);
    setConfirmDeleteId(null);
  }

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Financeiro</h1>
          <p className="alm-page-subtitle">Junho 2026</p>
        </div>
      </div>

      {/* ── DRE do mês ─────────────────────────────────────── */}
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

      {/* ── Custos fixos CRUD ───────────────────────────────── */}
      <div className="atlas-card">
        <div
          className="atlas-card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
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
                <th style={{ width: 88 }}></th>
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
                          onChange={(e) => setEditBuf((b) => ({ ...b, nome: e.target.value }))}
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
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button
                            className="atlas-btn atlas-btn-icon atlas-btn-sm"
                            title="Salvar"
                            onClick={saveEdit}
                          >
                            <Check size={13} strokeWidth={1.5} style={{ color: "var(--status-success)" }} />
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
                    <tr key={item.id} style={{ cursor: "default", background: "rgba(244,71,71,0.04)" }}>
                      <td
                        colSpan={2}
                        style={{ fontSize: 12, color: "var(--text-secondary)" }}
                      >
                        Excluir <strong>{item.nome}</strong>?
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
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
                    <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatBRL(item.valorMensal)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
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
                          onClick={() => { setConfirmDeleteId(item.id); setEditingId(null); }}
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Linha de novo custo */}
              {editingId === "__novo__" && (
                <tr style={{ cursor: "default" }}>
                  <td>
                    <input
                      className="atlas-input"
                      style={{ fontSize: 12 }}
                      value={editBuf.nome}
                      autoFocus
                      placeholder="Nome do custo"
                      onChange={(e) => setEditBuf((b) => ({ ...b, nome: e.target.value }))}
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
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        className="atlas-btn atlas-btn-icon atlas-btn-sm"
                        title="Salvar"
                        onClick={saveEdit}
                      >
                        <Check size={13} strokeWidth={1.5} style={{ color: "var(--status-success)" }} />
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

              {/* Total */}
              <tr style={{ cursor: "default", background: "var(--bg-hover)" }}>
                <td style={{ fontWeight: 600, fontSize: 12 }}>
                  Total mensal
                </td>
                <td
                  className="num"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}
                >
                  {formatBRL(totalFixo)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Histórico mensal ────────────────────────────────── */}
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
                    <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatBRL(h.receita)}
                    </td>
                    <td
                      className="num"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                    >
                      {formatBRL(h.custoVar)}
                    </td>
                    <td
                      className="num"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                    >
                      {formatBRL(totalFixo)}
                    </td>
                    <td className="num">
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          color: ll >= 0 ? "var(--status-success)" : "var(--status-error)",
                        }}
                      >
                        {formatBRL(ll)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Mês atual — destaque */}
              <tr style={{ cursor: "default", background: "var(--bg-hover)" }}>
                <td style={{ fontWeight: 600 }}>
                  Jun/26{" "}
                  <span
                    style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 400 }}
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
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                >
                  {formatBRL(custoVarJun)}
                </td>
                <td
                  className="num"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
                >
                  {formatBRL(totalFixo)}
                </td>
                <td className="num">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color:
                        lucroLiquido >= 0 ? "var(--status-success)" : "var(--status-error)",
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
    </div>
  );
}
