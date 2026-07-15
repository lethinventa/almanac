"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Plus, Search, Trash2 } from "lucide-react";
import { StepLayout } from "./step-layout";
import type { OpcaoInsumo } from "@/lib/produto-wizard/mock-data";
import type { LinhaQtd } from "@/lib/produto-wizard/types";
import { formatBRL } from "@/lib/utils";

export function StepMultiInsumo({
  title,
  hint,
  options,
  rows,
  onChange,
  onContinue,
  error,
}: {
  title: string;
  hint?: string;
  options: OpcaoInsumo[];
  rows: LinhaQtd[];
  onChange: (rows: LinhaQtd[]) => void;
  onContinue: () => void;
  error?: string | null;
}) {
  const [busca, setBusca] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const lastQtdRef = useRef<HTMLInputElement | null>(null);
  const prevLenRef = useRef(rows.length);

  useEffect(() => {
    if (rows.length > prevLenRef.current) {
      lastQtdRef.current?.focus();
      lastQtdRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    prevLenRef.current = rows.length;
  }, [rows.length]);

  const disponiveis = options.filter(
    (o) => !rows.some((r) => r.insumoId === o.id) && o.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function addInsumo(id: string) {
    onChange([...rows, { insumoId: id, quantidade: "" }]);
    setBusca("");
  }

  function updateQtd(idx: number, v: string) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, quantidade: v } : r)));
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  function voltarParaBusca() {
    searchRef.current?.focus();
  }

  const podeContinuar = rows.length > 0 && rows.every((r) => r.quantidade.trim() !== "" && parseFloat(r.quantidade) > 0);

  return (
    <StepLayout title={title} hint={hint} onContinue={podeContinuar ? onContinue : undefined} error={error}>
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          strokeWidth={1.5}
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}
        />
        <input
          ref={searchRef}
          autoFocus
          className="atlas-input"
          style={{ height: 40, fontSize: 15, paddingLeft: 34 }}
          placeholder="Buscar insumo…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {busca.trim() !== "" && (
        <div className="alm-wizard-suggest-list">
          {disponiveis.length === 0 ? (
            <div className="alm-wizard-suggest-empty">Nenhum insumo encontrado.</div>
          ) : (
            disponiveis.map((o) => (
              <div key={o.id} className="alm-wizard-suggest-item" onClick={() => addInsumo(o.id)}>
                <span className="alm-wizard-suggest-item-nome">{o.nome}</span>
                <span className="alm-wizard-suggest-item-price">{formatBRL(o.precoUnitario)}/{o.unidade}</span>
                <Plus size={14} strokeWidth={2} className="alm-wizard-suggest-item-add" />
              </div>
            ))
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="alm-label">Adicionados ({rows.length})</span>
          <div className="alm-wizard-added-list">
            {rows.map((row, idx) => {
              const opcao = options.find((o) => o.id === row.insumoId);
              const qtd = parseFloat(row.quantidade);
              const subtotal = opcao && !isNaN(qtd) && qtd > 0 ? opcao.precoUnitario * qtd : null;
              const isLast = idx === rows.length - 1;
              return (
                <div key={row.insumoId} className="alm-wizard-added-item">
                  <CheckCircle2 size={14} strokeWidth={1.5} className="alm-wizard-added-item-check" />
                  <span className="alm-wizard-added-item-nome">{opcao?.nome ?? row.insumoId}</span>
                  <div className="alm-wizard-added-item-qtd-wrap">
                    <input
                      ref={isLast ? lastQtdRef : undefined}
                      className="atlas-input"
                      type="number"
                      min="0"
                      placeholder="0"
                      style={{ width: 60, fontSize: 12, textAlign: "right" }}
                      value={row.quantidade}
                      onChange={(e) => updateQtd(idx, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && voltarParaBusca()}
                    />
                    <span className="alm-wizard-added-item-unidade">{opcao?.unidade}</span>
                  </div>
                  <span className="alm-wizard-added-item-subtotal">
                    {subtotal !== null ? formatBRL(subtotal) : "—"}
                  </span>
                  <button type="button" onClick={() => removeRow(idx)} className="alm-wizard-added-item-remove">
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </StepLayout>
  );
}
