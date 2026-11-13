"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import type { EmbalagemEncomenda } from "@/lib/repositories/encomendas";
import type { Insumo } from "@/lib/repositories/insumos";

// Embalagens do pedido, ligadas aos insumos da categoria "Embalagem".
// O custo unitário é gravado no momento da adição, como o preço dos itens.
export function EmbalagensPedido({
  embalagens,
  onChange,
  insumosEmbalagem,
}: {
  embalagens: EmbalagemEncomenda[];
  onChange: (novas: EmbalagemEncomenda[]) => void;
  insumosEmbalagem: Insumo[];
}) {
  const [insumoId, setInsumoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  const total = embalagens.reduce((s, e) => s + e.quantidade * e.custoUnitario, 0);
  const semCadastro = insumosEmbalagem.length === 0;

  const adicionar = () => {
    const qtd = parseFloat(quantidade);
    const insumo = insumosEmbalagem.find((i) => i.id === (insumoId || insumosEmbalagem[0]?.id));
    if (!insumo || !(qtd > 0)) return;
    onChange([
      ...embalagens,
      {
        id: crypto.randomUUID(),
        insumoId: insumo.id,
        descricao: insumo.nome,
        quantidade: qtd,
        custoUnitario: insumo.precoAtual,
      },
    ]);
    setInsumoId("");
    setQuantidade("1");
  };

  const remover = (id: string) => onChange(embalagens.filter((e) => e.id !== id));

  return (
    <div className="alm-field">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label className="alm-label">Embalagens do pedido</label>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{formatBRL(total)}</span>
      </div>

      {embalagens.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {embalagens.map((e) => (
            <div
              key={e.id}
              style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 56px 88px 88px 24px", gap: 6, alignItems: "center", fontSize: 12 }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.descricao}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>× {e.quantidade}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textAlign: "right" }}>{formatBRL(e.custoUnitario)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, textAlign: "right" }}>{formatBRL(e.quantidade * e.custoUnitario)}</span>
              <button
                type="button"
                title="Remover embalagem"
                aria-label="Remover embalagem"
                onClick={() => remover(e.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {semCadastro ? (
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          Nenhuma embalagem cadastrada. Crie um insumo na categoria “Embalagem” em Insumos.
        </span>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 72px 32px", gap: 6 }}>
          <select
            className="alm-select"
            style={{ height: 36, fontSize: 12, width: "100%", minWidth: 0 }}
            value={insumoId || insumosEmbalagem[0].id}
            onChange={(e) => setInsumoId(e.target.value)}
          >
            {insumosEmbalagem.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} · {formatBRL(i.precoAtual)}/{i.unidade}
              </option>
            ))}
          </select>
          <input
            className="atlas-input"
            type="number"
            min="1"
            placeholder="Qtd"
            style={{ fontSize: 12 }}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adicionar()}
          />
          <button
            type="button"
            className="atlas-btn atlas-btn-secondary atlas-btn-sm"
            style={{ padding: 0, justifyContent: "center" }}
            onClick={adicionar}
            aria-label="Adicionar embalagem"
          >
            <Plus size={12} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
