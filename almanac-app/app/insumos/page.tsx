"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ChevronRight,
  X,
  TrendingUp,
  ArrowDownToLine,
  SlidersHorizontal,
  History,
  ImagePlus,
} from "lucide-react";
import {
  formatBRL,
  formatDate,
  categoriaLabel,
} from "@/lib/data";
import {
  buscarInsumos,
  criarInsumo,
  editarInsumo,
  deletarInsumo,
  registrarPreco,
  type Insumo,
  type InsumoCategoria,
} from "@/lib/repositories/insumos";

// ─── helpers ─────────────────────────────────────────────────
const categoriaBadge: Record<InsumoCategoria, string> = {
  visivel:    "atlas-badge atlas-badge-info",
  invisivel:  "atlas-badge",
  ferramenta: "atlas-badge atlas-badge-warning",
  maquinario: "atlas-badge atlas-badge-warning",
};

function isAlerta(i: Insumo) {
  return i.estoque !== null && i.estoqueMin !== null && i.estoque <= i.estoqueMin;
}

// ─── Modal wrapper (Lessons 19 + 20 — enter + exit animation) ─
type ModalMode = "detalhe" | "entrada" | "ajuste" | "preco" | "novo";

function Modal({
  open,
  onClose,
  title,
  wide,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
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

  // Fechar com Escape
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
          <button className="atlas-btn atlas-btn-icon" onClick={onClose}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>
        <div className="alm-modal-body">{children}</div>
        {footer && <div className="alm-modal-footer">{footer}</div>}
      </div>
    </>
  );
}

// ─── Upload de foto ───────────────────────────────────────────
function FotoUpload({ preview, onChange }: { preview: string | null; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  }

  return (
    <div className="alm-field">
      <label className="alm-label">Foto do insumo</label>
      <label className="alm-upload" onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
        {preview ? (
          <img src={preview} alt="preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
        ) : (
          <>
            <ImagePlus size={22} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="alm-upload-label">Clique para adicionar foto</span>
            <span className="alm-upload-hint">JPG, PNG ou WEBP · max 5 MB</span>
          </>
        )}
      </label>
    </div>
  );
}

