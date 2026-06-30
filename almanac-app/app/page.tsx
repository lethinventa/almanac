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
import { buscarInsumos, type Insumo, type InsumoCategoria } from "@/lib/repositories/insumos";
import { buscarProdutos, type Produto } from "@/lib/repositories/produtos";
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

  return (
    <>
      <div className="alm-field">
        <label className="alm-label">Nome *</label>
        <input autoFocus className="atlas-input" type="text" placeholder="Ex: Papel A4 premium" />
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
              <select className="alm-select">
                <option>unidade</option><option>folha</option><option>metro</option>
                <option>g</option><option>ml</option><option>cm²</option>
              </select>
            </div>
            <div className="alm-field">
              <label className="alm-label">Preço por unidade (R$)</label>
              <input className="atlas-input" type="number" step="0.01" placeholder="0,00" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="alm-field">
              <label className="alm-label">Estoque inicial</label>
              <input className="atlas-input" type="number" placeholder="0" />
            </div>
            <div className="alm-field">
              <label className="alm-label">Estoque mínimo</label>
              <input className="atlas-input" type="number" placeholder="0" />
            </div>
          </div>
        </>
      )}

      {!rotativo && (
        <div className="alm-field">
          <label className="alm-label">Valor de aquisição (R$)</label>
          <input className="atlas-input" type="number" step="0.01" placeholder="0,00" />
        </div>
      )}

      <div className="alm-modal-footer" style={{ margin: "0 -20px -16px", padding: "12px 20px" }}>
        <button className="atlas-btn atlas-btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="atlas-btn atlas-btn-primary" onClick={() => setSaved(true)}>Cadastrar insumo</button>
      </div>
    </>
  );
}

// ── Novo Produto ──────────────────────────────────────────────
const CATEGORIAS = ["Chaveiro", "Adesivo", "Tag", "Cartão", "Planner", "Kit", "Outro"];

function NovoProdutoForm({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);

  if (saved) return (
    <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 32 }}>✓</div>
      <div style={{ fontWeight: 600 }}>Produto cadastrado!</div>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Acesse o módulo Produtos para gerenciar.</div>
      <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" style={{ marginTop: 8 }} onClick={onClose}>Fechar</button>
    </div>
  );

  return (
    <>
      <div className="alm-field">
        <label className="alm-label">Nome *</label>
        <input autoFocus className="atlas-input" placeholder="Ex: Kit festa personalizado" />
      </div>

      <div className="alm-field">
        <label className="alm-label">Categoria</label>
        <select className="alm-select">
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div className="alm-field">
          <label className="alm-label">Preço de venda (R$)</label>
          <input className="atlas-input" type="number" step="0.01" placeholder="0,00" />
        </div>
        <div className="alm-field">
          <label className="alm-label">Custo (R$)</label>
          <input className="atlas-input" type="number" step="0.01" placeholder="0,00" />
        </div>
        <div className="alm-field">
          <label className="alm-label">Tempo (min)</label>
          <input className="atlas-input" type="number" placeholder="30" />
        </div>
      </div>

      <div className="alm-modal-footer" style={{ margin: "0 -20px -16px", padding: "12px 20px" }}>
        <button className="atlas-btn atlas-btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="atlas-btn atlas-btn-primary" onClick={() => setSaved(true)}>Cadastrar produto</button>
      </div>
    </>
  );
}

