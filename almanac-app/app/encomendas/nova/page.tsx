"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { criarEncomenda, type EncomendaInput } from "@/lib/repositories/encomendas";
import { buscarProdutos, type ProdutoCalculado } from "@/lib/repositories/produtos";
import { NovaEncomendaForm, limparRascunho } from "@/components/shared/nova-encomenda-form";

export default function NovaEncomendaPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<ProdutoCalculado[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [produtoCriadoId, setProdutoCriadoId] = useState<string | null>(null);

  // Produtos carregam antes do formulário, para os itens já nascerem com um produto selecionado.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProdutoCriadoId(params.get("produtoCriado"));
    buscarProdutos().then((lista) => {
      setProdutos(lista);
      setCarregado(true);
    });
  }, []);

  const handleSave = async (enc: EncomendaInput) => {
    const nova = await criarEncomenda(enc);
    limparRascunho();
    router.push(`/encomendas/${nova.id}`);
  };

  const handleCancelar = () => {
    limparRascunho();
    router.push("/encomendas");
  };

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <Link
            href="/encomendas"
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", marginBottom: 6 }}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Voltar para encomendas
          </Link>
          <h1 className="alm-page-title">Nova encomenda</h1>
        </div>
      </div>

      {carregado && (
        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 14 }}>
          <NovaEncomendaForm
            onSave={handleSave}
            onCancelar={handleCancelar}
            produtos={produtos}
            produtoCriadoId={produtoCriadoId}
          />
        </div>
      )}
    </div>
  );
}
