"use client";

import { RotateCcw } from "lucide-react";
import { CampoFormulario } from "./campo-formulario";
import { formatBRL } from "@/lib/utils";
import type { JustificativaPreco } from "@/lib/produto-wizard/calc";

function LinhaBreakdown({ label, valor }: { label: string; valor: number }) {
  if (valor <= 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(valor)}</span>
    </div>
  );
}

export function PrecoSugeridoCard({
  justificativa,
  precoEditado,
  onPrecoChange,
  error,
}: {
  justificativa: JustificativaPreco;
  precoEditado: string;
  onPrecoChange: (v: string) => void;
  error?: string | null;
}) {
  const precoNum = parseFloat(precoEditado);
  const difereDoSugerido = !isNaN(precoNum) && Math.abs(precoNum - justificativa.precoSugerido) > 0.001;

  return (
    <CampoFormulario label="Preço sugerido" error={error}>
      <div className="alm-wizard-final-breakdown">
        <LinhaBreakdown label="Material (insumos)" valor={justificativa.material} />
        <LinhaBreakdown label="Produção (energia, máquina, mão de obra)" valor={justificativa.producao} />
        <LinhaBreakdown label="Embalagem" valor={justificativa.embalagem} />
        <div className="alm-wizard-final-breakdown-divider" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
          <span>Custo total</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(justificativa.custoTotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)" }}>
          <span>Margem aplicada</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>+{justificativa.margemPct.toFixed(0)}%</span>
        </div>
      </div>

      <input
        className="atlas-input"
        style={{ height: 44, fontSize: 18, fontFamily: "var(--font-mono)", fontWeight: 700 }}
        type="number"
        min="0"
        step="0.01"
        value={precoEditado}
        onChange={(e) => onPrecoChange(e.target.value)}
      />
      {difereDoSugerido ? (
        <button
          type="button"
          onClick={() => onPrecoChange(justificativa.precoSugerido.toFixed(2))}
          style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11, color: "var(--text-tertiary)" }}
        >
          <RotateCcw size={11} strokeWidth={1.5} />
          Usar sugestão do sistema ({formatBRL(justificativa.precoSugerido)})
        </button>
      ) : (
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Igual à sugestão do sistema — edite se quiser cobrar diferente.</span>
      )}
    </CampoFormulario>
  );
}
