"use client";

import { AlertTriangle, Calendar, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isPessoal, type Encomenda } from "@/lib/repositories/encomendas";
import type { ProdutoCalculado } from "@/lib/repositories/produtos";

export interface PedidoDoProduto {
  encomenda: Encomenda;
  quantidade: number;
}

export interface GrupoProduto {
  chave: string;
  nome: string;
  foto?: string;
  total: number;
  pedidos: PedidoDoProduto[];
}

// Agrupa os itens das encomendas recebidas por produto (ordenado do maior total para o menor).
export function agruparPorProduto(encomendas: Encomenda[], produtos: ProdutoCalculado[]): GrupoProduto[] {
  const grupos = new Map<string, GrupoProduto>();
  for (const enc of encomendas) {
    for (const item of enc.itens) {
      const prod = produtos.find((p) => p.id === item.produtoId);
      // Itens de orçamento sem produto cadastrado são agrupados pela descrição.
      const chave = item.produtoId ? `produto:${item.produtoId}` : `desc:${item.descricao ?? "?"}`;
      const nome = prod?.nome ?? item.descricao ?? "Sem nome";

      let grupo = grupos.get(chave);
      if (!grupo) {
        grupo = { chave, nome, foto: prod?.foto, total: 0, pedidos: [] };
        grupos.set(chave, grupo);
      }
      grupo.total += item.quantidade;

      // Um mesmo pedido pode ter o produto em mais de um item: soma na mesma linha.
      const existente = grupo.pedidos.find((p) => p.encomenda.id === enc.id);
      if (existente) existente.quantidade += item.quantidade;
      else grupo.pedidos.push({ encomenda: enc, quantidade: item.quantidade });
    }
  }

  return [...grupos.values()]
    .map((g) => ({
      ...g,
      pedidos: [...g.pedidos].sort(
        (a, b) =>
          a.encomenda.dataEntrega.localeCompare(b.encomenda.dataEntrega) ||
          a.encomenda.cliente.localeCompare(b.encomenda.cliente)
      ),
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}

// Card de um produto dentro de uma coluna de status: cabeçalho com o total e uma linha por cliente.
export function CartaoProduto({
  grupo,
  onPedidoClick,
}: {
  grupo: GrupoProduto;
  onPedidoClick: (enc: Encomenda) => void;
}) {
  return (
    <div className="alm-kanban-card" style={{ cursor: "default", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-md, 4px)",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--bg-input)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {grupo.foto ? (
            <img src={grupo.foto} alt={grupo.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Package size={13} strokeWidth={1} style={{ color: "var(--text-tertiary)", opacity: 0.6 }} />
          )}
        </span>
        <span className="alm-kanban-card-client" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {grupo.nome}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{grupo.total} un</span>
      </div>

      {grupo.pedidos.map(({ encomenda: enc, quantidade }) => {
        const isLate = new Date(enc.dataEntrega) < new Date();
        return (
          <button
            key={enc.id}
            type="button"
            onClick={() => onPedidoClick(enc)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
              padding: "4px 6px",
              margin: "0 -6px",
              border: "none",
              background: "transparent",
              borderRadius: "var(--radius-sm, 3px)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-secondary)",
              textAlign: "left",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {quantidade}× {enc.cliente}
              {isPessoal(enc) && (
                <span className="atlas-badge" style={{ marginLeft: 6, fontSize: 10, verticalAlign: "middle" }}>
                  Pessoal
                </span>
              )}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                flexShrink: 0,
                color: isLate ? "var(--status-error)" : "var(--text-tertiary)",
              }}
            >
              {isLate ? <AlertTriangle size={10} strokeWidth={1.5} /> : <Calendar size={10} strokeWidth={1.5} />}
              {formatDate(enc.dataEntrega)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
