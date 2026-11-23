"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Calendar, Package } from "lucide-react";
import { formatDate, statusBadge, statusLabels } from "@/lib/utils";
import { isPessoal, type Encomenda } from "@/lib/repositories/encomendas";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";

interface PedidoDoProduto {
  encomenda: Encomenda;
  quantidade: number;
}

interface ColunaProduto {
  chave: string;
  nome: string;
  foto?: string;
  total: number;
  pedidos: PedidoDoProduto[];
}

interface EncomendasPorProdutoProps {
  // Encomendas já filtradas pela busca e pelo tipo.
  lista: Encomenda[];
  onCardClick: (enc: Encomenda) => void;
}

// Visão alternativa em kanban: uma coluna por produto, com um card por encomenda
// em aberto. Só leitura: clicar no card abre a encomenda.
export function EncomendasPorProduto({ lista, onCardClick }: EncomendasPorProdutoProps) {
  const [produtos, setProdutos] = useState<ProdutoCalculado[]>([]);

  useEffect(() => {
    buscarProdutos().then(setProdutos);
  }, []);

  const abertas = lista.filter((e) => e.status !== "entregue" && e.status !== "cancelado");

  const colunas = new Map<string, ColunaProduto>();
  for (const enc of abertas) {
    for (const item of enc.itens) {
      const prod = produtos.find((p) => p.id === item.produtoId);
      // Itens de orçamento sem produto cadastrado são agrupados pela descrição.
      const chave = item.produtoId ? `produto:${item.produtoId}` : `desc:${item.descricao ?? "?"}`;
      const nome = prod?.nome ?? item.descricao ?? "Sem nome";

      let coluna = colunas.get(chave);
      if (!coluna) {
        coluna = { chave, nome, foto: prod?.foto, total: 0, pedidos: [] };
        colunas.set(chave, coluna);
      }
      coluna.total += item.quantidade;

      // Um mesmo pedido pode ter o produto em mais de um item: soma no mesmo card.
      const existente = coluna.pedidos.find((p) => p.encomenda.id === enc.id);
      if (existente) existente.quantidade += item.quantidade;
      else coluna.pedidos.push({ encomenda: enc, quantidade: item.quantidade });
    }
  }

  const ordenadas = [...colunas.values()]
    .map((c) => ({
      ...c,
      pedidos: [...c.pedidos].sort(
        (a, b) =>
          a.encomenda.dataEntrega.localeCompare(b.encomenda.dataEntrega) ||
          a.encomenda.cliente.localeCompare(b.encomenda.cliente)
      ),
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

  if (ordenadas.length === 0) {
    return (
      <div className="atlas-card" style={{ padding: 0 }}>
        <div className="atlas-empty" style={{ padding: "32px" }}>
          <div className="atlas-empty-title">Nenhum produto em encomendas abertas</div>
          <div className="atlas-empty-desc">Encomendas entregues ou canceladas não aparecem nesta visão.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="alm-kanban"
      style={{ gridTemplateColumns: ordenadas.map(() => "minmax(160px, 200px)").join(" ") }}
    >
      {ordenadas.map((coluna) => (
        <div key={coluna.chave} className="alm-kanban-col">
          <div className="alm-kanban-col-header">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "var(--radius-md, 4px)",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--bg-input)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {coluna.foto ? (
                  <img src={coluna.foto} alt={coluna.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Package size={12} strokeWidth={1} style={{ color: "var(--text-tertiary)", opacity: 0.6 }} />
                )}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{coluna.nome}</span>
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, flexShrink: 0 }}>{coluna.total} un</span>
          </div>

          {coluna.pedidos.map(({ encomenda: enc, quantidade }) => {
            const isLate = new Date(enc.dataEntrega) < new Date();
            return (
              <div key={enc.id} className="alm-kanban-card" onClick={() => onCardClick(enc)}>
                <div className="alm-kanban-card-client">
                  {quantidade}× {enc.cliente}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span className={statusBadge[enc.status]}>{statusLabels[enc.status]}</span>
                  {isPessoal(enc) && (
                    <span className="atlas-badge" style={{ fontSize: 10 }}>
                      Pessoal
                    </span>
                  )}
                </div>
                <div className="alm-kanban-card-footer">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      color: isLate ? "var(--status-error)" : "var(--text-tertiary)",
                    }}
                  >
                    {isLate && <AlertTriangle size={10} strokeWidth={1.5} />}
                    <Calendar size={10} strokeWidth={1.5} />
                    {formatDate(enc.dataEntrega)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
