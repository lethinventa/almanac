"use client";

import { Layers, Scissors } from "lucide-react";
import type { FluxoWizard } from "@/lib/produto-wizard/types";

export function StepBifurcacao({
  selected,
  onSelect,
}: {
  selected?: FluxoWizard | null;
  onSelect: (flow: FluxoWizard) => void;
}) {
  return (
    <>
      <div className="alm-wizard-question-title">É impressão 3D ou papelaria?</div>
      <div className="alm-wizard-question-hint">Isso define as próximas perguntas do wizard.</div>
      <div className="alm-wizard-cards">
        <div className={`alm-wizard-card${selected === "3d" ? " is-selected" : ""}`} onClick={() => onSelect("3d")}>
          <Layers size={28} strokeWidth={1.3} />
          <span className="alm-wizard-card-title">Impressão 3D</span>
          <span className="alm-wizard-card-desc">Filamento, tempo de impressão, pós-processamento</span>
        </div>
        <div className={`alm-wizard-card${selected === "papelaria" ? " is-selected" : ""}`} onClick={() => onSelect("papelaria")}>
          <Scissors size={28} strokeWidth={1.3} />
          <span className="alm-wizard-card-title">Papelaria</span>
          <span className="alm-wizard-card-desc">Insumos, impressões, corte na Cricut</span>
        </div>
      </div>
    </>
  );
}
