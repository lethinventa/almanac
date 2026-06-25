import type { Metadata } from "next";
import "./globals.css";
import { Titlebar } from "@/components/shell/titlebar";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";

export const metadata: Metadata = {
  title: "Almanac — Papelaria criativa",
  description: "Gestão de insumos, produtos, encomendas e financeiro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/atlas.css" />
      </head>
      <body>
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
      </body>
    </html>
  );
}
