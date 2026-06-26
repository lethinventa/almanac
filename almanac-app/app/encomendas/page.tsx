"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Trash2,
  Search,
  LayoutList,
  Columns,
  MessageCircle,
  Users,
  AlertTriangle,
  Calendar,
  Package,
  ImagePlus,
  Link2,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  encomendas as encomendasMock,
  formatBRL,
  formatDate,
  statusLabels,
  statusBadge,
  Encomenda,
  EncomendaStatus,
} from "@/lib/data";
import { KanbanBoard } from "@/components/kanban-board";
import { NovaEncomendaForm } from "@/components/shared/nova-encomenda-form";

type ModalMode = "nova" | null;

interface ItemRow {
  produtoId: string;
  quantidade: string;
  precoUnitario: string;
}

// ── Modal wrapper ────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 340);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`alm-backdrop${visible ? " is-open" : ""}`}
        onClick={onClose}
      />
      <div
        className={`alm-modal${wide ? " is-wide" : ""}${
          visible ? " is-open" : ""
        }`}
      >
        <div className="alm-modal-header">
          <span className="alm-modal-title">{title}</span>
          <button
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{ padding: "0 4px" }}
            onClick={onClose}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="alm-modal-body">{children}</div>
      </div>
    </>
  );
}


// ── Page ─────────────────────────────────────────────────────
export default function EncomendasPage() {
  const router = useRouter();
  const [lista, setLista] = useState<Encomenda[]>(encomendasMock);
  const [busca, setBusca] = useState("");
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [mode, setMode] = useState<ModalMode>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("novo=1")) {
      setMode("nova");
    }
  }, []);

  const filtrados = lista.filter(
    (e) =>
      e.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      statusLabels[e.status].toLowerCase().includes(busca.toLowerCase())
  );

  const goDetalhe = (e: Encomenda) => router.push(`/encomendas/${e.id}`);

  const close = () => setMode(null);

  const handleStatusChange = (id: string, status: EncomendaStatus) =>
    setLista((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));

  const handleNova = (enc: Omit<Encomenda, "id">) => {
    const nova: Encomenda = { ...enc, id: `enc-${Date.now()}` };
    setLista((prev) => [nova, ...prev]);
    close();
    router.push(`/encomendas/${nova.id}`);
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
            onClick={() => setMode("nova")}
          >
            <Plus size={13} strokeWidth={1.5} />
            Nova encomenda
          </button>
        </div>
      </div>

      {/* Busca */}
      <div style={{ position: "relative", maxWidth: 320 }}>
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

      {/* Kanban */}
      {view === "kanban" && (
        <KanbanBoard lista={filtrados} onCardClick={goDetalhe} onStatusChange={handleStatusChange} />
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
                  return (
                    <tr key={enc.id} onClick={() => goDetalhe(enc)}>
                      <td style={{ fontWeight: 500 }}>{enc.cliente}</td>
                      <td><span className={statusBadge[enc.status]}>{statusLabels[enc.status]}</span></td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-tertiary)" }}>
                          {enc.canal === "whatsapp" ? <MessageCircle size={11} strokeWidth={1.5} /> : <Users size={11} strokeWidth={1.5} />}
                          {enc.canal === "whatsapp" ? "WhatsApp" : "Presencial"}
                        </span>
                      </td>
                      <td className="num" style={{ fontSize: 12, color: isLate ? "var(--status-error)" : "var(--text-secondary)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          {isLate && <AlertTriangle size={10} strokeWidth={1.5} />}
                          {formatDate(enc.dataEntrega)}
                        </span>
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {formatBRL(enc.totalCobrado)}
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: margemColor }}>
                        {enc.margem.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal nova encomenda */}
      <Modal open={mode === "nova"} onClose={close} title="Nova encomenda" wide>
        <NovaEncomendaForm onSave={handleNova} onClose={close} />
      </Modal>
    </div>
  );
}
