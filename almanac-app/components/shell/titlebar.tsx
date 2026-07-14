"use client";

import { useState, useEffect, useRef } from "react";
import { BookMarked, Sun, Moon, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

function getInitials(nome: string): string {
  return nome.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function Titlebar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("almanac_theme") as "dark" | "light" | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("almanac_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BookMarked size={16} strokeWidth={1.5} style={{ color: "var(--accent-primary)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
          Almanac
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 24, height: 24,
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer", padding: 0,
          }}
        >
          {theme === "dark" ? <Sun size={13} strokeWidth={1.5} /> : <Moon size={13} strokeWidth={1.5} />}
        </button>

        {/* User */}
        {user && (
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "3px 8px 3px 4px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-default)",
                background: dropdownOpen ? "var(--bg-hover)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "var(--accent-highlight, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {getInitials(user.email?.split('@')[0] ?? '')}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                {user.email?.split('@')[0] ?? ''}
              </span>
              <ChevronDown
                size={12} strokeWidth={1.5}
                style={{ color: "var(--text-tertiary)", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms" }}
              />
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                minWidth: 180,
                background: "var(--bg-raised)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                zIndex: 100, overflow: "hidden",
              }}>
                <div style={{ padding: "8px 12px 7px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{user.email?.split('@')[0] ?? ''}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>{user.email}</div>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, color: "var(--status-error)", textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(244,71,71,0.08)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "none"}
                >
                  <LogOut size={13} strokeWidth={1.5} />
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
