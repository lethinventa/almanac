"use client";

import { useRef, useState } from "react";
import { ExternalLink, ImagePlus, Plus, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { lerImagem } from "@/lib/imagem";
import { dadosSiteVazios, pendenciasSite, slugify, URL_SITE, urlFoto } from "@/lib/site";
import type { DadosSite, ProdutoCalculado } from "@/lib/repositories/produtos";

interface LinhaFaixa {
  quantidade: string;
  preco: string;
}

interface LinhaEspec {
  rotulo: string;
  valor: string;
}

const tituloSecao: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--text-tertiary)",
};

const dica: React.CSSProperties = { fontSize: 11, color: "var(--text-tertiary)" };

// Formulário da aba "Site": o que aparece em gingastudio.com.br para este produto.
export function SiteForm({
  produto,
  categoriasSite,
  salvando,
  onSave,
  onClose,
}: {
  produto: ProdutoCalculado;
  // Categorias já usadas por outros produtos do site (sugestões)
  categoriasSite: string[];
  salvando: boolean;
  onSave: (site: DadosSite) => void;
  onClose: () => void;
}) {
  const inicial = produto.site ?? dadosSiteVazios();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [publicar, setPublicar] = useState(inicial.publicar);
  const [categoria, setCategoria] = useState(inicial.categoria);
  const [descricao, setDescricao] = useState(inicial.descricao);
  const [fotos, setFotos] = useState<string[]>(inicial.fotos);
  const [faixas, setFaixas] = useState<LinhaFaixa[]>(
    inicial.faixas.length
      ? inicial.faixas.map((f) => ({ quantidade: String(f.quantidade), preco: String(f.preco) }))
      : [{ quantidade: "10", preco: "" }]
  );
  const [especs, setEspecs] = useState<LinhaEspec[]>(
    inicial.especificacoes.length ? inicial.especificacoes : [{ rotulo: "Materiais", valor: "" }]
  );

  const montar = (): DadosSite => ({
    publicar,
    categoria: categoria.trim(),
    descricao: descricao.trim(),
    fotos,
    faixas: faixas
      .map((f) => ({ quantidade: parseInt(f.quantidade), preco: parseFloat(f.preco) }))
      .filter((f) => f.quantidade > 0 && f.preco > 0)
      .sort((a, b) => a.quantidade - b.quantidade),
    especificacoes: especs
      .map((e) => ({ rotulo: e.rotulo.trim(), valor: e.valor.trim() }))
      .filter((e) => e.rotulo && e.valor),
  });

  const pendencias = pendenciasSite(montar(), Boolean(produto.foto));
  const podeSalvar = !publicar || pendencias.length === 0;

  const adicionarFotos = async (arquivos: FileList | null) => {
    if (!arquivos) return;
    const novas = await Promise.all(Array.from(arquivos).map((f) => lerImagem(f, 1200)));
    setFotos((prev) => [...prev, ...novas]);
  };

  const moverFoto = (i: number, direcao: -1 | 1) =>
    setFotos((prev) => {
      const j = i + direcao;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  const fotosExibidas = fotos.length ? fotos : produto.foto ? [produto.foto] : [];

  return (
    <>
      {/* Publicar */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 12px",
          border: `1px solid ${publicar ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md, 4px)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={publicar}
          onChange={(e) => setPublicar(e.target.checked)}
          style={{ marginTop: 2, accentColor: "var(--accent-primary)" }}
        />
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Publicar no site</span>
          <span style={dica}>
            Ao salvar, o site é atualizado em cerca de 1 minuto.{" "}
            {produto.site?.publicar && (
              <a
                href={`${URL_SITE}/produtos/${slugify(produto.nome)}`}
                target="_blank"
                rel="noreferrer"
                className="atlas-link"
                style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
              >
                Ver no site <ExternalLink size={10} />
              </a>
            )}
          </span>
        </span>
      </label>

      {publicar && pendencias.length > 0 && (
        <div className="atlas-alert atlas-alert-warning">
          <div className="atlas-alert-desc">Para publicar, falta: {pendencias.join(", ")}.</div>
        </div>
      )}

      {/* Categoria */}
      <div className="alm-field">
        <label className="alm-label">Categoria no site</label>
        <input
          className="atlas-input"
          list="categorias-site"
          placeholder="Ex: Chaveiro"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
        <datalist id="categorias-site">
          {categoriasSite.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <span style={dica}>É o filtro do catálogo do site. Use o mesmo nome dos outros produtos.</span>
      </div>

      {/* Descrição */}
      <div className="alm-field">
        <label className="alm-label">Descrição</label>
        <textarea
          className="atlas-input"
          rows={4}
          style={{ resize: "vertical", padding: "6px 8px", lineHeight: 1.5, fontSize: 13, height: "auto" }}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Para que serve, material, ideal para…"
        />
      </div>

      {/* Fotos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={tituloSecao}>Fotos do site</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {fotosExibidas.map((f, i) => (
            <div key={i} style={{ position: "relative", width: 84 }}>
              <img
                src={urlFoto(f)}
                alt=""
                style={{
                  width: 84,
                  height: 84,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid var(--border-default)",
                  opacity: fotos.length ? 1 : 0.6,
                }}
              />
              {fotos.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ padding: "0 4px" }} disabled={i === 0} onClick={() => moverFoto(i, -1)} aria-label="Mover para a esquerda">‹</button>
                  <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ padding: "0 4px" }} onClick={() => setFotos((p) => p.filter((_, k) => k !== i))} aria-label="Remover foto">
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                  <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ padding: "0 4px" }} disabled={i === fotos.length - 1} onClick={() => moverFoto(i, 1)} aria-label="Mover para a direita">›</button>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            style={{
              width: 84,
              height: 84,
              border: "1px dashed var(--border-default)",
              borderRadius: 4,
              background: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontSize: 10,
            }}
          >
            <ImagePlus size={16} strokeWidth={1.5} />
            Adicionar
          </button>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              adicionarFotos(e.target.files).catch((err) => console.error("Erro ao ler imagem:", err));
              e.target.value = "";
            }}
          />
        </div>
        <span style={dica}>
          {fotos.length
            ? "A primeira foto é a capa do produto no site."
            : "Sem fotos próprias: o site usa a foto principal do produto."}
        </span>
      </div>

      {/* Faixas de preço */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={tituloSecao}>Faixas de preço (pacotes)</span>
        {faixas.map((f, i) => {
          const qtd = parseInt(f.quantidade);
          const preco = parseFloat(f.preco);
          const valida = qtd > 0 && preco > 0;
          const unitario = valida ? preco / qtd : 0;
          const margem = valida ? ((unitario - produto.custo) / unitario) * 100 : 0;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 6, alignItems: "center" }}>
              <input
                className="atlas-input"
                type="number"
                min="1"
                aria-label="Unidades no pacote"
                value={f.quantidade}
                onChange={(e) => setFaixas((p) => p.map((x, k) => (k === i ? { ...x, quantidade: e.target.value } : x)))}
              />
              <input
                className="atlas-input"
                type="number"
                min="0"
                step="0.01"
                aria-label="Preço do pacote"
                placeholder="Preço do pacote"
                value={f.preco}
                onChange={(e) => setFaixas((p) => p.map((x, k) => (k === i ? { ...x, preco: e.target.value } : x)))}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <button
                type="button"
                className="atlas-btn atlas-btn-ghost atlas-btn-sm"
                onClick={() => setFaixas((p) => p.filter((_, k) => k !== i))}
                aria-label="Remover faixa"
              >
                <Trash2 size={12} strokeWidth={1.5} />
              </button>
              {valida && (
                <span style={{ ...dica, gridColumn: "1 / -1", marginTop: -2 }}>
                  {qtd} un · {formatBRL(unitario)} cada · margem{" "}
                  <span style={{ color: margem < 0 ? "var(--status-error, #d33)" : "inherit" }}>
                    {margem.toFixed(0)}%
                  </span>{" "}
                  (custo {formatBRL(produto.custo)}/un)
                </span>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="atlas-btn atlas-btn-secondary atlas-btn-sm"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setFaixas((p) => [...p, { quantidade: "", preco: "" }])}
        >
          <Plus size={12} strokeWidth={1.5} /> Faixa
        </button>
      </div>

      {/* Especificações */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={tituloSecao}>Especificações</span>
        {especs.map((e, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 6 }}>
            <input
              className="atlas-input"
              placeholder="Ex: Medidas"
              value={e.rotulo}
              onChange={(ev) => setEspecs((p) => p.map((x, k) => (k === i ? { ...x, rotulo: ev.target.value } : x)))}
            />
            <input
              className="atlas-input"
              placeholder="Ex: 5 × 3 cm"
              value={e.valor}
              onChange={(ev) => setEspecs((p) => p.map((x, k) => (k === i ? { ...x, valor: ev.target.value } : x)))}
            />
            <button
              type="button"
              className="atlas-btn atlas-btn-ghost atlas-btn-sm"
              onClick={() => setEspecs((p) => p.filter((_, k) => k !== i))}
              aria-label="Remover especificação"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="atlas-btn atlas-btn-secondary atlas-btn-sm"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setEspecs((p) => [...p, { rotulo: "", valor: "" }])}
        >
          <Plus size={12} strokeWidth={1.5} /> Especificação
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--border-default)",
        }}
      >
        <button type="button" className="atlas-btn atlas-btn-secondary atlas-btn-sm" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="atlas-btn atlas-btn-primary atlas-btn-sm"
          disabled={!podeSalvar || salvando}
          style={{ opacity: podeSalvar && !salvando ? 1 : 0.4 }}
          onClick={() => onSave(montar())}
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </>
  );
}
