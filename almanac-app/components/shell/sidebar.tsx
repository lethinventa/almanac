"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Box,
  ClipboardList,
  PackageCheck,
  BarChart2,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number | null;
  badgeType?: "error" | "neutral";
}

const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/insumos",
    label: "Insumos",
    icon: Package,
    badge: null,
    badgeType: "error",
  },
  { href: "/produtos", label: "Produtos", icon: Box },
  {
    href: "/encomendas",
    label: "Encomendas",
    icon: ClipboardList,
    badge: null,
    badgeType: "neutral",
  },
  {
    href: "/pronta-entrega",
    label: "Pronta Entrega",
    icon: PackageCheck,
    badge: null,
    badgeType: "neutral",
  },
  { href: "/financeiro", label: "Financeiro", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="alm-nav">
      <div style={{ padding: "8px 0 0" }}>
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`alm-nav-item${isActive(item.href) ? " is-active" : ""}`}
          >
            <item.icon size={15} strokeWidth={1.5} />
            {item.label}
            {item.badge != null && (
              <span className={`alm-nav-badge${item.badgeType === "neutral" ? " is-neutral" : ""}`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="alm-divider" style={{ marginTop: "auto", marginBottom: 0 }} />

      <div style={{ padding: "4px 0 8px" }}>
        <Link
          href="/configuracoes"
          className={`alm-nav-item${isActive("/configuracoes") ? " is-active" : ""}`}
        >
          <Settings size={15} strokeWidth={1.5} />
          Configurações
        </Link>
      </div>
    </nav>
  );
}
