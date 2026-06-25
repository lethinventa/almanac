"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Box,
  ClipboardList,
  BarChart2,
} from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insumos", label: "Insumos", icon: Package },
  { href: "/produtos", label: "Produtos", icon: Box },
  { href: "/encomendas", label: "Encomendas", icon: ClipboardList },
  { href: "/financeiro", label: "Financeiro", icon: BarChart2 },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="atlas-tabbar-bottom" style={{ width: "100%", borderTop: "1px solid var(--border-default)" }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`atlas-tabbar-bottom-item${isActive(item.href) ? " is-active" : ""}`}
          style={{ textDecoration: "none", flex: 1 }}
        >
          <item.icon size={20} strokeWidth={isActive(item.href) ? 2 : 1.5} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
