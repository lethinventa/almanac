"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Package, ImagePlus, Link2, FileText,
} from "lucide-react";
import { formatBRL, formatDate } from "@/lib/utils";
import { lerImagem } from "@/lib/imagem";
import { gerarOrcamentoEncomenda } from "@/lib/orcamento-encomenda";
import { Combobox } from "@/components/shared/combobox";
import { Modal } from "@/components/shared/modal";
import { ClienteForm } from "@/components/shared/cliente-form";
import type { ProdutoCalculado } from "@/lib/repositories/produtos";
import type { EmbalagemEncomenda, EncomendaInput, EncomendaItem } from "@/lib/repositories/encomendas";
import { buscarClientes, criarCliente, type Cliente, type ClienteInput } from "@/lib/repositories/clientes";
import { buscarInsumos, type Insumo } from "@/lib/repositories/insumos";
import { EmbalagensPedido } from "@/components/shared/embalagens-pedido";

// Valor fixo no select de cliente: encomenda para uso próprio (não é venda).
const PESSOAL = "__pessoal__";
// Valor fixo no select de cliente: abre o cadastro rápido de cliente.
const NOVO_CLIENTE = "__novo_cliente__";

// Rota de retorno usada pelo cadastro de produto (?retorno=...).
export const ROTA_NOVA_ENCOMENDA = "/encomendas/nova";

// ── Rascunho ─────────────────────────────────────────────────
// O pedido em andamento é guardado na aba (sessionStorage), para não se perder
// ao sair para cadastrar um produto ou ao recarregar a página.
const CHAVE_RASCUNHO = "almanac:rascunho-encomenda";

interface ItemRow {
  produtoId: string;
  quantidade: string;
  precoUnitario: string;
  // Item avulso: feito uma vez para o cliente, sem cadastro no catálogo.
  avulso?: boolean;
  descricao?: string;
  custoUnitario?: string;
}

// Converte uma linha do formulário no item salvo na encomenda.
function paraItemEncomenda(r: ItemRow, precoUnitario: number): EncomendaItem {
  const base = {
    produtoId: r.avulso ? "" : r.produtoId,
    quantidade: parseFloat(r.quantidade) || 1,
    precoUnitario,
  };
  if (!r.avulso) return base;
  return {
    ...base,
    descricao: r.descricao?.trim() || "Item avulso",
    custoUnitario: parseFloat(r.custoUnitario ?? "") || 0,
  };
}

interface LinkUtil {
  label: string;
  url: string;
}

interface Rascunho {
  clienteSel: string;
  canal: "whatsapp" | "presencial";
  dataEntrega: string;
  itens: ItemRow[];
  desconto: string;
  valorCobrado: string;
  links: LinkUtil[];
  obs: string;
  embalagens: EmbalagemEncomenda[];
  foto: string | null;
}

export function lerRascunho(): Rascunho | null {
  try {
    const raw = sessionStorage.getItem(CHAVE_RASCUNHO);
    return raw ? (JSON.parse(raw) as Rascunho) : null;
  } catch {
    return null;
  }
}

function gravarRascunho(r: Rascunho) {
  try {
    sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(r));
  } catch {
    // Foto grande pode estourar a cota: guarda o resto sem a imagem.
    try {
      sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ ...r, foto: null }));
    } catch {
      // Sem espaço disponível: o pedido só vive na tela.
    }
  }
}

export function limparRascunho() {
  try {
    sessionStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    // ignorado
  }
}

function FotoUploadSmall({ value, onChange }: { value: string | null; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) lerImagem(f).then(onChange).catch((err) => console.error("Erro ao ler imagem:", err));
  };
  return (
    <div className="alm-upload" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
      {value ? (
        <img src={value} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4 }} />
      ) : (
        <>
          <ImagePlus size={18} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
          <span className="alm-upload-label">Foto de referência (opcional)</span>
          <span className="alm-upload-hint">PNG, JPG — para referência rápida</span>
        </>
      )}
    </div>
  );
}

