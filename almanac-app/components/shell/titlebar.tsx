"use client";

import { useState, useEffect } from "react";
import { BookMarked, Sun, Moon } from "lucide-react";

export function Titlebar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("almanac_theme") as "dark" | "light" | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("almanac_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <BookMarked size={16} strokeWidth={1.5} style={{ color: "var(--accent-primary)" }} />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          Almanac
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={toggle}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md, 4px)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {theme === "dark" ? <Sun size={13} strokeWidth={1.5} /> : <Moon size={13} strokeWidth={1.5} />}
        </button>
        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
          Letícia P.
        </span>
        <div
          className="atlas-avatar"
          style={{ width: "22px", height: "22px", fontSize: "10px", flexShrink: 0 }}
        >
          LP
        </div>
      </div>
    </>
  );
}
