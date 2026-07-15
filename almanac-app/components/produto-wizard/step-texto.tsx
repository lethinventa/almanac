"use client";

import { useRef, useEffect } from "react";
import { StepLayout } from "./step-layout";

export function StepTexto({
  value,
  onChange,
  onContinue,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <StepLayout title="Qual o nome do produto?" onContinue={onContinue} error={error}>
      <input
        ref={inputRef}
        className="atlas-input"
        style={{ height: 40, fontSize: 15 }}
        placeholder="Ex: Chaveiro acrílico personalizado"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onContinue()}
      />
    </StepLayout>
  );
}
