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
  Calculator,
  PackageCheck,
  History,
  Layers,
  Printer,
} from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { loadCustos } from "@/lib/repositories/financeiro";

interface Configuracoes {
  horasTrabalhoMes: number;
  multiplicadorPreco: number;
  custoHoraBambu: number;
}

const DEFAULT_CONFIGURACOES: Configuracoes = {
  horasTrabalhoMes: 160,
  multiplicadorPreco: 3,
  custoHoraBambu: 4.5,
};

const totalCustosDefault = 714.89; // fallback when no custos loaded yet
import {
  buscarProdutos,
  criarProduto,
  editarProduto,
  deletarProduto,
  registrarLote,
  type Produto,
  type LoteProducao,
  type Etapas3D,
} from "@/lib/repositories/produtos";
import { buscarInsumos, type Insumo } from "@/lib/repositories/insumos";

type ModalMode = "detalhe" | "novo" | "editar" | null;

interface ReceitaRow {
  insumoId: string;
  quantidade: string;
}

const CATEGORIAS_DEFAULT = [
  "Chaveiro",
  "Adesivo",
  "Tag",
  "Cartão",
  "Planner",
  "Kit",
  "Impressão 3D",
  "Outro",
];

function loadConfig(): Configuracoes {
  if (typeof window === "undefined") return DEFAULT_CONFIGURACOES;
  try {
    const saved = localStorage.getItem("almanac_config");
    if (saved) return { ...DEFAULT_CONFIGURACOES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIGURACOES;
}

function getTotalCustos(): number {
  const items = loadCustos();
  return items.reduce((s, c) => s + c.valorMensal, 0);
}

function calcPrecoSugerido(
  materialCost: number,
  tempoMin: number,
  config: Configuracoes
): number {
  const total = getTotalCustos() || totalCustosDefault;
  const hourlyRate = config.horasTrabalhoMes > 0 ? total / config.horasTrabalhoMes : 0;
  const timeCost = (tempoMin / 60) * hourlyRate;
  return (materialCost + timeCost) * config.multiplicadorPreco;
}

function calcPreco3D(
  materialCost: number,
  etapas: Etapas3D,
  config: Configuracoes
): {
  custoImpressao: number;
  custoModelagem: number;
  custoAcabamento: number;
  custoTotal: number;
  precoSugerido: number;
} {
  const total = getTotalCustos() || totalCustosDefault;
  const hourlyRate = config.horasTrabalhoMes > 0 ? total / config.horasTrabalhoMes : 0;
  const custoImpressao = ((etapas.impressao ?? 0) / 60) * config.custoHoraBambu;
  const custoModelagem = ((etapas.modelagem ?? 0) / 60) * hourlyRate;
  const custoAcabamento = ((etapas.acabamento ?? 0) / 60) * hourlyRate;
  const custoTotal = materialCost + custoImpressao + custoModelagem + custoAcabamento;
  return {
    custoImpressao,
    custoModelagem,
    custoAcabamento,
    custoTotal,
    precoSugerido: custoTotal * config.multiplicadorPreco,
  };
}

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

// ── Registrar lote form ───────────────────────────────────────
function RegistrarLoteForm({
  produto,
  onSave,
  onClose,
}: {
  produto: Produto;
  onSave: (qtd: number, data: string, obs: string) => void;
  onClose: () => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [qtd, setQtd] = useState("");
  const [data, setData] = useState(hoje);
  const [obs, setObs] = useState("");

  const qtdNum = parseInt(qtd) || 0;
  const custoTotal = qtdNum * produto.custo;
  const canSave = qtdNum > 0;

  return (
    <div
      style={{
        background: "var(--bg-input)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md, 4px)",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="alm-field" style={{ margin: 0 }}>
          <label className="alm-label">Quantidade produzida</label>
          <input
            autoFocus
            className="atlas-input"
            type="number"
            min="1"
            placeholder="Ex: 20"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
          />
        </div>
        <div className="alm-field" style={{ margin: 0 }}>
          <label className="alm-label">Data de produção</label>
          <input
            className="atlas-input"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
      </div>
      <div className="alm-field" style={{ margin: 0 }}>
        <label className="alm-label">Observação (opcional)</label>
        <input
          className="atlas-input"
          placeholder='Ex: "lote feira de junho"'
          value={obs}
          onChange={(e) => setObs(e.target.value)}
        />
      </div>
      {qtdNum > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            display: "flex",
            gap: 12,
          }}
        >
          <span>
            Custo total estimado:{" "}
            <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {formatBRL(custoTotal)}
            </strong>
          </span>
          <span style={{ color: "var(--status-warning)" }}>
            Deduz insumos conforme receita
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.4, flex: 1 }}
          onClick={() => onSave(qtdNum, data, obs.trim())}
        >
          Registrar lote
        </button>
        <button
          className="atlas-btn atlas-btn-ghost atlas-btn-sm"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Pronto estoque section ────────────────────────────────────
function ProntoEstoqueSection({
  produto,
  onRegistrarLote,
}: {
  produto: Produto;
  onRegistrarLote: () => void;
}) {
  const [showHistorico, setShowHistorico] = useState(false);
  const prontos = produto.prontoEstoque ?? 0;
  const min = produto.prontoEstoqueMin;
  const emAlerta = min !== undefined && prontos <= min;
  const lotes = produto.historicoLotes ?? [];

  return (
    <div
      style={{
        border: `1px solid ${emAlerta ? "rgba(244,71,71,0.3)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md, 4px)",
        background: emAlerta ? "rgba(244,71,71,0.04)" : "var(--bg-input)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PackageCheck
            size={13}
            strokeWidth={1.5}
            style={{ color: emAlerta ? "var(--status-error)" : "var(--text-tertiary)" }}
          />
          <span className="alm-label">Pronta entrega</span>
          {emAlerta && (
            <AlertTriangle size={11} strokeWidth={1.5} style={{ color: "var(--status-error)" }} />
          )}
        </div>
        <button
          className="atlas-btn atlas-btn-secondary atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          onClick={onRegistrarLote}
        >
          <Plus size={11} strokeWidth={1.5} />
          Registrar lote
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
            Em estoque
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 20,
              color: emAlerta ? "var(--status-error)" : "var(--text-primary)",
            }}
          >
            {prontos}
          </div>
        </div>
        {min !== undefined && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
              Mínimo
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-secondary)" }}>
              {min}
            </div>
          </div>
        )}
      </div>

      {lotes.length > 0 && (
        <button
          className="atlas-btn atlas-btn-ghost atlas-btn-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            alignSelf: "flex-start",
            color: "var(--text-tertiary)",
          }}
          onClick={() => setShowHistorico((v) => !v)}
        >
          <History size={11} strokeWidth={1.5} />
          {showHistorico ? "Ocultar" : `Ver histórico (${lotes.length} lote${lotes.length !== 1 ? "s" : ""})`}
        </button>
      )}

      {showHistorico && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[...lotes].reverse().map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "5px 0",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: 12,
              }}
            >
              <div>
                <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  {l.data.split("-").reverse().join("/")}
                </div>
                {l.observacao && (
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{l.observacao}</div>
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--status-success)",
                }}
              >
                +{l.quantidade}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Detalhe content ──────────────────────────────────────────
function DetalheContent({
  produto,
  insumos,
  onRegistrarLote,
}: {
  produto: Produto;
  insumos: Insumo[];
  onRegistrarLote: () => void;
}) {
  const receitaComInsumo = produto.receita.map((r) => ({
    ...r,
    insumo: insumos.find((i) => i.id === r.insumoId),
  }));

  const config = loadConfig();
  const hourlyRate =
    config.horasTrabalhoMes > 0
      ? getTotalCustos() / config.horasTrabalhoMes
      : 0;

  const is3D = produto.categoria === "Impressão 3D" && !!produto.etapas3D;
  const r3D = is3D ? calcPreco3D(produto.custo, produto.etapas3D!, config) : null;
  const timeCost = is3D ? 0 : (produto.tempoProducao / 60) * hourlyRate;
  const precoCalculado = is3D
    ? r3D!.precoSugerido
    : (produto.custo + timeCost) * config.multiplicadorPreco;

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
          {is3D
            ? <Layers size={28} strokeWidth={1} style={{ color: "var(--text-tertiary)" }} />
            : <Box size={28} strokeWidth={1} style={{ color: "var(--text-tertiary)" }} />
          }
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
            {formatBRL(precoCalculado)}
          </div>
        </div>
      </div>

      {/* Breakdown do preço */}
      <div
        style={{
          background: "var(--bg-input)",
          borderRadius: "var(--radius-md, 4px)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <Calculator size={11} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--text-tertiary)",
            }}
          >
            Como foi calculado
          </span>
        </div>
        {is3D && r3D ? (
          <>
            {[
              { label: "Insumos", value: produto.custo },
              {
                label: `Impressão (${produto.etapas3D!.impressao ?? 0}min × R$${config.custoHoraBambu.toFixed(2)}/h)`,
                value: r3D.custoImpressao,
              },
              {
                label: `Modelagem (${produto.etapas3D!.modelagem ?? 0}min × R$${hourlyRate.toFixed(2)}/h)`,
                value: r3D.custoModelagem,
              },
              {
                label: `Acabamento (${produto.etapas3D!.acabamento ?? 0}min × R$${hourlyRate.toFixed(2)}/h)`,
                value: r3D.custoAcabamento,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(value)}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: "Material (insumos)", value: produto.custo },
              {
                label: `Tempo (${produto.tempoProducao}min × R$${hourlyRate.toFixed(2)}/h)`,
                value: timeCost,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(value)}</span>
              </div>
            ))}
          </>
        )}
        <div
          style={{
            borderTop: "1px solid var(--border-default)",
            paddingTop: 6,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            × {config.multiplicadorPreco}× (multiplicador)
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {formatBRL(precoCalculado)}
          </span>
        </div>
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
                <td style={{ fontWeight: 500 }}>{r.insumo?.nome ?? r.insumoId}</td>
                <td
                  className="num"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                >
                  {r.quantidade} {r.insumo?.unidade ?? ""}
                </td>
                <td
                  className="num"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    fontSize: 11,
                  }}
                >
                  {r.insumo ? `${formatBRL(r.insumo.precoAtual)}/${r.insumo.unidade}` : "—"}
                </td>
                <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                  {r.insumo ? formatBRL(r.insumo.precoAtual * r.quantidade) : "—"}
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

      {produto.prontoEstoque !== undefined && (
        <ProntoEstoqueSection produto={produto} onRegistrarLote={onRegistrarLote} />
      )}
    </>
  );
}

// ── Categoria select com opção de criar nova ──────────────────
function CategoriaSelect({
  value,
  onChange,
  categorias,
  onAddCategoria,
}: {
  value: string;
  onChange: (v: string) => void;
  categorias: string[];
  onAddCategoria: (c: string) => void;
}) {
  const [criando, setCriando] = useState(false);
  const [nova, setNova] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (criando) inputRef.current?.focus();
  }, [criando]);

  function confirmar() {
    const cat = nova.trim();
    if (!cat) { setCriando(false); setNova(""); return; }
    onAddCategoria(cat);
    onChange(cat);
    setCriando(false);
    setNova("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select
        className="alm-select"
        style={{ height: 32 }}
        value={criando ? "__nova__" : value}
        onChange={(e) => {
          if (e.target.value === "__nova__") {
            setCriando(true);
          } else {
            setCriando(false);
            onChange(e.target.value);
          }
        }}
      >
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value="__nova__">+ Nova categoria…</option>
      </select>
      {criando && (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            ref={inputRef}
            className="atlas-input"
            placeholder="Nome da categoria"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
              if (e.key === "Escape") { setCriando(false); setNova(""); }
            }}
            style={{ flex: 1, fontSize: 12 }}
          />
          <button
            type="button"
            className="atlas-btn atlas-btn-primary atlas-btn-sm"
            onClick={confirmar}
          >
            Criar
          </button>
          <button
            type="button"
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            onClick={() => { setCriando(false); setNova(""); }}
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

const MULT_PRESETS = [2, 3, 4, 5];

// ── Produto form (novo e editar) ──────────────────────────────
function ProdutoFormContent({
  initial,
  categorias,
  insumos,
  onSave,
  onClose,
  onAddCategoria,
}: {
  initial?: Produto;
  categorias: string[];
  insumos: Insumo[];
  onSave: (data: {
    nome: string;
    categoria: string;
    tempo: number;
    receita: ReceitaRow[];
    multiplicador: number;
    etapas3D?: Etapas3D;
  }) => void;
  onClose: () => void;
  onAddCategoria: (c: string) => void;
}) {
  const insumosRotativo = insumos.filter(
    (i) => i.categoria === "visivel" || i.categoria === "invisivel"
  );

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [categoria, setCategoria] = useState(
    initial?.categoria ?? categorias[0] ?? "Outro"
  );
  const [tempo, setTempo] = useState(
    initial ? String(initial.tempoProducao) : ""
  );
  const [receita, setReceita] = useState<ReceitaRow[]>(
    initial
      ? initial.receita.map((r) => ({
          insumoId: r.insumoId,
          quantidade: String(r.quantidade),
        }))
      : [{ insumoId: insumosRotativo[0]?.id ?? "", quantidade: "" }]
  );

  const [impressaoMin, setImpressaoMin] = useState(
    initial?.etapas3D?.impressao !== undefined ? String(initial.etapas3D.impressao) : ""
  );
  const [modelagemMin, setModelagemMin] = useState(
    initial?.etapas3D?.modelagem !== undefined ? String(initial.etapas3D.modelagem) : ""
  );
  const [acabamentoMin, setAcabamentoMin] = useState(
    initial?.etapas3D?.acabamento !== undefined ? String(initial.etapas3D.acabamento) : ""
  );

  const config = loadConfig();
  const [multInput, setMultInput] = useState(String(config.multiplicadorPreco));

  const multNum = Math.max(1, parseFloat(multInput) || 1);
  const is3D = categoria === "Impressão 3D";

  const materialCost = receita.reduce((sum, r) => {
    const ins = insumos.find((i) => i.id === r.insumoId);
    const qtd = parseFloat(r.quantidade);
    if (ins && !isNaN(qtd) && qtd > 0) return sum + ins.precoAtual * qtd;
    return sum;
  }, 0);

  const hourlyRate =
    config.horasTrabalhoMes > 0
      ? getTotalCustos() / config.horasTrabalhoMes
      : 0;

  const impressaoNum = parseInt(impressaoMin) || 0;
  const modelagemNum = parseInt(modelagemMin) || 0;
  const acabamentoNum = parseInt(acabamentoMin) || 0;
  const tempoTotal3D = impressaoNum + modelagemNum + acabamentoNum;

  const tempoNum = is3D ? tempoTotal3D : (parseInt(tempo) || 0);

  const r3D = is3D
    ? calcPreco3D(materialCost, { impressao: impressaoNum, modelagem: modelagemNum, acabamento: acabamentoNum }, { ...config, multiplicadorPreco: multNum })
    : null;

  const timeCost = is3D ? 0 : (tempoNum / 60) * hourlyRate;
  const precoCalculado = is3D
    ? r3D!.precoSugerido
    : (materialCost + timeCost) * multNum;

  const addItem = () =>
    setReceita((prev) => [
      ...prev,
      { insumoId: insumosRotativo[0]?.id ?? "", quantidade: "" },
    ]);

  const removeItem = (idx: number) =>
    setReceita((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ReceitaRow, value: string) =>
    setReceita((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  const canSave = nome.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      nome: nome.trim(),
      categoria,
      tempo: tempoNum,
      receita,
      multiplicador: multNum,
      etapas3D: is3D
        ? { impressao: impressaoNum, modelagem: modelagemNum, acabamento: acabamentoNum }
        : undefined,
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
          <CategoriaSelect
            value={categoria}
            onChange={setCategoria}
            categorias={categorias}
            onAddCategoria={onAddCategoria}
          />
        </div>
        {!is3D && (
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
        )}
      </div>

      {/* Etapas 3D — só aparece quando categoria = Impressão 3D */}
      {is3D && (
        <div
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md, 4px)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-tertiary)",
              }}
            >
              Etapas de produção 3D
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Printer size={10} strokeWidth={1.5} />
                Impressão (min)
              </label>
              <input
                className="atlas-input"
                type="number"
                min="0"
                placeholder="90"
                value={impressaoMin}
                onChange={(e) => setImpressaoMin(e.target.value)}
              />
              {impressaoNum > 0 && (
                <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                  {formatBRL(r3D!.custoImpressao)}
                </span>
              )}
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Modelagem (min)</label>
              <input
                className="atlas-input"
                type="number"
                min="0"
                placeholder="20"
                value={modelagemMin}
                onChange={(e) => setModelagemMin(e.target.value)}
              />
              {modelagemNum > 0 && (
                <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                  {formatBRL(r3D!.custoModelagem)}
                </span>
              )}
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Acabamento (min)</label>
              <input
                className="atlas-input"
                type="number"
                min="0"
                placeholder="10"
                value={acabamentoMin}
                onChange={(e) => setAcabamentoMin(e.target.value)}
              />
              {acabamentoNum > 0 && (
                <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                  {formatBRL(r3D!.custoAcabamento)}
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              display: "flex",
              gap: 4,
              alignItems: "center",
            }}
          >
            <Clock size={10} strokeWidth={1.5} />
            Tempo total: {tempoTotal3D} min — todos os campos são opcionais
          </div>
        </div>
      )}

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
            const ins = insumos.find((i) => i.id === row.insumoId);
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
                  {insumosRotativo.map((i) => (
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
            {formatBRL(materialCost)}
          </span>
        </div>
      </div>

      {/* Preço calculado */}
      <div
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md, 4px)",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calculator size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="alm-label">Preço de venda sugerido</span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--accent-primary)",
            }}
          >
            {formatBRL(precoCalculado)}
          </span>
        </div>

        {/* Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {is3D && r3D ? (
            <>
              {[
                { label: "Insumos", value: materialCost },
                { label: `Impressão (${impressaoNum}min × R$${config.custoHoraBambu.toFixed(2)}/h)`, value: r3D.custoImpressao },
                { label: `Modelagem (${modelagemNum}min × R$${hourlyRate.toFixed(2)}/h)`, value: r3D.custoModelagem },
                { label: `Acabamento (${acabamentoNum}min × R$${hourlyRate.toFixed(2)}/h)`, value: r3D.custoAcabamento },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}
                >
                  <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    {formatBRL(value)}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { label: "Material", value: materialCost },
                { label: `Tempo (${tempoNum}min × R$${hourlyRate.toFixed(2)}/h)`, value: timeCost },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}
                >
                  <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    {formatBRL(value)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Multiplicador */}
        <div
          style={{
            borderTop: "1px solid var(--border-default)",
            paddingTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span className="alm-label">Multiplicador</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {MULT_PRESETS.map((p) => {
              const active = parseFloat(multInput) === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMultInput(String(p))}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: "var(--radius-md, 4px)",
                    border: active
                      ? "1px solid var(--accent-primary)"
                      : "1px solid var(--border-default)",
                    background: active ? "var(--accent-primary)" : "var(--bg-raised)",
                    color: active ? "#fff" : "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: active ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    flexShrink: 0,
                  }}
                >
                  {p}×
                </button>
              );
            })}
            <input
              className="atlas-input"
              type="number"
              min="1"
              step="0.1"
              value={multInput}
              onChange={(e) => setMultInput(e.target.value)}
              style={{ width: 64, fontFamily: "var(--font-mono)", fontSize: 12 }}
              placeholder="3"
            />
          </div>
        </div>
      </div>

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
  const [lista, setLista] = useState<Produto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [view, setView] = useState<"tabela" | "galeria">("tabela");
  const [selected, setSelected] = useState<Produto | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_DEFAULT);
  const [showLoteForm, setShowLoteForm] = useState(false);

  // Load initial data
  useEffect(() => {
    Promise.all([buscarProdutos(), buscarInsumos()])
      .then(([prods, inss]) => {
        setLista(prods);
        setInsumos(inss);
      })
      .catch((e) => setErro(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const reloadProdutos = async () => {
    try {
      const prods = await buscarProdutos();
      setLista(prods);
    } catch (e) {
      setErro(String(e));
    }
  };

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

  const handleAddCategoria = (cat: string) => {
    setCategorias((prev) =>
      prev.includes(cat) ? prev : [...prev, cat]
    );
  };

  const handleSave = async (data: {
    nome: string;
    categoria: string;
    tempo: number;
    receita: ReceitaRow[];
    multiplicador: number;
    etapas3D?: Etapas3D;
  }) => {
    const config = loadConfig();
    const custo = data.receita.reduce((sum, r) => {
      const ins = insumos.find((i) => i.id === r.insumoId);
      const qtd = parseFloat(r.quantidade);
      if (ins && !isNaN(qtd) && qtd > 0) return sum + ins.precoAtual * qtd;
      return sum;
    }, 0);
    const configComMult = { ...config, multiplicadorPreco: data.multiplicador };
    const precoSugerido = data.etapas3D
      ? calcPreco3D(custo, data.etapas3D, configComMult).precoSugerido
      : calcPrecoSugerido(custo, data.tempo, configComMult);

    const campos = {
      nome: data.nome,
      categoria: data.categoria,
      tempoProducao: data.tempo,
      precoSugerido,
      custo,
      margem: 0,
      receita: data.receita
        .filter((r) => r.insumoId && parseFloat(r.quantidade) > 0)
        .map((r) => ({
          insumoId: r.insumoId,
          quantidade: parseFloat(r.quantidade) || 0,
        })),
      etapas3D: data.etapas3D ?? null,
    };

    setSaving(true);
    setErro(null);
    try {
      if (mode === "novo") {
        await criarProduto(campos);
      } else if (mode === "editar" && selected) {
        await editarProduto(selected.id, campos);
      }
      close();
      await reloadProdutos();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    setErro(null);
    try {
      await deletarProduto(selected.id);
      close();
      await reloadProdutos();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrarLote = async (qtd: number, data: string, obs: string) => {
    if (!selected) return;
    setSaving(true);
    setErro(null);
    try {
      await registrarLote(selected.id, { quantidade: qtd, data, observacao: obs || undefined });
      const prods = await buscarProdutos();
      setLista(prods);
      const updated = prods.find((p) => p.id === selected.id);
      if (updated) setSelected(updated);
      setShowLoteForm(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="alm-page">
        <div className="alm-page-header">
          <h1 className="alm-page-title">Produtos</h1>
        </div>
        <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "32px 0" }}>
          Carregando produtos…
        </div>
      </div>
    );
  }

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
          disabled={saving}
        >
          <Plus size={13} strokeWidth={1.5} />
          Novo produto
        </button>
      </div>

      {/* Error banner */}
      {erro && (
        <div
          style={{
            background: "rgba(244,71,71,0.08)",
            border: "1px solid rgba(244,71,71,0.3)",
            borderRadius: "var(--radius-md, 4px)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--status-error)",
          }}
        >
          <AlertTriangle size={14} strokeWidth={1.5} />
          {erro}
          <button
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{ marginLeft: "auto", padding: "0 4px" }}
            onClick={() => setErro(null)}
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}

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
                  <th className="num">Prontos</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const config = loadConfig();
                  const preco = p.categoria === "Impressão 3D" && p.etapas3D
                    ? calcPreco3D(p.custo, p.etapas3D, config).precoSugerido
                    : calcPrecoSugerido(p.custo, p.tempoProducao, config);
                  const temProntos = p.prontoEstoque !== undefined;
                  const prontoAlerta =
                    temProntos &&
                    p.prontoEstoqueMin !== undefined &&
                    (p.prontoEstoque ?? 0) <= p.prontoEstoqueMin;
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
                        {formatBRL(preco)}
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
                      <td className="num">
                        {temProntos ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              color: prontoAlerta
                                ? "var(--status-error)"
                                : "var(--text-primary)",
                            }}
                          >
                            {prontoAlerta && (
                              <AlertTriangle size={10} strokeWidth={1.5} />
                            )}
                            {p.prontoEstoque}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>—</span>
                        )}
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
              const config = loadConfig();
              const preco = p.categoria === "Impressão 3D" && p.etapas3D
                ? calcPreco3D(p.custo, p.etapas3D, config).precoSugerido
                : calcPrecoSugerido(p.custo, p.tempoProducao, config);
              const temProntos = p.prontoEstoque !== undefined;
              const prontoAlerta =
                temProntos &&
                p.prontoEstoqueMin !== undefined &&
                (p.prontoEstoque ?? 0) <= p.prontoEstoqueMin;
              return (
                <div
                  key={p.id}
                  onClick={() => openDetalhe(p)}
                  style={{
                    background: "var(--bg-raised)",
                    border: `1px solid ${prontoAlerta ? "rgba(244,71,71,0.35)" : "var(--border-default)"}`,
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
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      <span
                        className="atlas-badge"
                        style={{ alignSelf: "flex-start", fontSize: 10 }}
                      >
                        {p.categoria}
                      </span>
                      {temProntos && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: "var(--radius-full)",
                            background: prontoAlerta
                              ? "rgba(244,71,71,0.12)"
                              : "rgba(72,199,142,0.1)",
                            color: prontoAlerta
                              ? "var(--status-error)"
                              : "var(--status-success)",
                            border: `1px solid ${prontoAlerta ? "rgba(244,71,71,0.25)" : "rgba(72,199,142,0.25)"}`,
                          }}
                        >
                          {prontoAlerta && <AlertTriangle size={9} strokeWidth={1.5} />}
                          <PackageCheck size={9} strokeWidth={1.5} />
                          {p.prontoEstoque}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: "auto" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {formatBRL(preco)}
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
        onClose={() => { setShowLoteForm(false); close(); }}
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
                disabled={saving}
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
                disabled={saving}
              >
                {saving ? "Excluindo…" : "Excluir"}
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
                disabled={saving}
              >
                <Trash2 size={13} strokeWidth={1.5} />
                Excluir
              </button>
              <button
                className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                onClick={close}
                disabled={saving}
              >
                Fechar
              </button>
              <button
                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                onClick={() => {
                  setMode("editar");
                }}
                disabled={saving}
              >
                <Pencil size={12} strokeWidth={1.5} />
                Editar
              </button>
            </>
          )
        }
      >
        {selected && (
          <>
            <DetalheContent
              produto={selected}
              insumos={insumos}
              onRegistrarLote={() => setShowLoteForm(true)}
            />
            {showLoteForm && (
              <RegistrarLoteForm
                produto={selected}
                onSave={handleRegistrarLote}
                onClose={() => setShowLoteForm(false)}
              />
            )}
          </>
        )}
      </Modal>

      {/* Modal novo produto */}
      <Modal open={mode === "novo"} onClose={close} title="Novo produto" wide>
        <ProdutoFormContent
          categorias={categorias}
          insumos={insumos}
          onSave={handleSave}
          onClose={close}
          onAddCategoria={handleAddCategoria}
        />
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
            categorias={categorias}
            insumos={insumos}
            onSave={handleSave}
            onClose={close}
            onAddCategoria={handleAddCategoria}
          />
        )}
      </Modal>
    </div>
  );
}
