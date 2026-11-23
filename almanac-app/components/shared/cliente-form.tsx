"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Cliente, ClienteInput } from "@/lib/repositories/clientes";

// Formulário de cadastro/edição de cliente. Usado na página Clientes e no cadastro rápido dentro de Nova encomenda.
export function ClienteForm({
  inicial,
  onSave,
  onDelete,
  onClose,
}: {
  inicial?: Cliente;
  onSave: (dados: ClienteInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [telefone, setTelefone] = useState(inicial?.telefone ?? "");
  const [observacoes, setObservacoes] = useState(inicial?.observacoes ?? "");
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [erro, setErro] = useState("");

  const podeSalvar = nome.trim().length > 0 && !salvando;

  const handleSave = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro("");
    try {
      await onSave({ nome, telefone, observacoes });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSalvando(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSalvando(true);
    try {
      await onDelete();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
      setSalvando(false);
    }
  };

  return (
    <>
      <div className="alm-field">
        <label className="alm-label">Nome</label>
        <input className="atlas-input" placeholder="Nome do cliente" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      </div>

      <div className="alm-field" style={{ maxWidth: 260 }}>
        <label className="alm-label">Telefone (opcional)</label>
        <input className="atlas-input" type="tel" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </div>

      <div className="alm-field">
        <label className="alm-label">Observações (opcional)</label>
        <textarea
          className="atlas-input"
          rows={3}
          placeholder="Preferências, endereço de entrega, etc."
          style={{ resize: "vertical", padding: "6px 8px", lineHeight: 1.5 }}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border-default)", marginTop: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {erro ? (
            <span style={{ fontSize: 11, color: "var(--status-error)" }}>{erro}</span>
          ) : onDelete && !confirmDelete ? (
            <button
              type="button"
              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-tertiary)" }}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={12} strokeWidth={1.5} />
              Excluir
            </button>
          ) : onDelete && confirmDelete ? (
            <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Excluir este cliente?
              <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ color: "var(--status-error)" }} onClick={handleDelete} disabled={salvando}>
                Sim, excluir
              </button>
              <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" onClick={() => setConfirmDelete(false)}>
                Não
              </button>
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="atlas-btn atlas-btn-primary atlas-btn-sm"
            disabled={!podeSalvar}
            style={{ opacity: podeSalvar ? 1 : 0.4 }}
            onClick={handleSave}
          >
            {salvando ? "Salvando…" : inicial ? "Salvar" : "Cadastrar cliente"}
          </button>
        </div>
      </div>
    </>
  );
}
