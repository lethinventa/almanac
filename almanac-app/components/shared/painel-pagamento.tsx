"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/data";

interface Pagamento {
  id: string;
  valor: number;
  data: string;
  forma: "pix" | "dinheiro" | "cartao" | "outro";
  observacao?: string;
}

const FORMA_PAG_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  outro: "Outro",
};

function loadPagamentos(recordId: string): Pagamento[] {
  if (typeof window === "undefined") return [];
  try {
    const all = localStorage.getItem("almanac_pagamentos");
    if (!all) return [];
    return JSON.parse(all)[recordId] ?? [];
  } catch { return []; }
}

function savePagamentos(recordId: string, pags: Pagamento[]) {
  if (typeof window === "undefined") return;
  try {
    const all = localStorage.getItem("almanac_pagamentos");
    const parsed = all ? JSON.parse(all) : {};
    parsed[recordId] = pags;
    localStorage.setItem("almanac_pagamentos", JSON.stringify(parsed));
  } catch {}
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{children}</span>
    </div>
  );
}

export function PainelPagamento({
  recordId,
  totalCobrado,
}: {
  recordId: string;
  totalCobrado: number;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [estornoId, setEstornoId] = useState<string | null>(null);
  const [estornoMotivo, setEstornoMotivo] = useState("");

  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(hoje);
  const [fForma, setFForma] = useState<"pix" | "dinheiro" | "cartao" | "outro">("pix");
  const [fObs, setFObs] = useState("");

  useEffect(() => {
    setPagamentos(loadPagamentos(recordId));
  }, [recordId]);

  function persist(pags: Pagamento[]) {
    setPagamentos(pags);
    savePagamentos(recordId, pags);
  }

  function handleAdd() {
    const valor = parseFloat(fValor);
    if (!valor || valor <= 0) return;
    persist([
      ...pagamentos,
      {
        id: `pag-${Date.now()}`,
        valor,
        data: fData,
        forma: fForma,
        observacao: fObs.trim() || undefined,
      },
    ]);
    setShowForm(false);
    setFValor("");
    setFObs("");
    setFData(hoje);
    setFForma("pix");
  }

  function handleEstorno(id: string) {
    const orig = pagamentos.find((p) => p.id === id);
    if (!orig) return;
    persist([
      ...pagamentos,
      {
        id: `est-${Date.now()}`,
        valor: -Math.abs(orig.valor),
        data: hoje,
        forma: orig.forma,
        observacao: `Estorno: ${estornoMotivo.trim() || "sem motivo"}`,
      },
    ]);
    setEstornoId(null);
    setEstornoMotivo("");
  }

  const totalRecebido = pagamentos.reduce((s, p) => s + p.valor, 0);
  const saldo = totalCobrado - totalRecebido;

  const statusPag =
    totalRecebido <= 0
      ? "sem_pagamento"
      : saldo < 0
      ? "paga_maior"
      : saldo === 0
      ? "paga"
      : "sinal";

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    sem_pagamento: { label: "Sem pagamento", bg: "var(--bg-raised)", color: "var(--text-tertiary)" },
    sinal:         { label: "Sinal recebido", bg: "rgba(255,193,7,0.1)", color: "var(--status-warning)" },
    paga:          { label: "Paga", bg: "rgba(72,199,142,0.1)", color: "var(--status-success)" },
    paga_maior:    { label: "Paga a maior", bg: "rgba(124,111,239,0.12)", color: "var(--accent-primary, #7c6fef)" },
  };
  const sc = statusConfig[statusPag];

  return (
    <div className="atlas-card">
      <div className="atlas-card-header">
        <span className="atlas-panel-title">Pagamento</span>
      </div>
      <div className="atlas-card-body" style={{ padding: "8px 12px 12px" }}>
        {/* Status badge */}
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: sc.bg,
              color: sc.color,
              border: `1px solid ${sc.color}44`,
            }}
          >
            {sc.label}
          </span>
        </div>

        <InfoRow label="Total cobrado">
          <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(totalCobrado)}</span>
        </InfoRow>
        <InfoRow label="Recebido">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: totalRecebido > 0 ? "var(--status-success)" : "var(--text-tertiary)",
            }}
          >
            {formatBRL(Math.max(totalRecebido, 0))}
          </span>
        </InfoRow>
        {Math.abs(saldo) > 0.001 && (
          <InfoRow label={saldo > 0 ? "Saldo em aberto" : "Pago a maior"}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: saldo > 0 ? "var(--status-warning)" : "var(--accent-primary, #7c6fef)",
              }}
            >
              {formatBRL(Math.abs(saldo))}
            </span>
          </InfoRow>
        )}

        {pagamentos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {pagamentos.map((p) => {
              const isNeg = p.valor < 0;
              const isEstornando = estornoId === p.id;

              if (isEstornando) {
                return (
                  <div key={p.id} style={{ padding: "6px 0", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                      Motivo do estorno:
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        autoFocus
                        className="atlas-input"
                        style={{ flex: 1, fontSize: 11, height: 26 }}
                        placeholder="Ex: cliente desistiu"
                        value={estornoMotivo}
                        onChange={(e) => setEstornoMotivo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEstorno(p.id);
                          if (e.key === "Escape") setEstornoId(null);
                        }}
                      />
                      <button
                        className="atlas-btn atlas-btn-sm"
                        style={{ background: "var(--status-error)", color: "#fff", border: "none", fontSize: 11 }}
                        onClick={() => handleEstorno(p.id)}
                      >
                        Confirmar
                      </button>
                      <button
                        className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                        onClick={() => { setEstornoId(null); setEstornoMotivo(""); }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "6px 0",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {formatDate(p.data)} · {FORMA_PAG_LABEL[p.forma]}
                    </div>
                    {p.observacao && (
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                        {p.observacao}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: isNeg ? "var(--status-error)" : "var(--status-success)",
                      }}
                    >
                      {isNeg ? "−" : "+"} {formatBRL(Math.abs(p.valor))}
                    </span>
                    {!isNeg && (
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 10,
                          color: "var(--text-tertiary)",
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                        }}
                        onClick={() => setEstornoId(p.id)}
                      >
                        estornar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm ? (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md, 4px)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div className="alm-field" style={{ margin: 0 }}>
                <label className="alm-label">Valor (R$)</label>
                <input
                  autoFocus
                  className="atlas-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={fValor}
                  onChange={(e) => setFValor(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="alm-field" style={{ margin: 0 }}>
                <label className="alm-label">Data</label>
                <input
                  className="atlas-input"
                  type="date"
                  value={fData}
                  onChange={(e) => setFData(e.target.value)}
                />
              </div>
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Forma de pagamento</label>
              <select
                className="alm-select"
                style={{ height: 32 }}
                value={fForma}
                onChange={(e) => setFForma(e.target.value as typeof fForma)}
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Observação (opcional)</label>
              <input
                className="atlas-input"
                placeholder="Ex: sinal, 50% antecipado..."
                value={fObs}
                onChange={(e) => setFObs(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                onClick={handleAdd}
                disabled={!fValor}
                style={{ opacity: !fValor ? 0.4 : 1, flex: 1 }}
              >
                Salvar
              </button>
              <button
                className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            className="atlas-btn atlas-btn-secondary atlas-btn-sm"
            style={{
              marginTop: 12,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
            }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={12} strokeWidth={1.5} />
            Registrar pagamento
          </button>
        )}
      </div>
    </div>
  );
}
