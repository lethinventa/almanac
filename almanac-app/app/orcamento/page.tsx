"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Copy, Check, RotateCcw, Package, Download, Share2, ImageIcon } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { buscarInsumos, type Insumo } from "@/lib/repositories/insumos";
import { buscarConfiguracoes, type Configuracoes } from "@/lib/repositories/configuracoes";
import { buscarTotalCustosIndiretos } from "@/lib/repositories/financeiro";
import {
  calcularItem,
  calcularResumo,
  novoItem,
  textoOrcamento,
  type ItemOrcamento,
  type ItemCalculado,
} from "@/lib/orcamento";
import { gerarImagemOrcamento, type DadosImagem } from "@/lib/orcamento-imagem";
import "./orcamento.css";

const novoId = () => crypto.randomUUID();

// Input numérico que aceita vírgula e não perde o ponto decimal enquanto digita.
function NumInput({
  value,
  onChange,
  placeholder,
  step = "0.01",
  ...rest
}: {
  value: number | null;
  onChange: (valor: number | null) => void;
  placeholder?: string;
  step?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const formatar = (v: number | null) => (v === null || v === 0 ? "" : String(v).replace(".", ","));
  const [texto, setTexto] = useState(formatar(value));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) setTexto(formatar(value));
  }, [value, focado]);

  return (
    <input
      {...rest}
      className="atlas-input"
      inputMode="decimal"
      step={step}
      placeholder={placeholder}
      value={texto}
      onFocus={() => setFocado(true)}
      onBlur={() => {
        setFocado(false);
        setTexto(formatar(value));
      }}
      onChange={(e) => {
        const bruto = e.target.value;
        setTexto(bruto);
        const limpo = bruto.trim().replace(",", ".");
        if (limpo === "") return onChange(null);
        const n = Number(limpo);
        if (!Number.isNaN(n)) onChange(n);
      }}
    />
  );
}