export function NovaEncomendaForm({
  onSave,
  onCancelar,
  produtos,
  produtoCriadoId,
}: {
  onSave: (enc: EncomendaInput) => void;
  onCancelar: () => void;
  produtos: ProdutoCalculado[];
  // Produto recém-cadastrado (volta do cadastro de produto): entra como novo item.
  produtoCriadoId?: string | null;
}) {
  const router = useRouter();
  const hoje = new Date().toISOString().slice(0, 10);

  // Rascunho lido uma única vez, na montagem (o formulário só monta no cliente).
  const [rascunho] = useState<Rascunho | null>(() => lerRascunho());

  const [foto, setFoto] = useState<string | null>(rascunho?.foto ?? null);
  // Seleção do campo Cliente: id de um cliente cadastrado, ou PESSOAL.
  const [clienteSel, setClienteSel] = useState(rascunho?.clienteSel ?? "");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novoClienteAberto, setNovoClienteAberto] = useState(false);
  const pessoal = clienteSel === PESSOAL;
  const nomeCliente = pessoal ? "Pessoal" : clientes.find((c) => c.id === clienteSel)?.nome ?? "";
  const [canal, setCanal] = useState<"whatsapp" | "presencial">(rascunho?.canal ?? "whatsapp");
  const [dataEntrega, setDataEntrega] = useState(rascunho?.dataEntrega ?? "");
  const [itens, setItens] = useState<ItemRow[]>(
    rascunho?.itens ??
      (produtos.length > 0
        ? [{ produtoId: produtos[0].id, quantidade: "1", precoUnitario: String(produtos[0].precoVendaEfetivo) }]
        : [])
  );
  const [desconto, setDesconto] = useState(rascunho?.desconto ?? "0");
  // Valor realmente cobrado do cliente. Vazio = calculado pelos itens menos o desconto.
  const [valorCobrado, setValorCobrado] = useState(rascunho?.valorCobrado ?? "");
  const [links, setLinks] = useState<LinkUtil[]>(rascunho?.links ?? []);
  const [novoLinkLabel, setNovoLinkLabel] = useState("");
  const [novoLinkUrl, setNovoLinkUrl] = useState("");
  const [obs, setObs] = useState(rascunho?.obs ?? "");
  const [gerando, setGerando] = useState(false);
  const [erroOrcamento, setErroOrcamento] = useState("");
  const [embalagens, setEmbalagens] = useState<EmbalagemEncomenda[]>(rascunho?.embalagens ?? []);
  const [insumos, setInsumos] = useState<Insumo[]>([]);

  useEffect(() => {
    buscarInsumos().then(setInsumos);
    buscarClientes().then(setClientes);
  }, []);

  // Volta do cadastro de produto: adiciona o produto novo como item e limpa o parâmetro da URL.
  const produtoAdicionado = useRef(false);
  useEffect(() => {
    if (!produtoCriadoId || produtoAdicionado.current) return;
    const prod = produtos.find((p) => p.id === produtoCriadoId);
    if (!prod) return;
    produtoAdicionado.current = true;
    setItens((prev) => [
      ...prev,
      { produtoId: prod.id, quantidade: "1", precoUnitario: String(prod.precoVendaEfetivo) },
    ]);
    window.history.replaceState(null, "", ROTA_NOVA_ENCOMENDA);
  }, [produtoCriadoId, produtos]);

  // Autosave do rascunho a cada mudança.
  useEffect(() => {
    gravarRascunho({
      clienteSel, canal, dataEntrega, itens, desconto, valorCobrado, links, obs, embalagens, foto,
    });
  }, [clienteSel, canal, dataEntrega, itens, desconto, valorCobrado, links, obs, embalagens, foto]);

  const subtotal = itens.reduce((s, r) => s + (parseFloat(r.quantidade) || 0) * (parseFloat(r.precoUnitario) || 0), 0);
  const descontoNum = parseFloat(desconto) || 0;
  const totalAutomatico = Math.max(subtotal - descontoNum, 0);
  const valorCobradoNum = parseFloat(valorCobrado);
  const temValorCobrado = valorCobrado.trim() !== "" && !isNaN(valorCobradoNum);
  const total = temValorCobrado ? valorCobradoNum : totalAutomatico;
  const custoItens = itens.reduce((s, r) => {
    const custoUnit = r.avulso
      ? parseFloat(r.custoUnitario ?? "") || 0
      : produtos.find((p) => p.id === r.produtoId)?.custo ?? 0;
    return s + custoUnit * (parseFloat(r.quantidade) || 0);
  }, 0);
  const custoEmbalagens = embalagens.reduce((s, e) => s + e.quantidade * e.custoUnitario, 0);
  const custo = custoItens + custoEmbalagens;
  const margem = total > 0 ? ((total - custo) / total) * 100 : 0;
  const margemColor = margem >= 60 ? "var(--status-success)" : margem >= 30 ? "var(--status-warning)" : "var(--status-error)";

  const addItem = () =>
    setItens((prev) => [
      ...prev,
      { produtoId: produtos[0]?.id ?? "", quantidade: "1", precoUnitario: String(produtos[0]?.precoVendaEfetivo ?? 0) },
    ]);

  const addItemAvulso = () =>
    setItens((prev) => [
      ...prev,
      { produtoId: "", quantidade: "1", precoUnitario: "", avulso: true, descricao: "", custoUnitario: "" },
    ]);

  const removeItem = (idx: number) =>
    setItens((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ItemRow, value: string) =>
    setItens((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (field === "produtoId") {
          const prod = produtos.find((p) => p.id === value);
          return { ...r, produtoId: value, precoUnitario: prod ? String(prod.precoVendaEfetivo) : r.precoUnitario };
        }
        return { ...r, [field]: value };
      })
    );

  // Sai para o cadastro de produto; o pedido fica guardado no rascunho e volta aqui.
  const irCadastrarProduto = () => {
    router.push(`/produtos?novo=1&retorno=${encodeURIComponent(ROTA_NOVA_ENCOMENDA)}`);
  };

  const handleSelecionarCliente = (v: string) => {
    if (v === NOVO_CLIENTE) {
      setNovoClienteAberto(true);
      return;
    }
    setClienteSel(v);
  };

  const handleCriarCliente = async (dados: ClienteInput) => {
    const novo = await criarCliente(dados);
    setClientes(await buscarClientes());
    setClienteSel(novo.id);
    setNovoClienteAberto(false);
  };

  const addLink = () => {
    if (!novoLinkUrl.trim()) return;
    setLinks((prev) => [...prev, { label: novoLinkLabel.trim() || novoLinkUrl.trim(), url: novoLinkUrl.trim() }]);
    setNovoLinkLabel("");
    setNovoLinkUrl("");
  };

  const camposFaltando = [
    !nomeCliente && "cliente",
    !dataEntrega && (pessoal ? "data prevista" : "data de entrega"),
    itens.length === 0 && "ao menos um item",
    itens.some((r) => r.avulso && !r.descricao?.trim()) && "descrição do item avulso",
  ].filter(Boolean) as string[];
  const canSave = camposFaltando.length === 0;

  const handleSave = async () => {
    if (!canSave || gerando) return;
    // Encomenda pessoal: sem preço, sem orçamento e sem cobrança. Só a produção importa.
    if (pessoal) {
      onSave({
        tipo: "pessoal",
        cliente: nomeCliente,
        canal: "presencial",
        status: "aguardando",
        dataPedido: hoje,
        dataEntrega,
        itens: itens.map((r) => paraItemEncomenda(r, 0)),
        desconto: 0,
        valorCobrado: null,
        totalCobrado: 0,
        custoProducao: custo,
        margem: 0,
        observacoes: obs.trim() || undefined,
        foto: foto ?? undefined,
        embalagens,
      });
      return;
    }
    setGerando(true);
    setErroOrcamento("");
    const itensSalvos = itens.map((r) => paraItemEncomenda(r, parseFloat(r.precoUnitario) || 0));
    try {
      // Toda encomenda leva a imagem de orçamento, no mesmo modelo do módulo Orçamento.
      const orcamentoImagem = await gerarOrcamentoEncomenda({
        cliente: nomeCliente,
        prazo: formatDate(dataEntrega),
        data: hoje,
        linhas: itensSalvos.map((i) => ({
          descricao: produtos.find((p) => p.id === i.produtoId)?.nome ?? i.descricao ?? "Item",
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          subtotal: i.quantidade * i.precoUnitario,
        })),
        desconto: descontoNum,
        total,
      });
      onSave({
        tipo: "cliente",
        cliente: nomeCliente,
        canal,
        status: "aguardando",
        dataPedido: hoje,
        dataEntrega,
        itens: itensSalvos,
        desconto: descontoNum,
        valorCobrado: temValorCobrado ? valorCobradoNum : null,
        totalCobrado: total,
        custoProducao: custo,
        margem,
        observacoes: obs.trim() || undefined,
        foto: foto ?? undefined,
        orcamentoImagem,
        embalagens,
      });
    } catch (err) {
      console.error("Erro ao gerar imagem do orçamento:", err);
      setErroOrcamento("Não foi possível gerar a imagem do orçamento. Tente de novo.");
      setGerando(false);
    }
  };

  return (
    <>
      <FotoUploadSmall value={foto} onChange={setFoto} />

      <div style={{ display: "grid", gridTemplateColumns: pessoal ? "1fr" : "1fr auto", gap: 10 }}>
        <div className="alm-field">
          <label className="alm-label">Cliente</label>
          <Combobox
            value={clienteSel}
            onChange={handleSelecionarCliente}
            options={[
              { value: "", label: "Selecione…" },
              { value: PESSOAL, label: "Pessoal" },
              { value: NOVO_CLIENTE, label: "+ Cadastrar novo cliente" },
              ...clientes.map((c) => ({ value: c.id, label: c.nome })),
            ]}
          />
        </div>
        {!pessoal && (
          <div className="alm-field">
            <label className="alm-label">Canal</label>
            <Combobox
              value={canal}
              onChange={(v) => setCanal(v as "whatsapp" | "presencial")}
              options={[
                { value: "whatsapp", label: "WhatsApp" },
                { value: "presencial", label: "Presencial" },
              ]}
            />
          </div>
        )}
      </div>

      <div className="alm-field" style={{ maxWidth: 200 }}>
        <label className="alm-label">{pessoal ? "Data prevista" : "Data de entrega"}</label>
        <input className="atlas-input" type="date" min={hoje} value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
      </div>

      <div className="alm-field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
          <label className="alm-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Package size={11} strokeWidth={1.5} />
            Itens do pedido
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }} onClick={addItemAvulso}>
              <Plus size={11} strokeWidth={1.5} />Item avulso
            </button>
            <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }} onClick={irCadastrarProduto}>
              <Plus size={11} strokeWidth={1.5} />Cadastrar novo produto
            </button>
            <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }} onClick={addItem}>
              <Plus size={11} strokeWidth={1.5} />Adicionar
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {itens.map((row, idx) => {
            const q = parseFloat(row.quantidade) || 0;
            const p = parseFloat(row.precoUnitario) || 0;
            const sub = q * p;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: pessoal ? "minmax(0, 1fr) 64px 24px" : "minmax(0, 1fr) 64px 88px 72px 24px", gap: 6, alignItems: "center" }}>
                {row.avulso ? (
                  <input className="atlas-input" placeholder="Descrição do item (ex: Convite casamento)" style={{ height: 32, fontSize: 12, minWidth: 0 }} value={row.descricao ?? ""} onChange={(e) => updateItem(idx, "descricao", e.target.value)} />
                ) : (
                  <select className="alm-select" style={{ height: 32, fontSize: 12, width: "100%", minWidth: 0, textOverflow: "ellipsis" }} value={row.produtoId} onChange={(e) => updateItem(idx, "produtoId", e.target.value)}>
                    {produtos.length === 0 && <option value="" disabled>Nenhum produto cadastrado</option>}
                    {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                )}
                <input className="atlas-input" type="number" min="1" placeholder="Qtd" style={{ fontSize: 12 }} value={row.quantidade} onChange={(e) => updateItem(idx, "quantidade", e.target.value)} />
                {!pessoal && (
                  <>
                    <input className="atlas-input" type="number" min="0" step="0.01" placeholder="R$ unit." style={{ fontSize: 12 }} value={row.precoUnitario} onChange={(e) => updateItem(idx, "precoUnitario", e.target.value)} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: sub > 0 ? "var(--text-primary)" : "var(--text-tertiary)", textAlign: "right", paddingRight: 4 }}>
                      {sub > 0 ? formatBRL(sub) : "—"}
                    </span>
                  </>
                )}
                <button type="button" title="Remover item" aria-label="Remover item" onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
                {row.avulso && (
                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
                    <span>Custo unitário (R$)</span>
                    <input className="atlas-input" type="number" min="0" step="0.01" placeholder="0,00" style={{ fontSize: 12, width: 110 }} value={row.custoUnitario ?? ""} onChange={(e) => updateItem(idx, "custoUnitario", e.target.value)} />
                    <span>Usado na margem. Não tem cadastro no catálogo.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EmbalagensPedido embalagens={embalagens} onChange={setEmbalagens} insumosEmbalagem={insumos.filter((i) => i.categoria === "embalagem")} />

      {!pessoal && (
        <>
          <div className="alm-field" style={{ maxWidth: 200 }}>
            <label className="alm-label">Desconto (R$)</label>
            <input className="atlas-input" type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
          </div>

          <div className="alm-field" style={{ maxWidth: 200 }}>
            <label className="alm-label">Valor cobrado (R$)</label>
            <input className="atlas-input" type="number" min="0" step="0.01" placeholder={totalAutomatico.toFixed(2)} value={valorCobrado} onChange={(e) => setValorCobrado(e.target.value)} />
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, display: "block" }}>
              {temValorCobrado ? "Valor combinado com o cliente, usado no total." : "Vazio: usa o total calculado pelos itens."}
            </span>
          </div>
        </>
      )}

      {!pessoal && subtotal > 0 && (
        <div style={{ background: "var(--bg-input)", borderRadius: "var(--radius-md, 4px)", border: "1px solid var(--border-default)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)" }}>
            <span>Subtotal</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(subtotal)}</span>
          </div>
          {descontoNum > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--status-error)" }}>
              <span>Desconto</span><span style={{ fontFamily: "var(--font-mono)" }}>− {formatBRL(descontoNum)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid var(--border-default)", paddingTop: 6 }}>
            <span>Total</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatBRL(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
            <span>Margem estimada</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: margemColor }}>{margem.toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div className="alm-field">
        <label className="alm-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <Link2 size={11} strokeWidth={1.5} />Links úteis (opcional)
        </label>
        {links.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <FileText size={12} strokeWidth={1.5} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, color: "var(--accent-highlight)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</span>
            <button onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, display: "flex" }}>
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          <input className="atlas-input" placeholder="Rótulo (ex: Drive identidade)" style={{ flex: 1, fontSize: 12 }} value={novoLinkLabel} onChange={(e) => setNovoLinkLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} />
          <input className="atlas-input" placeholder="https://..." style={{ flex: 1, fontSize: 12 }} value={novoLinkUrl} onChange={(e) => setNovoLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} />
          <button className="atlas-btn atlas-btn-secondary atlas-btn-sm" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }} onClick={addLink} disabled={!novoLinkUrl.trim()}>
            <Plus size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="alm-field">
        <label className="alm-label">Observações (opcional)</label>
        <textarea className="atlas-input" rows={2} placeholder="Instruções especiais, referências, etc." style={{ resize: "vertical", padding: "6px 8px", lineHeight: 1.5 }} value={obs} onChange={(e) => setObs(e.target.value)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border-default)", marginTop: 4 }}>
        {erroOrcamento ? (
          <span style={{ marginRight: "auto", fontSize: 11, color: "var(--status-error)" }}>{erroOrcamento}</span>
        ) : !canSave ? (
          <span style={{ marginRight: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
            Falta preencher: {camposFaltando.join(", ")}
          </span>
        ) : null}
        <button type="button" className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="atlas-btn atlas-btn-primary atlas-btn-sm" disabled={!canSave || gerando} style={{ opacity: canSave && !gerando ? 1 : 0.4 }} onClick={handleSave}>
          {gerando ? "Gerando orçamento…" : "Criar encomenda"}
        </button>
      </div>

      <Modal open={novoClienteAberto} onClose={() => setNovoClienteAberto(false)} title="Novo cliente">
        <ClienteForm onSave={handleCriarCliente} onClose={() => setNovoClienteAberto(false)} />
      </Modal>
    </>
  );
}
