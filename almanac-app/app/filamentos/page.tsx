"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Check, Trash2 } from "lucide-react";
import {
  buscarFilamentos,
  criarFilamento,
  editarFilamento,
  deletarFilamento,
  MATERIAIS_FILAMENTO,
  PESO_ROLO_PADRAO,
  type Filamento,
  type FilamentoInput,
  type MaterialFilamento,
} from "@/lib/repositories/filamentos";

const COR_PADRAO = "#9ca3af";

const OUTRA_MARCA = "__outra__";

function FilamentoModal({
  inicial,
  marcas,
  onClose,
  onSave,
  onDelete,
}: {
  inicial?: Filamento;
  marcas: string[];
  onClose: () => void;
  onSave: (input: FilamentoInput) => void;
  onDelete?: () => void;
}) {
  const [cor, setCor] = useState(inicial?.cor ?? "");
  const [corHex, setCorHex] = useState(inicial?.corHex ?? COR_PADRAO);
  const [material, setMaterial] = useState<MaterialFilamento>(inicial?.material ?? "PLA");
  const [marca, setMarca] = useState(inicial?.marca ?? "");
  const [novaMarca, setNovaMarca] = useState("");
  const opcoesMarca = Array.from(new Set([...marcas, ...(inicial?.marca ? [inicial.marca] : [])])).sort();
  const [pesoRolo, setPesoRolo] = useState(String(inicial?.pesoRolo ?? PESO_ROLO_PADRAO));
  const [gramas, setGramas] = useState(String(inicial?.gramasRestantes ?? PESO_ROLO_PADRAO));
  const [quantidade, setQuantidade] = useState(String(inicial?.quantidade ?? 1));
  const [observacoes, setObservacoes] = useState(inicial?.observacoes ?? "");

  const canSave =
    cor.trim() && parseFloat(pesoRolo) > 0 && parseFloat(gramas) >= 0 && parseInt(quantidade) >= 1;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", width: 440, maxWidth: "calc(100vw - 32px)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-default)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{inicial ? "Editar filamento" : "Novo filamento"}</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onClose}><X size={14} strokeWidth={1.5} /></button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "start" }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Cor</label>
              <input type="color" value={corHex} onChange={(e) => setCorHex(e.target.value)} style={{ display: "block", width: 44, height: 36, padding: 2, border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", cursor: "pointer" }} />
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Nome da cor *</label>
              <input autoFocus className="atlas-input" placeholder="Ex: Verde menta" value={cor} onChange={(e) => setCor(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Material</label>
              <select className="atlas-input" value={material} onChange={(e) => setMaterial(e.target.value as MaterialFilamento)}>
                {MATERIAIS_FILAMENTO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Marca</label>
              <select className="atlas-input" value={marca} onChange={(e) => setMarca(e.target.value)}>
                <option value="">Sem marca</option>
                {opcoesMarca.map((m) => <option key={m} value={m}>{m}</option>)}
                <option value={OUTRA_MARCA}>Outra marca…</option>
              </select>
              {marca === OUTRA_MARCA && (
                <input autoFocus className="atlas-input" style={{ marginTop: 6 }} placeholder="Nome da marca" value={novaMarca} onChange={(e) => setNovaMarca(e.target.value)} />
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "start" }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Peso (g) *</label>
              <input className="atlas-input" type="number" min="1" step="1" value={pesoRolo} onChange={(e) => setPesoRolo(e.target.value)} />
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Restante (g) *</label>
              <input className="atlas-input" type="number" min="0" step="1" value={gramas} onChange={(e) => setGramas(e.target.value)} />
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Qtd. rolos *</label>
              <input className="atlas-input" type="number" min="1" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
          </div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Observações</label>
            <input className="atlas-input" placeholder="Ex: sedoso, tom mais claro na luz do dia" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--border-default)" }}>
          <div>
            {onDelete && (
              <button className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--status-error)" }} onClick={onDelete}>
                <Trash2 size={13} strokeWidth={1.5} />
                Excluir
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
            <button
              className="atlas-btn atlas-btn-primary atlas-btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, opacity: canSave ? 1 : 0.4 }}
              disabled={!canSave}
              onClick={() => {
                onSave({
                  cor: cor.trim(),
                  corHex,
                  material,
                  marca: (marca === OUTRA_MARCA ? novaMarca.trim() : marca) || undefined,
                  pesoRolo: parseFloat(pesoRolo),
                  gramasRestantes: Math.min(parseFloat(gramas) || 0, parseFloat(pesoRolo)),
                  quantidade: Math.max(1, parseInt(quantidade) || 1),
                  observacoes: observacoes.trim() || undefined,
                });
              }}
            >
              <Check size={13} strokeWidth={2} />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilamentosPage() {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [filtroMaterial, setFiltroMaterial] = useState<MaterialFilamento | "todos">("todos");
  const [modal, setModal] = useState<{ aberto: boolean; filamento?: Filamento }>({ aberto: false });

  function recarregar() {
    buscarFilamentos().then(setFilamentos);
  }

  useEffect(() => { recarregar() }, []);

  const visiveis = useMemo(
    () => (filtroMaterial === "todos" ? filamentos : filamentos.filter((f) => f.material === filtroMaterial)),
    [filamentos, filtroMaterial],
  );

  const marcas = useMemo(
    () => Array.from(new Set(filamentos.map((f) => f.marca).filter((m): m is string => !!m))),
    [filamentos],
  );

  const totalRolos = filamentos.reduce((s, f) => s + f.quantidade, 0);
  const totalGramas = filamentos.reduce((s, f) => s + f.gramasRestantes * f.quantidade, 0);
  const rolosAcabando = filamentos
    .filter((f) => f.gramasRestantes / f.pesoRolo <= 0.2)
    .reduce((s, f) => s + f.quantidade, 0);

  async function salvar(input: FilamentoInput) {
    if (modal.filamento) await editarFilamento(modal.filamento.id, input);
    else await criarFilamento(input);
    setModal({ aberto: false });
    recarregar();
  }

  async function excluir() {
    if (!modal.filamento) return;
    if (!window.confirm(`Excluir "${modal.filamento.cor}" do inventário?`)) return;
    await deletarFilamento(modal.filamento.id);
    setModal({ aberto: false });
    recarregar();
  }

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Filamentos</h1>
          <p className="alm-page-desc">Inventário de cores e rolos disponíveis</p>
        </div>
        <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setModal({ aberto: true })}>
          <Plus size={14} strokeWidth={1.5} />
          Novo filamento
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div className="atlas-stat"><div className="atlas-stat-label">Rolos ({filamentos.length} cores)</div><div className="atlas-stat-value">{totalRolos}</div></div>
        <div className="atlas-stat"><div className="atlas-stat-label">Total restante</div><div className="atlas-stat-value">{(totalGramas / 1000).toFixed(2).replace(".", ",")} kg</div></div>
        <div className="atlas-stat"><div className="atlas-stat-label">Rolos acabando (≤ 20%)</div><div className="atlas-stat-value" style={{ color: rolosAcabando > 0 ? "var(--status-warning)" : undefined }}>{rolosAcabando}</div></div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["todos", ...MATERIAIS_FILAMENTO] as const).map((m) => (
          <button
            key={m}
            className={`atlas-btn atlas-btn-sm ${filtroMaterial === m ? "atlas-btn-primary" : "atlas-btn-secondary"}`}
            onClick={() => setFiltroMaterial(m)}
          >
            {m === "todos" ? "Todos" : m}
          </button>
        ))}
      </div>

      <div className="atlas-card" style={{ padding: 0 }}>
        <table className="atlas-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 44 }} />
              <th>Cor</th>
              <th>Material</th>
              <th>Marca</th>
              <th className="num">Qtd.</th>
              <th className="num">Restante (por rolo)</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "32px 0", fontSize: 13 }}>Nenhum filamento cadastrado.</td></tr>
            ) : (
              visiveis.map((f) => {
                const pct = Math.max(0, Math.min(100, (f.gramasRestantes / f.pesoRolo) * 100));
                const baixo = pct <= 20;
                return (
                  <tr key={f.id} style={{ cursor: "pointer" }} onClick={() => setModal({ aberto: true, filamento: f })}>
                    <td style={{ padding: "0 8px 0 12px" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: f.corHex, border: "1px solid var(--border-default)" }} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{f.cor}</td>
                    <td><span className="atlas-badge atlas-badge-info">{f.material}</span></td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{f.marca ?? "—"}</td>
                    <td className="num">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{f.quantidade}</span>
                    </td>
                    <td className="num" style={{ minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: baixo ? "var(--status-warning)" : undefined }}>
                          {f.gramasRestantes} g
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>/ {f.pesoRolo} g</span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-input)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: baixo ? "var(--status-warning)" : f.corHex }} />
                      </div>
                    </td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{f.observacoes ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal.aberto && (
        <FilamentoModal
          inicial={modal.filamento}
          marcas={marcas}
          onClose={() => setModal({ aberto: false })}
          onSave={salvar}
          onDelete={modal.filamento ? excluir : undefined}
        />
      )}
    </div>
  );
}