function ItemCard({
  item,
  index,
  calc,
  insumos,
  onChange,
  onRemove,
}: {
  item: ItemOrcamento;
  index: number;
  calc: ItemCalculado;
  insumos: Insumo[];
  onChange: (patch: Partial<ItemOrcamento>) => void;
  onRemove: () => void;
}) {
  const mapa = new Map(insumos.map((i) => [i.id, i]));
  const margemCor =
    calc.margem >= 60 ? "var(--status-success)" : calc.margem >= 30 ? "var(--status-warning)" : "var(--status-error)";
  const precoAjustado = item.precoManual !== null;

  const atualizarUso = (idx: number, patch: Partial<ItemOrcamento["insumos"][number]>) =>
    onChange({
      insumos: item.insumos.map((u, i) => (i === idx ? { ...u, ...patch } : u)),
    });

  return (
    <div className="atlas-card orc-item">
      <div className="orc-item-header">
        <span className="orc-item-numero">Item {index + 1}</span>
        <button type="button" className="orc-icone-btn" onClick={onRemove} aria-label="Remover item">
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>

      <div className="orc-item-grid">
        <div className="alm-field orc-full">
          <label className="alm-label">Descrição</label>
          <input
            className="atlas-input"
            placeholder="Ex.: Chaveiro acrílico com nome"
            value={item.descricao}
            onChange={(e) => onChange({ descricao: e.target.value })}
          />
        </div>
        <div className="alm-field">
          <label className="alm-label">Quantidade</label>
          <NumInput
            step="1"
            value={item.quantidade}
            placeholder="1"
            onChange={(v) => onChange({ quantidade: v ?? 0 })}
          />
        </div>
        <div className="alm-field">
          <label className="alm-label">Tempo (min/un)</label>
          <NumInput
            step="1"
            value={item.tempoMin}
            placeholder="0"
            onChange={(v) => onChange({ tempoMin: v ?? 0 })}
          />
        </div>
        <div className="alm-field">
          <label className="alm-label">Multiplicador</label>
          <NumInput
            value={item.multiplicador}
            placeholder="3"
            onChange={(v) => onChange({ multiplicador: v ?? 0 })}
          />
        </div>
        <div className="alm-field">
          <label className="alm-label">Material avulso (R$/un)</label>
          <NumInput
            value={item.materialAvulso}
            placeholder="0,00"
            onChange={(v) => onChange({ materialAvulso: v ?? 0 })}
          />
        </div>
      </div>

      <div className="alm-field">
        <div className="orc-linha-titulo">
          <label className="alm-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Package size={11} strokeWidth={1.5} />
            Insumos usados (por unidade)
          </label>
        </div>
        {insumos.length > 0 ? (
          <select
            className="alm-select"
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) onChange({ insumos: [...item.insumos, { insumoId: id, quantidade: 1 }] });
            }}
          >
            <option value="">+ Adicionar insumo cadastrado…</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ({formatBRL(i.precoAtual)}/{i.unidade})
              </option>
            ))}
          </select>
        ) : (
          <span className="orc-ajuda">
            Nenhum insumo cadastrado ainda. <Link href="/insumos">Cadastrar insumos</Link>, ou use &quot;Material
            avulso&quot;.
          </span>
        )}
        {item.insumos.map((uso, idx) => {
          const insumo = mapa.get(uso.insumoId);
          return (
            <div key={idx} className="orc-insumo-row">
              <select
                className="alm-select"
                value={uso.insumoId}
                onChange={(e) => atualizarUso(idx, { insumoId: e.target.value })}
              >
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({formatBRL(i.precoAtual)}/{i.unidade})
                  </option>
                ))}
              </select>
              <NumInput
                step="0.01"
                value={uso.quantidade}
                placeholder={insumo ? `qtd em ${insumo.unidade}` : "qtd"}
                onChange={(v) => atualizarUso(idx, { quantidade: v ?? 0 })}
              />
              <button
                type="button"
                className="orc-icone-btn"
                aria-label="Remover insumo"
                onClick={() => onChange({ insumos: item.insumos.filter((_, i) => i !== idx) })}
              >
                <Trash2 size={12} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="orc-preco">
        <div className="alm-field" style={{ maxWidth: 220 }}>
          <div className="orc-linha-titulo">
            <label className="alm-label">Preço unitário (R$)</label>
            {precoAjustado && (
              <button type="button" className="orc-link" onClick={() => onChange({ precoManual: null })}>
                <RotateCcw size={10} strokeWidth={1.5} style={{ verticalAlign: "-1px" }} /> usar calculado
              </button>
            )}
          </div>
          <NumInput
            value={item.precoManual ?? calc.precoCalculado}
            placeholder="0,00"
            onChange={(v) => onChange({ precoManual: v })}
          />
          <span className="orc-ajuda">
            {precoAjustado ? `Ajustado à mão · calculado: ${formatBRL(calc.precoCalculado)}` : "Calculado automaticamente"}
          </span>
        </div>

        <div className="orc-item-totais">
          <div className="orc-linha">
            <span>Custo do item</span>
            <strong>{formatBRL(calc.custoTotal)}</strong>
          </div>
          <div className="orc-linha">
            <span>Margem</span>
            <strong style={{ color: margemCor }}>{calc.subtotal > 0 ? `${calc.margem.toFixed(1)}%` : "—"}</strong>
          </div>
          <div className="orc-linha orc-linha-destaque">
            <span>Subtotal</span>
            <strong>{formatBRL(calc.subtotal)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pré-visualização e envio da imagem. Recebe os dados já prontos e só roda
// os hooks quando a página está carregada (evita hooks após um return antecipado).
function ImagemOrcamento({ dados }: { dados: DadosImagem | null }) {
  const [imagem, setImagem] = useState<{ blob: Blob; url: string } | null>(null);
  const chave = dados ? JSON.stringify(dados) : "";

  useEffect(() => {
    if (!chave) {
      setImagem(null);
      return;
    }
    let cancelado = false;
    const t = setTimeout(async () => {
      try {
        const blob = await gerarImagemOrcamento(JSON.parse(chave) as DadosImagem);
        if (cancelado) return;
        // A URL anterior é liberada pelo efeito de limpeza abaixo.
        setImagem({ blob, url: URL.createObjectURL(blob) });
      } catch (err) {
        console.error("Erro ao gerar imagem:", err);
      }
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [chave]);

  // Libera a URL do blob quando a imagem é trocada ou o componente sai da tela.
  useEffect(() => {
    return () => {
      if (imagem) URL.revokeObjectURL(imagem.url);
    };
  }, [imagem]);

  const nomeArquivo = () => {
    const slug = (dados?.cliente ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `orcamento${slug ? `-${slug}` : ""}.png`;
  };

  const baixarImagem = () => {
    if (!imagem) return;
    const a = document.createElement("a");
    a.href = imagem.url;
    a.download = nomeArquivo();
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const compartilharImagem = async () => {
    if (!imagem) return;
    const arquivo = new File([imagem.blob], nomeArquivo(), { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: "Orçamento" });
      } else {
        baixarImagem();
      }
    } catch (err) {
      // Cancelar o compartilhamento lança AbortError; não é erro.
      if ((err as Error).name !== "AbortError") console.error("Erro ao compartilhar:", err);
    }
  };

  return (
    <div className="orc-imagem">
      <div className="orc-linha-titulo">
        <label className="alm-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ImageIcon size={11} strokeWidth={1.5} />
          Imagem para enviar
        </label>
      </div>
      {imagem ? (
        <img className="orc-imagem-preview" src={imagem.url} alt="Pré-visualização do orçamento" />
      ) : (
        <span className="orc-ajuda">Adicione um item com descrição ou valor para gerar a imagem.</span>
      )}
      <div className="orc-imagem-acoes">
        <button
          type="button"
          className="atlas-btn atlas-btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, flex: 1 }}
          onClick={baixarImagem}
          disabled={!imagem}
        >
          <Download size={14} strokeWidth={1.5} />
          Baixar PNG
        </button>
        <button
          type="button"
          className="atlas-btn atlas-btn-primary"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, flex: 1 }}
          onClick={compartilharImagem}
          disabled={!imagem}
        >
          <Share2 size={14} strokeWidth={1.5} />
          Compartilhar
        </button>
      </div>
    </div>
  );
}

export default function OrcamentoPage() {
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [totalCustos, setTotalCustos] = useState(0);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cliente, setCliente] = useState("");
  const [prazo, setPrazo] = useState("");
  const [desconto, setDesconto] = useState<number | null>(null);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    Promise.all([buscarConfiguracoes(), buscarTotalCustosIndiretos(), buscarInsumos()]).then(
      ([cfg, custos, ins]) => {
        setConfig(cfg);
        setTotalCustos(custos);
        setInsumos(ins);
        setItens([novoItem(cfg.multiplicadorPreco, novoId())]);
      }
    );
  }, []);

  if (!config) {
    return (
      <div className="alm-page">
        <p className="alm-page-subtitle">Carregando…</p>
      </div>
    );
  }

  const mapaInsumos = new Map(insumos.map((i) => [i.id, i]));
  const calculados = itens.map((item) => ({ item, calc: calcularItem(item, mapaInsumos, config, totalCustos) }));
  const resumo = calcularResumo(
    calculados.map((c) => c.calc),
    desconto ?? 0
  );
  const texto = textoOrcamento(cliente, prazo, calculados, resumo);
  const margemCor =
    resumo.margem >= 60 ? "var(--status-success)" : resumo.margem >= 30 ? "var(--status-warning)" : "var(--status-error)";

  // Dados da imagem: só itens com descrição ou valor, sem custo nem margem.
  const linhasImagem = calculados
    .filter(({ item, calc }) => item.descricao.trim() || calc.subtotal > 0)
    .map(({ item, calc }, idx) => ({
      descricao: item.descricao.trim() || `Item ${idx + 1}`,
      quantidade: item.quantidade,
      precoUnitario: calc.precoUnitario,
      subtotal: calc.subtotal,
    }));
  const dadosImagem: DadosImagem | null =
    linhasImagem.length > 0
      ? {
          cliente,
          prazo,
          linhas: linhasImagem,
          subtotal: resumo.subtotal,
          desconto: resumo.desconto,
          total: resumo.total,
          data: new Date().toISOString().slice(0, 10),
        }
      : null;

  const atualizarItem = (id: string, patch: Partial<ItemOrcamento>) =>
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const adicionarItem = () => setItens((prev) => [...prev, novoItem(config.multiplicadorPreco, novoId())]);

  const removerItem = (id: string) => setItens((prev) => prev.filter((i) => i.id !== id));

  const novoOrcamento = () => {
    setCliente("");
    setPrazo("");
    setDesconto(null);
    setItens([novoItem(config.multiplicadorPreco, novoId())]);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Não foi possível copiar:", err);
    }
  };

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Orçamento</h1>
          <p className="alm-page-subtitle">Calcule e envie para o cliente, sem cadastrar produto</p>
        </div>
        <button type="button" className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={novoOrcamento}>
          Novo orçamento
        </button>
      </div>

      <div className="orc-layout">
        <div className="orc-itens">
          {calculados.map(({ item, calc }, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              index={idx}
              calc={calc}
              insumos={insumos}
              onChange={(patch) => atualizarItem(item.id, patch)}
              onRemove={() => removerItem(item.id)}
            />
          ))}

          <button type="button" className="orc-adicionar" onClick={adicionarItem}>
            <Plus size={13} strokeWidth={1.5} /> Adicionar item
          </button>
        </div>

        <aside className="atlas-card orc-resumo">
          <div className="orc-resumo-corpo">
            <div className="alm-field">
              <label className="alm-label">Cliente (opcional)</label>
              <input className="atlas-input" placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
            </div>
            <div className="alm-field">
              <label className="alm-label">Prazo de entrega (opcional)</label>
              <input className="atlas-input" placeholder="Ex.: 7 dias úteis" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
            <div className="alm-field">
              <label className="alm-label">Desconto (R$)</label>
              <NumInput value={desconto} placeholder="0,00" onChange={setDesconto} />
            </div>

            <div className="orc-totais">
              <div className="orc-linha">
                <span>Subtotal</span>
                <strong>{formatBRL(resumo.subtotal)}</strong>
              </div>
              {resumo.desconto > 0 && (
                <div className="orc-linha" style={{ color: "var(--status-error)" }}>
                  <span>Desconto</span>
                  <strong>− {formatBRL(resumo.desconto)}</strong>
                </div>
              )}
              <div className="orc-linha orc-total">
                <span>Total</span>
                <strong>{formatBRL(resumo.total)}</strong>
              </div>
              <div className="orc-linha">
                <span>Margem estimada</span>
                <strong style={{ color: margemCor }}>{resumo.total > 0 ? `${resumo.margem.toFixed(1)}%` : "—"}</strong>
              </div>
            </div>

            <ImagemOrcamento dados={dadosImagem} />

            <div className="alm-field">
              <label className="alm-label">Texto para o cliente</label>
              <pre className="orc-preview">{texto}</pre>
            </div>

            <button
              type="button"
              className="atlas-btn atlas-btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}
              onClick={copiar}
              disabled={resumo.subtotal <= 0}
            >
              {copiado ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
              {copiado ? "Copiado!" : "Copiar texto"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
