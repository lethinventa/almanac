import Link from "next/link";
import { AlertTriangle, TrendingUp, ShoppingBag, Package, Plus, ClipboardList, Box } from "lucide-react";
import { KanbanWidget } from "@/components/kanban-widget";
import {
  insumosEmAlerta,
  encomendasAbertas,
  formatBRL,
  receitaMes,
  lucroBruto,
  lucroLiquido,
  categoriaLabel,
} from "@/lib/data";

function StatCard({
  label,
  value,
  delta,
  deltaUp,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  icon: React.ElementType;
  accent?: "error" | "warning";
}) {
  return (
    <div
      className="atlas-card"
      style={{ padding: 0, display: "flex", flexDirection: "column" }}
    >
      <div className="atlas-card-body" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {label}
          </span>
          <Icon
            size={14}
            strokeWidth={1.5}
            style={{
              color: accent === "error"
                ? "var(--status-error)"
                : accent === "warning"
                ? "var(--status-warning)"
                : "var(--text-tertiary)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: accent === "error" ? "var(--status-error)" : "var(--text-primary)",
          }}
        >
          {value}
        </div>
        {delta && (
          <div className={`atlas-stat-delta ${deltaUp ? "is-up" : "is-down"}`}>
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="alm-page">
      {/* Header */}
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

      {/* Stats */}
      <div className="alm-stats-grid">
        <StatCard
          label="Receita do mês"
          value={formatBRL(receitaMes)}
          delta="+18,4% vs maio"
          deltaUp
          icon={TrendingUp}
        />
        <StatCard
          label="Lucro bruto"
          value={formatBRL(lucroBruto)}
          delta="+22,1% vs maio"
          deltaUp
          icon={TrendingUp}
        />
        <StatCard
          label="Encomendas abertas"
          value={String(encomendasAbertas.length)}
          delta="4 com entrega esta semana"
          deltaUp={false}
          icon={ShoppingBag}
        />
        <StatCard
          label="Alertas de estoque"
          value={String(insumosEmAlerta.length)}
          icon={AlertTriangle}
          accent={insumosEmAlerta.length > 0 ? "error" : undefined}
        />
      </div>

      {/* Atalhos rápidos */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Link
          href="/encomendas?novo=1"
          className="atlas-btn atlas-btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={13} strokeWidth={1.5} />
          <ClipboardList size={13} strokeWidth={1.5} />
          Nova encomenda
        </Link>
        <Link
          href="/insumos?novo=1"
          className="atlas-btn atlas-btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={13} strokeWidth={1.5} />
          <Package size={13} strokeWidth={1.5} />
          Novo insumo
        </Link>
        <Link
          href="/produtos?novo=1"
          className="atlas-btn atlas-btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={13} strokeWidth={1.5} />
          <Box size={13} strokeWidth={1.5} />
          Novo produto
        </Link>
      </div>

      {/* Pipeline de encomendas */}
      <KanbanWidget />

      {/* Estoque em alerta — full width */}
      <div className="atlas-card">
        <div className="atlas-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="atlas-dot atlas-dot-error is-pulse" />
            <span className="atlas-panel-title">Estoque em alerta</span>
          </span>
          <Link href="/insumos" className="atlas-link" style={{ fontSize: "11px" }}>
            Ver todos
          </Link>
        </div>
        <div className="atlas-card-body" style={{ padding: 0 }}>
          {insumosEmAlerta.length === 0 ? (
            <div className="atlas-empty" style={{ padding: "24px" }}>
              <div className="atlas-empty-title">Nenhum alerta</div>
              <div className="atlas-empty-desc">Todos os insumos estão acima do mínimo.</div>
            </div>
          ) : (
            <table className="atlas-table" style={{ width: "100%", border: 0 }}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Categoria</th>
                  <th className="num">Estoque atual</th>
                  <th className="num">Mínimo</th>
                  <th className="num">Preço atual</th>
                  <th>Fornecedor</th>
                </tr>
              </thead>
              <tbody>
                {insumosEmAlerta.map((insumo) => (
                  <tr key={insumo.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Package size={13} strokeWidth={1.5} style={{ color: "var(--status-error)", flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{insumo.nome}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>
                      {categoriaLabel[insumo.categoria]}
                    </td>
                    <td className="num">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--status-error)" }}>
                        {insumo.estoque} {insumo.unidade}
                      </span>
                    </td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                      {insumo.estoqueMin} {insumo.unidade}
                    </td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                      {formatBRL(insumo.precoAtual)}/{insumo.unidade}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                      {insumo.fornecedor ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Lucro líquido callout */}
      <div
        style={{
          border: "1px solid var(--border-default)",
          borderRadius: "6px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: lucroLiquido >= 0 ? "rgba(77,77,77,0.06)" : "rgba(244,71,71,0.06)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "2px",
            }}
          >
            Lucro líquido estimado (junho)
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: lucroLiquido >= 0 ? "var(--status-success)" : "var(--status-error)",
            }}
          >
            {formatBRL(lucroLiquido)}
          </div>
        </div>
        <Link href="/financeiro" className="atlas-btn atlas-btn-secondary atlas-btn-sm">
          Ver financeiro
        </Link>
      </div>
    </div>
  );
}
