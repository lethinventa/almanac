import { LOGO_GINGA_PATH, LOGO_GINGA_VIEWBOX, COR_LOGO_GINGA } from "@/lib/logo-ginga";

// Gera o orçamento como PNG para enviar ao cliente, desenhado em <canvas>.
// Só contém o que o cliente deve ver. Custo e margem são internos e não entram.

export interface LinhaImagem {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface DadosImagem {
  cliente: string;
  prazo: string;
  linhas: LinhaImagem[];
  subtotal: number;
  desconto: number;
  total: number;
  data: string; // ISO yyyy-mm-dd
  // Dados da loja (Configurações)
  nomeLoja: string;
  instagram: string;
  telefone: string;
  endereco: string;
  validadeDias: number;
}

const LARGURA = 1080;
const PAD = 80;
const ESCALA = 2; // resolução para telas de alta densidade
const CONTEUDO = LARGURA - PAD * 2;
const COR = {
  fundo: "#FFFFFF",
  texto: "#161616",
  corpo: "#3A3A3A",
  secundario: "#6B6B6B",
  linha: "#E3E3E3",
  branco: "#FFFFFF",
  desconto: "#B42318",
};

const FONTE = `Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const fonte = (tamanho: number, peso: number = 400) => `${peso} ${tamanho}px ${FONTE}`;

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function dataExtenso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

function arroba(handle: string): string {
  const h = handle.trim();
  if (!h) return "";
  return h.startsWith("@") ? h : `@${h}`;
}

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [""];
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of palavras) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(candidata).width <= larguraMax || !atual) {
      atual = candidata;
    } else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Uma única rotina de desenho. Com `medir = true` só calcula a altura final;
// depois é chamada de novo para pintar no canvas já dimensionado.
function desenhar(ctx: CanvasRenderingContext2D, d: DadosImagem, medir: boolean): number {
  const pintar = !medir;
  const R = LARGURA - PAD; // borda direita do conteúdo

  const txt = (
    t: string,
    x: number,
    y: number,
    font: string,
    cor: string = COR.texto,
    align: CanvasTextAlign = "left"
  ) => {
    if (!pintar) return;
    ctx.font = font;
    ctx.fillStyle = cor;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(t, x, y);
  };

  const retangulo = (x: number, y: number, w: number, h: number, cor: string) => {
    if (!pintar) return;
    ctx.fillStyle = cor;
    ctx.fillRect(x, y, w, h);
  };

  // Parágrafo com quebra de linha. Retorna a posição de y logo abaixo do bloco.
  const bloco = (
    t: string,
    x: number,
    topo: number,
    largura: number,
    tamanho: number,
    peso: number,
    entrelinha: number,
    cor: string = COR.texto
  ) => {
    const font = fonte(tamanho, peso);
    ctx.font = font;
    const linhas = quebrarTexto(ctx, t, largura);
    linhas.forEach((l, i) => txt(l, x, topo + tamanho + i * entrelinha, font, cor));
    return topo + linhas.length * entrelinha;
  };

  const logoLargura = 200;
  const logoAltura = (logoLargura * LOGO_GINGA_VIEWBOX.altura) / LOGO_GINGA_VIEWBOX.largura;
  const desenharLogo = (x: number, topo: number) => {
    if (!pintar) return;
    ctx.save();
    ctx.translate(x, topo);
    const s = logoLargura / LOGO_GINGA_VIEWBOX.largura;
    ctx.scale(s, s);
    ctx.fillStyle = COR_LOGO_GINGA;
    ctx.fill(new Path2D(LOGO_GINGA_PATH));
    ctx.restore();
  };

  let y = PAD;

  // ── Cabeçalho ──────────────────────────────────────────────
  const tamTitulo = 104;
  txt("Orçamento", PAD, y + tamTitulo, fonte(tamTitulo, 800));
  desenharLogo(R - logoLargura, y + tamTitulo - logoAltura); // base do logo alinhada à base do título
  y += tamTitulo + 40;

  y = bloco(
    "Agradecemos pela oportunidade de apresentar nossa proposta de orçamento para atender às suas necessidades.",
    PAD, y, CONTEUDO, 30, 400, 42, COR.corpo
  ) + 28;

  if (d.cliente.trim()) {
    y = bloco(`Para: ${d.cliente.trim()}`, PAD, y, CONTEUDO, 30, 700, 42) + 4;
  }
  const data = dataExtenso(d.data);
  if (data) y = bloco(data, PAD, y, CONTEUDO, 30, 700, 42) + 52;

  // ── Tabela ─────────────────────────────────────────────────
  const xNumero = PAD + 20;
  const xDescricao = PAD + 96;
  const larguraDescricao = 330;
  const rPreco = R - 300;
  const rQtd = R - 190;
  const rTotal = R;

  retangulo(PAD, y, CONTEUDO, 64, COR.texto);
  const baseCabecalho = y + 41;
  const fCab = fonte(22, 600);
  txt("Nº", xNumero, baseCabecalho, fCab, COR.branco);
  txt("Descrição", xDescricao, baseCabecalho, fCab, COR.branco);
  txt("Preço", rPreco, baseCabecalho, fCab, COR.branco, "right");
  txt("Qtd.", rQtd, baseCabecalho, fCab, COR.branco, "right");
  txt("Total", rTotal, baseCabecalho, fCab, COR.branco, "right");
  y += 64;

  d.linhas.forEach((item, i) => {
    ctx.font = fonte(26, 500);
    const linhasDesc = quebrarTexto(ctx, item.descricao, larguraDescricao);
    const altura = linhasDesc.length * 36 + 36;
    const base = y + 18 + 26;
    txt(String(i + 1), xNumero, base, fonte(26), COR.corpo);
    linhasDesc.forEach((t, k) => txt(t, xDescricao, base + k * 36, fonte(26, 500)));
    txt(moeda(item.precoUnitario), rPreco, base, fonte(26), COR.corpo, "right");
    txt(String(item.quantidade), rQtd, base, fonte(26), COR.corpo, "right");
    txt(moeda(item.subtotal), rTotal, base, fonte(26, 600), COR.texto, "right");
    y += altura;
    retangulo(PAD, y, CONTEUDO, 1, COR.linha);
  });

  // ── Totais (coluna esquerda: prazo e validade; direita: valores) ──
  y += 36;
  const yTotais = y;

  let yEsq = yTotais;
  if (d.prazo.trim()) {
    txt("PRAZO DE ENTREGA", PAD, yEsq + 18, fonte(18, 600), COR.secundario);
    yEsq = bloco(d.prazo.trim(), PAD, yEsq + 30, 400, 28, 500, 38) + 24;
  }
  if (d.validadeDias > 0) {
    txt("VALIDADE DA PROPOSTA", PAD, yEsq + 18, fonte(18, 600), COR.secundario);
    yEsq = bloco(`${d.validadeDias} dias a partir da data de emissão`, PAD, yEsq + 30, 400, 28, 500, 38);
  }

  const xDir = R - 440;
  let yDir = yTotais;
  const linhaValor = (rotulo: string, valor: string, cor: string) => {
    txt(rotulo, xDir, yDir + 26, fonte(26), cor === COR.texto ? COR.secundario : cor);
    txt(valor, R, yDir + 26, fonte(26, 500), cor, "right");
    yDir += 44;
  };
  linhaValor("Subtotal", moeda(d.subtotal), COR.texto);
  if (d.desconto > 0) linhaValor("Desconto", `− ${moeda(d.desconto)}`, COR.desconto);
  yDir += 8;
  retangulo(xDir, yDir, 440, 96, COR.texto);
  txt("Total", xDir + 24, yDir + 40, fonte(24, 600), COR.branco);
  txt(moeda(d.total), R - 24, yDir + 66, fonte(46, 700), COR.branco, "right");
  yDir += 96;

  y = Math.max(yEsq, yDir) + 56;

  // ── Fechamento ─────────────────────────────────────────────
  y = bloco(
    "Estamos à disposição para esclarecer quaisquer dúvidas ou fornecer informações adicionais.",
    PAD, y, 560, 28, 400, 40, COR.corpo
  ) + 56;

  // ── Rodapé ─────────────────────────────────────────────────
  retangulo(PAD, y, CONTEUDO, 6, COR.texto);
  y += 44;
  const topoRodape = y;

  const nome = d.nomeLoja.trim() || "Ginga";
  const yNome = bloco(nome, PAD, topoRodape, 260, 36, 700, 42);

  const xInsta = PAD + 340;
  const yInsta = d.instagram.trim()
    ? bloco(arroba(d.instagram), xInsta, topoRodape + 4, 240, 30, 600, 40)
    : topoRodape;

  const xContato = PAD + 640;
  let yContato = topoRodape;
  if (d.telefone.trim()) {
    yContato = bloco(d.telefone.trim(), xContato, yContato, CONTEUDO - 640, 28, 500, 38);
  }
  if (d.endereco.trim()) {
    yContato = bloco(d.endereco.trim(), xContato, yContato + (d.telefone.trim() ? 6 : 0), CONTEUDO - 640, 24, 400, 34, COR.corpo);
  }

  const yFim = Math.max(yNome, yInsta, yContato);
  if (d.instagram.trim() || d.telefone.trim() || d.endereco.trim()) {
    retangulo(PAD + 300, topoRodape, 2, yFim - topoRodape, COR.linha);
  }

  return yFim + PAD;
}

export async function gerarImagemOrcamento(dados: DadosImagem): Promise<Blob> {
  // Passo 1: medir a altura final com um canvas de medição.
  const medidor = document.createElement("canvas").getContext("2d");
  if (!medidor) throw new Error("Canvas indisponível neste navegador.");
  const altura = Math.ceil(desenhar(medidor, dados, true));

  // Passo 2: pintar no canvas já dimensionado.
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA * ESCALA;
  canvas.height = altura * ESCALA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");
  ctx.scale(ESCALA, ESCALA);
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, altura);
  desenhar(ctx, dados, false);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem."))), "image/png")
  );
}
