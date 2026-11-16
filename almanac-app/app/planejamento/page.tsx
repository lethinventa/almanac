"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Check, Trash2 } from "lucide-react";
import {
  buscarPosts,
  criarPost,
  editarPost,
  deletarPost,
  FORMATOS_INSTAGRAM,
  STATUS_POST,
  ROTULO_STATUS,
  ROTULO_FORMATO,
  type PostInstagram,
  type PostInstagramInput,
  type StatusPost,
  type VinculoPost,
} from "@/lib/repositories/planejamento-instagram";
import { listarProdutos, type Produto } from "@/lib/repositories/produtos-registro";
import { buscarProdutosPE, type ProdutoPE } from "@/lib/repositories/pronta-entrega";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Cor de cada status, usando os tokens do Atlas já existentes.
const COR_STATUS: Record<StatusPost, string> = {
  ideia: "var(--text-tertiary)",
  roteiro: "var(--status-info, var(--text-secondary))",
  produzido: "var(--status-warning)",
  agendado: "var(--accent-default, var(--text-primary))",
  publicado: "var(--status-success)",
};

// Data local como AAAA-MM-DD (evita o deslocamento de fuso do toISOString).
function chaveData(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

function formatarDataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// ── Modal ────────────────────────────────────────────────────

interface FormState {
  titulo: string;
  formato: PostInstagramInput["formato"];
  status: StatusPost;
  data: string;
  legenda: string;
  hashtags: string;
  observacoes: string;
  vinculoTipo: "" | "produto" | "pe";
  vinculoId: string;
}

function formInicial(post?: PostInstagram, dataPadrao?: string): FormState {
  return {
    titulo: post?.titulo ?? "",
    formato: post?.formato ?? "feed",
    status: post?.status ?? (dataPadrao ? "roteiro" : "ideia"),
    data: post?.data ?? dataPadrao ?? "",
    legenda: post?.legenda ?? "",
    hashtags: post?.hashtags ?? "",
    observacoes: post?.observacoes ?? "",
    vinculoTipo: post?.vinculo?.tipo ?? "",
    vinculoId: post?.vinculo?.id ?? "",
  };
}

function PostModal({
  post,
  dataPadrao,
  produtos,
  produtosPE,
  onClose,
  onSave,
  onDelete,
}: {
  post?: PostInstagram;
  dataPadrao?: string;
  produtos: Produto[];
  produtosPE: ProdutoPE[];
  onClose: () => void;
  onSave: (dados: PostInstagramInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [f, setF] = useState<FormState>(() => formInicial(post, dataPadrao));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  // Se o status exige data, ela é obrigatória.
  const exigeData = f.status === "agendado" || f.status === "publicado";
  const canSave = f.titulo.trim().length > 0 && (!exigeData || f.data !== "");

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const vinculo: VinculoPost | undefined =
        f.vinculoTipo && f.vinculoId ? { tipo: f.vinculoTipo, id: f.vinculoId } : undefined;
      await onSave({
        titulo: f.titulo.trim(),
        formato: f.formato,
        status: f.status,
        data: f.data || undefined,
        legenda: f.legenda.trim() || undefined,
        hashtags: f.hashtags.trim() || undefined,
        observacoes: f.observacoes.trim() || undefined,
        vinculo,
      });
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!onDelete) return;
    if (!window.confirm("Excluir este post do planejamento?")) return;
    setSalvando(true);
    try {
      await onDelete();
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
      setSalvando(false);
    }
  }

  const opcoesVinculo =
    f.vinculoTipo === "produto"
      ? produtos.map((p) => ({ id: p.id, nome: p.nome }))
      : f.vinculoTipo === "pe"
        ? produtosPE.map((p) => ({ id: p.id, nome: p.nome }))
        : [];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", width: 560, maxWidth: "100%", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-default)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{post ? "Editar post" : "Novo post"} · Instagram</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onClose}><X size={14} strokeWidth={1.5} /></button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Título / assunto *</label>
            <input autoFocus className="atlas-input" placeholder="Ex: Bastidores da caderneta nova" value={f.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Formato</label>
              <select className="atlas-input" value={f.formato} onChange={(e) => set("formato", e.target.value as FormState["formato"])}>
                {FORMATOS_INSTAGRAM.map((x) => <option key={x} value={x}>{ROTULO_FORMATO[x]}</option>)}
              </select>
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Status</label>
              <select className="atlas-input" value={f.status} onChange={(e) => set("status", e.target.value as StatusPost)}>
                {STATUS_POST.map((s) => <option key={s} value={s}>{ROTULO_STATUS[s]}</option>)}
              </select>
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Data {exigeData ? "*" : ""}</label>
              <input className="atlas-input" type="date" value={f.data} onChange={(e) => set("data", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Vincular a</label>
              <select
                className="atlas-input"
                value={f.vinculoTipo}
                onChange={(e) => setF((s) => ({ ...s, vinculoTipo: e.target.value as FormState["vinculoTipo"], vinculoId: "" }))}
              >
                <option value="">Nada</option>
                <option value="produto">Produto</option>
                <option value="pe">Pronta entrega</option>
              </select>
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Item</label>
              <select className="atlas-input" value={f.vinculoId} disabled={!f.vinculoTipo} onChange={(e) => set("vinculoId", e.target.value)}>
                <option value="">{f.vinculoTipo ? "Selecione…" : "—"}</option>
                {opcoesVinculo.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Legenda</label>
            <textarea className="atlas-input" rows={4} placeholder="Texto da legenda" value={f.legenda} onChange={(e) => set("legenda", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Hashtags</label>
            <input className="atlas-input" placeholder="#papelaria #cadernos" value={f.hashtags} onChange={(e) => set("hashtags", e.target.value)} />
          </div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Observações internas</label>
            <input className="atlas-input" placeholder="Ideias de roteiro, referências, lembretes" value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>

          {erro && <div style={{ color: "var(--status-error)", fontSize: 12 }}>{erro}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--border-default)" }}>
          <div>
            {post && onDelete && (
              <button className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--status-error)" }} onClick={excluir} disabled={salvando}>
                <Trash2 size={13} strokeWidth={1.5} />
                Excluir
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
            <button
              className="atlas-btn atlas-btn-primary atlas-btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, opacity: canSave && !salvando ? 1 : 0.4 }}
              disabled={!canSave || salvando}
              onClick={salvar}
            >
              <Check size={13} strokeWidth={2} />
              {post ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cartão de post (usado no calendário e no kanban) ─────────

function Chip({ post, onClick, compacto }: { post: PostInstagram; onClick: () => void; compacto?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={post.titulo}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--bg-input)",
        border: "1px solid var(--border-default)",
        borderLeft: `3px solid ${COR_STATUS[post.status]}`,
        borderRadius: "var(--radius-sm)",
        padding: compacto ? "2px 5px" : "8px 10px",
        fontSize: compacto ? 11 : 12,
        color: "var(--text-primary)",
        cursor: "pointer",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {compacto ? post.titulo : (
        <>
          <div style={{ fontWeight: 600, whiteSpace: "normal" }}>{post.titulo}</div>
          <div style={{ color: "var(--text-tertiary)", fontSize: 11, marginTop: 2 }}>
            {ROTULO_FORMATO[post.formato]}{post.data ? ` · ${formatarDataCurta(post.data)}` : ""}
          </div>
        </>
      )}
    </button>
  );
}

// ── Página ───────────────────────────────────────────────────

type Visao = "calendario" | "kanban";

export default function PlanejamentoPage() {
  const [posts, setPosts] = useState<PostInstagram[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosPE, setProdutosPE] = useState<ProdutoPE[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [visao, setVisao] = useState<Visao>("calendario");
  const [mes, setMes] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });
  // modal: null fechado; { post } edição; { dataPadrao? } novo
  const [modal, setModal] = useState<null | { post?: PostInstagram; dataPadrao?: string }>(null);

  async function recarregar() {
    const [p, pr, pe] = await Promise.all([buscarPosts(), listarProdutos(), buscarProdutosPE()]);
    setPosts(p);
    setProdutos(pr);
    setProdutosPE(pe);
  }

  useEffect(() => {
    recarregar()
      .catch((e) => setErroCarga(e instanceof Error ? e.message : "Erro ao carregar."))
      .finally(() => setCarregando(false));
  }, []);

  const ideias = useMemo(() => posts.filter((p) => p.status === "ideia"), [posts]);

  // Grade do mês: começa no domingo anterior ao dia 1 e completa semanas.
  const grade = useMemo(() => {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());
    const celulas: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      celulas.push(d);
    }
    // Se a última semana estiver toda no mês seguinte, mostra só 5 semanas.
    const ultimaSemanaForaDoMes = celulas.slice(35).every((d) => d.getMonth() !== mes.getMonth());
    return ultimaSemanaForaDoMes ? celulas.slice(0, 35) : celulas;
  }, [mes]);

  const postsPorDia = useMemo(() => {
    const mapa: Record<string, PostInstagram[]> = {};
    for (const p of posts) {
      if (!p.data) continue;
      (mapa[p.data] ??= []).push(p);
    }
    return mapa;
  }, [posts]);

  const hoje = chaveData(new Date());

  async function salvar(dados: PostInstagramInput, id?: string) {
    if (id) await editarPost(id, dados);
    else await criarPost(dados);
    await recarregar();
  }

  async function excluir(id: string) {
    await deletarPost(id);
    await recarregar();
  }

  function abrirPost(post: PostInstagram) {
    setModal({ post });
  }

  const tituloMes = `${MESES[mes.getMonth()]} ${mes.getFullYear()}`;

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Planejamento</h1>
          <p className="alm-page-desc">Calendário e ideias de conteúdo para o Instagram</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "inline-flex", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            {(["calendario", "kanban"] as Visao[]).map((v) => (
              <button
                key={v}
                type="button"
                className="atlas-btn atlas-btn-sm"
                onClick={() => setVisao(v)}
                style={{ borderRadius: 0, background: visao === v ? "var(--bg-input)" : "transparent", color: visao === v ? "var(--text-primary)" : "var(--text-tertiary)" }}
              >
                {v === "calendario" ? "Calendário" : "Kanban"}
              </button>
            ))}
          </div>
          <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setModal({})}>
            <Plus size={14} strokeWidth={1.5} />
            Novo post
          </button>
        </div>
      </div>

      {erroCarga && <div style={{ color: "var(--status-error)", fontSize: 13 }}>{erroCarga}</div>}

      {carregando ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "24px 0" }}>Carregando…</div>
      ) : visao === "calendario" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mês anterior">
              <ChevronLeft size={15} strokeWidth={1.5} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15, minWidth: 170, textAlign: "center" }}>{tituloMes}</span>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Próximo mês">
              <ChevronRight size={15} strokeWidth={1.5} />
            </button>
            <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={() => { const h = new Date(); setMes(new Date(h.getFullYear(), h.getMonth(), 1)); }}>
              Hoje
            </button>
          </div>

          <div className="atlas-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-default)" }}>
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ padding: "8px 10px", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {grade.map((d) => {
                const chave = chaveData(d);
                const doMes = d.getMonth() === mes.getMonth();
                const lista = postsPorDia[chave] ?? [];
                return (
                  <div
                    key={chave}
                    onClick={() => setModal({ dataPadrao: chave })}
                    style={{
                      minHeight: 104,
                      padding: 6,
                      borderRight: "1px solid var(--border-default)",
                      borderBottom: "1px solid var(--border-default)",
                      background: doMes ? "transparent" : "var(--bg-sunken, transparent)",
                      opacity: doMes ? 1 : 0.5,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        alignSelf: "flex-start",
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        fontWeight: chave === hoje ? 700 : 400,
                        color: chave === hoje ? "var(--accent-default, var(--text-primary))" : "var(--text-secondary)",
                      }}
                    >
                      {d.getDate()}
                    </span>
                    {lista.map((p) => (
                      <div key={p.id} onClick={(e) => e.stopPropagation()}>
                        <Chip post={p} compacto onClick={() => abrirPost(p)} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {ideias.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Banco de ideias ({ideias.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {ideias.map((p) => <Chip key={p.id} post={p} onClick={() => abrirPost(p)} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUS_POST.length}, minmax(180px, 1fr))`, gap: 10, overflowX: "auto" }}>
          {STATUS_POST.map((status) => {
            const itens = posts.filter((p) => p.status === status);
            return (
              <div key={status} className="atlas-card" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COR_STATUS[status] }} />
                    {ROTULO_STATUS[status]}
                  </span>
                  <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{itens.length}</span>
                </div>
                {itens.length === 0 && (
                  <div style={{ color: "var(--text-tertiary)", fontSize: 12, padding: "8px 2px" }}>Nenhum post</div>
                )}
                {itens.map((p) => <Chip key={p.id} post={p} onClick={() => abrirPost(p)} />)}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <PostModal
          post={modal.post}
          dataPadrao={modal.dataPadrao}
          produtos={produtos}
          produtosPE={produtosPE}
          onClose={() => setModal(null)}
          onSave={(dados) => salvar(dados, modal.post?.id)}
          onDelete={modal.post ? () => excluir(modal.post!.id) : undefined}
        />
      )}
    </div>
  );
}
