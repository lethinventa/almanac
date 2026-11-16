"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buscarEncomendas, atualizarStatus, type Encomenda, type EncomendaStatus } from "@/lib/repositories/encomendas";
import { buscarTodosPagamentos } from "@/lib/repositories/pagamentos";
import { KanbanBoard } from "@/components/kanban-board";

// Entregues ficam visíveis no dashboard por este número de dias após a data de entrega.
const DIAS_ENTREGUE_VISIVEL = 7;

// Data (YYYY-MM-DD) mais antiga que ainda aparece entre as entregues.
function dataLimiteEntregues(): string {
  const d = new Date();
  d.setDate(d.getDate() - DIAS_ENTREGUE_VISIVEL);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function KanbanWidget() {
  const router = useRouter();
  const [lista, setLista] = useState<Encomenda[]>([]);
  const [recebidoPorEncomenda, setRecebidoPorEncomenda] = useState<Record<string, number>>({});

  useEffect(() => {
    buscarEncomendas().then(setLista);
    buscarTodosPagamentos().then((todos) => {
      const totais: Record<string, number> = {};
      for (const [encId, pags] of Object.entries(todos)) {
        totais[encId] = pags.reduce((s, p) => s + p.valor, 0);
      }
      setRecebidoPorEncomenda(totais);
    });
  }, []);

  const handleStatusChange = (id: string, newStatus: EncomendaStatus) => {
    atualizarStatus(id, newStatus);
    setLista((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
  };

  const limite = dataLimiteEntregues();
  const visiveis = lista.filter((e) => e.status !== "entregue" || e.dataEntrega >= limite);

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
          lista={visiveis}
          onCardClick={(enc) => router.push(`/encomendas/${enc.id}`)}
          onStatusChange={handleStatusChange}
          recebidoPorEncomenda={recebidoPorEncomenda}
        />
      </div>
    </div>
  );
}
