"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Phone } from "lucide-react";
import {
  buscarClientes,
  criarCliente,
  editarCliente,
  excluirCliente,
  type Cliente,
  type ClienteInput,
} from "@/lib/repositories/clientes";
import { Modal } from "@/components/shared/modal";
import { ClienteForm } from "@/components/shared/cliente-form";

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
