"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { formatDate, statusBadge, statusLabels } from "@/lib/utils";
import { isPessoal, type Encomenda } from "@/lib/repositories/encomendas";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";

interface PedidoDoProduto {
  encomenda: Encomenda;
  quantidade: number;
}

interface GrupoProduto {
  chave: string;
  nome: string;
  foto?: string;
  total: number;
  pedidos: PedidoDoProduto[];
}

interface EncomendasPorProdutoProps {
  // Encomendas já filtradas pela busca e pelo tipo.
  lista: Encomenda[];
  onRowClick: (enc: Encomenda) => void;
}

// Visão alternativa: agrupa os itens das encomendas em aberto por produto,
// mostrando quantas unidades cada cliente pediu.
export function EncomendasPorProduto({ lista, onRowClick }: EncomendasPorProdutoProps) {
  const [produtos, setProdutos] = useState<ProdutoCalculado[]>([]);

  useEffect(() => {
    buscarProdutos().then(setProdutos);
  }, []);

  const abertas = lista.filter((e) => e.status !== "entregue" && e.status !== "cancelado");

  const grupos = new Map<string, GrupoProduto>();
  for (const enc of abertas) {
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

  const ordenados = [...grupos.values()]
    .map((g) => ({
      ...g,
      pedidos: g.pedidos.sort(
        (a, b) =>
          a.encomenda.dataEntrega.localeCompare(b.encomenda.dataEntrega) ||
          a.encomenda.cliente.localeCompare(b.encomenda.cliente)
      ),
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

  if (ordenados.length === 0) {
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
      {ordenados.map((grupo) => (
        <div key={grupo.chave} className="atlas-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
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
                <Package size={16} strokeWidth={1} style={{ color: "var(--text-tertiary)", opacity: 0.6 }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
              {grupo.nome}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
              {grupo.total} un
            </div>
          </div>

          <table className="atlas-table" style={{ width: "100%" }}>
            <tbody>
              {grupo.pedidos.map(({ encomenda: enc, quantidade }) => {
                const isLate = new Date(enc.dataEntrega) < new Date();
                return (
                  <tr key={enc.id} onClick={() => onRowClick(enc)} style={{ cursor: "pointer" }}>
                    <td className="num" style={{ width: 56, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {quantidade}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {enc.cliente}
                      {isPessoal(enc) && (
                        <span className="atlas-badge" style={{ marginLeft: 6, fontSize: 10, verticalAlign: "middle" }}>
                          Pessoal
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={statusBadge[enc.status]}>{statusLabels[enc.status]}</span>
                    </td>
                    <td className="num" style={{ fontSize: 12, color: isLate ? "var(--status-error)" : "var(--text-secondary)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {isLate && <AlertTriangle size={10} strokeWidth={1.5} />}
                        {formatDate(enc.dataEntrega)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
