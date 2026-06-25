"use client";

import { useState } from "react";
import { Calendar, AlertTriangle } from "lucide-react";
import {
  Encomenda,
  EncomendaStatus,
  produtos,
  formatBRL,
  formatDate,
  statusLabels,
} from "@/lib/data";

const STATUS_ORDER: EncomendaStatus[] = [
  "aguardando",
  "em_producao",
  "pronto",
  "entregue",
  "cancelado",
];

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
}

export function KanbanBoard({
  lista,
  onCardClick,
  onStatusChange,
  columns = STATUS_ORDER,
}: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<EncomendaStatus | null>(
    null
  );

  return (
    <div className="alm-kanban">
      {columns.map((status) => {
        const cards = lista.filter((e) => e.status === status);
        const isOver = dragOverStatus === status;

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
              className="alm-kanban-col-header"
              style={{
                borderLeft: `2px solid ${STATUS_COLOR[status]}`,
                background: isOver ? "var(--bg-hover)" : undefined,
                transition: "background-color 120ms ease",
              }}
            >
              <span style={{ color: STATUS_COLOR[status] }}>
                {statusLabels[status]}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                }}
              >
                {cards.length}
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
                const resumo = enc.itens
                  .map((item) => {
                    const prod = produtos.find((p) => p.id === item.produtoId);
                    return `${item.quantidade}× ${prod?.nome ?? "?"}`;
                  })
                  .join(", ");

                const isLate =
                  enc.status !== "entregue" &&
                  enc.status !== "cancelado" &&
                  new Date(enc.dataEntrega) < new Date();

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
                        {formatBRL(enc.totalCobrado)}
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
