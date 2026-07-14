"use client";

import { useAuth } from "@/contexts/auth-context";
import { Titlebar } from "./titlebar";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

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
    <div className="alm-shell">
      <div className="alm-titlebar">
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
