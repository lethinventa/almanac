"use client";

import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Package, Eye, EyeOff } from "lucide-react";
import {
  formatBRL,
  formatDate,
  statusLabels,
} from "@/lib/utils";
import { isPessoal, type Encomenda, type EncomendaStatus } from "@/lib/repositories/encomendas";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";

const STATUS_ORDER: EncomendaStatus[] = [
  "aguardando",
  "em_producao",
  "pronto",
  "entregue",
  "cancelado",
];

// Colunas ocultas ficam salvas no navegador (preferência de visualização).
const STORAGE_KEY_OCULTAS = "alm-kanban-ocultas";

function lerOcultas(): EncomendaStatus[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_OCULTAS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is EncomendaStatus => STATUS_ORDER.includes(s)) : [];
  } catch {
    return [];
  }
}

function salvarOcultas(ocultas: EncomendaStatus[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY_OCULTAS, JSON.stringify(ocultas));
  } catch {
    // Armazenamento indisponível: a preferência vale só para esta sessão.
  }
}

// Botão de olho discreto: sem caixa, pequeno, na cor terciária.
const BOTAO_DISCRETO: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  borderRadius: 4,
};

const STATUS_COLOR: Record<EncomendaStatus, string> = {
  aguardando: "var(--text-tertiary)",
  em_producao: "var(--status-warning)",
  pronto: "var(--accent-highlight)",
  entregue: "var(--status-success)",
  cancelado: "var(--status-error)",
};

interface KanbanBoardProps {
  lista: Encomenda[];
  onCardClick: (enc: Encomenda) => void;
  onStatusChange: (id: string, newStatus: EncomendaStatus) => void;
  columns?: EncomendaStatus[];
  // Total já recebido por encomenda (id → valor). Se informado, o card mostra a tag Pago/Pendente.
  recebidoPorEncomenda?: Record<string, number>;
}

