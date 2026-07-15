"use client";

import { ArrowRight } from "lucide-react";

export function StepLayout({
  title,
  hint,
  children,
  onContinue,
  error,
  hideContinue,
  continueLabel = "Continuar",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  onContinue?: () => void;
  error?: string | null;
  hideContinue?: boolean;
  continueLabel?: string;
}) {
  return (
    <>
      <div className="alm-wizard-question-title">{title}</div>
      {hint && <div className="alm-wizard-question-hint">{hint}</div>}
      <div className={error ? "alm-wizard-field-error" : undefined} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
      {error && <div className="alm-wizard-error-msg">{error}</div>}
      {!hideContinue && onContinue && (
        <button
          type="button"
          className="atlas-btn atlas-btn-primary atlas-btn-lg"
          style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={onContinue}
        >
          {continueLabel}
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      )}
    </>
  );
}
