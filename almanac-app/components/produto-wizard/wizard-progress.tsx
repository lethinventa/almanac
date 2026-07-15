export function WizardProgress({ step, total }: { step: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (step / total) * 100) : 0;

  return (
    <div className="alm-wizard-progress-track">
      <div className="atlas-progress">
        <div className="atlas-progress-bar" style={{ width: `${pct}%`, transition: "width 260ms var(--ease-apple)" }} />
      </div>
    </div>
  );
}