// ── StatCard ──────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaUp, icon: Icon, accent }: {
  label: string; value: string; delta?: string; deltaUp?: boolean;
  icon: React.ElementType; accent?: "error" | "warning";
}) {
  return (
    <div className="atlas-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
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
type ModalType = "encomenda" | "insumo" | "produto" | null;

export default function DashboardPage() {
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);
  const [insumosAlerta, setInsumosAlerta] = useState<Insumo[]>([]);
  const [produtosAlerta, setProdutosAlerta] = useState<Produto[]>([]);
  const [encomendasAbertas, setEncomendasAbertas] = useState<Encomenda[]>([]);
  const [receitaMes, setReceitaMes] = useState(0);
  const [lucroBruto, setLucroBruto] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);
  const [produtosList, setProdutosList] = useState<Produto[]>([]);

  useEffect(() => {
    Promise.all([
      buscarInsumos(),
      buscarProdutos(),
      buscarEncomendas(),
      buscarTotalCustosIndiretos(),
    ]).then(([ins, prods, encs, totalCustos]) => {
      setInsumosAlerta(ins.filter(i => i.estoque !== null && i.estoqueMin !== null && (i.estoque ?? 0) <= (i.estoqueMin ?? 0)));
      setProdutosAlerta(prods.filter(p => p.prontoEstoqueMin !== undefined && (p.prontoEstoque ?? 0) <= p.prontoEstoqueMin));
      const abertas = encs.filter(e => e.status !== 'entregue' && e.status !== 'cancelado');
      setEncomendasAbertas(abertas);
      setProdutosList(prods);
      const entregues = encs.filter(e => e.status === 'entregue');
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
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Dashboard</h1>
          <p className="alm-page-subtitle">Visão geral · Junho 2026</p>
        </div>
        <div className="atlas-segmented">
          <button className="atlas-segmented-item">Semana</button>
          <button className="atlas-segmented-item is-active">Mês</button>
          <button className="atlas-segmented-item">Ano</button>
        </div>
      </div>

      <div className="alm-stats-grid">
        <StatCard label="Receita do mês" value={formatBRL(receitaMes)} delta="+18,4% vs maio" deltaUp icon={TrendingUp} />
        <StatCard label="Lucro bruto" value={formatBRL(lucroBruto)} delta="+22,1% vs maio" deltaUp icon={TrendingUp} />
        <StatCard label="Encomendas abertas" value={String(encomendasAbertas.length)} delta="4 com entrega esta semana" deltaUp={false} icon={ShoppingBag} />
        <StatCard label="Alertas de estoque" value={String(insumosAlerta.length)} icon={AlertTriangle} accent={insumosAlerta.length > 0 ? "error" : undefined} />
      </div>

      {/* Ações rápidas */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="atlas-btn atlas-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setModal("encomenda")}>
          <Plus size={13} strokeWidth={1.5} /><ClipboardList size={13} strokeWidth={1.5} />Nova encomenda
        </button>
        <button className="atlas-btn atlas-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setModal("insumo")}>
          <Plus size={13} strokeWidth={1.5} /><Package size={13} strokeWidth={1.5} />Novo insumo
        </button>
        <button className="atlas-btn atlas-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setModal("produto")}>
          <Plus size={13} strokeWidth={1.5} /><Box size={13} strokeWidth={1.5} />Novo produto
        </button>
      </div>

      <KanbanWidget />

      {/* Estoque em alerta */}
      <div className="atlas-card">
        <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="atlas-dot atlas-dot-error is-pulse" />
            <span className="atlas-panel-title">Estoque em alerta</span>
          </span>
          <Link href="/insumos" className="atlas-link" style={{ fontSize: 11 }}>Ver todos</Link>
        </div>
        <div className="atlas-card-body" style={{ padding: 0 }}>
          {insumosAlerta.length === 0 ? (
            <div className="atlas-empty" style={{ padding: 24 }}>
              <div className="atlas-empty-title">Nenhum alerta</div>
              <div className="atlas-empty-desc">Todos os insumos estão acima do mínimo.</div>
            </div>
          ) : (
            <table className="atlas-table" style={{ width: "100%", border: 0 }}>
              <thead><tr><th>Insumo</th><th>Categoria</th><th className="num">Estoque atual</th><th className="num">Mínimo</th><th className="num">Preço atual</th></tr></thead>
              <tbody>
                {insumosAlerta.map((insumo) => (
                  <tr key={insumo.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Package size={13} strokeWidth={1.5} style={{ color: "var(--status-error)", flexShrink: 0 }} /><span style={{ fontWeight: 500 }}>{insumo.nome}</span></div></td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{categoriaLabel[insumo.categoria]}</td>
                    <td className="num"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--status-error)" }}>{insumo.estoque} {insumo.unidade}</span></td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{insumo.estoqueMin} {insumo.unidade}</td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(insumo.precoAtual)}/{insumo.unidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {produtosAlerta.length > 0 && (
        <div className="atlas-card">
          <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="atlas-dot atlas-dot-warning is-pulse" />
              <span className="atlas-panel-title">Pronta entrega em alerta</span>
            </span>
            <Link href="/produtos" className="atlas-link" style={{ fontSize: 11 }}>Ver produtos</Link>
          </div>
          <div className="atlas-card-body" style={{ padding: 0 }}>
            <table className="atlas-table" style={{ width: "100%", border: 0 }}>
              <thead><tr><th>Produto</th><th>Categoria</th><th className="num">Em estoque</th><th className="num">Mínimo</th></tr></thead>
              <tbody>
                {produtosAlerta.map((p) => (
                  <tr key={p.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><PackageCheck size={13} strokeWidth={1.5} style={{ color: "var(--status-warning)", flexShrink: 0 }} /><span style={{ fontWeight: 500 }}>{p.nome}</span></div></td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{p.categoria}</td>
                    <td className="num"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: (p.prontoEstoque ?? 0) === 0 ? "var(--status-error)" : "var(--status-warning)" }}>{p.prontoEstoque ?? 0}</span></td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{p.prontoEstoqueMin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ border: "1px solid var(--border-default)", borderRadius: 6, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: lucroLiquido >= 0 ? "rgba(77,77,77,0.06)" : "rgba(244,71,71,0.06)" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 2 }}>Lucro líquido estimado (junho)</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: lucroLiquido >= 0 ? "var(--status-success)" : "var(--status-error)" }}>{formatBRL(lucroLiquido)}</div>
        </div>
        <Link href="/financeiro" className="atlas-btn atlas-btn-secondary atlas-btn-sm">Ver financeiro</Link>
      </div>

      {/* Modais */}
      <Modal open={modal === "encomenda"} onClose={() => setModal(null)} title="Nova encomenda" wide>
        <NovaEncomendaForm onSave={handleNovaDashboard} onClose={() => setModal(null)} produtos={produtosList} />
      </Modal>
      <Modal open={modal === "insumo"} onClose={() => setModal(null)} title="Novo insumo">
        <NovoInsumoForm onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "produto"} onClose={() => setModal(null)} title="Novo produto">
        <NovoProdutoForm onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
