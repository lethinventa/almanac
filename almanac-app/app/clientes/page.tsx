"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Search, Phone, Trash2 } from "lucide-react";
import {
  buscarClientes,
  criarCliente,
  editarCliente,
  excluirCliente,
  type Cliente,
  type ClienteInput,
} from "@/lib/repositories/clientes";

// ── Modal wrapper (mesmo padrão de Encomendas) ───────────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 340);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div className={`alm-backdrop${visible ? " is-open" : ""}`} onClick={onClose} />
      <div className={`alm-modal${visible ? " is-open" : ""}`}>
        <div className="alm-modal-header">
          <span className="alm-modal-title">{title}</span>
          <button className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ padding: "0 4px" }} onClick={onClose}>
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="alm-modal-body">{children}</div>
      </div>
    </>
  );
}

// ── Formulário de cliente ────────────────────────────────────
function ClienteForm({
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

// ── Página ───────────────────────────────────────────────────
type ModalState = { mode: "novo" } | { mode: "editar"; cliente: Cliente } | null;

export default function ClientesPage() {
  const [lista, setLista] = useState<Cliente[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const recarregar = useCallback(() => buscarClientes().then((l) => { setLista(l); setCarregado(true); }), []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const close = useCallback(() => setModal(null), []);

  const filtrados = lista.filter((c) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return c.nome.toLowerCase().includes(q) || (c.telefone ?? "").includes(q);
  });

  const handleSave = async (dados: ClienteInput) => {
    if (modal?.mode === "editar") {
      await editarCliente(modal.cliente.id, dados);
    } else {
      await criarCliente(dados);
    }
    close();
    await recarregar();
  };

  const handleDelete = async () => {
    if (modal?.mode !== "editar") return;
    await excluirCliente(modal.cliente.id);
    close();
    await recarregar();
  };

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Clientes</h1>
          <p className="alm-page-subtitle">{lista.length} cadastrado{lista.length === 1 ? "" : "s"}</p>
        </div>
        <button
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => setModal({ mode: "novo" })}
        >
          <Plus size={13} strokeWidth={1.5} />
          Novo cliente
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 320 }}>
        <Search
          size={13}
          strokeWidth={1.5}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}
        />
        <input
          className="atlas-input"
          placeholder="Buscar por nome ou telefone…"
          style={{ paddingLeft: 26 }}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="atlas-card" style={{ padding: 0 }}>
        {!carregado ? null : filtrados.length === 0 ? (
          <div className="atlas-empty" style={{ padding: "32px" }}>
            <div className="atlas-empty-title">
              {lista.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
            </div>
            <div className="atlas-empty-desc">
              {lista.length === 0 ? "Cadastre um cliente para usá-lo nas encomendas." : "Tente outro termo."}
            </div>
          </div>
        ) : (
          <table className="atlas-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} onClick={() => setModal({ mode: "editar", cliente: c })} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td>
                    {c.telefone ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                        <Phone size={11} strokeWidth={1.5} />
                        {c.telefone}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-tertiary)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.observacoes ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal !== null} onClose={close} title={modal?.mode === "editar" ? "Editar cliente" : "Novo cliente"}>
        {modal && (
          <ClienteForm
            key={modal.mode === "editar" ? modal.cliente.id : "novo"}
            inicial={modal.mode === "editar" ? modal.cliente : undefined}
            onSave={handleSave}
            onDelete={modal.mode === "editar" ? handleDelete : undefined}
            onClose={close}
          />
        )}
      </Modal>
    </div>
  );
}
