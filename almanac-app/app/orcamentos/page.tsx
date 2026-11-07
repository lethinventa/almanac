"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { OrcamentosEnviados } from "../orcamento/orcamentos-enviados";

export default function OrcamentosPage() {
  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Orçamentos</h1>
          <p className="alm-page-subtitle">Acompanhe os orçamentos enviados e mande os aprovados para produção</p>
        </div>
        <Link
          href="/orcamento"
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
        >
          <Plus size={13} strokeWidth={1.5} />
          Novo orçamento
        </Link>
      </div>

      <OrcamentosEnviados refreshKey={0} />
    </div>
  );
}
