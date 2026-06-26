"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Trash2,
  MessageCircle,
  Users,
  Calendar,
  ChevronRight,
  Check,
  Clock,
  Package,
  PackageCheck,
  ZoomIn,
  X,
  Eye,
  Info,
} from "lucide-react";
import {
  encomendas as encomendasMock,
  produtos,
  insumos,
  formatBRL,
  formatDate,
  statusLabels,
  statusBadge,
  EncomendaStatus,
  EncomendaTipo,
  LinkUtil,
  EncomendaItem,
  Produto,
} from "@/lib/data";

// ── Status flow ───────────────────────────────────────────────
const NEXT_STATUS: Partial<Record<EncomendaStatus, EncomendaStatus>> = {
  aguardando: "em_producao",
  em_producao: "pronto",
  pronto: "entregue",
};
const NEXT_LABEL: Partial<Record<EncomendaStatus, string>> = {
  aguardando: "Iniciar produção",
  em_producao: "Marcar como pronto",
  pronto: "Confirmar entrega",
};

// ── Helpers ───────────────────────────────────────────────────
function formatOrderNumber(id: string): string {
  const match = id.match(/\d+$/);
  return match ? `#${match[0].padStart(3, "0")}` : `#${id}`;
}

function getDaysLabel(dateStr: string, status: EncomendaStatus): string | null {
  if (status === "entregue" || status === "cancelado") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(`${dateStr}T00:00:00`);
  const diff = Math.round(
    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return `${Math.abs(diff)} dias de atraso`;
  if (diff === 0) return "entrega hoje";
  return `faltam ${diff} dias`;
}

function deriveTimeline(
  status: EncomendaStatus,
  dataPedido: string
): { evento: string; data: string; concluido: boolean; isCurrent: boolean }[] {
  const base = new Date(`${dataPedido}T00:00:00`);
  const addDays = (n: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString("pt-BR");
  };

  if (status === "cancelado") {
    return [
      { evento: "Pedido criado", data: addDays(0), concluido: true, isCurrent: false },
      { evento: "Pedido cancelado", data: addDays(1), concluido: false, isCurrent: true },
    ];
  }

  const ORDER: EncomendaStatus[] = ["aguardando", "em_producao", "pronto", "entregue"];
  const currentIdx = ORDER.indexOf(status);

  const steps = [
    { evento: "Pedido criado", statusIdx: 0 },
    { evento: "Produção iniciada", statusIdx: 1 },
    { evento: "Marcado como pronto", statusIdx: 2 },
    { evento: "Entregue ao cliente", statusIdx: 3 },
  ];

  return steps
    .filter((s) => s.statusIdx <= currentIdx)
    .map((s) => ({
      evento: s.evento,
      data: addDays(s.statusIdx),
      concluido: s.statusIdx < currentIdx,
      isCurrent: s.statusIdx === currentIdx,
    }));
}

function getFileExt(url: string, label: string): string {
  const src = url || label;
  const match = src.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toUpperCase() : "ARQ";
}

const EXT_COLORS: Record<string, { bg: string; color: string }> = {
  PDF: { bg: "#c0392b", color: "#fff" },
  PNG: { bg: "#2980b9", color: "#fff" },
  JPG: { bg: "#2980b9", color: "#fff" },
  JPEG: { bg: "#2980b9", color: "#fff" },
  AI:  { bg: "#7b2d8b", color: "#fff" },
  PSD: { bg: "#1a5276", color: "#fff" },
};

// ── VisualGaleria ─────────────────────────────────────────────
function VisualGaleria({
  foto,
  onFotoChange,
  itens,
  onPreview,
}: {
  foto: string | null;
  onFotoChange: (url: string) => void;
  itens: EncomendaItem[];
  onPreview: (src: string, alt: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFotoChange(URL.createObjectURL(f));
  };

  const TILE = 88;

  const tiles: {
    key: string;
    label: string;
    src: string | null;
    isKit?: boolean;
    qty?: number;
  }[] = [
    { key: "kit", label: "preview geral", src: foto, isKit: true },
    ...itens.map((item, i) => {
      const prod = produtos.find((p) => p.id === item.produtoId);
      return {
        key: `item-${i}`,
        label: prod?.nome ?? item.produtoId,
        src: prod?.foto ?? null,
        qty: item.quantidade,
      };
    }),
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {tiles.map((tile) => {
        const hasPhoto = !!tile.src;
        return (
          <div
            key={tile.key}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
          >
            <div
              style={{
                width: TILE,
                height: TILE,
                borderRadius: "var(--radius-md)",
                border: `1px solid ${hasPhoto ? "var(--border-default)" : "var(--border-subtle)"}`,
                background: "var(--bg-input)",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0,
                cursor: hasPhoto ? "zoom-in" : tile.isKit ? "pointer" : "default",
              }}
              onClick={() => {
                if (hasPhoto) onPreview(tile.src!, tile.label);
                else if (tile.isKit) inputRef.current?.click();
              }}
            >
              {hasPhoto ? (
                <>
                  <img
                    src={tile.src!}
                    alt={tile.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.45)",
                      borderRadius: "var(--radius-sm)",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ZoomIn size={10} strokeWidth={1.5} style={{ color: "#fff" }} />
                  </div>
                </>
              ) : tile.isKit ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 4,
                  }}
                >
                  <ImagePlus size={18} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: 9, color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.2 }}>
                    adicionar
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <Package size={20} strokeWidth={1} style={{ color: "var(--border-default)" }} />
                </div>
              )}

              {tile.qty !== undefined && tile.qty > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "var(--radius-full)",
                    lineHeight: 1.4,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ×{tile.qty}
                </div>
              )}

              {tile.isKit && hasPhoto && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    background: "rgba(0,0,0,0.55)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: "#fff",
                    fontSize: 9,
                    padding: "2px 6px",
                    cursor: "pointer",
                    lineHeight: 1.4,
                  }}
                >
                  trocar
                </button>
              )}
            </div>

            <span
              style={{
                fontSize: 10,
                color: "var(--text-tertiary)",
                maxWidth: TILE,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "center",
                lineHeight: 1,
              }}
            >
              {tile.label}
            </span>
          </div>
        );
      })}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}

