"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import { editarOrcamento, type Orcamento, type OrcamentoItem } from "@/lib/repositories/orcamentos";

interface LinhaEdicao {
  descricao: string;
  quantidade: string;
  precoUnitario: string;
  custoUnitario: string;
}

const paraLinha = (i: OrcamentoItem): LinhaEdicao => ({
  descricao: i.descricao,
  quantidade: String(i.quantidade),
  precoUnitario: String(i.precoUnitario),
  custoUnitario: String(i.custoUnitario),
});

const num = (s: string) => parseFloat(s.replace(",", ".")) || 0;

export function EditarOrcamentoModal({
  orcamento,
  onClose,
  onSalvo,
}: {
  orcamento: Orcamento | null;
  onClose: () => void;
  onSalvo: () => void;
}) {
  // A chave por orçamento faz o formulário reiniciar ao abrir outro orçamento.
  return (
    <Modal open={orcamento !== null} onClose={onClose} title="Editar orçamento" wide>
      {orcamento && <FormularioEdicao key={orcamento.id} orcamento={orcamento} onClose={onClose} onSalvo={onSalvo} />}
    </Modal>
  );
}

function FormularioEdicao({
  orcamento,
  onClose,
  onSalvo,
}: {
  orcamento: Orcamento;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const [cliente, setCliente] = useState(orcamento.cliente);
  const [prazo, setPrazo] = useState(orcamento.prazo);
  const [desconto, setDesconto] = useState(String(orcamento.desconto || ""));
  const [linhas, setLinhas] = useState<LinhaEdicao[]>(orcamento.itens.map(paraLinha));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const atualizarLinha = (idx: number, campo: keyof LinhaEdicao, valor: string) =>
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));

  const subtotal = linhas.reduce((s, l) => s + num(l.quantidade) * num(l.precoUnitario), 0);
  const descontoNum = Math.min(Math.max(num(desconto), 0), subtotal);
  const total = Math.max(subtotal - descontoNum, 0);
  const custo = linhas.reduce((s, l) => s + num(l.custoUnitario) * num(l.quantidade), 0);
  const margem = total > 0 ? ((total - custo) / total) * 100 : 0;

  const podeSalvar = linhas.some((l) => l.descricao.trim()) && !salvando;

  const handleSalvar = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro("");
    try {
      await editarOrcamento(orcamento.id, {
        cliente,
        prazo,
        desconto: descontoNum,
        itens: linhas
          .filter((l) => l.descricao.trim())
          .map((l) => {
            const quantidade = num(l.quantidade) || 1;
            const precoUnitario = num(l.precoUnitario);
            return {
              descricao: l.descricao.trim(),
              quantidade,
              precoUnitario,
              subtotal: quantidade * precoUnitario,
              custoUnitario: num(l.custoUnitario),
            };
          }),
      });
      onSalvo();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSalvando(false);
    }
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="alm-field">
          <label className="alm-label">Cliente</label>
          <input className="atlas-input" placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </div>
        <div className="alm-field">
          <label className="alm-label">Prazo de entrega</label>
          <input className="atlas-input" placeholder="Ex.: 7 dias úteis" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
      </div>

      <div className="alm-field">
        <label className="alm-label">Itens</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {linhas.map((l, idx) => (
            <div
              key={idx}
              style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 64px 92px 92px 24px", gap: 6, alignItems: "center" }}
            >
              <input className="atlas-input" placeholder="Descrição" style={{ fontSize: 12 }} value={l.descricao} onChange={(e) => atualizarLinha(idx, "descricao", e.target.value)} />
              <input className="atlas-input" type="number" min="1" placeholder="Qtd" style={{ fontSize: 12 }} value={l.quantidade} onChange={(e) => atualizarLinha(idx, "quantidade", e.target.value)} />
              <input className="atlas-input" type="number" min="0" step="0.01" placeholder="R$ unit." title="Preço unitário" style={{ fontSize: 12 }} value={l.precoUnitario} onChange={(e) => atualizarLinha(idx, "precoUnitario", e.target.value)} />
              <input className="atlas-input" type="number" min="0" step="0.01" placeholder="Custo un." title="Custo unitário (interno)" style={{ fontSize: 12 }} value={l.custoUnitario} onChange={(e) => atualizarLinha(idx, "custoUnitario", e.target.value)} />
              <button
                type="button"
                title="Remover item"
                aria-label="Remover item"
                onClick={() => setLinhas((prev) => prev.filter((_, i) => i !== idx))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="atlas-btn atlas-btn-ghost atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, marginTop: 6 }}
          onClick={() => setLinhas((prev) => [...prev, { descricao: "", quantidade: "1", precoUnitario: "", custoUnitario: "" }])}
        >
          <Plus size={11} strokeWidth={1.5} />Adicionar item
        </button>
      </div>

      <div className="alm-field" style={{ maxWidth: 200 }}>
        <label className="alm-label">Desconto (R$)</label>
        <input className="atlas-input" type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
      </div>

      <div style={{ background: "var(--bg-input)", borderRadius: "var(--radius-md, 4px)", border: "1px solid var(--border-default)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)" }}>
          <span>Subtotal</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid var(--border-default)", paddingTop: 6 }}>
          <span>Total</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(total)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
          <span>Margem estimada</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{total > 0 ? `${margem.toFixed(1)}%` : "—"}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border-default)", marginTop: 4 }}>
        {erro ? (
          <span style={{ marginRight: "auto", fontSize: 11, color: "var(--status-error)" }}>{erro}</span>
        ) : !linhas.some((l) => l.descricao.trim()) ? (
          <span style={{ marginRight: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>Informe ao menos um item com descrição.</span>
        ) : null}
        <button type="button" className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          disabled={!podeSalvar}
          style={{ opacity: podeSalvar ? 1 : 0.4 }}
          onClick={handleSalvar}
        >
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </>
  );
}
