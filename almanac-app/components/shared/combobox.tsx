"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label?: string;
}

/**
 * Select customizado com o mesmo visual dos inputs do Atlas. Substitui o
 * <select> nativo nos casos em que o dropdown do navegador (posição
 * inconsistente, estilo fora do design system) atrapalha — o painel deste
 * componente sempre abre para baixo, nunca reposiciona sozinho.
 *
 * O ref encaminhado aponta para um <select> nativo oculto que espelha o
 * valor atual, então componentes que hoje leem `ref.current?.value` em modo
 * não controlado continuam funcionando sem mudanças.
 */
export const Combobox = forwardRef<HTMLSelectElement, {
  value: string;
  onChange: (value: string) => void;
  options: (string | ComboboxOption)[];
  className?: string;
}>(function Combobox({ value, onChange, options, className }, ref) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizadas: Required<ComboboxOption>[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
  );
  const atual = normalizadas.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className={`atlas-combobox${className ? ` ${className}` : ""}`}>
      <select ref={ref} value={value} onChange={() => {}} style={{ display: "none" }} tabIndex={-1} aria-hidden>
        {normalizadas.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button type="button" className="atlas-input atlas-combobox-trigger" onClick={() => setOpen((v) => !v)}>
        <span>{atual?.label ?? value}</span>
        <ChevronDown size={14} strokeWidth={1.5} className={`atlas-combobox-chevron${open ? " is-open" : ""}`} />
      </button>

      {open && (
        <div className="atlas-combobox-panel">
          {normalizadas.map((o) => (
            <div
              key={o.value}
              className={`atlas-combobox-item${o.value === value ? " is-selected" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
