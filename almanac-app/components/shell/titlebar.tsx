import { BookMarked } from "lucide-react";

export function Titlebar() {
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
