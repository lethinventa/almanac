"use client";

import { CampoFormulario } from "./campo-formulario";

export function CampoSimNaoNumero({
  label,
  hint,
  selected,
  onSelect,
  numeroLabel,
  numeroValue,
  onNumeroChange,
  error,
}: {
  label: string;
  hint?: string;
  selected: boolean | null;
  onSelect: (v: boolean) => void;
  numeroLabel: string;
  numeroValue: string;
  onNumeroChange: (v: string) => void;
  error?: string | null;
}) {
  return (
    <CampoFormulario label={label} hint={hint} error={error}>
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
          className="atlas-input"
          type="number"
          min="0"
          placeholder={numeroLabel}
          value={numeroValue}
          onChange={(e) => onNumeroChange(e.target.value)}
        />
      )}
    </CampoFormulario>
  );
}
