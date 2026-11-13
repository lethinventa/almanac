"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Truck, ExternalLink } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/utils";
import { gerarOrcamentoEncomenda } from "@/lib/orcamento-encomenda";
import "./orcamento.css";
import {
  listarOrcamentos,
  recusarOrcamento,
  aprovarOrcamento,
  type Orcamento,
  type OrcamentoStatus,
} from "@/lib/repositories/orcamentos";

const statusInfo: Record<OrcamentoStatus, { label: string; badge: string }> = {
  enviado: { label: "Aguardando cliente", badge: "atlas-badge atlas-badge-warning" },
  aprovado: { label: "Aprovado", badge: "atlas-badge atlas-badge-success" },
  recusado: { label: "Recusado", badge: "atlas-badge atlas-badge-error" },
};

const mensagemErro = (err: unknown) => (err instanceof Error ? err.message : "Algo deu errado. Tente de novo.");

export function OrcamentosEnviados({ refreshKey }: { refreshKey: number }) {
  const [lista, setLista] = useState<Orcamento[] | null>(null);
  const [erro, setErro] = useState("");
  const [expandidos, setExpandidos] = useState<string[]>([]);
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [dataEntrega, setDataEntrega] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista(await listarOrcamentos());
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar, refreshKey]);

  const alternar = (id: string) =>
    setExpandidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function confirmarAprovacao(orc: Orcamento) {
    if (!dataEntrega) return;
    setOcupado(true);
    setErro("");
    try {
      // A encomenda leva a imagem do orçamento aprovado, no mesmo modelo enviado ao cliente.
      const orcamentoImagem = await gerarOrcamentoEncomenda({
        cliente: orc.cliente.trim() || "Sem nome",
        prazo: orc.prazo,
        data: new Date().toISOString().slice(0, 10),
        linhas: orc.itens.map((i) => ({
          descricao: i.descricao,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          subtotal: i.subtotal,
        })),
        desconto: orc.desconto,
        total: orc.total,
      });
      await aprovarOrcamento(orc, dataEntrega, orcamentoImagem);
      setAprovandoId(null);
      setDataEntrega("");
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setOcupado(false);
    }
  }

  async function marcarRecusado(id: string) {
    setOcupado(true);
    setErro("");
    try {
      await recusarOrcamento(id);
      await carregar();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="orc-enviados">
      {erro && <div className="orc-erro">{erro}</div>}

      {lista === null && <span className="orc-ajuda">Carregando…</span>}
      {lista !== null && lista.length === 0 && (
        <span className="orc-ajuda">Nenhum orçamento registrado ainda. Use “Registrar como enviado” depois de mandar a imagem.</span>
      )}

      {lista !== null && lista.length > 0 && (
        <div className="atlas-card" style={{ padding: 0 }}>
          <table className="atlas-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Enviado em</th>
                <th className="num">Itens</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((orc) => {
                const info = statusInfo[orc.status];
                const aberto = expandidos.includes(orc.id) || aprovandoId === orc.id;
                const aprovando = aprovandoId === orc.id;
                return (
                  <Fragment key={orc.id}>
                    <tr onClick={() => alternar(orc.id)}>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, color: "var(--text-tertiary)", width: 10 }}>{aberto ? "▼" : "▶"}</span>
                          <span style={{ fontWeight: 500 }}>{orc.cliente.trim() || "Sem nome"}</span>
                        </span>
                      </td>
                      <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{formatDate(orc.enviadoEm.slice(0, 10))}</td>
                      <td className="num" style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{orc.itens.length}</td>
                      <td><span className={info.badge}>{info.label}</span></td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatBRL(orc.total)}</td>
                    </tr>

                    {aberto && (
                      <tr style={{ cursor: "default" }}>
                        <td colSpan={5} style={{ height: "auto", padding: "12px 22px 16px", whiteSpace: "normal" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                            {orc.itens.map((i, idx) => (
                              <div key={idx}>
                                {i.quantidade}× {i.descricao} — {formatBRL(i.precoUnitario)} cada = {formatBRL(i.subtotal)}
                              </div>
                            ))}
                          </div>

                          {orc.status === "enviado" && !aprovando && (
                            <div className="orc-acoes-linha" style={{ marginTop: 12 }}>
                              <button
                                type="button"
                                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                                disabled={ocupado}
                                onClick={() => {
                                  setAprovandoId(orc.id);
                                  setDataEntrega("");
                                }}
                              >
                                <Truck size={13} strokeWidth={1.5} /> Aprovado → produção
                              </button>
                              <button
                                type="button"
                                className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                                disabled={ocupado}
                                onClick={() => marcarRecusado(orc.id)}
                              >
                                <X size={13} strokeWidth={1.5} /> Recusou
                              </button>
                            </div>
                          )}

                          {orc.status === "enviado" && aprovando && (
                            <div className="orc-acoes-linha" style={{ marginTop: 12 }}>
                              <div className="alm-field" style={{ maxWidth: 200 }}>
                                <label className="alm-label">Data de entrega</label>
                                <input
                                  className="atlas-input"
                                  type="date"
                                  value={dataEntrega}
                                  onChange={(e) => setDataEntrega(e.target.value)}
                                />
                              </div>
                              <button
                                type="button"
                                className="atlas-btn atlas-btn-primary atlas-btn-sm"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                                disabled={!dataEntrega || ocupado}
                                onClick={() => confirmarAprovacao(orc)}
                              >
                                <Check size={13} strokeWidth={1.5} /> Criar encomenda
                              </button>
                              <button
                                type="button"
                                className="atlas-btn atlas-btn-secondary atlas-btn-sm"
                                disabled={ocupado}
                                onClick={() => setAprovandoId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          )}

                          {orc.status === "aprovado" && orc.encomendaId && (
                            <Link
                              href={`/encomendas/${orc.encomendaId}`}
                              className="orc-link"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12 }}
                            >
                              <ExternalLink size={12} strokeWidth={1.5} /> Ver encomenda em produção
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
