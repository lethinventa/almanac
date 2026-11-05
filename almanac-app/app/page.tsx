"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, TrendingUp, ShoppingBag, Package, Plus,
  ClipboardList, Box, PackageCheck, X,
} from "lucide-react";
import { KanbanWidget } from "@/components/kanban-widget";
import { formatBRL, categoriaLabel } from "@/lib/utils";
import { buscarInsumos, criarInsumo, type Insumo, type InsumoCategoria } from "@/lib/repositories/insumos";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";
import { buscarProdutosPE, type ProdutoPE } from "@/lib/repositories/pronta-entrega";
import { buscarEncomendas, criarEncomenda, type Encomenda, type EncomendaInput } from "@/lib/repositories/encomendas";
import { buscarTotalCustosIndiretos } from "@/lib/repositories/financeiro";
import { NovaEncomendaForm } from "@/components/shared/nova-encomenda-form";

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ open, onClose, title, wide, children, footer }: {
  open: boolean; onClose: () => void; title: string; wide?: boolean;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div className={`alm-backdrop${visible ? " is-open" : ""}`} onClick={onClose} />
      <div className={`alm-modal${wide ? " is-wide" : ""}${visible ? " is-open" : ""}`}>
        <div className="alm-modal-header">
          <span className="alm-modal-title">{title}</span>
          <button className="atlas-btn atlas-btn-icon" onClick={onClose}><X size={15} strokeWidth={1.5} /></button>
        </div>
        <div className="alm-modal-body">{children}</div>
        {footer && <div className="alm-modal-footer">{footer}</div>}
      </div>
    </>
  );
}