// ─── Conteúdos do modal ───────────────────────────────────────
function DetalheContent({ insumo }: { insumo: Insumo }) {
  const alerta = isAlerta(insumo);
  return (
    <>
      {/* Cabeçalho com foto placeholder */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div
          className="alm-photo-preview"
          style={{ width: "72px", height: "72px" }}
          title="Sem foto cadastrada"
        >
          <Package size={24} strokeWidth={1.5} style={{ color: "var(--text-ghost)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{insumo.nome}</div>
          <span className={categoriaBadge[insumo.categoria]}>{categoriaLabel[insumo.categoria]}</span>
          {alerta && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
              <AlertTriangle size={12} strokeWidth={1.5} style={{ color: "var(--status-error)" }} />
              <span style={{ fontSize: "11px", color: "var(--status-error)", fontWeight: 600 }}>Estoque abaixo do mínimo</span>
            </div>
          )}
        </div>
      </div>

      <hr className="atlas-divider" />

      {/* Dados */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {insumo.unidade !== "—" && <InfoRow label="Unidade" value={insumo.unidade} />}
        <InfoRow label="Preço atual" value={`${formatBRL(insumo.precoAtual)} / ${insumo.unidade}`} mono />
        {insumo.estoque !== null && (
          <InfoRow label="Estoque atual" value={`${insumo.estoque} ${insumo.unidade}`} mono error={alerta} />
        )}
        {insumo.estoqueMin !== null && (
          <InfoRow label="Estoque mínimo" value={`${insumo.estoqueMin} ${insumo.unidade}`} mono />
        )}
      </div>

      {/* Barra de nível */}
      {insumo.estoque !== null && insumo.estoqueMin !== null && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-tertiary)" }}>
            <span>Nível de estoque</span>
            <span style={{ fontFamily: "var(--font-mono)", color: alerta ? "var(--status-error)" : undefined }}>
              {Math.round((insumo.estoque / (insumo.estoqueMin * 3)) * 100)}%
            </span>
          </div>
          <div className="atlas-progress" style={{ height: "4px" }}>
            <div
              className="atlas-progress-bar"
              style={{
                width: `${Math.min(100, (insumo.estoque / (insumo.estoqueMin * 3)) * 100)}%`,
                background: alerta ? "var(--status-error)" : "var(--accent-primary)",
              }}
            />
          </div>
        </>
      )}

      {/* Histórico de preços */}
      {insumo.historico.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <History size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>
              Histórico de preços
            </span>
          </div>
          <table className="atlas-table" style={{ width: "100%", border: "1px solid var(--border-default)", borderRadius: "4px" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th className="num">Preço</th>
                <th className="num">Variação</th>
              </tr>
            </thead>
            <tbody>
              {[...insumo.historico].reverse().map((h, i, arr) => {
                const prev = arr[i + 1];
                const delta = prev ? ((h.preco - prev.preco) / prev.preco) * 100 : null;
                return (
                  <tr key={h.data}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{formatDate(h.data)}</td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatBRL(h.preco)}</td>
                    <td className="num">
                      {delta !== null ? (
                        <span className={`atlas-stat-delta ${delta >= 0 ? "is-up" : "is-down"}`} style={{ fontSize: "11px" }}>
                          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-ghost)", fontSize: "11px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function InfoRow({ label, value, mono, error }: { label: string; value: string; mono?: boolean; error?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
      <span style={{ fontSize: "11px", color: "var(--text-tertiary)", flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: "12px",
        fontFamily: mono ? "var(--font-mono)" : undefined,
        fontWeight: mono ? 600 : 500,
        color: error ? "var(--status-error)" : "var(--text-primary)",
      }}>
        {value}
      </span>
    </div>
  );
}

function EntradaContent({ insumo, qtdRef, precoRef }: {
  insumo: Insumo;
  qtdRef: React.RefObject<HTMLInputElement | null>;
  precoRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div className="atlas-alert atlas-alert-info">
        <div className="atlas-alert-title">Entrada de estoque</div>
        <div className="atlas-alert-desc">
          Estoque atual de <strong>{insumo.nome}</strong>: <strong>{insumo.estoque} {insumo.unidade}</strong>.
        </div>
      </div>
      <div className="alm-field">
        <label className="alm-label">Quantidade adquirida ({insumo.unidade})</label>
        <input ref={qtdRef} className="atlas-input" type="number" placeholder="0" min="0" autoFocus />
      </div>
      <div className="alm-field">
        <label className="alm-label">Valor pago por {insumo.unidade} (R$) — atualiza preço</label>
        <input ref={precoRef} className="atlas-input" type="number" placeholder={String(insumo.precoAtual)} step="0.01" />
      </div>
    </>
  );
}

function AjusteContent({ insumo, qtdRef, motivoRef }: {
  insumo: Insumo;
  qtdRef: React.RefObject<HTMLInputElement | null>;
  motivoRef: React.RefObject<HTMLSelectElement | null>;
}) {
  return (
    <>
      <div className="alm-field">
        <label className="alm-label">Nova quantidade ({insumo.unidade})</label>
        <input ref={qtdRef} className="atlas-input" type="number" defaultValue={insumo.estoque ?? 0} autoFocus />
      </div>
      <div className="alm-field">
        <label className="alm-label">Motivo</label>
        <select ref={motivoRef} className="alm-select">
          <option>Perda / avaria</option>
          <option>Erro de contagem</option>
          <option>Uso interno</option>
          <option>Doação</option>
          <option>Outro</option>
        </select>
      </div>
      <div className="alm-field">
        <label className="alm-label">Observação</label>
        <input className="atlas-input" type="text" placeholder="Opcional" />
      </div>
    </>
  );
}

function PrecoContent({ insumo, novoPrecoRef }: {
  insumo: Insumo;
  novoPrecoRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div className="atlas-alert atlas-alert-warning">
        <div className="atlas-alert-title">Impacto nos produtos</div>
        <div className="atlas-alert-desc">
          Ao salvar, o custo de produção de todos os produtos que usam este insumo é recalculado automaticamente.
        </div>
      </div>
      <div className="alm-field">
        <label className="alm-label">Preço atual</label>
        <input className="atlas-input" value={`R$ ${insumo.precoAtual.toFixed(2).replace(".", ",")}`} disabled style={{ opacity: 0.5 }} />
      </div>
      <div className="alm-field">
        <label className="alm-label">Novo preço por {insumo.unidade} (R$)</label>
        <input ref={novoPrecoRef} className="atlas-input" type="number" step="0.01" placeholder="0,00" autoFocus />
      </div>
    </>
  );
}

function NovoInsumoContent({
  nomeRef,
  categoriaRef,
  unidadeRef,
  precoRef,
  estoqueRef,
  estoqueMinRef,
}: {
  nomeRef: React.RefObject<HTMLInputElement | null>;
  categoriaRef: React.RefObject<HTMLSelectElement | null>;
  unidadeRef: React.RefObject<HTMLSelectElement | null>;
  precoRef: React.RefObject<HTMLInputElement | null>;
  estoqueRef: React.RefObject<HTMLInputElement | null>;
  estoqueMinRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [categoria, setCategoria] = useState<InsumoCategoria>("visivel");
  const [foto, setFoto] = useState<string | null>(null);
  const rotativo = categoria === "visivel" || categoria === "invisivel";

  function handleCategoriaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as InsumoCategoria;
    setCategoria(val);
    if (categoriaRef.current) categoriaRef.current.value = val;
  }

  return (
    <>
      <FotoUpload preview={foto} onChange={setFoto} />

      <div className="alm-field">
        <label className="alm-label">Nome</label>
        <input ref={nomeRef} className="atlas-input" type="text" placeholder="Ex: Papel A4 premium" autoFocus />
      </div>

      <div className="alm-field">
        <label className="alm-label">Categoria</label>
        <select
          ref={categoriaRef}
          className="alm-select"
          value={categoria}
          onChange={handleCategoriaChange}
        >
          <option value="visivel">Rotativo visível</option>
          <option value="invisivel">Rotativo invisível</option>
          <option value="ferramenta">Ferramenta</option>
          <option value="maquinario">Maquinário</option>
        </select>
      </div>

      {rotativo && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div className="alm-field">
              <label className="alm-label">Unidade</label>
              <select ref={unidadeRef} className="alm-select">
                <option>unidade</option>
                <option>folha</option>
                <option>metro</option>
                <option>g</option>
                <option>ml</option>
                <option>cm²</option>
              </select>
            </div>
            <div className="alm-field">
              <label className="alm-label">Preço por unidade (R$)</label>
              <input ref={precoRef} className="atlas-input" type="number" step="0.01" placeholder="0,00" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div className="alm-field">
              <label className="alm-label">Estoque inicial</label>
              <input ref={estoqueRef} className="atlas-input" type="number" placeholder="0" />
            </div>
            <div className="alm-field">
              <label className="alm-label">Estoque mínimo</label>
              <input ref={estoqueMinRef} className="atlas-input" type="number" placeholder="0" />
            </div>
          </div>
        </>
      )}

      {!rotativo && (
        <div className="alm-field">
          <label className="alm-label">Valor de aquisição (R$)</label>
          <input ref={precoRef} className="atlas-input" type="number" step="0.01" placeholder="0,00" />
        </div>
      )}

    </>
  );
}

// ─── Página principal ─────────────────────────────────────────
const filtros = ["Todos", "Rotativo visível", "Rotativo invisível", "Ferramenta", "Maquinário"] as const;
type Filtro = (typeof filtros)[number];

const filtroMap: Record<Filtro, InsumoCategoria[]> = {
  "Todos":             ["visivel", "invisivel", "ferramenta", "maquinario"],
  "Rotativo visível":  ["visivel"],
  "Rotativo invisível":["invisivel"],
  "Ferramenta":        ["ferramenta"],
  "Maquinário":        ["maquinario"],
};

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]     = useState<Filtro>("Todos");
  const [busca, setBusca]       = useState("");
  const [selected, setSelected] = useState<Insumo | null>(null);
  const [mode, setMode]         = useState<ModalMode>("detalhe");

  // Refs para o modal "Novo insumo"
  const novoNomeRef       = useRef<HTMLInputElement>(null);
  const novoCategoriaRef  = useRef<HTMLSelectElement>(null);
  const novoUnidadeRef    = useRef<HTMLSelectElement>(null);
  const novoPrecoRef      = useRef<HTMLInputElement>(null);
  const novoEstoqueRef    = useRef<HTMLInputElement>(null);
  const novoEstoqueMinRef = useRef<HTMLInputElement>(null);

  // Refs para o modal "Entrada"
  const entradaQtdRef   = useRef<HTMLInputElement>(null);
  const entradaPrecoRef = useRef<HTMLInputElement>(null);

  // Refs para o modal "Ajuste"
  const ajusteQtdRef   = useRef<HTMLInputElement>(null);
  const ajusteMotivoRef = useRef<HTMLSelectElement>(null);

  // Ref para o modal "Preço"
  const precoNovoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buscarInsumos().then(data => { setInsumos(data); setLoading(false); });
  }, []);

  function refresh() {
    return buscarInsumos().then(setInsumos);
  }

  const lista = insumos.filter((i) =>
    filtroMap[filtro].includes(i.categoria) &&
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function open(insumo: Insumo | null, m: ModalMode) {
    setSelected(insumo);
    setMode(m);
  }

  function closeModal() {
    setSelected(null);
    setMode("detalhe");
  }

  async function handleSalvar() {
    if (mode === "novo") {
      const nome      = novoNomeRef.current?.value.trim() ?? "";
      const categoria = (novoCategoriaRef.current?.value ?? "visivel") as InsumoCategoria;
      const unidade   = novoUnidadeRef.current?.value ?? "unidade";
      const preco     = parseFloat(novoPrecoRef.current?.value ?? "0") || 0;
      const estoque   = novoEstoqueRef.current?.value ? parseFloat(novoEstoqueRef.current.value) : null;
      const estoqueMin = novoEstoqueMinRef.current?.value ? parseFloat(novoEstoqueMinRef.current.value) : null;

      if (!nome) return;

      await criarInsumo({ nome, categoria, unidade, precoAtual: preco, estoque, estoqueMin });
      await refresh();
      closeModal();
      return;
    }

    if (!selected) return;

    if (mode === "entrada") {
      const qtd   = parseFloat(entradaQtdRef.current?.value ?? "0") || 0;
      const preco = parseFloat(entradaPrecoRef.current?.value ?? "0") || 0;
      const novoEstoque = (selected.estoque ?? 0) + qtd;

      const updates: Parameters<typeof editarInsumo>[1] = { estoque: novoEstoque };
      if (preco > 0) updates.precoAtual = preco;

      await editarInsumo(selected.id, updates);
      await refresh();
      closeModal();
      return;
    }

    if (mode === "ajuste") {
      const novaQtd = parseFloat(ajusteQtdRef.current?.value ?? "0") || 0;
      await editarInsumo(selected.id, { estoque: novaQtd });
      await refresh();
      closeModal();
      return;
    }

    if (mode === "preco") {
      const novoPreco = parseFloat(precoNovoRef.current?.value ?? "0") || 0;
      if (novoPreco <= 0) return;
      await registrarPreco(selected.id, novoPreco, new Date().toISOString().slice(0, 10));
      await editarInsumo(selected.id, { precoAtual: novoPreco });
      await refresh();
      closeModal();
      return;
    }
  }

  const alertaCount = insumos.filter(isAlerta).length;
  const isOpen = selected !== null || mode === "novo";

  const modalTitles: Record<ModalMode, string> = {
    detalhe: selected?.nome ?? "",
    entrada: "Registrar entrada",
    ajuste:  "Ajuste manual de estoque",
    preco:   "Atualizar preço",
    novo:    "Novo insumo",
  };

  return (
    <div className="alm-page">
      {/* Header */}
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Insumos</h1>
          <p className="alm-page-subtitle">
            {loading ? "Carregando…" : `${insumos.length} cadastrados`}
            {!loading && alertaCount > 0 && (
              <span style={{ color: "var(--status-error)", marginLeft: "8px", fontWeight: 600 }}>
                · {alertaCount} em alerta
              </span>
            )}
          </p>
        </div>
        <button className="atlas-btn atlas-btn-primary" onClick={() => open(null, "novo")}>
          <Plus size={14} strokeWidth={1.5} />
          Novo insumo
        </button>
      </div>

      {/* Filtros + busca */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <div className="atlas-segmented">
          {filtros.map((f) => (
            <button key={f} className={`atlas-segmented-item${filtro === f ? " is-active" : ""}`} onClick={() => setFiltro(f)}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <Search size={13} strokeWidth={1.5} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <input className="atlas-input" placeholder="Buscar insumo…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ paddingLeft: "28px", width: "200px" }} />
        </div>
      </div>

      {/* Tabela */}
      <div className="atlas-card">
        <div className="atlas-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="atlas-empty" style={{ padding: "40px" }}>
              <div className="atlas-empty-desc">Carregando insumos…</div>
            </div>
          ) : lista.length === 0 ? (
            <div className="atlas-empty" style={{ padding: "40px" }}>
              <div className="atlas-empty-icon"><Package size={24} strokeWidth={1.5} /></div>
              <div className="atlas-empty-title">Nenhum insumo encontrado</div>
              <div className="atlas-empty-desc">Tente outro filtro ou busca.</div>
            </div>
          ) : (
            <table className="atlas-table" style={{ width: "100%", border: 0 }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th className="num">Estoque</th>
                  <th className="num">Mínimo</th>
                  <th className="num">Preço atual</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((insumo) => {
                  const alerta = isAlerta(insumo);
                  return (
                    <tr key={insumo.id} onClick={() => open(insumo, "detalhe")}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {alerta && <AlertTriangle size={13} strokeWidth={1.5} style={{ color: "var(--status-error)", flexShrink: 0 }} />}
                          <span style={{ fontWeight: 500 }}>{insumo.nome}</span>
                        </div>
                      </td>
                      <td><span className={categoriaBadge[insumo.categoria]}>{categoriaLabel[insumo.categoria]}</span></td>
                      <td className="num">
                        {insumo.estoque !== null ? (
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: alerta ? "var(--status-error)" : "var(--text-primary)" }}>
                            {insumo.estoque} {insumo.unidade}
                          </span>
                        ) : <span style={{ color: "var(--text-ghost)" }}>—</span>}
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                        {insumo.estoqueMin !== null ? `${insumo.estoqueMin} ${insumo.unidade}` : "—"}
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatBRL(insumo.precoAtual)}/{insumo.unidade === "—" ? "un." : insumo.unidade}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                          {(insumo.categoria === "visivel" || insumo.categoria === "invisivel") && (
                            <>
                              <button className="atlas-btn atlas-btn-icon atlas-btn-sm" title="Registrar entrada"
                                onClick={(e) => { e.stopPropagation(); open(insumo, "entrada"); }}>
                                <ArrowDownToLine size={13} strokeWidth={1.5} />
                              </button>
                              <button className="atlas-btn atlas-btn-icon atlas-btn-sm" title="Ajuste manual"
                                onClick={(e) => { e.stopPropagation(); open(insumo, "ajuste"); }}>
                                <SlidersHorizontal size={13} strokeWidth={1.5} />
                              </button>
                              <button className="atlas-btn atlas-btn-icon atlas-btn-sm" title="Atualizar preço"
                                onClick={(e) => { e.stopPropagation(); open(insumo, "preco"); }}>
                                <TrendingUp size={13} strokeWidth={1.5} />
                              </button>
                            </>
                          )}
                          <button className="atlas-btn atlas-btn-icon atlas-btn-sm" title="Ver detalhe"
                            onClick={(e) => { e.stopPropagation(); open(insumo, "detalhe"); }}>
                            <ChevronRight size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={isOpen}
        onClose={closeModal}
        title={modalTitles[mode]}
        wide={mode === "detalhe" || mode === "novo"}
        footer={
          mode !== "detalhe" ? (
            <>
              <button className="atlas-btn atlas-btn-ghost" onClick={closeModal}>
                Cancelar
              </button>
              <button className="atlas-btn atlas-btn-primary" onClick={handleSalvar}>
                Salvar
              </button>
            </>
          ) : undefined
        }
      >
        {mode === "detalhe" && selected && <DetalheContent insumo={selected} />}
        {mode === "entrada" && selected && (
          <EntradaContent
            insumo={selected}
            qtdRef={entradaQtdRef}
            precoRef={entradaPrecoRef}
          />
        )}
        {mode === "ajuste"  && selected && (
          <AjusteContent
            insumo={selected}
            qtdRef={ajusteQtdRef}
            motivoRef={ajusteMotivoRef}
          />
        )}
        {mode === "preco"   && selected && (
          <PrecoContent
            insumo={selected}
            novoPrecoRef={precoNovoRef}
          />
        )}
        {mode === "novo" && (
          <NovoInsumoContent
            nomeRef={novoNomeRef}
            categoriaRef={novoCategoriaRef}
            unidadeRef={novoUnidadeRef}
            precoRef={novoPrecoRef}
            estoqueRef={novoEstoqueRef}
            estoqueMinRef={novoEstoqueMinRef}
          />
        )}
      </Modal>
    </div>
  );
}
