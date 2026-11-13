"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/utils";
import { buscarPagamentos, registrarPagamento, excluirPagamento, type Pagamento } from "@/lib/repositories/pagamentos";

const METODO_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

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
  cancelada = false,
}: {
  recordId: string;
  totalCobrado: number;
  cancelada?: boolean;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(hoje);
  const [fMetodo, setFMetodo] = useState<"pix" | "dinheiro" | "cartao">("pix");
  const [fObs, setFObs] = useState("");

  useEffect(() => {
    buscarPagamentos(recordId).then(setPagamentos);
  }, [recordId]);

  function reload() {
    buscarPagamentos(recordId).then(setPagamentos);
  }

  async function handleAdd() {
    const valor = parseFloat(fValor);
    if (!valor || valor <= 0) return;
    await registrarPagamento({ encomendaId: recordId, valor, metodo: fMetodo, data: fData, observacao: fObs || undefined });
    reload();
    setShowForm(false);
    setFValor("");
    setFData(hoje);
    setFMetodo("pix");
    setFObs("");
  }

  async function handleExcluir(id: string) {
    await excluirPagamento(id);
    reload();
    setExcluindoId(null);
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
    paga_maior:    { label: "Paga a maior", bg: "var(--accent-primary-muted)", color: "var(--accent-primary, var(--accent-primary))" },
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
                color: saldo > 0 ? "var(--status-warning)" : "var(--accent-primary, var(--accent-primary))",
              }}
            >
              {formatBRL(Math.abs(saldo))}
            </span>
          </InfoRow>
        )}

        {pagamentos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {pagamentos.map((p) => {
              const isNeg = p.tipo === "estorno";
              const isExcluindo = excluindoId === p.id;

              if (isExcluindo) {
                const afetaEstornos = p.tipo === "recebimento" && pagamentos.some((x) => x.estornoDeId === p.id);
                return (
                  <div key={p.id} style={{ padding: "6px 0", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                      Excluir este lançamento de {formatBRL(Math.abs(p.valor))}?
                      {afetaEstornos && " Os estornos ligados a ele também serão excluídos."}
                    </div>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        className="atlas-btn atlas-btn-sm"
                        style={{ background: "var(--status-error)", color: "#fff", border: "none", fontSize: 11 }}
                        onClick={() => handleExcluir(p.id)}
                      >
                        Sim, excluir
                      </button>
                      <button
                        className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                        onClick={() => setExcluindoId(null)}
                      >
                        Não
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
                      {formatDate(p.data)} · {METODO_LABEL[p.metodo]}
                    </div>
                    {p.observacao && (
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                        {p.observacao}
                      </div>
                    )}
                    {p.motivoEstorno && (
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                        {p.motivoEstorno}
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
                      onClick={() => setExcluindoId(p.id)}
                    >
                      excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cancelada ? null : showForm ? (
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
                value={fMetodo}
                onChange={(e) => setFMetodo(e.target.value as typeof fMetodo)}
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
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
