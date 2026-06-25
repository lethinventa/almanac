"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  X,
  Plus,
  Trash2,
  ImagePlus,
  Clock,
  ChefHat,
  Search,
  LayoutGrid,
  LayoutList,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import {
  produtos as produtosMock,
  insumos,
  formatBRL,
  Produto,
} from "@/lib/data";

type ModalMode = "detalhe" | "novo" | "editar" | null;

interface ReceitaRow {
  insumoId: string;
  quantidade: string;
}

const CATEGORIAS = [
  "Chaveiro",
  "Adesivo",
  "Tag",
  "Cartão",
  "Planner",
  "Kit",
  "Outro",
];
const INSUMOS_ROTATIVO = insumos.filter(
  (i) => i.categoria === "visivel" || i.categoria === "invisivel"
);

// ── Modal wrapper ────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  wide,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
        {footer && <div className="alm-modal-footer">{footer}</div>}
      </div>
    </>
  );
}

// ── Photo upload ─────────────────────────────────────────────
function FotoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="alm-upload" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
      {preview ? (
        <img
          src={preview}
          alt="preview"
          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }}
        />
      ) : (
        <>
          <ImagePlus
            size={20}
            strokeWidth={1.5}
            style={{ color: "var(--text-tertiary)" }}
          />
          <span className="alm-upload-label">Adicionar foto do produto</span>
          <span className="alm-upload-hint">PNG, JPG até 2 MB</span>
        </>
      )}
    </div>
  );
}

