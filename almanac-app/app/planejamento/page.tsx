"use client";

import { useState, useEffect, useMemo, useRef, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
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
} from "@/lib/repositories/planejamento-instagram";

type Visao = "quadro" | "calendario" | "tabela";
type Patch = Partial<PostInstagramInput>;

const VISOES: { id: Visao; rotulo: string }[] = [
  { id: "quadro", rotulo: "Quadro" },
  { id: "calendario", rotulo: "Calendário" },
  { id: "tabela", rotulo: "Tabela" },
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const COR_STATUS: Record<StatusPost, string> = {
  ideia: "var(--text-muted)",
  roteiro: "var(--status-info)",
  produzido: "var(--status-warning)",
  agendado: "var(--accent-primary)",
  publicado: "var(--status-success)",
};

// Data local como AAAA-MM-DD (evita o deslocamento de fuso do toISOString).
function chaveData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function ordenar(lista: PostInstagram[]): PostInstagram[] {
  return [...lista].sort((a, b) => {
    const da = a.data ?? "9999";
    const db = b.data ?? "9999";
    if (da !== db) return da < db ? -1 : 1;
    return a.criadoEm.localeCompare(b.criadoEm);
  });
}

// ── Campo de texto que salva ao sair (como o Notion) ─────────

function CampoTexto({
  valor,
  onSalvar,
  placeholder,
  estilo,
  multilinha,
  linhas,
}: {
  valor: string;
  onSalvar: (v: string) => void;
  placeholder?: string;
  estilo?: React.CSSProperties;
  multilinha?: boolean;
  linhas?: number;
}) {
  const [rascunho, setRascunho] = useState(valor);
  useEffect(() => setRascunho(valor), [valor]);

  const base: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontFamily: "var(--font-ui)",
    fontSize: 14,
    padding: "4px 0",
    ...estilo,
  };

  const commit = () => {
    if (rascunho !== valor) onSalvar(rascunho);
  };

  return multilinha ? (
    <textarea
      value={rascunho}
      placeholder={placeholder}
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={commit}
      style={{ ...base, resize: "vertical", lineHeight: 1.6 }}
      rows={linhas ?? 5}
    />
  ) : (
    <input
      value={rascunho}
      placeholder={placeholder}
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      style={base}
    />
  );
}

// Linha de propriedade: rótulo à esquerda, controle à direita.
function Propriedade({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center", minHeight: 34, padding: "0 6px", borderRadius: "var(--radius-sm)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>{rotulo}</span>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

const selectNotion: React.CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--text-primary)",
  fontFamily: "var(--font-ui)",
  fontSize: 13,
  padding: "4px 0",
  cursor: "pointer",
};

// ── Painel lateral de um post (estilo "página" do Notion) ────

function PainelPost({
  post,
  onPatch,
  onDelete,
  onClose,
}: {
  post: PostInstagram;
  onPatch: (patch: Patch) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          maxHeight: "calc(100vh - 32px)",
          background: "var(--bg-base)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          overflowY: "auto",
          padding: "16px 28px 28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>Instagram · {ROTULO_FORMATO[post.formato]}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onDelete} aria-label="Excluir post">
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onClose} aria-label="Fechar">
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <CampoTexto
          valor={post.titulo}
          placeholder="Sem título"
          onSalvar={(v) => onPatch({ titulo: v.trim() || "Sem título" })}
          estilo={{ fontSize: 28, fontWeight: 700, padding: "4px 0 16px", letterSpacing: "-0.01em" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
          <Propriedade rotulo="Status">
            <select style={selectNotion} value={post.status} onChange={(e) => onPatch({ status: e.target.value as StatusPost })}>
              {STATUS_POST.map((s) => <option key={s} value={s}>{ROTULO_STATUS[s]}</option>)}
            </select>
          </Propriedade>

          <Propriedade rotulo="Formato">
            <select style={selectNotion} value={post.formato} onChange={(e) => onPatch({ formato: e.target.value as PostInstagram["formato"] })}>
              {FORMATOS_INSTAGRAM.map((f) => <option key={f} value={f}>{ROTULO_FORMATO[f]}</option>)}
            </select>
          </Propriedade>

          <Propriedade rotulo="Data">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="date"
                value={post.data ?? ""}
                onChange={(e) => onPatch({ data: e.target.value || undefined })}
                style={{ ...selectNotion, colorScheme: "dark" }}
              />
              {!post.data && (post.status === "agendado" || post.status === "publicado") && (
                <span style={{ color: "var(--status-warning)", fontSize: 12 }}>Defina uma data</span>
              )}
            </div>
          </Propriedade>

        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
          <div style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 6 }}>Legenda</div>
          <CampoTexto
            multilinha
            valor={post.legenda ?? ""}
            placeholder="Escreva a legenda…"
            onSalvar={(v) => onPatch({ legenda: v.trim() || undefined })}
          />
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, marginTop: 16 }}>
          <div style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 6 }}>Notas internas</div>
          <CampoTexto
            multilinha
            valor={post.observacoes ?? ""}
            linhas={12}
            placeholder="Roteiro, referências, lembretes…"
            onSalvar={(v) => onPatch({ observacoes: v.trim() || undefined })}
          />
        </div>
      </aside>
    </div>
  );
}

