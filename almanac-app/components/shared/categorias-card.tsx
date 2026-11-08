"use client";

import { useEffect, useState } from "react";
import { Tag, Pencil, Archive, ArchiveRestore, Trash2, Plus, Check, X } from "lucide-react";
import {
  buscarCategorias,
  contarProdutosPorCategoria,
  criarCategoria,
  renomearCategoria,
  arquivarCategoria,
  excluirCategoria,
  CATEGORIA_SISTEMA,
  type Categoria,
} from "@/lib/repositories/categorias";

const mensagem = (err: unknown) => (err instanceof Error ? err.message : "Algo deu errado. Tente de novo.");

export function CategoriasCard() {
  const [itens, setItens] = useState<Categoria[]>([]);
  const [contagem, setContagem] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [nova, setNova] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null);

  async function carregar() {
    try {
      const [cats, cont] = await Promise.all([buscarCategorias(), contarProdutosPorCategoria()]);
      setItens(cats);
      setContagem(cont);
    } catch (err) {
      setErro(mensagem(err));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function executar(acao: () => Promise<void>, aoConcluir?: () => void) {
    setOcupado(true);
    setErro("");
    try {
      await acao();
      aoConcluir?.();
      await carregar();
    } catch (err) {
      setErro(mensagem(err));
    } finally {
      setOcupado(false);
    }
  }

  const btnIcone = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  } as const;

  return (
    <div className="atlas-card">
      <div className="atlas-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag size={14} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
          <span className="atlas-panel-title">Categorias de produto</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
          Renomear atualiza todos os produtos que usam a categoria. Arquive as que não usa mais: somem do cadastro de
          produto, mas os produtos existentes mantêm a categoria. Só é possível excluir categoria sem produtos.
        </p>
      </div>

      <div className="atlas-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {erro && (
          <div
            style={{
              background: "rgba(244,71,71,0.08)",
              border: "1px solid rgba(244,71,71,0.3)",
              borderRadius: "var(--radius-md, 4px)",
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--status-error)",
            }}
          >
            {erro}
          </div>
        )}

        <form
          style={{ display: "flex", gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!nova.trim()) return;
            executar(() => criarCategoria(nova), () => setNova(""));
          }}
        >
          <input
            className="atlas-input"
            placeholder="Nova categoria"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <button
            type="submit"
            className="atlas-btn atlas-btn-primary atlas-btn-sm"
            style={btnIcone}
            disabled={ocupado || !nova.trim()}
          >
            <Plus size={13} strokeWidth={1.5} /> Adicionar
          </button>
        </form>

        {carregando ? (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Carregando…</span>
        ) : (
          <div className="atlas-card" style={{ padding: 0 }}>
            <table className="atlas-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th className="num">Produtos</th>
                  <th>Status</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((cat) => {
                  const sistema = cat.nome === CATEGORIA_SISTEMA;
                  const usos = contagem[cat.nome] ?? 0;
                  const emEdicao = editando === cat.nome;
                  const confirmando = confirmarExcluir === cat.nome;

                  return (
                    <tr key={cat.nome} style={{ cursor: "default" }}>
                      <td>
                        {emEdicao ? (
                          <input
                            className="atlas-input"
                            autoFocus
                            value={rascunho}
                            onChange={(e) => setRascunho(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                executar(() => renomearCategoria(cat.nome, rascunho), () => setEditando(null));
                              }
                              if (e.key === "Escape") setEditando(null);
                            }}
                            style={{ maxWidth: 260, height: 32 }}
                          />
                        ) : (
                          <span style={{ fontWeight: 500 }}>
                            {cat.nome}
                            {sistema && (
                              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-tertiary)" }}>(sistema)</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)" }}>
                        {usos}
                      </td>
                      <td>
                        <span className="atlas-badge">{cat.arquivada ? "Arquivada" : "Ativa"}</span>
                      </td>
                      <td className="num">
                        {sistema ? (
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Protegida</span>
                        ) : emEdicao ? (
                          <span style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-primary atlas-btn-sm"
                              style={btnIcone}
                              disabled={ocupado}
                              onClick={() => executar(() => renomearCategoria(cat.nome, rascunho), () => setEditando(null))}
                            >
                              <Check size={13} strokeWidth={1.5} /> Salvar
                            </button>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                              style={btnIcone}
                              onClick={() => setEditando(null)}
                            >
                              <X size={13} strokeWidth={1.5} />
                            </button>
                          </span>
                        ) : confirmando ? (
                          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Excluir “{cat.nome}”?</span>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-primary atlas-btn-sm"
                              disabled={ocupado}
                              onClick={() => executar(() => excluirCategoria(cat.nome), () => setConfirmarExcluir(null))}
                            >
                              Excluir
                            </button>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                              onClick={() => setConfirmarExcluir(null)}
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                              style={btnIcone}
                              disabled={ocupado}
                              onClick={() => {
                                setEditando(cat.nome);
                                setRascunho(cat.nome);
                              }}
                            >
                              <Pencil size={13} strokeWidth={1.5} /> Editar
                            </button>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                              style={btnIcone}
                              disabled={ocupado}
                              onClick={() => executar(() => arquivarCategoria(cat.nome, !cat.arquivada))}
                            >
                              {cat.arquivada ? (
                                <>
                                  <ArchiveRestore size={13} strokeWidth={1.5} /> Desarquivar
                                </>
                              ) : (
                                <>
                                  <Archive size={13} strokeWidth={1.5} /> Arquivar
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                              style={btnIcone}
                              disabled={ocupado || usos > 0}
                              title={usos > 0 ? "Há produtos nesta categoria. Mova-os ou arquive a categoria." : "Excluir categoria"}
                              onClick={() => setConfirmarExcluir(cat.nome)}
                            >
                              <Trash2 size={13} strokeWidth={1.5} />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