// ── Margem bar ───────────────────────────────────────────────
function MargemBar({ margem }: { margem: number }) {
  const color =
    margem >= 70
      ? "var(--status-success)"
      : margem >= 40
      ? "var(--status-warning)"
      : "var(--status-error)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 9999,
          background: "var(--bg-input)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(Math.max(margem, 0), 100)}%`,
            height: "100%",
            background: color,
            borderRadius: 9999,
            transition: "width 400ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 700,
          color,
          width: 44,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {margem.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Detalhe content ──────────────────────────────────────────
function DetalheContent({ produto }: { produto: Produto }) {
  const receitaComInsumo = produto.receita.map((r) => ({
    ...r,
    insumo: insumos.find((i) => i.id === r.insumoId)!,
  }));

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          className="alm-photo-preview"
          style={{
            width: 72,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box size={28} strokeWidth={1} style={{ color: "var(--text-tertiary)" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{produto.nome}</div>
          <span className="atlas-badge">{produto.categoria}</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Clock size={11} strokeWidth={1.5} />
            {produto.tempoProducao} min de produção
          </span>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 2,
            }}
          >
            Preço sugerido
          </div>
          <div
            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20 }}
          >
            {formatBRL(produto.precoSugerido)}
          </div>
        </div>
      </div>

      <div>
        <div className="alm-label" style={{ marginBottom: 6 }}>
          Margem de contribuição
        </div>
        <MargemBar margem={produto.margem} />
      </div>

      <div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
        >
          <ChefHat size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
          <span className="alm-label">Receita de produção</span>
        </div>
        <table className="atlas-table" style={{ width: "100%", border: 0 }}>
          <thead>
            <tr>
              <th>Insumo</th>
              <th className="num">Qtd</th>
              <th className="num">Unitário</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {receitaComInsumo.map((r, i) => (
              <tr key={i} style={{ cursor: "default" }}>
                <td style={{ fontWeight: 500 }}>{r.insumo.nome}</td>
                <td
                  className="num"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                >
                  {r.quantidade} {r.insumo.unidade}
                </td>
                <td
                  className="num"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    fontSize: 11,
                  }}
                >
                  {formatBRL(r.insumo.precoAtual)}/{r.insumo.unidade}
                </td>
                <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatBRL(r.insumo.precoAtual * r.quantidade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--border-default)",
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Custo total de insumos
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {formatBRL(produto.custo)}
        </span>
      </div>
    </>
  );
}

// ── Produto form (novo e editar) ──────────────────────────────
function ProdutoFormContent({
  initial,
  onSave,
  onClose,
}: {
  initial?: Produto;
  onSave: (data: {
    nome: string;
    categoria: string;
    tempo: number;
    preco: number;
    receita: ReceitaRow[];
  }) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [categoria, setCategoria] = useState(
    initial?.categoria ?? "Chaveiro"
  );
  const [tempo, setTempo] = useState(
    initial ? String(initial.tempoProducao) : ""
  );
  const [preco, setPreco] = useState(
    initial ? String(initial.precoSugerido) : ""
  );
  const [receita, setReceita] = useState<ReceitaRow[]>(
    initial
      ? initial.receita.map((r) => ({
          insumoId: r.insumoId,
          quantidade: String(r.quantidade),
        }))
      : [{ insumoId: INSUMOS_ROTATIVO[0].id, quantidade: "" }]
  );

  const custoCalculado = receita.reduce((sum, r) => {
    const ins = insumos.find((i) => i.id === r.insumoId);
    const qtd = parseFloat(r.quantidade);
    if (ins && !isNaN(qtd) && qtd > 0) return sum + ins.precoAtual * qtd;
    return sum;
  }, 0);

  const precoNum = parseFloat(preco.replace(",", ".")) || 0;
  const margemCalc =
    precoNum > custoCalculado
      ? ((precoNum - custoCalculado) / precoNum) * 100
      : 0;

  const addItem = () =>
    setReceita((prev) => [
      ...prev,
      { insumoId: INSUMOS_ROTATIVO[0].id, quantidade: "" },
    ]);

  const removeItem = (idx: number) =>
    setReceita((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ReceitaRow, value: string) =>
    setReceita((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  const canSave = nome.trim().length > 0 && precoNum > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      nome: nome.trim(),
      categoria,
      tempo: parseInt(tempo) || 0,
      preco: precoNum,
      receita,
    });
  };

  return (
    <>
      <FotoUpload />

      <div className="alm-field">
        <label className="alm-label">Nome do produto</label>
        <input
          className="atlas-input"
          placeholder="Ex: Chaveiro acrílico personalizado"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="alm-field">
          <label className="alm-label">Categoria</label>
          <select
            className="alm-select"
            style={{ height: 32 }}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="alm-field">
          <label className="alm-label">Tempo de produção (min)</label>
          <input
            className="atlas-input"
            type="number"
            min="1"
            placeholder="15"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
          />
        </div>
      </div>

      <div className="alm-field">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <label
            className="alm-label"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <ChefHat size={11} strokeWidth={1.5} />
            Receita de insumos
          </label>
          <button
            type="button"
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
            }}
            onClick={addItem}
          >
            <Plus size={11} strokeWidth={1.5} />
            Adicionar
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {receita.map((row, idx) => {
            const ins = insumos.find((i) => i.id === row.insumoId)!;
            const qtd = parseFloat(row.quantidade);
            const subtotal =
              ins && !isNaN(qtd) && qtd > 0 ? ins.precoAtual * qtd : null;

            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 68px 24px",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <select
                  className="alm-select"
                  style={{ height: 32, fontSize: 12 }}
                  value={row.insumoId}
                  onChange={(e) => updateItem(idx, "insumoId", e.target.value)}
                >
                  {INSUMOS_ROTATIVO.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ))}
                </select>
                <input
                  className="atlas-input"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder={`qtd ${ins?.unidade ?? ""}`}
                  style={{ fontSize: 12 }}
                  value={row.quantidade}
                  onChange={(e) => updateItem(idx, "quantidade", e.target.value)}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color:
                      subtotal !== null
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                    textAlign: "right",
                    paddingRight: 4,
                  }}
                >
                  {subtotal !== null ? formatBRL(subtotal) : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            background: "var(--bg-input)",
            borderRadius: "var(--radius-md, 4px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            Custo estimado de insumos
          </span>
          <span
            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}
          >
            {formatBRL(custoCalculado)}
          </span>
        </div>
      </div>

      <div className="alm-field">
        <label className="alm-label">Preço de venda sugerido (R$)</label>
        <input
          className="atlas-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
        />
      </div>

      {precoNum > 0 && (
        <div>
          <div className="alm-label" style={{ marginBottom: 6 }}>
            Margem estimada
          </div>
          <MargemBar margem={margemCalc} />
          {margemCalc < 40 && (
            <div className="atlas-alert atlas-alert-warning" style={{ marginTop: 8 }}>
              Margem abaixo de 40% — verifique o preço ou reduza insumos.
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          paddingTop: 4,
          borderTop: "1px solid var(--border-default)",
          marginTop: 4,
        }}
      >
        <button
          type="button"
          className="atlas-btn atlas-btn-secondary atlas-btn-sm"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "default" }}
          onClick={handleSave}
        >
          {initial ? "Salvar alterações" : "Salvar produto"}
        </button>
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ProdutosPage() {
  const [lista, setLista] = useState<Produto[]>(produtosMock);
  const [busca, setBusca] = useState("");
  const [view, setView] = useState<"tabela" | "galeria">("tabela");
  const [selected, setSelected] = useState<Produto | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtrados = lista.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const openDetalhe = (p: Produto) => {
    setConfirmDelete(false);
    setSelected(p);
    setMode("detalhe");
  };

  const close = () => {
    setMode(null);
    setConfirmDelete(false);
    setTimeout(() => setSelected(null), 340);
  };

  const handleSave = (data: {
    nome: string;
    categoria: string;
    tempo: number;
    preco: number;
    receita: ReceitaRow[];
  }) => {
    if (mode === "novo") {
      const novo: Produto = {
        id: `prd-${Date.now()}`,
        nome: data.nome,
        categoria: data.categoria,
        tempoProducao: data.tempo,
        precoSugerido: data.preco,
        custo: data.receita.reduce((sum, r) => {
          const ins = insumos.find((i) => i.id === r.insumoId);
          const qtd = parseFloat(r.quantidade);
          if (ins && !isNaN(qtd) && qtd > 0) return sum + ins.precoAtual * qtd;
          return sum;
        }, 0),
        margem:
          data.preco > 0
            ? ((data.preco -
                data.receita.reduce((sum, r) => {
                  const ins = insumos.find((i) => i.id === r.insumoId);
                  const qtd = parseFloat(r.quantidade);
                  if (ins && !isNaN(qtd) && qtd > 0)
                    return sum + ins.precoAtual * qtd;
                  return sum;
                }, 0)) /
                data.preco) *
              100
            : 0,
        receita: data.receita.map((r) => ({
          insumoId: r.insumoId,
          quantidade: parseFloat(r.quantidade) || 0,
        })),
      };
      setLista((prev) => [...prev, novo]);
    } else if (mode === "editar" && selected) {
      const custo = data.receita.reduce((sum, r) => {
        const ins = insumos.find((i) => i.id === r.insumoId);
        const qtd = parseFloat(r.quantidade);
        if (ins && !isNaN(qtd) && qtd > 0) return sum + ins.precoAtual * qtd;
        return sum;
      }, 0);
      setLista((prev) =>
        prev.map((p) =>
          p.id === selected.id
            ? {
                ...p,
                nome: data.nome,
                categoria: data.categoria,
                tempoProducao: data.tempo,
                precoSugerido: data.preco,
                custo,
                margem:
                  data.preco > 0
                    ? ((data.preco - custo) / data.preco) * 100
                    : 0,
                receita: data.receita.map((r) => ({
                  insumoId: r.insumoId,
                  quantidade: parseFloat(r.quantidade) || 0,
                })),
              }
            : p
        )
      );
    }
    close();
  };

  const handleDelete = () => {
    if (!selected) return;
    setLista((prev) => prev.filter((p) => p.id !== selected.id));
    close();
  };

  return (
    <div className="alm-page">
      {/* Header */}
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Produtos</h1>
          <p className="alm-page-subtitle">
            {lista.length} produto{lista.length !== 1 ? "s" : ""} cadastrado
            {lista.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => setMode("novo")}
        >
          <Plus size={13} strokeWidth={1.5} />
          Novo produto
        </button>
      </div>

      {/* Busca + toggle de visualização */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search
            size={13}
            strokeWidth={1.5}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
              pointerEvents: "none",
            }}
          />
          <input
            className="atlas-input"
            placeholder="Buscar por nome ou categoria…"
            style={{ paddingLeft: 26 }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div
          style={{
            display: "flex",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md, 4px)",
            overflow: "hidden",
          }}
        >
          {(["tabela", "galeria"] as const).map((v) => (
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
                borderLeft:
                  v === "galeria" ? "1px solid var(--border-default)" : "none",
                cursor: "pointer",
                color:
                  view === v ? "var(--text-primary)" : "var(--text-tertiary)",
                transition: "background-color 120ms ease, color 120ms ease",
              }}
            >
              {v === "tabela" ? (
                <LayoutList size={14} strokeWidth={1.5} />
              ) : (
                <LayoutGrid size={14} strokeWidth={1.5} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {view === "tabela" && (
        <div className="atlas-card" style={{ padding: 0 }}>
          {filtrados.length === 0 ? (
            <div className="atlas-empty" style={{ padding: "32px" }}>
              <div className="atlas-empty-title">Nenhum produto encontrado</div>
              <div className="atlas-empty-desc">
                Tente um termo diferente ou adicione um novo produto.
              </div>
            </div>
          ) : (
            <table className="atlas-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th className="num">Custo produção</th>
                  <th className="num">Preço sugerido</th>
                  <th className="num">Tempo</th>
                  <th style={{ minWidth: 140 }}>Margem</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const margemColor =
                    p.margem >= 70
                      ? "var(--status-success)"
                      : p.margem >= 40
                      ? "var(--status-warning)"
                      : "var(--status-error)";

                  return (
                    <tr key={p.id} onClick={() => openDetalhe(p)}>
                      <td>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 4,
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-default)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              size={13}
                              strokeWidth={1.5}
                              style={{ color: "var(--text-tertiary)" }}
                            />
                          </div>
                          <span style={{ fontWeight: 500 }}>{p.nome}</span>
                        </div>
                      </td>
                      <td>
                        <span className="atlas-badge">{p.categoria}</span>
                      </td>
                      <td
                        className="num"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatBRL(p.custo)}
                      </td>
                      <td
                        className="num"
                        style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                      >
                        {formatBRL(p.precoSugerido)}
                      </td>
                      <td
                        className="num"
                        style={{ color: "var(--text-tertiary)", fontSize: 12 }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Clock size={11} strokeWidth={1.5} />
                          {p.tempoProducao} min
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            paddingRight: 8,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 9999,
                              background: "var(--bg-input)",
                              overflow: "hidden",
                              minWidth: 60,
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(p.margem, 100)}%`,
                                height: "100%",
                                background: margemColor,
                                borderRadius: 9999,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 600,
                              color: margemColor,
                              width: 40,
                              textAlign: "right",
                            }}
                          >
                            {p.margem.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Galeria */}
      {view === "galeria" &&
        (filtrados.length === 0 ? (
          <div className="atlas-card">
            <div className="atlas-empty" style={{ padding: "32px" }}>
              <div className="atlas-empty-title">Nenhum produto encontrado</div>
              <div className="atlas-empty-desc">
                Tente um termo diferente ou adicione um novo produto.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            {filtrados.map((p) => {
              const margemColor =
                p.margem >= 70
                  ? "var(--status-success)"
                  : p.margem >= 40
                  ? "var(--status-warning)"
                  : "var(--status-error)";

              return (
                <div
                  key={p.id}
                  onClick={() => openDetalhe(p)}
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-lg, 6px)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition:
                      "border-color 120ms ease, background-color 120ms ease",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "var(--border-strong)";
                    (e.currentTarget as HTMLDivElement).style.background =
                      "var(--bg-elevated, #0f0f0f)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "var(--border-default)";
                    (e.currentTarget as HTMLDivElement).style.background =
                      "var(--bg-raised)";
                  }}
                >
                  <div
                    style={{
                      height: 120,
                      background: "var(--bg-input)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    <Box
                      size={32}
                      strokeWidth={1}
                      style={{ color: "var(--text-tertiary)", opacity: 0.4 }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "10px 10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {p.nome}
                    </div>
                    <span
                      className="atlas-badge"
                      style={{ alignSelf: "flex-start", fontSize: 10 }}
                    >
                      {p.categoria}
                    </span>
                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {formatBRL(p.precoSugerido)}
                      </div>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 9999,
                            background: "var(--bg-hover)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(p.margem, 100)}%`,
                              height: "100%",
                              background: margemColor,
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            fontWeight: 700,
                            color: margemColor,
                          }}
                        >
                          {p.margem.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* Modal detalhe */}
      <Modal
        open={mode === "detalhe"}
        onClose={close}
        title={selected?.nome ?? "Produto"}
        wide
        footer={
          confirmDelete ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
              }}
            >
              <AlertTriangle
                size={13}
                strokeWidth={1.5}
                style={{ color: "var(--status-error)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  flex: 1,
                }}
              >
                Excluir permanentemente?
              </span>
              <button
                className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                className="atlas-btn atlas-btn-sm"
                style={{
                  background: "var(--status-error)",
                  color: "#fff",
                  border: "none",
                }}
                onClick={handleDelete}
              >
                Excluir
              </button>
            </div>
          ) : (
            <>
              <button
                className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: "var(--status-error)",
                  marginRight: "auto",
                }}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={13} strokeWidth={1.5} />
                Excluir
              </button>
              <button
                className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                onClick={close}
              >
                Fechar
              </button>
              <button
                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                onClick={() => {
                  setMode("editar");
                }}
              >
                <Pencil size={12} strokeWidth={1.5} />
                Editar
              </button>
            </>
          )
        }
      >
        {selected && <DetalheContent produto={selected} />}
      </Modal>

      {/* Modal novo produto */}
      <Modal open={mode === "novo"} onClose={close} title="Novo produto" wide>
        <ProdutoFormContent onSave={handleSave} onClose={close} />
      </Modal>

      {/* Modal editar produto */}
      <Modal
        open={mode === "editar"}
        onClose={close}
        title={`Editar · ${selected?.nome ?? ""}`}
        wide
      >
        {selected && (
          <ProdutoFormContent
            initial={selected}
            onSave={handleSave}
            onClose={close}
          />
        )}
      </Modal>
    </div>
  );
}
