"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Search,
  LayoutList,
  Columns,
  MessageCircle,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  formatBRL,
  formatDate,
  statusLabels,
  statusBadge,
} from "@/lib/utils";
import { buscarEncomendas, atualizarStatus, isPessoal, type Encomenda, type EncomendaStatus } from "@/lib/repositories/encomendas";
import { buscarTodosPagamentos } from "@/lib/repositories/pagamentos";
import { KanbanBoard } from "@/components/kanban-board";

// ── Page ─────────────────────────────────────────────────────
export default function EncomendasPage() {
  const router = useRouter();
  const [lista, setLista] = useState<Encomenda[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todas" | "clientes" | "pessoal">("todas");
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [recebidoPorEncomenda, setRecebidoPorEncomenda] = useState<Record<string, number>>({});

  useEffect(() => {
    buscarEncomendas().then(setLista);
    buscarTodosPagamentos().then((todos) => {
      const totais: Record<string, number> = {};
      for (const [encId, pags] of Object.entries(todos)) {
        totais[encId] = pags.reduce((s, p) => s + p.valor, 0);
      }
      setRecebidoPorEncomenda(totais);
    });
  }, []);

  // Atalho antigo /encomendas?novo=1 agora leva para a página de nova encomenda.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("novo=1")) {
      router.replace("/encomendas/nova");
    }
  }, [router]);

  const filtrados = lista.filter(
    (e) =>
      (filtroTipo === "todas" ||
        (filtroTipo === "pessoal" ? isPessoal(e) : !isPessoal(e))) &&
      (e.cliente.toLowerCase().includes(busca.toLowerCase()) ||
        statusLabels[e.status].toLowerCase().includes(busca.toLowerCase()))
  );

  const goDetalhe = (e: Encomenda) => router.push(`/encomendas/${e.id}`);

  const handleStatusChange = (id: string, status: EncomendaStatus) => {
    atualizarStatus(id, status);
    setLista((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const abertas = lista.filter((e) => e.status !== "entregue" && e.status !== "cancelado");

  return (
    <div className="alm-page">
      {/* Header */}
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Encomendas</h1>
          <p className="alm-page-subtitle">
            {abertas.length} abertas · {lista.length} total
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md, 4px)",
              overflow: "hidden",
            }}
          >
            {(["kanban", "lista"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: view === v ? "var(--bg-tab-active)" : "transparent",
                  border: "none",
                  borderLeft: v === "lista" ? "1px solid var(--border-default)" : "none",
                  cursor: "pointer",
                  color: view === v ? "var(--text-primary)" : "var(--text-tertiary)",
                  transition: "background-color 120ms ease, color 120ms ease",
                }}
              >
                {v === "kanban" ? <Columns size={14} strokeWidth={1.5} /> : <LayoutList size={14} strokeWidth={1.5} />}
              </button>
            ))}
          </div>
          <button
            className="atlas-btn atlas-btn-primary atlas-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => router.push("/encomendas/nova")}
          >
            <Plus size={13} strokeWidth={1.5} />
            Nova encomenda
          </button>
        </div>
      </div>

      {/* Busca e filtro por tipo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: 320, flex: "1 1 220px" }}>
          <Search
            size={13}
            strokeWidth={1.5}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}
          />
          <input
            className="atlas-input"
            placeholder="Buscar por cliente ou status…"
            style={{ paddingLeft: 26 }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md, 4px)", overflow: "hidden" }}>
          {(
            [
              { v: "todas", label: "Todas" },
              { v: "clientes", label: "Clientes" },
              { v: "pessoal", label: "Pessoal" },
            ] as const
          ).map(({ v, label }, i) => (
            <button
              key={v}
              onClick={() => setFiltroTipo(v)}
              style={{
                height: 32,
                padding: "0 10px",
                fontSize: 12,
                border: "none",
                borderLeft: i > 0 ? "1px solid var(--border-default)" : "none",
                cursor: "pointer",
                background: filtroTipo === v ? "var(--bg-tab-active)" : "transparent",
                color: filtroTipo === v ? "var(--text-primary)" : "var(--text-tertiary)",
                fontWeight: filtroTipo === v ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <KanbanBoard
          lista={filtrados}
          onCardClick={goDetalhe}
          onStatusChange={handleStatusChange}
          recebidoPorEncomenda={recebidoPorEncomenda}
        />
      )}

      {/* Lista */}
      {view === "lista" && (
        <div className="atlas-card" style={{ padding: 0 }}>
          {filtrados.length === 0 ? (
            <div className="atlas-empty" style={{ padding: "32px" }}>
              <div className="atlas-empty-title">Nenhuma encomenda encontrada</div>
              <div className="atlas-empty-desc">Tente um termo diferente ou crie uma nova encomenda.</div>
            </div>
          ) : (
            <table className="atlas-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Canal</th>
                  <th className="num">Entrega</th>
                  <th className="num">Total</th>
                  <th className="num">Margem</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((enc) => {
                  const margemColor =
                    enc.margem >= 60 ? "var(--status-success)" : enc.margem >= 30 ? "var(--status-warning)" : "var(--status-error)";
                  const isLate =
                    enc.status !== "entregue" && enc.status !== "cancelado" && new Date(enc.dataEntrega) < new Date();
                  const pessoalEnc = isPessoal(enc);
                  return (
                    <tr key={enc.id} onClick={() => goDetalhe(enc)}>
                      <td style={{ fontWeight: 500 }}>
                        {enc.cliente}
                        {pessoalEnc && <span className="atlas-badge" style={{ marginLeft: 8, fontSize: 10, verticalAlign: "middle" }}>Pessoal</span>}
                      </td>
                      <td><span className={statusBadge[enc.status]}>{statusLabels[enc.status]}</span></td>
                      <td>
                        {pessoalEnc ? (
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>—</span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-tertiary)" }}>
                            {enc.canal === "whatsapp" ? <MessageCircle size={11} strokeWidth={1.5} /> : <Users size={11} strokeWidth={1.5} />}
                            {enc.canal === "whatsapp" ? "WhatsApp" : "Presencial"}
                          </span>
                        )}
                      </td>
                      <td className="num" style={{ fontSize: 12, color: isLate ? "var(--status-error)" : "var(--text-secondary)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          {isLate && <AlertTriangle size={10} strokeWidth={1.5} />}
                          {formatDate(enc.dataEntrega)}
                        </span>
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {pessoalEnc ? "—" : formatBRL(enc.totalCobrado)}
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: margemColor }}>
                        {pessoalEnc ? "—" : `${enc.margem.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}
