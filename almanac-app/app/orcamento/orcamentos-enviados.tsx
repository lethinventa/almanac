"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Truck, ExternalLink } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/utils";
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

  async function confirmarAprovacao(orc: Orcamento) {
    if (!dataEntrega) return;
    setOcupado(true);
    setErro("");
    try {
      await aprovarOrcamento(orc, dataEntrega);
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
      <div className="orc-enviados-header">
        <h2 className="alm-page-title" style={{ fontSize: 18 }}>Orçamentos enviados</h2>
        <span className="orc-ajuda">Quando o cliente aprovar, mande para produção aqui.</span>
      </div>

      {erro && <div className="orc-erro">{erro}</div>}

      {lista === null && <span className="orc-ajuda">Carregando…</span>}
      {lista !== null && lista.length === 0 && (
        <span className="orc-ajuda">Nenhum orçamento registrado ainda. Use “Registrar como enviado” depois de mandar a imagem.</span>
      )}

      {lista?.map((orc) => {
        const info = statusInfo[orc.status];
        const aprovando = aprovandoId === orc.id;
        return (
          <div key={orc.id} className="atlas-card orc-enviado">
            <div className="orc-enviado-topo">
              <div>
                <div className="orc-enviado-cliente">{orc.cliente.trim() || "Sem nome"}</div>
                <div className="orc-ajuda">
                  Enviado em {formatDate(orc.enviadoEm.slice(0, 10))} · {orc.itens.length}{" "}
                  {orc.itens.length === 1 ? "item" : "itens"}
                </div>
              </div>
              <div className="orc-enviado-direita">
                <span className={info.badge}>{info.label}</span>
                <strong className="orc-enviado-total">{formatBRL(orc.total)}</strong>
              </div>
            </div>

            <details className="orc-detalhes">
              <summary>Ver itens</summary>
              <ul>
                {orc.itens.map((i, idx) => (
                  <li key={idx}>
                    {i.quantidade}× {i.descricao} — {formatBRL(i.precoUnitario)} cada = {formatBRL(i.subtotal)}
                  </li>
                ))}
              </ul>
            </details>

            {orc.status === "enviado" && !aprovando && (
              <div className="orc-acoes-linha">
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
              <div className="orc-acoes-linha">
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
              <Link href={`/encomendas/${orc.encomendaId}`} className="orc-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ExternalLink size={12} strokeWidth={1.5} /> Ver encomenda em produção
              </Link>
            )}
          </div>
        );
      })}
    </section>
  );
}