export function KanbanBoard({
  lista,
  onCardClick,
  onStatusChange,
  columns = STATUS_ORDER,
  recebidoPorEncomenda,
}: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<EncomendaStatus | null>(null);
  const [produtosList, setProdutosList] = useState<ProdutoCalculado[]>([]);
  const [ocultas, setOcultas] = useState<EncomendaStatus[]>([]);

  useEffect(() => {
    buscarProdutos().then(setProdutosList);
    setOcultas(lerOcultas());
  }, []);

  const toggleOculta = (status: EncomendaStatus) => {
    setOcultas((prev) => {
      const next = prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status];
      salvarOcultas(next);
      return next;
    });
  };

  const getCardFoto = (enc: Encomenda): string | undefined => {
    if (enc.foto) return enc.foto;
    for (const item of enc.itens) {
      const prod = produtosList.find((p) => p.id === item.produtoId);
      if (prod?.foto) return prod.foto;
    }
    return undefined;
  };

  return (
    <div
      className="alm-kanban"
      style={{
        gridTemplateColumns: columns
          .map((s) => (ocultas.includes(s) ? "44px" : "minmax(160px, 200px)"))
          .join(" "),
      }}
    >
      {columns.map((status) => {
        // Prioridade pelo prazo: entrega mais próxima (ou atrasada) no topo
        const cards = lista
          .filter((e) => e.status === status)
          .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega) || a.dataPedido.localeCompare(b.dataPedido));
        const isOver = dragOverStatus === status;

        if (ocultas.includes(status)) {
          return (
            <div
              key={status}
              className="alm-kanban-col"
              style={{ alignItems: "center", gap: 10, paddingTop: 4 }}
            >
              <button
                type="button"
                onClick={() => toggleOculta(status)}
                title={`Mostrar ${statusLabels[status]}`}
                aria-label={`Mostrar coluna ${statusLabels[status]}`}
                style={BOTAO_DISCRETO}
              >
                <Eye size={12} strokeWidth={1.5} />
              </button>
              <span
                style={{
                  writingMode: "vertical-rl",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {statusLabels[status]} · {cards.length}
              </span>
            </div>
          );
        }

        return (
          <div
            key={status}
            className="alm-kanban-col"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverStatus(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverStatus(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedId) onStatusChange(draggedId, status);
              setDraggedId(null);
              setDragOverStatus(null);
            }}
          >
            {/* Column header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "4px 2px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: STATUS_COLOR[status],
                    flexShrink: 0,
                  }}
                />
                {statusLabels[status]}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-tertiary)",
                  }}
                >
                  {cards.length}
                </span>
                <button
                  type="button"
                  onClick={() => toggleOculta(status)}
                  title="Ocultar coluna"
                  aria-label={`Ocultar coluna ${statusLabels[status]}`}
                  style={BOTAO_DISCRETO}
                >
                  <EyeOff size={12} strokeWidth={1.5} />
                </button>
              </span>
            </div>

            {/* Drop zone wrapper */}
            <div
              style={{
                flex: 1,
                borderRadius: "var(--radius-md, 4px)",
                border: isOver
                  ? `1px dashed ${STATUS_COLOR[status]}`
                  : "1px dashed transparent",
                padding: isOver ? 3 : 0,
                transition: "border-color 120ms ease, padding 80ms ease",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 48,
              }}
            >
              {cards.length === 0 && !isOver && (
                <div
                  style={{
                    padding: "12px 8px",
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    textAlign: "center",
                    border: "1px dashed var(--border-default)",
                    borderRadius: "var(--radius-md, 4px)",
                  }}
                >
                  Vazio
                </div>
              )}

              {cards.map((enc) => {
                const isDragging = draggedId === enc.id;
                const cardFoto = getCardFoto(enc);
                const resumo = enc.itens
                  .map((item) => {
                    const prod = produtosList.find((p) => p.id === item.produtoId);
                    return `${item.quantidade}× ${prod?.nome ?? item.descricao ?? "?"}`;
                  })
                  .join(", ");

                const isLate =
                  enc.status !== "entregue" &&
                  enc.status !== "cancelado" &&
                  new Date(enc.dataEntrega) < new Date();

                const pessoal = isPessoal(enc);
                const recebido = recebidoPorEncomenda?.[enc.id] ?? 0;
                const pago = enc.totalCobrado > 0 && recebido >= enc.totalCobrado - 0.005;
                const mostrarPagamento = recebidoPorEncomenda !== undefined && enc.status !== "cancelado" && !pessoal;

                return (
                  <div
                    key={enc.id}
                    className="alm-kanban-card"
                    draggable
                    onDragStart={(e) => {
                      setDraggedId(enc.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", enc.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverStatus(null);
                    }}
                    onClick={() => {
                      if (!isDragging) onCardClick(enc);
                    }}
                    style={{
                      opacity: isDragging ? 0.4 : 1,
                      cursor: "grab",
                      transition: "opacity 120ms ease",
                      userSelect: "none",
                    }}
                  >
                    {/* Mesmo modelo do card de produto: capa panorâmica com tag no canto superior direito */}
                    <div
                      style={{
                        margin: "-16px -16px 0",
                        borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                        overflow: "hidden",
                        position: "relative",
                        aspectRatio: "1.9 / 1",
                        flexShrink: 0,
                        background: "var(--bg-input)",
                        borderBottom: "1px solid var(--border-default)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {cardFoto ? (
                        <img
                          src={cardFoto}
                          alt={enc.cliente}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Package size={28} strokeWidth={1} style={{ color: "var(--text-tertiary)", opacity: 0.4 }} />
                      )}
                      {mostrarPagamento && (
                        <span
                          className={`atlas-badge ${pago ? "atlas-badge-success" : "atlas-badge-warning"}`}
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            fontSize: 10,
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          {pago ? "Pago" : "Pendente"}
                        </span>
                      )}
                      <span
                        className="atlas-badge"
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          fontSize: 10,
                          background: "var(--bg-raised)",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        {pessoal ? "Pessoal" : enc.canal === "whatsapp" ? "WhatsApp" : "Presencial"}
                      </span>
                    </div>
                    <div className="alm-kanban-card-client">{enc.cliente}</div>
                    <div
                      className="alm-kanban-card-items"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {resumo}
                    </div>
                    <div className="alm-kanban-card-footer">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          color: isLate
                            ? "var(--status-error)"
                            : "var(--text-tertiary)",
                        }}
                      >
                        {isLate && (
                          <AlertTriangle size={10} strokeWidth={1.5} />
                        )}
                        <Calendar size={10} strokeWidth={1.5} />
                        {formatDate(enc.dataEntrega)}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {pessoal ? "—" : formatBRL(enc.totalCobrado)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