// ── Novo Insumo ───────────────────────────────────────────────
function NovoInsumoForm({ onClose }: { onClose: () => void }) {
  const [categoria, setCategoria] = useState<InsumoCategoria>("visivel");
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("unidade");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMin, setEstoqueMin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const rotativo = categoria === "visivel" || categoria === "invisivel";

  if (saved) return (
    <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 32 }}>✓</div>
      <div style={{ fontWeight: 600 }}>Insumo cadastrado!</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Acesse o módulo Insumos para gerenciar.</div>
      <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" style={{ marginTop: 8 }} onClick={onClose}>Fechar</button>
    </div>
  );

  const handleSubmit = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await criarInsumo({
        nome: nome.trim(),
        categoria,
        unidade,
        precoAtual: parseFloat(preco) || 0,
        estoque: estoque ? parseFloat(estoque) : null,
        estoqueMin: estoqueMin ? parseFloat(estoqueMin) : null,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="alm-field">
        <label className="alm-label">Nome *</label>
        <input autoFocus className="atlas-input" type="text" placeholder="Ex: Papel A4 premium" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div className="alm-field">
        <label className="alm-label">Categoria</label>
        <select className="alm-select" value={categoria} onChange={(e) => setCategoria(e.target.value as InsumoCategoria)}>
          <option value="visivel">Rotativo visível</option>
          <option value="invisivel">Rotativo invisível</option>
          <option value="ferramenta">Ferramenta</option>
          <option value="maquinario">Maquinário</option>
        </select>
      </div>

      {rotativo && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="alm-field">
              <label className="alm-label">Unidade</label>
              <select className="alm-select" value={unidade} onChange={(e) => setUnidade(e.target.value)}>
                <option>unidade</option><option>folha</option><option>metro</option>
                <option>g</option><option>ml</option><option>cm²</option>
              </select>
            </div>
            <div className="alm-field">
              <label className="alm-label">Preço por unidade (R$)</label>
              <input className="atlas-input" type="number" step="0.01" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="alm-field">
              <label className="alm-label">Estoque inicial</label>
              <input className="atlas-input" type="number" placeholder="0" value={estoque} onChange={(e) => setEstoque(e.target.value)} />
            </div>
            <div className="alm-field">
              <label className="alm-label">Estoque mínimo</label>
              <input className="atlas-input" type="number" placeholder="0" value={estoqueMin} onChange={(e) => setEstoqueMin(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {!rotativo && (
        <div className="alm-field">
          <label className="alm-label">Valor de aquisição (R$)</label>
          <input className="atlas-input" type="number" step="0.01" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </div>
      )}

      <div className="alm-modal-footer" style={{ margin: "0 -20px -16px", padding: "12px 20px" }}>
        <button className="atlas-btn atlas-btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="atlas-btn atlas-btn-primary" disabled={!nome.trim() || saving} onClick={handleSubmit}>
          {saving ? "Cadastrando…" : "Cadastrar insumo"}
        </button>
      </div>
    </>
  );
}

function StatCard({ label, value, delta, deltaUp, icon: Icon, accent, highlight }: {
  label: string; value: string; delta?: string; deltaUp?: boolean;
  icon: React.ElementType; accent?: "error" | "warning"; highlight?: boolean;
}) {
  return (
    <div className={`atlas-card${highlight ? " is-highlight" : ""}`} style={{ padding: 0, display: "flex", flexDirection: "column" }}>
      <div className="atlas-card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
          <Icon size={14} strokeWidth={1.5} style={{ color: accent === "error" ? "var(--status-error)" : accent === "warning" ? "var(--status-warning)" : "var(--text-tertiary)" }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: accent === "error" ? "var(--status-error)" : "var(--text-primary)" }}>{value}</div>
        {delta && <div className={`atlas-stat-delta ${deltaUp ? "is-up" : "is-down"}`}>{delta}</div>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
type ModalType = "encomenda" | "insumo" | null;

export default function DashboardPage() {
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);
  const [insumosAlerta, setInsumosAlerta] = useState<Insumo[]>([]);
  const [produtosAlerta, setProdutosAlerta] = useState<ProdutoPE[]>([]);
  const [encomendasAbertas, setEncomendasAbertas] = useState<Encomenda[]>([]);
  const [receitaMes, setReceitaMes] = useState(0);
  const [lucroBruto, setLucroBruto] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);
  const [produtosList, setProdutosList] = useState<ProdutoCalculado[]>([]);

  useEffect(() => {
    Promise.all([
      buscarInsumos(),
      buscarProdutos(),
      buscarEncomendas(),
      buscarTotalCustosIndiretos(),
      buscarProdutosPE(),
    ]).then(([ins, prods, encs, totalCustos, prontaEntrega]) => {
      setInsumosAlerta(ins.filter(i => i.estoque !== null && i.estoqueMin !== null && (i.estoque ?? 0) <= (i.estoqueMin ?? 0)));
      setProdutosAlerta(prontaEntrega.filter(p => p.estoqueAtual <= p.estoqueMin));
      const abertas = encs.filter(e => e.status !== 'entregue' && e.status !== 'cancelado');
      setEncomendasAbertas(abertas);
      setProdutosList(prods);
      const agora = new Date();
      const anoMesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
      const entregues = encs.filter(e => e.status === 'entregue' && e.dataEntrega?.startsWith(anoMesAtual));
      const receita = entregues.reduce((s, e) => s + e.totalCobrado, 0);
      const custo = entregues.reduce((s, e) => s + e.custoProducao, 0);
      setReceitaMes(receita);
      setLucroBruto(receita - custo);
      setLucroLiquido(receita - custo - totalCustos);
    });
  }, []);

  const handleNovaDashboard = async (enc: EncomendaInput) => {
    const nova = await criarEncomenda(enc);
    setModal(null);
    router.push(`/encomendas/${nova.id}`);
  };

  return (
    <div className="alm-page">
      <div className="alm-page-header" style={{ justifyContent: "flex-end" }}>
        <div className="alm-header-actions">
          <button className="atlas-btn atlas-btn-secondary" onClick={() => setModal("insumo")}>
            <Plus size={15} strokeWidth={2} />Novo insumo
          </button>
          <button className="atlas-btn atlas-btn-secondary" onClick={() => router.push("/produtos?novo=1")}>
            <Plus size={15} strokeWidth={2} />Novo produto
          </button>
          <button className="atlas-btn atlas-btn-primary" onClick={() => setModal("encomenda")}>
            <Plus size={15} strokeWidth={2} />Nova encomenda
          </button>
        </div>
      </div>

      <div className="alm-stats-grid">
        <StatCard label="Receita do mês" value={formatBRL(receitaMes)} icon={TrendingUp} />
        <StatCard label="Lucro bruto" value={formatBRL(lucroBruto)} icon={TrendingUp} />
        <StatCard label="Encomendas abertas" value={String(encomendasAbertas.length)} icon={ShoppingBag} />
        <StatCard label="Lucro líquido estimado" value={formatBRL(lucroLiquido)} icon={TrendingUp} highlight />
      </div>

      <KanbanWidget />

      <div className="alm-bento">
        {/* Estoque em alerta */}
          <div className="atlas-card">
            <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`atlas-dot ${insumosAlerta.length > 0 ? "atlas-dot-error is-pulse" : ""}`} />
                <span className="atlas-panel-title">Estoque em alerta</span>
                {insumosAlerta.length > 0 && <span className="atlas-badge atlas-badge-error">{insumosAlerta.length}</span>}
              </span>
              <Link href="/insumos" className="atlas-link" style={{ fontSize: 13 }}>Ver todos</Link>
            </div>
            <div className="atlas-card-body" style={{ padding: insumosAlerta.length === 0 ? undefined : 0 }}>
              {insumosAlerta.length === 0 ? (
                <div className="atlas-empty" style={{ padding: 24 }}>
                  <div className="atlas-empty-title">Nenhum alerta</div>
                  <div className="atlas-empty-desc">Todos os insumos estão acima do mínimo.</div>
                </div>
              ) : (
                <table className="atlas-table" style={{ width: "100%", border: 0 }}>
                  <thead><tr><th>Insumo</th><th className="num">Atual</th><th className="num">Mínimo</th></tr></thead>
                  <tbody>
                    {insumosAlerta.map((insumo) => (
                      <tr key={insumo.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{insumo.nome}</div>
                          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{categoriaLabel[insumo.categoria]}</div>
                        </td>
                        <td className="num"><span style={{ fontWeight: 600, color: "var(--status-error)" }}>{insumo.estoque} {insumo.unidade}</span></td>
                        <td className="num" style={{ color: "var(--text-tertiary)" }}>{insumo.estoqueMin} {insumo.unidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pronta entrega em alerta */}
          {produtosAlerta.length > 0 && (
            <div className="atlas-card">
              <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="atlas-dot atlas-dot-warning is-pulse" />
                  <span className="atlas-panel-title">Pronta entrega em alerta</span>
                  <span className="atlas-badge atlas-badge-warning">{produtosAlerta.length}</span>
                </span>
                <Link href="/pronta-entrega" className="atlas-link" style={{ fontSize: 13 }}>Ver produtos</Link>
              </div>
              <div className="atlas-card-body" style={{ padding: 0 }}>
                <table className="atlas-table" style={{ width: "100%", border: 0 }}>
                  <thead><tr><th>Produto</th><th className="num">Em estoque</th><th className="num">Mínimo</th></tr></thead>
                  <tbody>
                    {produtosAlerta.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{p.nome}</div>
                          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{p.descricao ?? "—"}</div>
                        </td>
                        <td className="num"><span style={{ fontWeight: 600, color: p.estoqueAtual === 0 ? "var(--status-error)" : "var(--status-warning)" }}>{p.estoqueAtual}</span></td>
                        <td className="num" style={{ color: "var(--text-tertiary)" }}>{p.estoqueMin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>

      {/* Modais */}
      <Modal open={modal === "encomenda"} onClose={() => setModal(null)} title="Nova encomenda" wide>
        <NovaEncomendaForm onSave={handleNovaDashboard} onClose={() => setModal(null)} produtos={produtosList} />
      </Modal>
      <Modal open={modal === "insumo"} onClose={() => setModal(null)} title="Novo insumo">
        <NovoInsumoForm onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
