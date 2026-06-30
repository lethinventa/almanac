"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Package, X, Check } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { buscarProdutosPE, criarProdutoPE, type ProdutoPE, type ProdutoPEInput } from "@/lib/repositories/pronta-entrega";

function CadastrarModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (input: ProdutoPEInput) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMin, setEstoqueMin] = useState("5");

  const canSave = nome.trim() && parseFloat(preco) > 0 && parseInt(estoque) >= 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", width: 440, maxWidth: "calc(100vw - 32px)", boxShadow: "0 8px 32px rgba(0,0,0,0.28)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-default)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Cadastrar produto</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-icon atlas-btn-sm" onClick={onClose}><X size={14} strokeWidth={1.5} /></button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Nome do produto *</label>
            <input autoFocus className="atlas-input" placeholder="Ex: Caderneta pautada A6" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Descrição</label>
            <input className="atlas-input" placeholder="Ex: Capa dura, 80 folhas" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Preço (R$) *</label>
              <input className="atlas-input" type="number" min="0" step="0.01" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Estoque inicial *</label>
              <input className="atlas-input" type="number" min="0" placeholder="0" value={estoque} onChange={(e) => setEstoque(e.target.value)} />
            </div>
            <div className="alm-field" style={{ margin: 0 }}>
              <label className="alm-label">Estoque mínimo</label>
              <input className="atlas-input" type="number" min="0" placeholder="5" value={estoqueMin} onChange={(e) => setEstoqueMin(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--border-default)" }}>
          <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
          <button
            className="atlas-btn atlas-btn-primary atlas-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, opacity: canSave ? 1 : 0.4 }}
            disabled={!canSave}
            onClick={() => {
              onSave({ nome: nome.trim(), descricao: descricao.trim() || undefined, precoVenda: parseFloat(preco), estoqueAtual: parseInt(estoque) || 0, estoqueMin: parseInt(estoqueMin) || 5 });
              onClose();
            }}
          >
            <Check size={13} strokeWidth={2} />
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProntaEntregaPage() {
  const [produtos, setProdutos] = useState<ProdutoPE[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { buscarProdutosPE().then(setProdutos) }, []);

  const emAlerta = produtos.filter((p) => p.estoqueAtual <= p.estoqueMin && p.estoqueAtual > 0).length;
  const semEstoque = produtos.filter((p) => p.estoqueAtual === 0).length;
  const totalUnidades = produtos.reduce((s, p) => s + p.estoqueAtual, 0);

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Pronta Entrega</h1>
          <p className="alm-page-desc">Produtos prontos disponíveis para venda imediata</p>
        </div>
        <button className="atlas-btn atlas-btn-primary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setShowModal(true)}>
          <Plus size={14} strokeWidth={1.5} />
          Cadastrar produto
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div className="atlas-stat"><div className="atlas-stat-label">Total em estoque</div><div className="atlas-stat-value">{totalUnidades} un.</div></div>
        <div className="atlas-stat"><div className="atlas-stat-label">Estoque baixo</div><div className="atlas-stat-value" style={{ color: emAlerta > 0 ? "var(--status-warning)" : undefined }}>{emAlerta}</div></div>
        <div className="atlas-stat"><div className="atlas-stat-label">Sem estoque</div><div className="atlas-stat-value" style={{ color: semEstoque > 0 ? "var(--status-error)" : undefined }}>{semEstoque}</div></div>
      </div>

      <div className="atlas-card" style={{ padding: 0 }}>
        <table className="atlas-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 44 }} />
              <th>Produto</th>
              <th>Descrição</th>
              <th className="num">Preço</th>
              <th className="num">Em estoque</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "32px 0", fontSize: 13 }}>Nenhum produto cadastrado.</td></tr>
            ) : (
              produtos.map((p) => {
                const semEst = p.estoqueAtual === 0;
                const baixo = !semEst && p.estoqueAtual <= p.estoqueMin;
                return (
                  <tr key={p.id} style={{ cursor: "pointer" }}>
                    <td style={{ padding: "0 8px 0 12px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--bg-input)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {p.foto ? <img src={p.foto} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={15} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />}
                      </div>
                    </td>
                    <td>
                      <Link href={`/pronta-entrega/${p.id}`} style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
                        {p.nome}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{p.descricao ?? "—"}</td>
                    <td className="num"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatBRL(p.precoVenda)}</span></td>
                    <td className="num">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: semEst ? "var(--status-error)" : baixo ? "var(--status-warning)" : "var(--status-success)" }}>
                        {p.estoqueAtual}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 4 }}>/ mín. {p.estoqueMin}</span>
                    </td>
                    <td>
                      {semEst
                        ? <span className="atlas-badge atlas-badge-error">Sem estoque</span>
                        : baixo
                        ? <span className="atlas-badge atlas-badge-warning">Estoque baixo</span>
                        : <span className="atlas-badge atlas-badge-success">Disponível</span>
                      }
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CadastrarModal
          onClose={() => setShowModal(false)}
          onSave={(input) => { criarProdutoPE(input).then(() => buscarProdutosPE().then(setProdutos)) }}
        />
      )}
    </div>
  );
}