// ── Cartão de post (quadro, calendário e tabela) ─────────────

function Cartao({
  post,
  onAbrir,
  compacto,
}: {
  post: PostInstagram;
  onAbrir: () => void;
  compacto?: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", post.id)}
      onClick={(e) => { e.stopPropagation(); onAbrir(); }}
      style={{
        display: "flex",
        alignItems: compacto ? "flex-start" : "center",
        gap: 6,
        padding: compacto ? "4px 6px" : "8px 10px",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-raised)",
        border: "1px solid var(--border-subtle)",
        cursor: "pointer",
        fontSize: compacto ? 12 : 13,
        lineHeight: 1.35,
        color: "var(--text-primary)",
        minWidth: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-raised)")}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: COR_STATUS[post.status], flexShrink: 0, marginTop: compacto ? 4 : 0 }} />
      <span style={{ whiteSpace: "normal", overflowWrap: "anywhere", minWidth: 0 }}>
        {post.titulo || "Sem título"}
      </span>
      {!compacto && (
        <span style={{ marginLeft: "auto", color: "var(--text-tertiary)", fontSize: 11, whiteSpace: "nowrap" }}>
          {ROTULO_FORMATO[post.formato]}{post.data ? ` · ${dataCurta(post.data)}` : ""}
        </span>
      )}
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────

export default function PlanejamentoPage() {
  const [posts, setPosts] = useState<PostInstagram[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [visao, setVisao] = useState<Visao>("quadro");
  const [aberto, setAberto] = useState<string | null>(null);
  const [mes, setMes] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });
  const [arrastando, setArrastando] = useState<string | null>(null);

  async function recarregar() {
    setPosts(await buscarPosts());
  }

  useEffect(() => {
    recarregar()
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."))
      .finally(() => setCarregando(false));
  }, []);

  // Aplica a mudança na tela na hora e grava em seguida; se falhar, recarrega do banco.
  function atualizar(id: string, patch: Patch) {
    const limpo: Patch = { ...patch };
    setPosts((ps) => ordenar(ps.map((p) => (p.id === id ? { ...p, ...limpo } : p))));
    editarPost(id, limpo).catch((e) => {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
      recarregar();
    });
  }

  async function novoPost(inicial: Partial<PostInstagramInput> = {}) {
    try {
      const criado = await criarPost({ titulo: "", formato: "feed", status: "ideia", ...inicial });
      setPosts((ps) => ordenar([...ps, criado]));
      setAberto(criado.id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar.");
    }
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir este post?")) return;
    setAberto(null);
    setPosts((ps) => ps.filter((p) => p.id !== id));
    try {
      await deletarPost(id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
      recarregar();
    }
  }

  const postAberto = posts.find((p) => p.id === aberto) ?? null;

  // Grade do mês: começa no domingo anterior ao dia 1.
  const grade = useMemo(() => {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());
    const celulas = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
    return celulas.slice(35).every((d) => d.getMonth() !== mes.getMonth()) ? celulas.slice(0, 35) : celulas;
  }, [mes]);

  const postsPorDia = useMemo(() => {
    const mapa: Record<string, PostInstagram[]> = {};
    for (const p of posts) if (p.data) (mapa[p.data] ??= []).push(p);
    return mapa;
  }, [posts]);

  const hoje = chaveData(new Date());

  // Soltar um post num dia do calendário remarca; ideias viram roteiro.
  function soltarNoDia(chave: string, e: DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    const patch: Patch = { data: chave };
    if (p.status === "ideia") patch.status = "roteiro";
    atualizar(id, patch);
  }

  function soltarNoStatus(status: StatusPost, e: DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const p = posts.find((x) => x.id === id);
    if (!p || p.status === status) return;
    atualizar(id, { status });
  }

  const tituloMes = `${MESES[mes.getMonth()]} ${mes.getFullYear()}`;

  return (
    <div className="alm-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <h1 className="alm-page-title" style={{ marginBottom: 4 }}>Planejamento</h1>
          <p className="alm-page-desc" style={{ margin: 0 }}>Conteúdo do Instagram</p>
        </div>
        <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => novoPost()}>
          <Plus size={14} strokeWidth={1.5} />
          Novo
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", marginBottom: 16 }}>
        {VISOES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVisao(v.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${visao === v.id ? "var(--text-primary)" : "transparent"}`,
              color: visao === v.id ? "var(--text-primary)" : "var(--text-tertiary)",
              padding: "8px 10px",
              marginBottom: -1,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            {v.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <div style={{ color: "var(--status-error)", fontSize: 13, marginBottom: 12 }}>
          {erro}{" "}
          <button onClick={() => setErro(null)} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer" }}>fechar</button>
        </div>
      )}

      {carregando ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "24px 0" }}>Carregando…</div>
      ) : visao === "quadro" ? (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
          {STATUS_POST.map((status) => {
            const itens = posts.filter((p) => p.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => soltarNoStatus(status, e)}
                style={{ width: 250, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 6px", fontSize: 13 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COR_STATUS[status] }} />
                    {ROTULO_STATUS[status]}
                    <span style={{ color: "var(--text-tertiary)" }}>{itens.length}</span>
                  </span>
                  <button
                    onClick={() => novoPost({ status })}
                    className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm"
                    aria-label={`Novo post em ${ROTULO_STATUS[status]}`}
                  >
                    <Plus size={13} strokeWidth={1.5} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 120, borderRadius: "var(--radius-sm)", padding: 2 }}>
                  {itens.map((p) => (
                    <Cartao key={p.id} post={p} onAbrir={() => setAberto(p.id)} />
                  ))}
                  <button
                    onClick={() => novoPost({ status })}
                    style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", textAlign: "left", padding: "6px 10px", fontSize: 13, cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    + Novo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : visao === "calendario" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mês anterior">
              <ChevronLeft size={15} strokeWidth={1.5} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15, minWidth: 160, textAlign: "center" }}>{tituloMes}</span>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Próximo mês">
              <ChevronRight size={15} strokeWidth={1.5} />
            </button>
            <button className="atlas-btn atlas-btn-ghost atlas-btn-sm" onClick={() => { const h = new Date(); setMes(new Date(h.getFullYear(), h.getMonth(), 1)); }}>
              Hoje
            </button>
          </div>

          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-subtle)" }}>
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ padding: "6px 8px", fontSize: 12, color: "var(--text-tertiary)" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {grade.map((d) => {
                const chave = chaveData(d);
                const doMes = d.getMonth() === mes.getMonth();
                const lista = postsPorDia[chave] ?? [];
                const ehHoje = chave === hoje;
                return (
                  <div
                    key={chave}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => soltarNoDia(chave, e)}
                    onClick={() => novoPost({ data: chave, status: "roteiro" })}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{
                      minHeight: 100,
                      padding: 6,
                      borderRight: "1px solid var(--border-subtle)",
                      borderBottom: "1px solid var(--border-subtle)",
                      opacity: doMes ? 1 : 0.4,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        alignSelf: "flex-start",
                        fontSize: 12,
                        minWidth: 22,
                        textAlign: "center",
                        padding: "1px 4px",
                        borderRadius: "var(--radius-full)",
                        background: ehHoje ? "var(--accent-primary)" : "transparent",
                        color: ehHoje ? "var(--text-inverse)" : "var(--text-secondary)",
                      }}
                    >
                      {d.getDate()}
                    </span>
                    {lista.map((p) => (
                      <Cartao key={p.id} post={p} compacto onAbrir={() => setAberto(p.id)} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,2fr) 130px 110px 130px", gap: 8, padding: "6px 8px", borderBottom: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-tertiary)" }}>
              <span>Título</span><span>Status</span><span>Formato</span><span>Data</span>
            </div>
            {posts.length === 0 && (
              <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "20px 8px" }}>Nenhum post ainda.</div>
            )}
            {posts.map((p) => (
              <div
                key={p.id}
                style={{ display: "grid", gridTemplateColumns: "minmax(220px,2fr) 130px 110px 130px", gap: 8, alignItems: "center", padding: "0 8px", minHeight: 36, borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <button onClick={() => setAberto(p.id)} style={{ background: "none", border: "none", color: "var(--text-primary)", textAlign: "left", padding: 0, cursor: "pointer", fontSize: 13, fontFamily: "var(--font-ui)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.titulo || "Sem título"}
                </button>
                <select style={{ ...selectNotion, fontSize: 12 }} value={p.status} onChange={(e) => atualizar(p.id, { status: e.target.value as StatusPost })}>
                  {STATUS_POST.map((s) => <option key={s} value={s}>{ROTULO_STATUS[s]}</option>)}
                </select>
                <select style={{ ...selectNotion, fontSize: 12 }} value={p.formato} onChange={(e) => atualizar(p.id, { formato: e.target.value as PostInstagram["formato"] })}>
                  {FORMATOS_INSTAGRAM.map((f) => <option key={f} value={f}>{ROTULO_FORMATO[f]}</option>)}
                </select>
                <input type="date" value={p.data ?? ""} onChange={(e) => atualizar(p.id, { data: e.target.value || undefined })} style={{ ...selectNotion, fontSize: 12, colorScheme: "dark" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {postAberto && (
        <PainelPost
          key={postAberto.id}
          post={postAberto}
          onPatch={(patch) => atualizar(postAberto.id, patch)}
          onDelete={() => excluir(postAberto.id)}
          onClose={() => setAberto(null)}
        />
      )}
    </div>
  );
}
