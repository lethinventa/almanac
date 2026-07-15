"use client";

import { StepLayout } from "./step-layout";

export function StepSimNao({
  title,
  hint,
  selected,
  onSelect,
  numeroLabel,
  numeroValue,
  onNumeroChange,
  onContinue,
  error,
}: {
  title: string;
  hint?: string;
  selected: boolean | null;
  onSelect: (v: boolean) => void;
  numeroLabel: string;
  numeroValue: string;
  onNumeroChange: (v: string) => void;
  onContinue: () => void;
  error?: string | null;
}) {
  return (
    <StepLayout title={title} hint={hint} onContinue={selected === true ? onContinue : undefined} error={error}>
      <div className="alm-wizard-simnao">
        <button
          type="button"
          className={`alm-wizard-simnao-btn${selected === true ? " is-selected-yes" : ""}`}
          onClick={() => onSelect(true)}
        >
          Sim
        </button>
        <button
          type="button"
          className={`alm-wizard-simnao-btn${selected === false ? " is-selected-no" : ""}`}
          onClick={() => onSelect(false)}
        >
          Não
        </button>
      </div>
      {selected === true && (
        <input
          autoFocus
          className="atlas-input"
          type="number"
          min="0"
          placeholder={numeroLabel}
          value={numeroValue}
          onChange={(e) => onNumeroChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onContinue()}
        />
      )}
    </StepLayout>
  );
}
