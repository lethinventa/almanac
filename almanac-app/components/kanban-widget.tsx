"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  encomendas as encomendasMock,
  Encomenda,
  EncomendaStatus,
} from "@/lib/data";
import { KanbanBoard } from "@/components/kanban-board";

export function KanbanWidget() {
  const router = useRouter();
  const [lista, setLista] = useState<Encomenda[]>(encomendasMock);

  const handleStatusChange = (id: string, newStatus: EncomendaStatus) => {
    setLista((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
  };

  return (
    <div className="atlas-card" style={{ padding: 0 }}>
      <div
        className="atlas-card-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span className="atlas-panel-title">Pipeline de encomendas</span>
        <Link
          href="/encomendas"
          className="atlas-link"
          style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}
        >
          Ver todas
          <ArrowRight size={11} strokeWidth={1.5} />
        </Link>
      </div>
      <div className="atlas-card-body" style={{ padding: "12px 16px 16px" }}>
        <KanbanBoard
          lista={lista}
          onCardClick={(enc) => router.push(`/encomendas/${enc.id}`)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
