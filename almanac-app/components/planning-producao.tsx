"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Factory } from "lucide-react";
import {
  buscarEncomendas,
  editarEncomenda,
  type Encomenda,
  type EncomendaItem,
  type EtapaProducao,
} from "@/lib/repositories/encomendas";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";
import { CATEGORIA_SISTEMA } from "@/lib/repositories/categorias";
import { formatDate } from "@/lib/utils";

type Distribuicao = Record<EtapaProducao, number>;

// Cada item tem uma contagem de peças por etapa. A soma sempre bate com a quantidade.
interface Cartao {
  key: string; // item + etapa
  encomendaId: string;
  itemIndex: number;
  cliente: string;
  dataEntrega: string;
  produto: string;
  quantidade: number;
  etapa: EtapaProducao;
  pecas: number; // quantas peças deste item estão nesta etapa
  itens: EncomendaItem[];
}

const ETAPAS: { id: EtapaProducao; titulo: string; cor: string }[] = [
  { id: "impressao", titulo: "Impressão", cor: "var(--accent-primary)" },
  { id: "acabamento", titulo: "Acabamento", cor: "var(--status-warning)" },
  { id: "embalagem", titulo: "Embalagem", cor: "var(--accent-highlight)" },
  { id: "finalizado", titulo: "Finalizado", cor: "var(--status-success)" },
];

const ENCERRADAS = ["entregue", "cancelado"];

// Distribuição completa e consistente com a quantidade; o que faltar fica em impressão.
function distribuicaoDe(item: EncomendaItem): Distribuicao {
  const d: Distribuicao = { impressao: 0, acabamento: 0, embalagem: 0, finalizado: 0 };
  if (!item.etapas) {
    d.impressao = item.quantidade;
    return d;
  }
  for (const e of ETAPAS) d[e.id] = Math.max(0, Math.round(item.etapas[e.id] ?? 0));
  const soma = ETAPAS.reduce((s, e) => s + d[e.id], 0);
  if (soma > item.quantidade) {
    // Excesso (ex.: quantidade diminuiu): corta de trás para frente
    let excesso = soma - item.quantidade;
    for (const e of [...ETAPAS].reverse()) {
      const tira = Math.min(d[e.id], excesso);
      d[e.id] -= tira;
      excesso -= tira;
    }
  } else {
    d.impressao += item.quantidade - soma;
  }
  return d;
}

function montarCartoes(encs: Encomenda[], produtos: ProdutoCalculado[]): Cartao[] {
  const mapa = new Map(produtos.map((p) => [p.id, p]));
  const cartoes: Cartao[] = [];

  for (const enc of encs) {
    if (ENCERRADAS.includes(enc.status)) continue;
    enc.itens.forEach((item, itemIndex) => {
      const prod = mapa.get(item.produtoId);
      if (!prod || prod.categoria !== CATEGORIA_SISTEMA) return;
      const dist = distribuicaoDe(item);
      for (const e of ETAPAS) {
        if (dist[e.id] <= 0) continue;
        cartoes.push({
          key: `${enc.id}-${itemIndex}-${e.id}`,
          encomendaId: enc.id,
          itemIndex,
          cliente: enc.cliente,
          dataEntrega: enc.dataEntrega,
          produto: prod.nome,
          quantidade: item.quantidade,
          etapa: e.id,
          pecas: dist[e.id],
          itens: enc.itens,
        });
      }
    });
  }

  return cartoes.sort(
    (a, b) => a.dataEntrega.localeCompare(b.dataEntrega) || a.produto.localeCompare(b.produto)
  );
}

