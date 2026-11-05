"use client";

import { useEffect, useState } from "react";
import { PanelLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Titlebar } from "./titlebar";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

const SIDEBAR_KEY = "almanac_sidebar_recolhida";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    setRecolhida(localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  function alternarSidebar() {
    setRecolhida((atual) => {
      localStorage.setItem(SIDEBAR_KEY, atual ? "0" : "1");
      return !atual;
    });
  }

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--border-default)", borderTopColor: "var(--text-primary)", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <>{children}</>;

  return (
    <div className={`alm-shell${recolhida ? " is-collapsed" : ""}`}>
      <div className="alm-titlebar">
        <button
          className="atlas-btn atlas-btn-secondary atlas-btn-icon alm-sidebar-toggle"
          onClick={alternarSidebar}
          title={recolhida ? "Mostrar menu" : "Ocultar menu"}
          aria-label={recolhida ? "Mostrar menu" : "Ocultar menu"}
        >
          <PanelLeft size={16} strokeWidth={1.6} />
        </button>
        <Titlebar />
      </div>
      <aside className="alm-sidebar">
        <Sidebar />
      </aside>
      <main className="alm-main">
        {children}
      </main>
      <div className="alm-mobile-nav">
        <MobileNav />
      </div>
    </div>
  );
}
