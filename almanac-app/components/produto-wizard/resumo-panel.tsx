"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import type { LinhaResumo } from "@/lib/produto-wizard/types";

function useAnimatedNumber(target: number, durationMs = 260) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const valueRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    let start: number | null = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      if (start === null) start = now;
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      valueRef.current = next;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = valueRef.current;
    };
  }, [target, durationMs]);

  return value;
}

function ResumoConteudo({ linhas, total }: { linhas: LinhaResumo[]; total: number }) {
  const animatedTotal = useAnimatedNumber(total);

  return (
    <>
      <div className="alm-wizard-resumo-lines">
        {linhas.length === 0 ? (
          <div className="alm-wizard-resumo-empty">Suas respostas vão aparecer aqui conforme você preenche o wizard.</div>
        ) : (
          linhas.map((l) => (
            <div key={l.id} className="alm-wizard-resumo-line">
              <span className="alm-wizard-resumo-line-label">{l.label}</span>
              <span className="alm-wizard-resumo-line-value">{formatBRL(l.valor)}</span>
            </div>
          ))
        )}
      </div>
      <div className="alm-wizard-resumo-total">
        <span className="alm-wizard-resumo-total-label">Custo estimado</span>
        <span className="alm-wizard-resumo-total-value">{formatBRL(animatedTotal)}</span>
      </div>
    </>
  );
}

export function ResumoPanel({ linhas, total }: { linhas: LinhaResumo[]; total: number }) {
  const [mobileAberto, setMobileAberto] = useState(false);

  return (
    <>
      <aside className="alm-wizard-resumo">
        <div className="alm-wizard-resumo-header">Resumo</div>
        <ResumoConteudo linhas={linhas} total={total} />
      </aside>

      <div className="alm-wizard-resumo-mobile">
        <button
          type="button"
          className="alm-wizard-resumo-mobile-bar"
          onClick={() => setMobileAberto((v) => !v)}
        >
          <span style={{ color: "var(--text-tertiary)" }}>
            Ver resumo {mobileAberto ? <ChevronDown size={12} style={{ display: "inline", verticalAlign: -2 }} /> : <ChevronUp size={12} style={{ display: "inline", verticalAlign: -2 }} />}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{formatBRL(total)}</span>
        </button>
        {mobileAberto && (
          <div className="alm-wizard-resumo-mobile-panel">
            <ResumoConteudo linhas={linhas} total={total} />
          </div>
        )}
      </div>
    </>
  );
}