export function PlanningProducao() {
  const [cartoes, setCartoes] = useState<Cartao[] | null>(null);
  const [erro, setErro] = useState("");
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<EtapaProducao | null>(null);

  function recarregar() {
    return Promise.all([buscarEncomendas(), buscarProdutos()]).then(([encs, prods]) =>
      setCartoes(montarCartoes(encs, prods))
    );
  }

  useEffect(() => {
    recarregar().catch((e) => setErro(String(e)));
  }, []);

  // Move `n` peças de um item da etapa `de` para `para`
  async function mover(cartao: Cartao, para: EtapaProducao, n: number) {
    if (cartao.etapa === para || n <= 0) return;
    const item = cartao.itens[cartao.itemIndex];
    const d = distribuicaoDe(item);
    const movidas = Math.min(n, d[cartao.etapa]);
    d[cartao.etapa] -= movidas;
    d[para] += movidas;
    const novoItem: EncomendaItem = { ...item, etapas: d };
    const novosItens = cartao.itens.map((it, i) => (i === cartao.itemIndex ? novoItem : it));

    setErro("");
    try {
      await editarEncomenda(cartao.encomendaId, { itens: novosItens });
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
      await recarregar();
    }
  }

  function vizinha(etapa: EtapaProducao, delta: -1 | 1): EtapaProducao | null {
    const i = ETAPAS.findIndex((e) => e.id === etapa) + delta;
    return ETAPAS[i]?.id ?? null;
  }

  function soltar(etapa: EtapaProducao) {
    const cartao = cartoes?.find((c) => c.key === arrastando);
    setArrastando(null);
    setColunaAlvo(null);
    if (cartao) mover(cartao, etapa, cartao.pecas); // arrastar leva todas as peças daquela etapa
  }

  const itensAbertos = new Set((cartoes ?? []).filter((c) => c.etapa !== "finalizado").map((c) => c.encomendaId + c.itemIndex));
  const pecasAbertas = (cartoes ?? [])
    .filter((c) => c.etapa !== "finalizado")
    .reduce((s, c) => s + c.pecas, 0);

  return (
    <section className="atlas-card" style={{ padding: 0, overflow: "hidden" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Factory size={15} strokeWidth={1.6} style={{ color: "var(--text-tertiary)" }} />
          <span className="atlas-panel-title">Planning de produção</span>
        </div>
        {cartoes && (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {pecasAbertas} {pecasAbertas === 1 ? "peça" : "peças"} em produção · {itensAbertos.size}{" "}
            {itensAbertos.size === 1 ? "item" : "itens"}
          </span>
        )}
      </header>

      <div style={{ padding: 12 }}>
        {erro && <div style={{ fontSize: 12, color: "var(--status-error)", marginBottom: 8 }}>{erro}</div>}

        {cartoes === null && !erro && (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Carregando…</span>
        )}

        {cartoes !== null && cartoes.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", padding: "20px 0" }}>
            Nenhuma peça de impressão 3D em encomendas abertas.
          </div>
        )}

        {cartoes !== null && cartoes.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
            {ETAPAS.map((col) => {
              const doGrupo = cartoes.filter((c) => c.etapa === col.id);
              const pecasNaColuna = doGrupo.reduce((s, c) => s + c.pecas, 0);
              const ativa = colunaAlvo === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    if (!arrastando) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (colunaAlvo !== col.id) setColunaAlvo(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setColunaAlvo(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    soltar(col.id);
                  }}
                  style={{
                    background: "var(--bg-input)",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    minWidth: 0,
                    outline: ativa ? `2px dashed ${col.cor}` : "2px dashed transparent",
                    outlineOffset: -2,
                    transition: "outline-color 120ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 2px 4px" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.cor }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{col.titulo}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
                      {pecasNaColuna} {pecasNaColuna === 1 ? "peça" : "peças"}
                    </span>
                  </div>

                  {doGrupo.length === 0 && (
                    <div style={{ padding: "14px 6px", fontSize: 11, color: "var(--text-tertiary)", textAlign: "center" }}>
                      Vazio
                    </div>
                  )}

                  {doGrupo.map((c) => {
                    const antes = vizinha(c.etapa, -1);
                    const depois = vizinha(c.etapa, 1);
                    const atrasado =
                      c.etapa !== "finalizado" &&
                      new Date(`${c.dataEntrega}T00:00:00`) < new Date(new Date().toDateString());

                    return (
                      <article
                        key={c.key}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", c.key);
                          setArrastando(c.key);
                        }}
                        onDragEnd={() => {
                          setArrastando(null);
                          setColunaAlvo(null);
                        }}
                        style={{
                          cursor: "grab",
                          opacity: arrastando === c.key ? 0.4 : 1,
                          background: "var(--bg-raised)",
                          border: `1px solid ${atrasado ? "rgba(244,71,71,0.5)" : "var(--border-default)"}`,
                          borderRadius: 6,
                          padding: "8px 10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                            {c.produto}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "var(--font-mono)",
                              color: atrasado ? "var(--status-error)" : "var(--text-tertiary)",
                              fontWeight: atrasado ? 600 : 400,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDate(c.dataEntrega).slice(0, 5)}
                          </span>
                        </div>

                        <div style={{ fontSize: 10, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.cliente}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                          <button
                            type="button"
                            onClick={() => antes && mover(c, antes, 1)}
                            disabled={!antes}
                            aria-label="Mover uma peça para a etapa anterior"
                            style={botao(!antes)}
                          >
                            <ChevronLeft size={12} strokeWidth={2} />
                          </button>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                            {c.pecas} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>de {c.quantidade}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => depois && mover(c, depois, 1)}
                            disabled={!depois}
                            aria-label="Mover uma peça para a próxima etapa"
                            style={botao(!depois)}
                          >
                            <ChevronRight size={12} strokeWidth={2} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function botao(desabilitado: boolean): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "1px solid var(--border-default)",
    background: "var(--bg-raised)",
    color: desabilitado ? "var(--text-tertiary)" : "var(--text-primary)",
    opacity: desabilitado ? 0.35 : 1,
    cursor: desabilitado ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };
}
