"use client";

import { useRef, useEffect } from "react";
import { StepLayout } from "./step-layout";

export function StepNumero({
  title,
  hint,
  placeholder,
  value,
  onChange,
  onContinue,
  error,
}: {
  title: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <StepLayout title={title} hint={hint} onContinue={onContinue} error={error}>
      <input
        ref={inputRef}
        className="atlas-input"
        style={{ height: 40, fontSize: 15 }}
        type="number"
        min="0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onContinue()}
      />
    </StepLayout>
  );
}
