"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, TrendingUp, TrendingDown, X, Check } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/data";
import { buscarProdutoPE, editarProdutoPE, type ProdutoPE } from "@/lib/repositories/pronta-entrega";

interface MovPE {
  id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  data: string;
  cliente?: string;
  observacao?: string;
  valorTotal?: number;
}

function loadMovs(id: string): MovPE[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(`almanac_pe_movs_${id}`) ?? "[]"); } catch { return []; }
}
function saveMovs(id: string, movs: MovPE[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`almanac_pe_movs_${id}`, JSON.stringify(movs));
}
function loadEstoque(id: string, base: number): number {
  if (typeof window === "undefined") return base;
  try {
    const v = localStorage.getItem(`almanac_pe_estoque_${id}`);
    return v !== null ? parseInt(v) : base;
  } catch { return base; }
}
function saveEstoque(id: string, q: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`almanac_pe_estoque_${id}`, String(q));
}

function EntradaModal({ preco, onClose, onSave }: { preco: number; onClose: () => void; onSave: (qtd: number, obs: string) => void }) {
  const [qtd, setQtd] = useState("1");
  const [obs, setObs] = useState("");
  const ok = parseInt(qtd) > 0;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", width: 360, maxWidth: "calc(100vw - 32px)", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-default)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Adicionar ao estoque</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onClose}><X size={14} strokeWidth={1.5} /></button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Quantidade *</label>
            <input autoFocus className="atlas-input" type="number" min="1" value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Observação</label>
            <input className="atlas-input" placeholder="Ex: nova produção, reposição..." value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--border-default)" }}>
          <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
          <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5, opacity: ok ? 1 : 0.4 }} disabled={!ok} onClick={() => { onSave(parseInt(qtd), obs); onClose(); }}>
            <Check size={13} strokeWidth={2} />Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function VendaModal({ precoVenda, estoqueAtual, onClose, onSave }: { precoVenda: number; estoqueAtual: number; onClose: () => void; onSave: (qtd: number, cliente: string, obs: string, total: number) => void }) {
  const [qtd, setQtd] = useState("1");
  const [cliente, setCliente] = useState("");
  const [obs, setObs] = useState("");
  const [preco, setPreco] = useState(String(precoVenda));
  const qtdN = parseInt(qtd) || 0;
  const total = qtdN * (parseFloat(preco) || 0);
  const ok = qtdN > 0 && qtdN <= estoqueAtual;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", width: 400, maxWidth: "calc(100vw - 32px)", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-default)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Registrar venda</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onClose}><X size={14} strokeWidth={1.5} /></button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Quantidade *</label>
              <input autoFocus className="atlas-input" type="number" min="1" max={estoqueAtual} value={qtd} onChange={(e) => setQtd(e.target.value)} />
              {qtdN > estoqueAtual && <span style={{ fontSize: 11, color: "var(--status-error)", marginTop: 3, display: "block" }}>Máx. {estoqueAtual} em estoque</span>}
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Preço unit. (R$)</label>
              <input className="atlas-input" type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
            </div>
          </div>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Cliente</label>
            <input className="atlas-input" placeholder="Nome do cliente (opcional)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Observação</label>
            <input className="atlas-input" placeholder="Canal, detalhe da venda..." value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
          {total > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 13 }}>
              <span style={{ color: "var(--text-tertiary)" }}>Total: </span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: 6 }}>{formatBRL(total)}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--border-default)" }}>
          <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
          <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5, opacity: ok ? 1 : 0.4 }} disabled={!ok} onClick={() => { onSave(qtdN, cliente, obs, total); onClose(); }}>
            <Check size={13} strokeWidth={2} />Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProdutoPEPage() {
  const { id } = useParams<{ id: string }>();

  const [base, setBase] = useState<ProdutoPE | null>(null);
  const [loading, setLoading] = useState(true);
  const [estoque, setEstoque] = useState(0);
  const [movs, setMovs] = useState<MovPE[]>([]);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showVenda, setShowVenda] = useState(false);

  useEffect(() => {
    buscarProdutoPE(id).then(p => { setBase(p); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!base) return;
    setEstoque(loadEstoque(base.id, base.estoqueAtual));
    setMovs(loadMovs(base.id));
  }, [base?.id]);

  if (loading) return <div className="alm-page"><p style={{ color: "var(--text-tertiary)" }}>Carregando...</p></div>;

  if (!base) {
    return (
      <div className="alm-page">
        <div className="alm-page-header"><div><p style={{ color: "var(--text-tertiary)" }}>Produto não encontrado.</p><Link href="/pronta-entrega" className="atlas-link">← Voltar</Link></div></div>
      </div>
    );
  }

  const baixo = estoque > 0 && estoque <= base.estoqueMin;
  const semEst = estoque === 0;
  const estoqueColor = semEst ? "var(--status-error)" : baixo ? "var(--status-warning)" : "var(--status-success)";

  function addEntrada(qtd: number, obs: string) {
    const novoEst = estoque + qtd;
    const mov: MovPE = { id: `mov-${Date.now()}`, tipo: "entrada", quantidade: qtd, data: new Date().toISOString().slice(0, 10), observacao: obs || undefined };
    const novasMovs = [mov, ...movs];
    setEstoque(novoEst); saveEstoque(base!.id, novoEst);
    setMovs(novasMovs); saveMovs(base!.id, novasMovs);
    editarProdutoPE(base!.id, { estoqueAtual: novoEst });
  }

  function addVenda(qtd: number, cliente: string, obs: string, total: number) {
    const novoEst = Math.max(estoque - qtd, 0);
    const mov: MovPE = { id: `mov-${Date.now()}`, tipo: "saida", quantidade: qtd, data: new Date().toISOString().slice(0, 10), cliente: cliente || undefined, observacao: obs || undefined, valorTotal: total || undefined };
    const novasMovs = [mov, ...movs];
    setEstoque(novoEst); saveEstoque(base!.id, novoEst);
    setMovs(novasMovs); saveMovs(base!.id, novasMovs);
    editarProdutoPE(base!.id, { estoqueAtual: novoEst });
  }

  return (
    <div className="alm-page">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/pronta-entrega" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-secondary)" }}>
            <ArrowLeft size={13} strokeWidth={1.5} />
            Pronta Entrega
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5 }} onClick={() => setShowEntrada(true)}>
              <Plus size={13} strokeWidth={1.5} />
              Adicionar ao estoque
            </button>
            <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5 }} disabled={semEst} onClick={() => setShowVenda(true)}>
              <Minus size={13} strokeWidth={1.5} />
              Registrar venda
            </button>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{base.nome}</h1>
          {base.descricao && <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-tertiary)" }}>{base.descricao}</p>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        {/* Histórico */}
        <div className="atlas-card" style={{ padding: 0 }}>
          <div className="atlas-card-header" style={{ padding: "0 12px", justifyContent: "space-between" }}>
            <span className="atlas-panel-title">Movimentações</span>
            <span className="atlas-badge">{movs.length}</span>
          </div>
          {movs.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <table className="atlas-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Observação</th>
                  <th className="num">Qtd</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: m.tipo === "entrada" ? "var(--status-success)" : "var(--text-secondary)" }}>
                        {m.tipo === "entrada"
                          ? <TrendingUp size={13} strokeWidth={1.5} />
                          : <TrendingDown size={13} strokeWidth={1.5} />}
                        {m.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDate(m.data)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.cliente ?? "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{m.observacao ?? "—"}</td>
                    <td className="num">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: m.tipo === "entrada" ? "var(--status-success)" : "var(--status-error)" }}>
                        {m.tipo === "entrada" ? "+" : "−"}{m.quantidade}
                      </span>
                    </td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {m.valorTotal ? formatBRL(m.valorTotal) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Estoque */}
          <div className="atlas-card">
            <div className="atlas-card-header"><span className="atlas-panel-title">Estoque</span></div>
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 52, fontWeight: 800, lineHeight: 1, color: estoqueColor }}>{estoque}</span>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>unidades disponíveis</span>
              {semEst && <span className="atlas-badge atlas-badge-error" style={{ marginTop: 6 }}>Sem estoque</span>}
              {baixo && <span className="atlas-badge atlas-badge-warning" style={{ marginTop: 6 }}>Estoque baixo</span>}
              <div style={{ width: "100%", marginTop: 12, padding: "8px 0", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text-tertiary)" }}>Mínimo desejado</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{base.estoqueMin}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="atlas-card">
            <div className="atlas-card-header"><span className="atlas-panel-title">Informações</span></div>
            <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                ["Preço de venda", <span key="p" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{formatBRL(base.precoVenda)}</span>],
                ["Total em estoque", <span key="e" style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: estoqueColor }}>{estoque} un.</span>],
                ["Valor em estoque", <span key="v" style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(estoque * base.precoVenda)}</span>],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 12 }}>
                  <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showEntrada && <EntradaModal preco={base.precoVenda} onClose={() => setShowEntrada(false)} onSave={addEntrada} />}
      {showVenda && <VendaModal precoVenda={base.precoVenda} estoqueAtual={estoque} onClose={() => setShowVenda(false)} onSave={addVenda} />}
    </div>
  );
}
