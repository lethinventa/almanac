"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp, ShoppingBag, Plus, X, ArrowDown, ArrowUp, Wallet,
  Receipt, CalendarClock, AlertOctagon, Percent, Trophy, BarChart3, Instagram,
} from "lucide-react";
import { KanbanWidget } from "@/components/kanban-widget";
import { formatBRL, formatDate, categoriaLabel, statusLabels } from "@/lib/utils";
import { calcularPainelAdmin, type PainelAdmin, type ResumoEncomenda } from "@/lib/dashboard-admin";
import { buscarInsumos, criarInsumo, type Insumo, type InsumoCategoria } from "@/lib/repositories/insumos";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";
import { buscarCustosIndiretos } from "@/lib/repositories/financeiro";
import { buscarTodosPagamentos } from "@/lib/repositories/pagamentos";
import { buscarPosts, ROTULO_STATUS, ROTULO_FORMATO, type PostInstagram } from "@/lib/repositories/planejamento-instagram";
import {
  gerarAutoMovimentacoes,
  getPeriodRange,
  loadManuais,
  resumoDoPeriodo,
  calcularLucroTotal,
} from "@/lib/fluxo-caixa";
import { buscarProdutosPE, type ProdutoPE } from "@/lib/repositories/pronta-entrega";
import { buscarEncomendas, criarEncomenda, isPessoal, type Encomenda, type EncomendaInput } from "@/lib/repositories/encomendas";
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
          <option value="embalagem">Embalagem</option>
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

function StatCard({ label, value, sub, delta, deltaUp, icon: Icon, accent, highlight }: {
  label: string; value: string; sub?: string; delta?: string; deltaUp?: boolean;
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
        {sub && <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{sub}</div>}
        {delta && <div className={`atlas-stat-delta ${deltaUp ? "is-up" : "is-down"}`}>{delta}</div>}
      </div>
    </div>
  );
}

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split("-").map(Number);
  return `${MESES_CURTOS[mes - 1]}/${String(ano).slice(2)}`;
}

