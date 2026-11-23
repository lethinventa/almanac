"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

// Modal com backdrop, animação de entrada/saída e fechamento com Escape.
export function Modal({
  open,
  onClose,
  title,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 340);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div className={`alm-backdrop${visible ? " is-open" : ""}`} onClick={onClose} />
      <div className={`alm-modal${wide ? " is-wide" : ""}${visible ? " is-open" : ""}`}>
        <div className="alm-modal-header">
          <span className="alm-modal-title">{title}</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ padding: "0 4px" }} onClick={onClose}>
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="alm-modal-body">{children}</div>
      </div>
    </>
  );
}