// ── TabelaProdutos ────────────────────────────────────────────
function TabelaProdutos({
  itens,
  onChange,
  onPreview,
  onProdutoClick,
}: {
  itens: EncomendaItem[];
  onChange: (itens: EncomendaItem[]) => void;
  onPreview?: (src: string, alt: string) => void;
  onProdutoClick?: (prod: Produto) => void;
}) {
  const [editCell, setEditCell] = useState<{
    row: number;
    field: "quantidade" | "precoUnitario";
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingRow, setAddingRow] = useState(false);
  const [newItem, setNewItem] = useState({
    produtoId: produtos[0]?.id ?? "",
    quantidade: "1",
    precoUnitario: String(produtos[0]?.precoSugerido ?? 0),
  });

  const startEdit = (row: number, field: "quantidade" | "precoUnitario") => {
    setEditCell({ row, field });
    setEditValue(String(itens[row][field]));
  };

  const commitEdit = () => {
    if (!editCell) return;
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      onChange(
        itens.map((item, i) =>
          i === editCell.row ? { ...item, [editCell.field]: val } : item
        )
      );
    }
    setEditCell(null);
  };

  const removeItem = (idx: number) =>
    onChange(itens.filter((_, i) => i !== idx));

  const confirmAdd = () => {
    const qty = parseFloat(newItem.quantidade);
    const price = parseFloat(newItem.precoUnitario);
    if (!newItem.produtoId || isNaN(qty) || qty <= 0) return;
    onChange([
      ...itens,
      { produtoId: newItem.produtoId, quantidade: qty, precoUnitario: price || 0 },
    ]);
    setAddingRow(false);
    const first = produtos[0];
    setNewItem({
      produtoId: first?.id ?? "",
      quantidade: "1",
      precoUnitario: String(first?.precoSugerido ?? 0),
    });
  };

  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);

  const editableCellStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    cursor: "pointer",
    borderRadius: "var(--radius-sm)",
    padding: "2px 4px",
    display: "inline-block",
    transition: "background-color 80ms",
  };

  return (
    <div className="atlas-card" style={{ padding: 0 }}>
      {/* Header */}
      <div
        className="atlas-card-header"
        style={{ justifyContent: "space-between", padding: "0 12px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="atlas-panel-title">Produtos do pedido</span>
          <span className="atlas-badge">
            {itens.length} {itens.length === 1 ? "item" : "itens"}
          </span>
        </div>
      </div>

      {/* Table */}
      <table className="atlas-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: 44 }} />
            <th>Produto</th>
            <th className="num">Qtd</th>
            <th className="num">Valor unit.</th>
            <th className="num">Subtotal</th>
            <th style={{ width: 36 }} />
          </tr>
        </thead>
        <tbody>
          {itens.map((item, i) => {
            const prod = produtos.find((p) => p.id === item.produtoId);
            const sub = item.quantidade * item.precoUnitario;
            return (
              <tr key={i} style={{ cursor: "default" }}>
                {/* Thumbnail */}
                <td style={{ padding: "0 8px 0 12px" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-default)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                      cursor: prod?.foto ? "zoom-in" : "default",
                    }}
                    onClick={() => prod?.foto && onPreview?.(prod.foto, prod.nome)}
                  >
                    {prod?.foto ? (
                      <img
                        src={prod.foto}
                        alt={prod.nome}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Package
                        size={14}
                        strokeWidth={1.5}
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    )}
                  </div>
                </td>

                {/* Name */}
                <td>
                  <span
                    style={{
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: prod && onProdutoClick ? "pointer" : "default",
                    }}
                    onClick={() => prod && onProdutoClick?.(prod)}
                    onMouseEnter={(e) => {
                      if (prod && onProdutoClick)
                        (e.currentTarget as HTMLElement).style.color = "var(--text-link, var(--primary))";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "";
                    }}
                  >
                    {prod?.nome ?? item.produtoId}
                    {prod && onProdutoClick && (
                      <Info size={11} strokeWidth={1.5} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                    )}
                  </span>
                </td>

                {/* Qty — inline editable */}
                <td className="num">
                  {editCell?.row === i && editCell.field === "quantidade" ? (
                    <input
                      autoFocus
                      type="number"
                      min="1"
                      className="atlas-input"
                      style={{ width: 64, fontSize: 12, textAlign: "right", height: 24 }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditCell(null);
                      }}
                    />
                  ) : (
                    <span
                      title="Clique para editar"
                      style={{ ...editableCellStyle, color: "var(--text-secondary)" }}
                      onClick={() => startEdit(i, "quantidade")}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      {item.quantidade}
                    </span>
                  )}
                </td>

                {/* Unit price — inline editable */}
                <td className="num">
                  {editCell?.row === i && editCell.field === "precoUnitario" ? (
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      step="0.01"
                      className="atlas-input"
                      style={{ width: 88, fontSize: 12, textAlign: "right", height: 24 }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditCell(null);
                      }}
                    />
                  ) : (
                    <span
                      title="Clique para editar"
                      style={{
                        ...editableCellStyle,
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                      }}
                      onClick={() => startEdit(i, "precoUnitario")}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      {formatBRL(item.precoUnitario)}
                    </span>
                  )}
                </td>

                {/* Subtotal */}
                <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatBRL(sub)}
                </td>

                {/* Remove */}
                <td style={{ padding: "0 8px 0 0" }}>
                  <button
                    className="atlas-btn-icon"
                    title="Remover produto"
                    onClick={() => removeItem(i)}
                    style={{
                      width: 28,
                      height: 28,
                      color: "var(--text-tertiary)",
                      borderRadius: "var(--radius-sm)",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "var(--status-error)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")
                    }
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            );
          })}

          {/* Add row */}
          {addingRow && (
            <tr style={{ cursor: "default" }}>
              <td />
              <td>
                <select
                  className="alm-select"
                  style={{ width: "100%", height: 28 }}
                  value={newItem.produtoId}
                  onChange={(e) => {
                    const prod = produtos.find((p) => p.id === e.target.value);
                    setNewItem((n) => ({
                      ...n,
                      produtoId: e.target.value,
                      precoUnitario: String(prod?.precoSugerido ?? n.precoUnitario),
                    }));
                  }}
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </td>
              <td className="num">
                <input
                  className="atlas-input"
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  style={{ width: 64, fontSize: 12, height: 28 }}
                  value={newItem.quantidade}
                  onChange={(e) =>
                    setNewItem((n) => ({ ...n, quantidade: e.target.value }))
                  }
                />
              </td>
              <td className="num">
                <input
                  className="atlas-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Preço"
                  style={{ width: 88, fontSize: 12, height: 28 }}
                  value={newItem.precoUnitario}
                  onChange={(e) =>
                    setNewItem((n) => ({ ...n, precoUnitario: e.target.value }))
                  }
                />
              </td>
              <td />
              <td style={{ padding: "0 8px 0 0" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={confirmAdd}
                    style={{
                      background: "var(--accent-highlight)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      color: "#fff",
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setAddingRow(false)}
                    className="atlas-btn-icon"
                    style={{ width: 26, height: 26 }}
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderTop: "1px solid var(--border-default)",
        }}
      >
        <button
          className="atlas-btn atlas-btn-ghost atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          onClick={() => setAddingRow(true)}
          disabled={addingRow}
        >
          <Plus size={12} strokeWidth={1.5} />
          Adicionar produto
        </button>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Subtotal dos itens{" "}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginLeft: 6,
            }}
          >
            {formatBRL(subtotal)}
          </span>
        </span>
      </div>
    </div>
  );
}

