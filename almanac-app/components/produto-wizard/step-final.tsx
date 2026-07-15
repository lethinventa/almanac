"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
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

export function StepFinal({
  nome,
  justificativa,
  precoEditado,
  onPrecoChange,
  onSalvar,
  salvo,
  error,
}: {
  nome: string;
  justificativa: JustificativaPreco;
  precoEditado: string;
  onPrecoChange: (v: string) => void;
  onSalvar: () => void;
  salvo: boolean;
  error?: string | null;
}) {
  if (salvo) {
    return (
      <div className="alm-wizard-final-success">
        <CheckCircle2 size={40} strokeWidth={1.3} style={{ color: "var(--status-success)" }} />
        <div style={{ fontSize: 16, fontWeight: 600 }}>Produto salvo!</div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {nome || "Seu produto"} foi cadastrado com preço de {formatBRL(parseFloat(precoEditado) || justificativa.precoSugerido)}.
        </div>
      </div>
    );
  }

  const precoNum = parseFloat(precoEditado);
  const difereDoSugerido = !isNaN(precoNum) && Math.abs(precoNum - justificativa.precoSugerido) > 0.001;

  return (
    <>
      <div className="alm-wizard-question-title">Tudo pronto, {nome || "produto"}!</div>
      <div className="alm-wizard-question-hint">Veja como chegamos nesse preço antes de salvar.</div>

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
        <div className="alm-wizard-final-breakdown-divider" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Preço sugerido</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--accent-highlight)" }}>
            {formatBRL(justificativa.precoSugerido)}
          </span>
        </div>
      </div>

      <div className={error ? "alm-wizard-field-error" : undefined} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="alm-label">Preço final</label>
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
      </div>
      {error && <div className="alm-wizard-error-msg">{error}</div>}

      <button
        type="button"
        className="atlas-btn atlas-btn-primary atlas-btn-lg"
        style={{ alignSelf: "flex-start" }}
        onClick={onSalvar}
      >
        Salvar produto
      </button>
    </>
  );
}
