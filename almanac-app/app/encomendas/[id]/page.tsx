"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  ExternalLink,
  Plus,
  Trash2,
  MessageCircle,
  Users,
  Calendar,
  ChevronRight,
  Link2,
  FileText,
} from "lucide-react";
import {
  encomendas as encomendasMock,
  produtos,
  formatBRL,
  formatDate,
  statusLabels,
  statusBadge,
  EncomendaStatus,
  LinkUtil,
} from "@/lib/data";

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

const STATUS_COLOR: Record<EncomendaStatus, string> = {
  aguardando: "var(--text-tertiary)",
  em_producao: "var(--status-warning)",
  pronto: "var(--accent-highlight)",
  entregue: "var(--status-success)",
  cancelado: "var(--status-error)",
};

// ── Foto hero ────────────────────────────────────────────────
function FotoHero({
  src,
  onChange,
}: {
  src: string | null;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onChange(URL.createObjectURL(f));
  };

  if (src) {
    return (
      <div style={{ position: "relative" }}>
        <img
          src={src}
          alt="Visualização final"
          style={{
            width: "100%",
            aspectRatio: "16/7",
            objectFit: "cover",
            borderRadius: "var(--radius-lg, 6px)",
            display: "block",
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "var(--radius-md, 4px)",
            color: "#fff",
            fontSize: 11,
            padding: "4px 10px",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          Trocar foto
        </button>
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

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        width: "100%",
        aspectRatio: "16/7",
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius-lg, 6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        background: "var(--bg-input)",
        transition: "background-color 120ms ease, border-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "var(--bg-hover)";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--accent-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "var(--bg-input)";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--border-strong)";
      }}
    >
      <ImagePlus
        size={24}
        strokeWidth={1.5}
        style={{ color: "var(--text-tertiary)" }}
      />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
          Adicionar foto principal
        </div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
          Visualização final gerada por IA — PNG, JPG até 10 MB
        </div>
      </div>
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

// ── Links úteis ──────────────────────────────────────────────
function LinksUteis({
  links,
  onChange,
}: {
  links: LinkUtil[];
  onChange: (links: LinkUtil[]) => void;
}) {
  const [novoLabel, setNovoLabel] = useState("");
  const [novoUrl, setNovoUrl] = useState("");

  const add = () => {
    if (!novoUrl.trim()) return;
    onChange([
      ...links,
      { label: novoLabel.trim() || novoUrl.trim(), url: novoUrl.trim() },
    ]);
    setNovoLabel("");
    setNovoUrl("");
  };

  const remove = (idx: number) =>
    onChange(links.filter((_, i) => i !== idx));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {links.length === 0 && (
        <div
          style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic" }}
        >
          Nenhum link adicionado ainda.
        </div>
      )}
      {links.map((l, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <FileText
            size={13}
            strokeWidth={1.5}
            style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
          />
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: "var(--accent-highlight)",
              textDecoration: "none",
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {l.label}
            <ExternalLink size={10} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          </a>
          <button
            onClick={() => remove(i)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        </div>
      ))}

      {/* Add form */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          className="atlas-input"
          placeholder="Rótulo (ex: Drive identidade visual)"
          style={{ flex: 1, fontSize: 12 }}
          value={novoLabel}
          onChange={(e) => setNovoLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <input
          className="atlas-input"
          placeholder="https://..."
          style={{ flex: 1, fontSize: 12 }}
          value={novoUrl}
          onChange={(e) => setNovoUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          className="atlas-btn atlas-btn-secondary atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}
          onClick={add}
          disabled={!novoUrl.trim()}
        >
          <Plus size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

// ── Info row ─────────────────────────────────────────────────
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
        borderBottom: "1px solid var(--border-default)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{children}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function EncomendaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const encBase = encomendasMock.find((e) => e.id === id);

  const [status, setStatus] = useState<EncomendaStatus>(
    encBase?.status ?? "aguardando"
  );
  const [foto, setFoto] = useState<string | null>(encBase?.foto ?? null);
  const [links, setLinks] = useState<LinkUtil[]>(encBase?.linksUteis ?? []);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!encBase) {
    return (
      <div className="alm-page">
        <div className="alm-page-header">
          <div>
            <p style={{ color: "var(--text-tertiary)" }}>
              Encomenda não encontrada.
            </p>
            <Link href="/encomendas" className="atlas-link">
              ← Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enc = { ...encBase, status };

  const margemColor =
    enc.margem >= 60
      ? "var(--status-success)"
      : enc.margem >= 30
      ? "var(--status-warning)"
      : "var(--status-error)";

  const isLate =
    enc.status !== "entregue" &&
    enc.status !== "cancelado" &&
    new Date(enc.dataEntrega) < new Date();

  const nextStatus = NEXT_STATUS[enc.status];
  const nextLabel = NEXT_LABEL[enc.status];

  return (
    <div className="alm-page">
      {/* Header */}
      <div className="alm-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/encomendas"
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="alm-page-title" style={{ marginBottom: 2 }}>
              {enc.cliente}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={statusBadge[enc.status]}>
                {statusLabels[enc.status]}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                }}
              >
                {enc.canal === "whatsapp" ? (
                  <MessageCircle size={11} strokeWidth={1.5} />
                ) : (
                  <Users size={11} strokeWidth={1.5} />
                )}
                {enc.canal === "whatsapp" ? "WhatsApp" : "Presencial"}
              </span>
              {isLate && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--status-error)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  · Entrega atrasada
                </span>
              )}
            </div>
          </div>
        </div>

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
                style={{ background: "var(--status-error)", color: "#fff", border: "none" }}
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
              {enc.status !== "entregue" && enc.status !== "cancelado" && (
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
                  onClick={() => setStatus(nextStatus)}
                >
                  {nextLabel}
                  <ChevronRight size={13} strokeWidth={1.5} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Coluna principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Foto principal */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Visualização final</span>
            </div>
            <div className="atlas-card-body">
              <FotoHero src={foto} onChange={setFoto} />
            </div>
          </div>

          {/* Itens do pedido */}
          <div className="atlas-card" style={{ padding: 0 }}>
            <div
              className="atlas-card-header"
              style={{ padding: "0 16px", height: 40, display: "flex", alignItems: "center" }}
            >
              <span className="atlas-panel-title">Itens do pedido</span>
            </div>
            <table className="atlas-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }} />
                  <th>Produto</th>
                  <th className="num">Qtd</th>
                  <th className="num">Unitário</th>
                  <th className="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {enc.itens.map((item, i) => {
                  const prod = produtos.find((p) => p.id === item.produtoId);
                  return (
                    <tr key={i} style={{ cursor: "default" }}>
                      <td style={{ padding: "0 8px 0 12px" }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-default)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {prod?.foto ? (
                            <img
                              src={prod.foto}
                              alt={prod.nome}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                            />
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--text-tertiary)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {prod?.nome ?? item.produtoId}
                      </td>
                      <td
                        className="num"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                      >
                        {item.quantidade}
                      </td>
                      <td
                        className="num"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", fontSize: 11 }}
                      >
                        {formatBRL(item.precoUnitario)}
                      </td>
                      <td
                        className="num"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatBRL(item.quantidade * item.precoUnitario)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Observações */}
          {enc.observacoes && (
            <div className="atlas-card">
              <div className="atlas-card-header">
                <span className="atlas-panel-title">Observações</span>
              </div>
              <div className="atlas-card-body">
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {enc.observacoes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Informações */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Informações</span>
            </div>
            <div className="atlas-card-body" style={{ padding: "8px 16px 12px" }}>
              <InfoRow label="Canal">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {enc.canal === "whatsapp" ? (
                    <MessageCircle size={11} strokeWidth={1.5} />
                  ) : (
                    <Users size={11} strokeWidth={1.5} />
                  )}
                  {enc.canal === "whatsapp" ? "WhatsApp" : "Presencial"}
                </span>
              </InfoRow>
              <InfoRow label="Pedido em">
                {formatDate(enc.dataPedido)}
              </InfoRow>
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
                  {formatDate(enc.dataEntrega)}
                </span>
              </InfoRow>
            </div>
          </div>

          {/* Financeiro */}
          <div className="atlas-card">
            <div className="atlas-card-header">
              <span className="atlas-panel-title">Financeiro</span>
            </div>
            <div className="atlas-card-body" style={{ padding: "8px 16px 12px" }}>
              <InfoRow label="Subtotal bruto">
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatBRL(
                    enc.itens.reduce(
                      (s, i) => s + i.quantidade * i.precoUnitario,
                      0
                    )
                  )}
                </span>
              </InfoRow>
              {enc.desconto > 0 && (
                <InfoRow label="Desconto">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--status-error)",
                    }}
                  >
                    − {formatBRL(enc.desconto)}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Total cobrado">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                  }}
                >
                  {formatBRL(enc.totalCobrado)}
                </span>
              </InfoRow>
              <InfoRow label="Custo produção">
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatBRL(enc.custoProducao)}
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
                  style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}
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
                  {enc.margem.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Links úteis */}
          <div className="atlas-card">
            <div
              className="atlas-card-header"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Link2 size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
              <span className="atlas-panel-title">Links úteis</span>
            </div>
            <div className="atlas-card-body">
              <LinksUteis links={links} onChange={setLinks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