// ── ObservacoesCard ───────────────────────────────────────────
function ObservacoesCard({
  title,
  value,
  onChange,
  placeholder,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="atlas-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="atlas-card-header">
        <span className="atlas-panel-title">{title}</span>
      </div>
      <div
        className="atlas-card-body"
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px" }}
      >
        {editing ? (
          <>
            <textarea
              autoFocus
              className="atlas-input"
              rows={4}
              style={{
                resize: "vertical",
                padding: "6px 8px",
                lineHeight: 1.5,
                fontSize: 13,
                height: "auto",
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="atlas-btn atlas-btn-primary atlas-btn-sm" onClick={save}>
                Salvar
              </button>
              <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={cancel}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            {value ? (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                {value}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic", margin: 0 }}>
                {placeholder}
              </p>
            )}
            <button
              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
              style={{ alignSelf: "flex-start", fontSize: 11 }}
              onClick={() => {
                setDraft(value);
                setEditing(true);
              }}
            >
              Editar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "var(--z-modal)" as unknown as number,
        cursor: "zoom-out",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "var(--radius-md)",
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ── ProdutoDetalheModal ───────────────────────────────────────
function ProdutoDetalheModal({
  produto,
  onClose,
}: {
  produto: Produto;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const margemColor =
    produto.margem >= 60
      ? "var(--status-success)"
      : produto.margem >= 30
      ? "var(--status-warning)"
      : "var(--status-error)";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "var(--z-modal)" as unknown as number,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-default)",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{produto.nome}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
              {produto.categoria}
            </div>
          </div>
          <button
            className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm"
            onClick={onClose}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Foto */}
          {produto.foto && (
            <img
              src={produto.foto}
              alt={produto.nome}
              style={{
                width: "100%",
                maxHeight: 180,
                objectFit: "cover",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-default)",
              }}
            />
          )}

          {/* Resumo financeiro */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-tertiary)",
                marginBottom: 6,
              }}
            >
              Financeiro
            </div>
            <InfoRow label="Custo unitário">
              <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(produto.custo)}</span>
            </InfoRow>
            <InfoRow label="Preço sugerido">
              <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(produto.precoSugerido)}</span>
            </InfoRow>
            <InfoRow label="Margem">
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: margemColor }}>
                {produto.margem.toFixed(1)}%
              </span>
            </InfoRow>
            <InfoRow label="Tempo de produção">
              {produto.tempoProducao} min
            </InfoRow>
          </div>

          {/* Receita */}
          {produto.receita.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-tertiary)",
                  marginBottom: 6,
                }}
              >
                Receita ({produto.receita.length} insumo{produto.receita.length !== 1 ? "s" : ""})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {produto.receita.map((r) => {
                  const ins = insumos.find((i) => i.id === r.insumoId);
                  return (
                    <div
                      key={r.insumoId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 12,
                        padding: "5px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span>{ins?.nome ?? r.insumoId}</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: 11 }}>
                        {r.quantidade} {ins?.unidade ?? ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ArquivosPedido ────────────────────────────────────────────
function ArquivosPedido({
  arquivos,
  onChange,
}: {
  arquivos: LinkUtil[];
  onChange: (a: LinkUtil[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!url.trim()) return;
    onChange([...arquivos, { label: label.trim() || url.trim(), url: url.trim() }]);
    setLabel("");
    setUrl("");
  };

  const remove = (idx: number) => onChange(arquivos.filter((_, i) => i !== idx));

  return (
    <div className="atlas-card">
      <div className="atlas-card-header">
        <span className="atlas-panel-title">Arquivos do pedido</span>
      </div>
      <div className="atlas-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {arquivos.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic", margin: 0 }}>
            Nenhum arquivo adicionado.
          </p>
        )}

        {arquivos.map((arq, i) => {
          const ext = getFileExt(arq.url, arq.label);
          const colors = EXT_COLORS[ext] ?? { bg: "var(--bg-raised)", color: "var(--text-secondary)" };
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Type icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-sm)",
                  background: colors.bg,
                  color: colors.color,
                  fontSize: 8,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  letterSpacing: -0.3,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {ext.slice(0, 3)}
              </div>

              {/* Label */}
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--text-secondary)",
                }}
              >
                {arq.label}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <a
                  href={arq.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visualizar"
                  className="atlas-btn-icon"
                  style={{ width: 26, height: 26, color: "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Eye size={13} strokeWidth={1.5} />
                </a>
                <button
                  onClick={() => remove(i)}
                  className="atlas-btn-icon"
                  title="Remover"
                  style={{ width: 26, height: 26, color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--status-error)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")
                  }
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: arquivos.length > 0 ? "1px solid var(--border-subtle)" : undefined, paddingTop: arquivos.length > 0 ? 8 : 0 }}>
          <input
            className="atlas-input"
            placeholder="Nome do arquivo"
            style={{ fontSize: 12 }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="atlas-input"
              placeholder="https://..."
              style={{ flex: 1, fontSize: 12 }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button
              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}
              onClick={add}
              disabled={!url.trim()}
            >
              <Plus size={12} strokeWidth={1.5} />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PainelPagamento ───────────────────────────────────────────
interface Pagamento {
  id: string;
  valor: number;
  data: string;
  forma: "pix" | "dinheiro" | "cartao" | "outro";
  observacao?: string;
}

const FORMA_PAG_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  outro: "Outro",
};

function loadPagamentosEnc(encId: string): Pagamento[] {
  if (typeof window === "undefined") return [];
  try {
    const all = localStorage.getItem("almanac_pagamentos");
    if (!all) return [];
    return JSON.parse(all)[encId] ?? [];
  } catch { return []; }
}

function savePagamentosEnc(encId: string, pags: Pagamento[]) {
  if (typeof window === "undefined") return;
  try {
    const all = localStorage.getItem("almanac_pagamentos");
    const parsed = all ? JSON.parse(all) : {};
    parsed[encId] = pags;
    localStorage.setItem("almanac_pagamentos", JSON.stringify(parsed));
  } catch {}
}

function PainelPagamento({
  encId,
  totalCobrado,
}: {
  encId: string;
  totalCobrado: number;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [estornoId, setEstornoId] = useState<string | null>(null);
  const [estornoMotivo, setEstornoMotivo] = useState("");

  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(hoje);
  const [fForma, setFForma] = useState<"pix" | "dinheiro" | "cartao" | "outro">("pix");
  const [fObs, setFObs] = useState("");

  useEffect(() => {
    setPagamentos(loadPagamentosEnc(encId));
  }, [encId]);

  function persist(pags: Pagamento[]) {
    setPagamentos(pags);
    savePagamentosEnc(encId, pags);
  }

  function handleAdd() {
    const valor = parseFloat(fValor);
    if (!valor || valor <= 0) return;
    persist([
      ...pagamentos,
      {
        id: `pag-${Date.now()}`,
        valor,
        data: fData,
        forma: fForma,
        observacao: fObs.trim() || undefined,
      },
    ]);
    setShowForm(false);
    setFValor("");
    setFObs("");
    setFData(hoje);
    setFForma("pix");
  }

  function handleEstorno(id: string) {
    const orig = pagamentos.find((p) => p.id === id);
    if (!orig) return;
    persist([
      ...pagamentos,
      {
        id: `est-${Date.now()}`,
        valor: -Math.abs(orig.valor),
        data: hoje,
        forma: orig.forma,
        observacao: `Estorno: ${estornoMotivo.trim() || "sem motivo"}`,
      },
    ]);
    setEstornoId(null);
    setEstornoMotivo("");
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
    paga_maior:    { label: "Paga a maior", bg: "rgba(124,111,239,0.12)", color: "var(--accent-primary, #7c6fef)" },
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

        {/* Totals */}
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
                color: saldo > 0 ? "var(--status-warning)" : "var(--accent-primary, #7c6fef)",
              }}
            >
              {formatBRL(Math.abs(saldo))}
            </span>
          </InfoRow>
        )}

        {/* List of payments */}
        {pagamentos.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {pagamentos.map((p) => {
              const isNeg = p.valor < 0;
              const isEstornando = estornoId === p.id;

              if (isEstornando) {
                return (
                  <div key={p.id} style={{ padding: "6px 0", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                      Motivo do estorno:
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        autoFocus
                        className="atlas-input"
                        style={{ flex: 1, fontSize: 11, height: 26 }}
                        placeholder="Ex: cliente desistiu"
                        value={estornoMotivo}
                        onChange={(e) => setEstornoMotivo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEstorno(p.id);
                          if (e.key === "Escape") setEstornoId(null);
                        }}
                      />
                      <button
                        className="atlas-btn atlas-btn-sm"
                        style={{ background: "var(--status-error)", color: "#fff", border: "none", fontSize: 11 }}
                        onClick={() => handleEstorno(p.id)}
                      >
                        Confirmar
                      </button>
                      <button
                        className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                        onClick={() => { setEstornoId(null); setEstornoMotivo(""); }}
                      >
                        Cancelar
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
                      {formatDate(p.data)} · {FORMA_PAG_LABEL[p.forma]}
                    </div>
                    {p.observacao && (
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                        {p.observacao}
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
                    {!isNeg && (
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
                        onClick={() => setEstornoId(p.id)}
                      >
                        estornar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add form or register button */}
        {showForm ? (
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
                value={fForma}
                onChange={(e) => setFForma(e.target.value as typeof fForma)}
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="outro">Outro</option>
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

// ── TimelinePedido ────────────────────────────────────────────
function TimelinePedido({
  status,
  dataPedido,
}: {
  status: EncomendaStatus;
  dataPedido: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const eventos = deriveTimeline(status, dataPedido);
  const shown = expanded ? eventos : eventos.slice(0, 4);

  return (
    <div className="atlas-card">
      <div className="atlas-card-header">
        <span className="atlas-panel-title">Timeline do pedido</span>
      </div>
      <div
        className="atlas-card-body"
        style={{ display: "flex", flexDirection: "column", gap: 0, padding: "10px 12px" }}
      >
        {shown.map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              paddingBottom: i < shown.length - 1 ? 14 : 0,
              position: "relative",
            }}
          >
            {/* Connector line */}
            {i < shown.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 9,
                  top: 20,
                  width: 1,
                  bottom: 0,
                  background: "var(--border-default)",
                }}
              />
            )}

            {/* Icon */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                background: e.concluido
                  ? "var(--status-success)"
                  : e.isCurrent
                  ? "var(--status-warning)"
                  : "var(--bg-input)",
                border: `1px solid ${
                  e.concluido
                    ? "var(--status-success)"
                    : e.isCurrent
                    ? "var(--status-warning)"
                    : "var(--border-default)"
                }`,
              }}
            >
              {e.concluido ? (
                <Check size={10} strokeWidth={2.5} style={{ color: "#fff" }} />
              ) : (
                <Clock
                  size={10}
                  strokeWidth={1.5}
                  style={{
                    color: e.isCurrent ? "var(--status-warning)" : "var(--text-tertiary)",
                  }}
                />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: e.isCurrent ? 600 : 500,
                  color: "var(--text-primary)",
                }}
              >
                {e.evento}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                {e.data}
              </div>
            </div>
          </div>
        ))}

        {eventos.length > 4 && (
          <button
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{ marginTop: 10, fontSize: 11, alignSelf: "flex-start" }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? "Ver menos"
              : `Ver todas as atualizações (${eventos.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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

// ── Page ──────────────────────────────────────────────────────
export default function EncomendaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const encBase = encomendasMock.find((e) => e.id === id);

  const [status, setStatus] = useState<EncomendaStatus>(
    encBase?.status ?? "aguardando"
  );
  const tipo: EncomendaTipo = encBase?.tipo ?? "sob_encomenda";
  const storedFotos: Record<string, string> =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("almanac_enc_fotos") ?? "{}")
      : {};
  const encId = encBase?.id ?? "";
  const [foto, setFoto] = useState<string | null>(
    storedFotos[encId] ?? encBase?.foto ?? null
  );

  const handleFotoChange = (src: string | null) => {
    setFoto(src);
    if (!encId) return;
    const fotos: Record<string, string> = JSON.parse(
      localStorage.getItem("almanac_enc_fotos") ?? "{}"
    );
    if (src) fotos[encId] = src;
    else delete fotos[encId];
    localStorage.setItem("almanac_enc_fotos", JSON.stringify(fotos));
  };
  const [arquivos, setArquivos] = useState<LinkUtil[]>(
    encBase?.linksUteis ?? []
  );
  const [itens, setItens] = useState<EncomendaItem[]>(encBase?.itens ?? []);
  const [observacoes, setObservacoes] = useState(encBase?.observacoes ?? "");
  const [observacoesInternas, setObservacoesInternas] = useState(
    encBase?.observacoesInternas ?? ""
  );
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [produtoModal, setProdutoModal] = useState<Produto | null>(null);
  const [avisoEntrega, setAvisoEntrega] = useState<string | null>(null);

  if (!encBase) {
    return (
      <div className="alm-page">
        <div className="alm-page-header">
          <div>
            <p style={{ color: "var(--text-tertiary)" }}>Encomenda não encontrada.</p>
            <Link href="/encomendas" className="atlas-link">← Voltar</Link>
          </div>
        </div>
      </div>
    );
  }

  const orderNumber = formatOrderNumber(encBase.id);

  // Recalculate financials from current items
  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
  const desconto = encBase.desconto ?? 0;
  const totalCobrado = Math.max(subtotal - desconto, 0);
  const custoProducao = itens.reduce((s, i) => {
    const prod = produtos.find((p) => p.id === i.produtoId);
    return s + (prod?.custo ?? 0) * i.quantidade;
  }, 0);
  const margem =
    totalCobrado > 0 ? ((totalCobrado - custoProducao) / totalCobrado) * 100 : 0;
  const margemColor =
    margem >= 60
      ? "var(--status-success)"
      : margem >= 30
      ? "var(--status-warning)"
      : "var(--status-error)";

  const isLate =
    status !== "entregue" &&
    status !== "cancelado" &&
    new Date(`${encBase.dataEntrega}T00:00:00`) < new Date();

  const daysLabel = getDaysLabel(encBase.dataEntrega, status);
  const nextStatus = NEXT_STATUS[status];
  const nextLabel = NEXT_LABEL[status];

  const canalIcon =
    encBase.canal === "whatsapp" ? (
      <MessageCircle size={12} strokeWidth={1.5} />
    ) : (
      <Users size={12} strokeWidth={1.5} />
    );
  const canalLabel = encBase.canal === "whatsapp" ? "WhatsApp" : "Presencial";

  return (
    <div className="alm-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Row 1: back + actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/encomendas"
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--text-secondary)",
            }}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Voltar para encomendas
          </Link>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {confirmCancel ? (
              <>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Cancelar pedido?
                </span>
                <button
                  className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                  onClick={() => setConfirmCancel(false)}
                >
                  Não
                </button>
                <button
                  className="atlas-btn atlas-btn-sm"
                  style={{
                    background: "var(--status-error)",
                    color: "#fff",
                    border: "none",
                  }}
                  onClick={() => {
                    setStatus("cancelado");
                    setConfirmCancel(false);
                  }}
                >
                  Sim, cancelar
                </button>
              </>
            ) : (
              <>
                {status !== "entregue" && status !== "cancelado" && (
                  <button
                    className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                    style={{ color: "var(--status-error)" }}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancelar pedido
                  </button>
                )}
                {nextStatus && (
                  <button
                    className="atlas-btn atlas-btn-primary atlas-btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                    onClick={() => {
                      if (nextStatus === "entregue" && tipo === "pronta_entrega") {
                        const insuficientes = itens.filter((item) => {
                          const prod = produtos.find((p) => p.id === item.produtoId);
                          return prod?.prontoEstoque !== undefined && item.quantidade > (prod.prontoEstoque ?? 0);
                        });
                        if (insuficientes.length > 0) {
                          const nomes = insuficientes
                            .map((i) => produtos.find((p) => p.id === i.produtoId)?.nome ?? i.produtoId)
                            .join(", ");
                          setAvisoEntrega(`Estoque insuficiente: ${nomes}. Prosseguir mesmo assim?`);
                          return;
                        }
                      }
                      setStatus(nextStatus);
                    }}
                  >
                    {nextLabel}
                    <ChevronRight size={13} strokeWidth={1.5} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Row 2: order number + client */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Pedido {orderNumber}
          </h1>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginTop: 3,
              fontSize: 14,
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {canalIcon}
            {encBase.cliente}
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
              · {canalLabel}
            </span>
          </div>
        </div>

        {/* Row 3: info bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span className={statusBadge[status]}>{statusLabels[status]}</span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background:
                tipo === "pronta_entrega"
                  ? "rgba(72,199,142,0.1)"
                  : "var(--bg-raised)",
              color:
                tipo === "pronta_entrega"
                  ? "var(--status-success)"
                  : "var(--text-tertiary)",
              border: `1px solid ${tipo === "pronta_entrega" ? "rgba(72,199,142,0.25)" : "var(--border-default)"}`,
            }}
          >
            {tipo === "pronta_entrega" ? (
              <PackageCheck size={11} strokeWidth={1.5} />
            ) : (
              <Package size={11} strokeWidth={1.5} />
            )}
            {tipo === "pronta_entrega" ? "Pronta entrega" : "Sob encomenda"}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--text-tertiary)",
            }}
          >
            <Calendar size={11} strokeWidth={1.5} />
            Pedido em {formatDate(encBase.dataPedido)}
          </span>

          <span style={{ color: "var(--border-strong)", fontSize: 12 }}>·</span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: isLate ? "var(--status-error)" : "var(--text-tertiary)",
            }}
          >
            <Calendar size={11} strokeWidth={1.5} />
            Entrega {formatDate(encBase.dataEntrega)}
            {daysLabel && (
              <span
                style={{
                  background: isLate ? "var(--status-error-muted)" : "var(--bg-raised)",
                  border: `1px solid ${isLate ? "rgba(244,71,71,0.25)" : "var(--border-default)"}`,
                  color: isLate ? "var(--status-error)" : "var(--text-tertiary)",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  letterSpacing: "0.02em",
                }}
              >
                {daysLabel}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Coluna principal — operacional */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tabela de produtos */}
          <TabelaProdutos
            itens={itens}
            onChange={setItens}
            onPreview={(src, alt) => setLightbox({ src, alt })}
            onProdutoClick={(prod) => setProdutoModal(prod)}
          />

          {/* Pagamento */}
          <PainelPagamento encId={encBase.id} totalCobrado={totalCobrado} />

          {/* Observações */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ObservacoesCard
              title="Observações do cliente"
              value={observacoes}
              onChange={setObservacoes}
              placeholder="Nenhuma observação do cliente."
            />
            <ObservacoesCard
              title="Observações internas"
              value={observacoesInternas}
              onChange={setObservacoesInternas}
              placeholder="Nenhuma anotação interna."
            />
          </div>

          {/* Timeline */}
          <TimelinePedido status={status} dataPedido={encBase.dataPedido} />
        </div>

        {/* Sidebar — referência e visual */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Informações */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Informações</span>
            </div>
            <div className="atlas-card-body" style={{ padding: "8px 12px 12px" }}>
              <InfoRow label="Canal">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {canalIcon}
                  {canalLabel}
                </span>
              </InfoRow>
              <InfoRow label="Tipo">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {tipo === "pronta_entrega" ? (
                    <PackageCheck size={11} strokeWidth={1.5} style={{ color: "var(--status-success)" }} />
                  ) : (
                    <Package size={11} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
                  )}
                  {tipo === "pronta_entrega" ? "Pronta entrega" : "Sob encomenda"}
                </span>
              </InfoRow>
              <InfoRow label="Pedido em">{formatDate(encBase.dataPedido)}</InfoRow>
              <InfoRow label="Entrega prevista">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    color: isLate ? "var(--status-error)" : undefined,
                  }}
                >
                  <Calendar size={11} strokeWidth={1.5} />
                  {formatDate(encBase.dataEntrega)}
                </span>
              </InfoRow>
              <InfoRow label="Código do pedido">
                <span style={{ fontFamily: "var(--font-mono)" }}>{orderNumber}</span>
              </InfoRow>
            </div>
          </div>

          {/* Financeiro */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Financeiro</span>
            </div>
            <div className="atlas-card-body" style={{ padding: "8px 12px 12px" }}>
              <InfoRow label="Subtotal bruto">
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatBRL(subtotal)}
                </span>
              </InfoRow>
              {desconto > 0 && (
                <InfoRow label="Desconto">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--status-error)",
                    }}
                  >
                    − {formatBRL(desconto)}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Total cobrado">
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {formatBRL(totalCobrado)}
                </span>
              </InfoRow>
              <InfoRow label="Custo produção">
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatBRL(custoProducao)}
                </span>
              </InfoRow>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Margem
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: margemColor,
                  }}
                >
                  {margem.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Visual do pedido */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Visual do pedido</span>
            </div>
            <div className="atlas-card-body" style={{ padding: "12px" }}>
              <VisualGaleria
                foto={foto}
                onFotoChange={handleFotoChange}
                itens={itens}
                onPreview={(src, alt) => setLightbox({ src, alt })}
              />
            </div>
          </div>

          {/* Arquivos */}
          <ArquivosPedido arquivos={arquivos} onChange={setArquivos} />
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Modal detalhe produto */}
      {produtoModal && (
        <ProdutoDetalheModal
          produto={produtoModal}
          onClose={() => setProdutoModal(null)}
        />
      )}

      {/* Aviso estoque insuficiente (pronta entrega) */}
      {avisoEntrega && (
        <div
          onClick={() => setAvisoEntrega(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "var(--z-modal)" as unknown as number,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              width: 380,
              maxWidth: "calc(100vw - 32px)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <PackageCheck size={18} strokeWidth={1.5} style={{ color: "var(--status-warning)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Estoque de prontos insuficiente
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {avisoEntrega}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                onClick={() => setAvisoEntrega(null)}
              >
                Cancelar
              </button>
              <button
                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                onClick={() => {
                  setStatus("entregue");
                  setAvisoEntrega(null);
                }}
              >
                Confirmar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
