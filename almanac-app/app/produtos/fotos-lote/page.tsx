"use client";

// Página TEMPORÁRIA: envia várias fotos de uma vez e associa cada uma a um produto.
// Associação automática pelo nome do arquivo (ex.: "Porta anel premium.jpg"). Remover depois do uso.

import { useEffect, useState } from "react";
import { buscarProdutos, editarProduto, type ProdutoCalculado } from "@/lib/repositories/produtos";
import { lerImagem } from "@/lib/imagem";

interface Linha {
  id: string;
  file: File;
  preview: string;
  produtoId: string;
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function acharProduto(nomeArquivo: string, produtos: ProdutoCalculado[]): string {
  const base = normalizar(nomeArquivo.replace(/\.[^.]+$/, ""));
  if (!base) return "";
  const exato = produtos.find((p) => normalizar(p.nome) === base);
  if (exato) return exato.id;
  // Senão, o produto cujo nome está contido no arquivo (ou vice-versa), preferindo o nome mais longo.
  const candidatos = produtos.filter((p) => {
    const n = normalizar(p.nome);
    return n && (base.includes(n) || n.includes(base));
  });
  candidatos.sort((a, b) => b.nome.length - a.nome.length);
  return candidatos[0]?.id ?? "";
}

export default function FotosLotePage() {
  const [produtos, setProdutos] = useState<ProdutoCalculado[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    buscarProdutos().then(setProdutos).catch((e) => setLog([`ERRO ao carregar produtos: ${String(e)}`]));
  }, []);

  function escolherArquivos(files: FileList | null) {
    if (!files) return;
    const novas: Linha[] = Array.from(files).map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      produtoId: acharProduto(file.name, produtos),
    }));
    setLinhas(novas);
    setLog([]);
  }

  function mudarProduto(id: string, produtoId: string) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, produtoId } : l)));
  }

  async function salvar() {
    setRodando(true);
    const saida: string[] = [];
    const escrever = (msg: string) => {
      saida.push(msg);
      setLog([...saida]);
    };
    for (const linha of linhas) {
      if (!linha.produtoId) {
        escrever(`PULADO (sem produto): ${linha.file.name}`);
        continue;
      }
      const produto = produtos.find((p) => p.id === linha.produtoId);
      try {
        const foto = await lerImagem(linha.file);
        await editarProduto(linha.produtoId, { foto });
        escrever(`OK: ${linha.file.name} -> ${produto?.nome ?? linha.produtoId}`);
      } catch (e) {
        escrever(`ERRO em ${linha.file.name}: ${String(e)}`);
      }
    }
    escrever("Concluído.");
    setRodando(false);
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900 }}>
      <h1>Fotos dos produtos (lote)</h1>
      <p>Nomeie cada arquivo com o nome do produto (ex.: "Porta anel premium.jpg"). Confira a associação antes de salvar.</p>
      <input type="file" accept="image/*" multiple onChange={(e) => escolherArquivos(e.target.files)} />

      {linhas.length > 0 && (
        <table style={{ marginTop: 16, width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ width: 72, padding: 4 }}>
                  <img src={l.preview} alt="" style={{ width: 64, height: 64, objectFit: "cover" }} />
                </td>
                <td style={{ padding: 4, fontSize: 13 }}>{l.file.name}</td>
                <td style={{ padding: 4 }}>
                  <select value={l.produtoId} onChange={(e) => mudarProduto(l.id, e.target.value)}>
                    <option value="">— não associar —</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {linhas.length > 0 && (
        <button onClick={salvar} disabled={rodando} style={{ marginTop: 16 }}>
          {rodando ? "Salvando..." : "Salvar fotos"}
        </button>
      )}

      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
    </main>
  );
}