// Tabela de encomendas (entregas e saldos a receber)
function TabelaEncomendas({ linhas, vazio, mostrarStatus }: {
  linhas: ResumoEncomenda[]; vazio: string; mostrarStatus?: boolean;
}) {
  if (linhas.length === 0) {
    return (
      <div className="atlas-empty" style={{ padding: 24 }}>
        <div className="atlas-empty-desc">{vazio}</div>
      </div>
    );
  }
  return (
    <table className="atlas-table" style={{ width: "100%", border: 0 }}>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Entrega</th>
          <th className="num">Total</th>
          <th className="num">Saldo</th>
        </tr>
      </thead>
      <tbody>
        {linhas.map(({ encomenda: e, aReceber }) => (
          <tr key={e.id}>
            <td>
              <Link href={`/encomendas/${e.id}`} className="atlas-link" style={{ fontWeight: 500 }}>{e.cliente || "Sem nome"}</Link>
              {mostrarStatus && (
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{statusLabels[e.status]}</div>
              )}
            </td>
            <td style={{ whiteSpace: "nowrap" }}>{e.dataEntrega ? formatDate(e.dataEntrega) : "—"}</td>
            <td className="num">{formatBRL(e.totalCobrado)}</td>
            <td className="num" style={{ fontWeight: 600, color: aReceber > 0.005 ? "var(--status-warning)" : "var(--text-tertiary)" }}>
              {aReceber > 0.005 ? formatBRL(aReceber) : "Pago"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Lista de posts (atrasados ou próximos)
function ListaPosts({ posts, vazio }: { posts: PostInstagram[]; vazio: string }) {
  if (posts.length === 0) {
    return (
      <div className="atlas-empty" style={{ padding: 24 }}>
        <div className="atlas-empty-desc">{vazio}</div>
      </div>
    );
  }
  return (
    <table className="atlas-table" style={{ width: "100%", border: 0 }}>
      <thead><tr><th>Post</th><th>Data</th><th>Status</th></tr></thead>
      <tbody>
        {posts.map((p) => (
          <tr key={p.id}>
            <td>
              <div style={{ fontWeight: 500 }}>{p.titulo}</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{ROTULO_FORMATO[p.formato]}</div>
            </td>
            <td style={{ whiteSpace: "nowrap" }}>{p.data ? formatDate(p.data) : "—"}</td>
            <td>{ROTULO_STATUS[p.status]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Gráfico de barras simples (CSS), faturamento mensal
function GraficoFaturamento({ dados }: { dados: { mes: string; valor: number }[] }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const ultimo = dados[dados.length - 1];
  const anterior = dados[dados.length - 2];
  const variacao = anterior && anterior.valor > 0 ? (ultimo.valor - anterior.valor) / anterior.valor : null;
  return (
    <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total no período</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{formatBRL(total)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mês atual vs anterior</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {variacao === null ? "—" : `${variacao >= 0 ? "+" : ""}${Math.round(variacao * 100)}%`}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${dados.length}, 1fr)`, gap: 10, alignItems: "end", height: 160 }}>
        {dados.map((d) => {
          const pct = (d.valor / max) * 100;
          return (
            <div key={d.mes} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end", minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                {d.valor > 0 ? formatBRL(d.valor).replace(/^R\$\s?/, "") : "0"}
              </div>
              <div
                title={`${rotuloMes(d.mes)}: ${formatBRL(d.valor)}`}
                style={{
                  width: "100%", maxWidth: 56, height: `${Math.max(pct, d.valor > 0 ? 3 : 1)}%`,
                  background: d.mes === dados[dados.length - 1].mes ? "var(--accent-primary)" : "var(--accent-primary-muted)",
                  borderRadius: "6px 6px 2px 2px",
                }}
              />
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{rotuloMes(d.mes)}</div>
            </div>
          );
        })}
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
  const [fluxo, setFluxo] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [lucroTotal, setLucroTotal] = useState(0);
  const [produtosList, setProdutosList] = useState<ProdutoCalculado[]>([]);
  const [painel, setPainel] = useState<PainelAdmin | null>(null);

  useEffect(() => {
    Promise.all([
      buscarInsumos(),
      buscarProdutos(),
      buscarEncomendas(),
      buscarCustosIndiretos(),
      buscarProdutosPE(),
      buscarTodosPagamentos(),
      buscarPosts(),
    ]).then(([ins, prods, encs, custos, prontaEntrega, pagamentos, posts]) => {
      setInsumosAlerta(ins.filter(i => i.estoque !== null && i.estoqueMin !== null && (i.estoque ?? 0) <= (i.estoqueMin ?? 0)));
      setProdutosAlerta(prontaEntrega.filter(p => p.estoqueAtual <= p.estoqueMin));
      const abertas = encs.filter(e => e.status !== 'entregue' && e.status !== 'cancelado' && !isPessoal(e));
      setEncomendasAbertas(abertas);
      setProdutosList(prods);
      setPainel(calcularPainelAdmin(encs, pagamentos, new Map(prods.map((p) => [p.id, p.nome])), posts));
      // Mesmos números do Financeiro (fluxo de caixa do mês atual)
      const { inicio, fim } = getPeriodRange("mes", "", "");
      const movs = [...gerarAutoMovimentacoes(custos, pagamentos, encs), ...loadManuais()];
      setFluxo(resumoDoPeriodo(movs, inicio, fim));
      // Lucro total: desde o início, contando encomendas já iniciadas na produção
      const custosMensais = custos.reduce((s, c) => s + c.valorMensal, 0);
      setLucroTotal(calcularLucroTotal(encs, custosMensais));
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

      <div className="alm-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <StatCard label="Entradas do mês" value={formatBRL(fluxo.entradas)} icon={ArrowDown} />
        <StatCard label="Saídas do mês" value={formatBRL(fluxo.saidas)} icon={ArrowUp} />
        <StatCard label="Saldo do mês" value={formatBRL(fluxo.saldo)} icon={Wallet} />
        <StatCard
          label="Lucro total"
          value={formatBRL(lucroTotal)}
          sub={painel && painel.margemMediaMes > 0 ? `Margem do mês: ${Math.round(painel.margemMediaMes * 100)}%` : undefined}
          icon={TrendingUp}
          highlight
        />
        <StatCard
          label="A receber"
          value={formatBRL(painel?.aReceberTotal ?? 0)}
          sub={painel ? `${painel.aReceber.length} encomenda(s) com saldo` : undefined}
          icon={Receipt}
          accent={painel && painel.aReceberTotal > 0 ? "warning" : undefined}
        />
        <StatCard
          label="Encomendas abertas"
          value={String(encomendasAbertas.length)}
          sub={painel ? `${painel.porStatus.aguardando} aguardando · ${painel.porStatus.em_producao} em produção · ${painel.porStatus.pronto} prontas` : undefined}
          icon={ShoppingBag}
        />
        <StatCard
          label="Atrasadas"
          value={String(painel?.atrasadas.length ?? 0)}
          sub={painel ? (painel.proximas.length > 0 ? `${painel.proximas.length} entrega(s) nos próximos 7 dias` : "Nenhuma entrega nos próximos 7 dias") : undefined}
          icon={AlertOctagon}
          accent={painel && painel.atrasadas.length > 0 ? "error" : undefined}
        />
        <StatCard
          label="Posts a publicar"
          value={String(painel ? painel.posts.porStatus.ideia + painel.posts.porStatus.roteiro + painel.posts.porStatus.produzido + painel.posts.porStatus.agendado : 0)}
          sub={painel ? `${painel.posts.atrasados.length} atrasado(s) · ${painel.posts.ideias} ideia(s) no banco` : undefined}
          icon={Instagram}
          accent={painel && painel.posts.atrasados.length > 0 ? "warning" : undefined}
        />
        <StatCard
          label="Ticket médio do mês"
          value={formatBRL(painel?.ticketMedioMes ?? 0)}
          sub={painel ? `${painel.pedidosMes} pedido(s) no mês` : undefined}
          icon={Percent}
        />
        <StatCard
          label="Produtos vendidos no mês"
          value={String(painel?.maisVendidos.reduce((s, p) => s + p.quantidade, 0) ?? 0)}
          sub={painel?.maisVendidos[0] ? `Mais vendido: ${painel.maisVendidos[0].nome}` : undefined}
          icon={Trophy}
        />
      </div>

      <KanbanWidget />

      <div className="alm-bento">
        {/* Entregas: atrasadas e próximos 7 dias */}
        <div className="atlas-card">
          <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarClock size={15} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
              <span className="atlas-panel-title">Entregas</span>
              {painel && painel.atrasadas.length > 0 && <span className="atlas-badge atlas-badge-error">{painel.atrasadas.length} atrasada(s)</span>}
            </span>
            <Link href="/encomendas" className="atlas-link" style={{ fontSize: 13 }}>Ver todas</Link>
          </div>
          <div className="atlas-card-body" style={{ padding: 0 }}>
            <TabelaEncomendas
              linhas={[...(painel?.atrasadas ?? []), ...(painel?.proximas ?? [])]}
              vazio="Nenhuma entrega atrasada ou nos próximos 7 dias."
              mostrarStatus
            />
          </div>
        </div>

        {/* A receber */}
        <div className="atlas-card">
          <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Receipt size={15} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
              <span className="atlas-panel-title">A receber</span>
              {painel && painel.aReceber.length > 0 && <span className="atlas-badge atlas-badge-warning">{painel.aReceber.length}</span>}
            </span>
            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatBRL(painel?.aReceberTotal ?? 0)}</span>
          </div>
          <div className="atlas-card-body" style={{ padding: 0 }}>
            <TabelaEncomendas
              linhas={painel?.aReceber ?? []}
              vazio="Nenhum saldo em aberto."
            />
          </div>
        </div>

        {/* Faturamento */}
        <div className="atlas-card">
          <div className="atlas-card-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={15} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="atlas-panel-title">Faturamento · últimos 6 meses</span>
          </div>
          <div className="atlas-card-body" style={{ padding: 0 }}>
            {painel ? <GraficoFaturamento dados={painel.faturamentoMensal} /> : null}
          </div>
        </div>

        {/* Mais vendidos */}
        <div className="atlas-card">
          <div className="atlas-card-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={15} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="atlas-panel-title">Mais vendidos no mês</span>
          </div>
          <div className="atlas-card-body" style={{ padding: 0 }}>
            {!painel || painel.maisVendidos.length === 0 ? (
              <div className="atlas-empty" style={{ padding: 24 }}>
                <div className="atlas-empty-desc">Nenhum pedido no mês ainda.</div>
              </div>
            ) : (
              <table className="atlas-table" style={{ width: "100%", border: 0 }}>
                <thead><tr><th>Produto</th><th className="num">Qtd</th><th className="num">Receita</th></tr></thead>
                <tbody>
                  {painel.maisVendidos.map((p) => (
                    <tr key={p.nome}>
                      <td style={{ fontWeight: 500 }}>{p.nome}</td>
                      <td className="num">{p.quantidade}</td>
                      <td className="num">{formatBRL(p.receita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Instagram */}
        <div className="atlas-card" style={{ gridColumn: "1 / -1" }}>
          <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Instagram size={15} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
              <span className="atlas-panel-title">Instagram</span>
              {painel && painel.posts.atrasados.length > 0 && <span className="atlas-badge atlas-badge-warning">{painel.posts.atrasados.length} atrasado(s)</span>}
            </span>
            <Link href="/planejamento" className="atlas-link" style={{ fontSize: 13 }}>Abrir planejamento</Link>
          </div>
          <div className="atlas-card-body" style={{ padding: 0 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "14px 16px 4px" }}>
              {(["ideia", "roteiro", "produzido", "agendado", "publicado"] as const).map((st) => (
                <span key={st} className="atlas-badge" style={{ fontSize: 12 }}>
                  {ROTULO_STATUS[st]} · {painel?.posts.porStatus[st] ?? 0}
                </span>
              ))}
              <span className="atlas-badge" style={{ fontSize: 12 }}>
                Publicados no mês · {painel?.posts.publicadosMes ?? 0}
              </span>
            </div>
            <div className="alm-bento" style={{ gap: 0 }}>
              <div>
                <div style={{ padding: "10px 16px 0", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Atrasados</div>
                <ListaPosts posts={painel?.posts.atrasados ?? []} vazio="Nenhum post atrasado." />
              </div>
              <div>
                <div style={{ padding: "10px 16px 0", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Próximos 7 dias</div>
                <ListaPosts posts={painel?.posts.proximos ?? []} vazio="Nenhum post para os próximos 7 dias." />
              </div>
            </div>
          </div>
        </div>

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
