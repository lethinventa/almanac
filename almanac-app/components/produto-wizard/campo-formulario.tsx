"use client";

export function CampoFormulario({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="alm-produto-campo">
      <div className="alm-produto-campo-header">
        <span className="alm-label">{label}</span>
        {hint && <span className="alm-produto-campo-hint">{hint}</span>}
      </div>
      <div className={error ? "alm-wizard-field-error" : undefined} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
      {error && <div className="alm-wizard-error-msg">{error}</div>}
    </div>
  );
}
