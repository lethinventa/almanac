"use client";

import { useState, useRef } from "react";
import {
  Plus, Trash2, Package, ImagePlus, Link2, FileText,
} from "lucide-react";
import { formatBRL } from "@/lib/data";
import type { Produto } from "@/lib/repositories/produtos";
import type { EncomendaInput } from "@/lib/repositories/encomendas";

interface ItemRow {
  produtoId: string;
  quantidade: string;
  precoUnitario: string;
}

interface LinkUtil {
  label: string;
  url: string;
}

function FotoUploadSmall({ value, onChange }: { value: string | null; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onChange(URL.createObjectURL(f));
  };
  return (
    <div className="alm-upload" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
      {value ? (
        <img src={value} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4 }} />
      ) : (
        <>
          <ImagePlus size={18} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
          <span className="alm-upload-label">Foto de referência (opcional)</span>
          <span className="alm-upload-hint">PNG, JPG — para referência rápida</span>
        </>
      )}
    </div>
  );
}

export function NovaEncomendaForm({
  onSave,
  onClose,
  produtos,
}: {
  onSave: (enc: EncomendaInput) => void;
  onClose: () => void;
  produtos: Produto[];
}) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [foto, setFoto] = useState<string | null>(null);
  const [cliente, setCliente] = useState("");
  const [canal, setCanal] = useState<"whatsapp" | "presencial">("whatsapp");
  const [dataEntrega, setDataEntrega] = useState("");
  const [itens, setItens] = useState<ItemRow[]>(
    produtos.length > 0
      ? [{ produtoId: produtos[0].id, quantidade: "1", precoUnitario: String(produtos[0].precoSugerido) }]
      : []
  );
  const [desconto, setDesconto] = useState("0");
  const [links, setLinks] = useState<LinkUtil[]>([]);
  const [novoLinkLabel, setNovoLinkLabel] = useState("");
  const [novoLinkUrl, setNovoLinkUrl] = useState("");
  const [obs, setObs] = useState("");

  const subtotal = itens.reduce((s, r) => s + (parseFloat(r.quantidade) || 0) * (parseFloat(r.precoUnitario) || 0), 0);
  const descontoNum = parseFloat(desconto) || 0;
  const total = Math.max(subtotal - descontoNum, 0);
  const custo = itens.reduce((s, r) => {
    const prod = produtos.find((p) => p.id === r.produtoId);
    return s + (prod?.custo ?? 0) * (parseFloat(r.quantidade) || 0);
  }, 0);
  const margem = total > 0 ? ((total - custo) / total) * 100 : 0;
  const margemColor = margem >= 60 ? "var(--status-success)" : margem >= 30 ? "var(--status-warning)" : "var(--status-error)";

  const addItem = () =>
    setItens((prev) => [
      ...prev,
      { produtoId: produtos[0]?.id ?? "", quantidade: "1", precoUnitario: String(produtos[0]?.precoSugerido ?? 0) },
    ]);

  const removeItem = (idx: number) =>
    setItens((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ItemRow, value: string) =>
    setItens((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (field === "produtoId") {
          const prod = produtos.find((p) => p.id === value);
          return { ...r, produtoId: value, precoUnitario: prod ? String(prod.precoSugerido) : r.precoUnitario };
        }
        return { ...r, [field]: value };
      })
    );

  const addLink = () => {
    if (!novoLinkUrl.trim()) return;
    setLinks((prev) => [...prev, { label: novoLinkLabel.trim() || novoLinkUrl.trim(), url: novoLinkUrl.trim() }]);
    setNovoLinkLabel("");
    setNovoLinkUrl("");
  };

  const canSave = cliente.trim().length > 0 && dataEntrega && itens.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      cliente: cliente.trim(),
      canal,
      status: "aguardando",
      dataPedido: hoje,
      dataEntrega,
      itens: itens.map((r) => ({
        produtoId: r.produtoId,
        quantidade: parseFloat(r.quantidade) || 1,
        precoUnitario: parseFloat(r.precoUnitario) || 0,
      })),
      desconto: descontoNum,
      totalCobrado: total,
      custoProducao: custo,
      margem,
      observacoes: obs.trim() || undefined,
      foto: foto ?? undefined,
    });
  };

  return (
    <>
      <FotoUploadSmall value={foto} onChange={setFoto} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
        <div className="alm-field">
          <label className="alm-label">Cliente</label>
          <input className="atlas-input" placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </div>
        <div className="alm-field">
          <label className="alm-label">Canal</label>
          <select className="alm-select" style={{ height: 32 }} value={canal} onChange={(e) => setCanal(e.target.value as "whatsapp" | "presencial")}>
            <option value="whatsapp">WhatsApp</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>
      </div>

      <div className="alm-field" style={{ maxWidth: 200 }}>
        <label className="alm-label">Data de entrega</label>
        <input className="atlas-input" type="date" min={hoje} value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
      </div>

      <div className="alm-field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label className="alm-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Package size={11} strokeWidth={1.5} />
            Itens do pedido
          </label>
          <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }} onClick={addItem}>
            <Plus size={11} strokeWidth={1.5} />Adicionar
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {itens.map((row, idx) => {
            const q = parseFloat(row.quantidade) || 0;
            const p = parseFloat(row.precoUnitario) || 0;
            const sub = q * p;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 64px 88px 72px 24px", gap: 6, alignItems: "center" }}>
                <select className="alm-select" style={{ height: 32, fontSize: 12 }} value={row.produtoId} onChange={(e) => updateItem(idx, "produtoId", e.target.value)}>
                  {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <input className="atlas-input" type="number" min="1" placeholder="Qtd" style={{ fontSize: 12 }} value={row.quantidade} onChange={(e) => updateItem(idx, "quantidade", e.target.value)} />
                <input className="atlas-input" type="number" min="0" step="0.01" placeholder="R$ unit." style={{ fontSize: 12 }} value={row.precoUnitario} onChange={(e) => updateItem(idx, "precoUnitario", e.target.value)} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: sub > 0 ? "var(--text-primary)" : "var(--text-tertiary)", textAlign: "right", paddingRight: 4 }}>
                  {sub > 0 ? formatBRL(sub) : "—"}
                </span>
                <button type="button" onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="alm-field" style={{ maxWidth: 200 }}>
        <label className="alm-label">Desconto (R$)</label>
        <input className="atlas-input" type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
      </div>

      {subtotal > 0 && (
        <div style={{ background: "var(--bg-input)", borderRadius: "var(--radius-md, 4px)", border: "1px solid var(--border-default)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)" }}>
            <span>Subtotal</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(subtotal)}</span>
          </div>
          {descontoNum > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--status-error)" }}>
              <span>Desconto</span><span style={{ fontFamily: "var(--font-mono)" }}>− {formatBRL(descontoNum)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid var(--border-default)", paddingTop: 6 }}>
            <span>Total</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
            <span>Margem estimada</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: margemColor }}>{margem.toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div className="alm-field">
        <label className="alm-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <Link2 size={11} strokeWidth={1.5} />Links úteis (opcional)
        </label>
        {links.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <FileText size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, color: "var(--accent-highlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</span>
            <button onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, display: "flex" }}>
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          <input className="atlas-input" placeholder="Rótulo (ex: Drive identidade)" style={{ flex: 1, fontSize: 12 }} value={novoLinkLabel} onChange={(e) => setNovoLinkLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} />
          <input className="atlas-input" placeholder="https://..." style={{ flex: 1, fontSize: 12 }} value={novoLinkUrl} onChange={(e) => setNovoLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} />
          <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }} onClick={addLink} disabled={!novoLinkUrl.trim()}>
            <Plus size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="alm-field">
        <label className="alm-label">Observações (opcional)</label>
        <textarea className="atlas-input" rows={2} placeholder="Instruções especiais, referências, etc." style={{ resize: "vertical", padding: "6px 8px", lineHeight: 1.5 }} value={obs} onChange={(e) => setObs(e.target.value)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border-default)", marginTop: 4 }}>
        <button type="button" className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
        <button type="button" className="atlas-btn atlas-btn-primary atlas-btn-sm" disabled={!canSave} style={{ opacity: canSave ? 1 : 0.4 }} onClick={handleSave}>
          Criar encomenda
        </button>
      </div>
    </>
  );
}
