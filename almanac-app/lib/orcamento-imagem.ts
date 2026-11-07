import { LOGO_GINGA_PATH, LOGO_GINGA_VIEWBOX, COR_LOGO_GINGA } from "@/lib/logo-ginga";

// Gera o orçamento como PNG para enviar ao cliente, desenhado em <canvas>.
// Só contém o que o cliente deve ver. Custo e margem são internos e não entram.

export interface LinhaImagem {
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

// Recursos de imagem já carregados antes de desenhar.
interface Recursos {
  logo: HTMLImageElement | null;
  foto: HTMLImageElement | null;
}

export interface DadosImagem {
  cliente: string;
  prazo: string;
  linhas: LinhaImagem[];
  subtotal: number;
  desconto: number;
  total: number;
  data: string; // ISO yyyy-mm-dd
  // Foto opcional do orçamento inteiro (data URL), exibida logo abaixo da data
  foto?: string;
  // Dados da loja (Configurações)
  nomeLoja: string;
  instagram: string;
  telefone: string;
  email: string;
  endereco: string;
  validadeDias: number;
}

// Tamanho fixo da imagem final, vertical como o modelo (4:5).
const LARGURA = 1080;
const ALTURA = 1350;
const PAD = 90;
const ESCALA = 2; // desenha em 2x e reduz para o tamanho final (nitidez)
const LOGO_SRC = "/ginga-logo.png";

const COR = {
  fundo: "#FFFFFF",
  texto: "#161616",
  secundario: "#5E5E5E",
  grade: "#161616",
  azul: COR_LOGO_GINGA,
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

async function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

// Uma única rotina de desenho. Com `medir = true` só calcula a altura final;
// depois é chamada de novo para pintar no canvas já dimensionado.
// `alvoAltura` (> 0) fixa o rodapé no fim da área da imagem; 0 deixa o rodapé logo após o conteúdo.
// `L` é a largura lógica do layout: quanto menor, maior o conteúdo ao ser ampliado para a largura final.
// Medidas que a passada de medição devolve, para centralizar a tabela na pagina.
interface InfoLayout {
  topoTabela: number;
  alturaTabela: number;
  altRodape: number;
}

function desenhar(
  ctx: CanvasRenderingContext2D,
  d: DadosImagem,
  recursos: Recursos,
  medir: boolean,
  alvoAltura: number,
  L: number,
  tabelaY: number | null,
  info: InfoLayout
): number {
  const pintar = !medir;
  const CONTEUDO = L - PAD * 2;
  const R = L - PAD; // borda direita do conteúdo
  const logo = recursos.logo;

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

  // Texto centralizado que diminui a fonte até caber na largura da célula.
  const txtCaber = (t: string, cx: number, base: number, largura: number, tam: number, peso: number, cor: string) => {
    let f = tam;
    ctx.font = fonte(f, peso);
    while (f > 14 && ctx.measureText(t).width > largura) {
      f -= 1;
      ctx.font = fonte(f, peso);
    }
    txt(t, cx, base, fonte(f, peso), cor, "center");
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
    cor: string = COR.texto,
    align: CanvasTextAlign = "left"
  ) => {
    const font = fonte(tamanho, peso);
    ctx.font = font;
    const linhas = quebrarTexto(ctx, t, largura);
    linhas.forEach((l, i) => {
      const xx = align === "right" ? x + largura : x;
      txt(l, xx, topo + tamanho + i * entrelinha, font, cor, align);
    });
    return topo + linhas.length * entrelinha;
  };

  // Faixa de peixes no topo, como no modelo.
  // Peixes igualmente espaçados na largura disponível, sem sobreposição.
  const peixes = 8;
  const passo = CONTEUDO / peixes;
  const peixeLargura = passo * 0.8;
  const peixeAltura = (peixeLargura * LOGO_GINGA_VIEWBOX.altura) / LOGO_GINGA_VIEWBOX.largura;
  const faixaTopo = PAD / 2;
  const peixe = pintar ? new Path2D(LOGO_GINGA_PATH) : null;
  if (pintar && peixe) {
    for (let i = 0; i < peixes; i++) {
      ctx.save();
      ctx.translate(PAD + i * passo, faixaTopo);
      const s = peixeLargura / LOGO_GINGA_VIEWBOX.largura;
      ctx.scale(s, s);
      ctx.fillStyle = COR.azul;
      ctx.fill(peixe);
      ctx.restore();
    }
  }

  let y = faixaTopo + peixeAltura + 70;

  // ── Título e cliente ───────────────────────────────────────
  txt("Orçamento", PAD, y + 92, fonte(92, 800));
  y += 92 + 36;
  if (d.cliente.trim()) {
    y = bloco(`Cliente: ${d.cliente.trim()}`, PAD, y, CONTEUDO, 28, 400, 40) + 2;
  }
  const data = dataExtenso(d.data);
  if (data) y = bloco(data, PAD, y, CONTEUDO, 28, 700, 40) + 40;

  // Foto do orçamento, em faixa larga com proporção preservada (corte centralizado)
  if (recursos.foto) {
    const altFoto = 320;
    if (pintar) {
      const f = recursos.foto;
      const escalaCobrir = Math.max(CONTEUDO / f.naturalWidth, altFoto / f.naturalHeight);
      const sw = CONTEUDO / escalaCobrir;
      const sh = altFoto / escalaCobrir;
      const sx = (f.naturalWidth - sw) / 2;
      const sy = (f.naturalHeight - sh) / 2;
      ctx.drawImage(f, sx, sy, sw, sh, PAD, y, CONTEUDO, altFoto);

      // Aviso no canto inferior direito da foto, em bloco azul.
      const aviso =
        "Imagem produzida por inteligência artificial. Produto artesanal pode conter suaves diferenças de textura e tonalidade.";
      const margem = 12;
      const maxLarg = CONTEUDO * 0.6;
      ctx.font = fonte(16, 600);
      const linhasAviso = quebrarTexto(ctx, aviso, maxLarg - 20);
      const larguraAviso = Math.max(...linhasAviso.map((l) => ctx.measureText(l).width)) + 20;
      const alturaAviso = linhasAviso.length * 22 + 14;
      const xAviso = PAD + CONTEUDO - margem - larguraAviso;
      const yAviso = y + altFoto - margem - alturaAviso;
      ctx.fillStyle = COR.azul;
      ctx.fillRect(xAviso, yAviso, larguraAviso, alturaAviso);
      linhasAviso.forEach((l, i) => txt(l, xAviso + 10, yAviso + 7 + 16 + i * 22, fonte(16, 600), COR.branco));
    }
    y += altFoto + 40;
  }

  // ── Tabela (grade com cabeçalho azul) ─────────────────────
  // A tabela começa onde o cabeçalho termina, ou na posição centralizada se informada.
  const topoTabela = tabelaY ?? y;
  info.topoTabela = topoTabela;
  y = topoTabela;

  // Colunas em proporção da largura: Nº, Descrição, Preço, Qtd., Total
  const cols = [PAD];
  [0.09, 0.36, 0.19, 0.1, 0.26].forEach((f) => cols.push(cols[cols.length - 1] + f * CONTEUDO));
  const meio = (i: number) => (cols[i] + cols[i + 1]) / 2;
  const alturaCabecalho = 56;
  const fCab = fonte(24, 700);

  retangulo(PAD, y, CONTEUDO, alturaCabecalho, COR.azul);
  const titulosCab = ["Nº", "Descrição", "Preço", "Qtd.", "Total"];
  titulosCab.forEach((t, i) => txt(t, meio(i), y + 37, fCab, COR.branco, "center"));
  y += alturaCabecalho;

  const linhasGrade = (topo: number, base: number) => {
    retangulo(PAD, base, CONTEUDO, 1, COR.grade);
    for (let i = 1; i < cols.length - 1; i++) retangulo(cols[i], topo, 1, base - topo, COR.grade);
    retangulo(PAD, topo, 1, base - topo, COR.grade);
    retangulo(R - 1, topo, 1, base - topo, COR.grade);
  };

  const topoCabecalho = y - alturaCabecalho;
  // Linha de cima da tabela (base do cabeçalho)
  retangulo(PAD, topoCabecalho, CONTEUDO, 1, COR.grade);

  d.linhas.forEach((item, i) => {
    ctx.font = fonte(24, 400);
    const linhasDesc = quebrarTexto(ctx, item.descricao, cols[2] - cols[1] - 24);
    const altura = linhasDesc.length * 34 + 30;
    const primeiraBase = y + 15 + 24;
    linhasDesc.forEach((t, k) => txt(t, meio(1), primeiraBase + k * 34, fonte(24), COR.texto, "center"));
    const baseNum = primeiraBase;
    txt(String(i + 1), meio(0), baseNum, fonte(24), COR.texto, "center");
    const larguraCel = (i: number) => cols[i + 1] - cols[i] - 16;
    txtCaber(moeda(item.precoUnitario), meio(2), baseNum, larguraCel(2), 24, 400, COR.texto);
    txtCaber(String(item.quantidade), meio(3), baseNum, larguraCel(3), 24, 400, COR.texto);
    txtCaber(moeda(item.subtotal), meio(4), baseNum, larguraCel(4), 24, 400, COR.texto);
    linhasGrade(y, y + altura);
    y += altura;
  });

  // Totais: células à direita, na mesma grade (colunas Preço, Qtd. e Total)
  const xTot = cols[2];
  const larguraTot = R - xTot;
  const celula = (texto: string, altura: number, fontTam: number, peso: number, cor: string) => {
    retangulo(xTot, y, 1, altura, COR.grade);
    retangulo(R - 1, y, 1, altura, COR.grade);
    txtCaber(texto, xTot + larguraTot / 2, y + altura / 2 + fontTam * 0.35, larguraTot - 24, fontTam, peso, cor);
    retangulo(xTot, y + altura, larguraTot, 1, COR.grade);
    y += altura;
  };

  const yTotaisTopo = y;
  retangulo(xTot, y, larguraTot, 1, COR.grade);
  if (d.desconto > 0) {
    celula(`Subtotal: ${moeda(d.subtotal)}`, 46, 24, 400, COR.texto);
    celula(`Desconto: − ${moeda(d.desconto)}`, 46, 24, 400, COR.desconto);
  }
  celula(`Total: ${moeda(d.total)}`, 62, 28, 800, COR.texto);

  // Prazo e validade, à esquerda da grade de totais
  let yEsq = yTotaisTopo + 8;
  if (d.prazo.trim()) {
    yEsq = bloco(`Prazo de entrega: ${d.prazo.trim()}`, PAD, yEsq, cols[2] - PAD - 30, 26, 400, 36) + 10;
  }
  if (d.validadeDias > 0) {
    yEsq = bloco(`Validade: ${d.validadeDias} dias a partir da emissão`, PAD, yEsq, cols[2] - PAD - 30, 22, 400, 32, COR.secundario);
  }
  const fimTabela = Math.max(y, yEsq);
  info.alturaTabela = fimTabela - topoTabela;
  y = fimTabela + 90;

  // ── Rodapé: logo à esquerda, contatos à direita ───────────
  const logoLargura = 300;
  const logoAltura = logo ? (logoLargura * logo.naturalHeight) / logo.naturalWidth : 100;
  const contatos = [d.telefone.trim(), d.email.trim(), arroba(d.instagram), d.endereco.trim()].filter(Boolean);
  const alturaContatos = contatos.length * 38;
  const altRodape = Math.max(logoAltura, alturaContatos);
  info.altRodape = altRodape;

  // Com altura alvo, o rodapé vai para o fim da área; senão, fica logo após o conteúdo.
  const yRodape = alvoAltura > 0 ? Math.max(y, alvoAltura - PAD - altRodape) : y;

  if (pintar && logo) {
    ctx.drawImage(logo, PAD, yRodape + (altRodape - logoAltura) / 2, logoLargura, logoAltura);
  } else if (!logo) {
    txt("GINGA STUDIO 3D", PAD, yRodape + altRodape / 2 + 14, fonte(40, 800), COR.azul);
  }

  let yContato = yRodape + (altRodape - alturaContatos) / 2;
  for (const linha of contatos) {
    yContato = bloco(linha, PAD, yContato, CONTEUDO, 26, 400, 38, COR.texto, "right");
  }

  return yRodape + altRodape + PAD;
}

export async function gerarImagemOrcamento(dados: DadosImagem): Promise<Blob> {
  const [logo, foto] = await Promise.all([
    carregarImagem(LOGO_SRC),
    dados.foto ? carregarImagem(dados.foto) : Promise.resolve(null),
  ]);
  const recursos: Recursos = { logo, foto };

  // Passo 1: usar o tamanho natural (1x), que segue a proporção da referência; só reduz se não couber.
  // Com zoom, o layout é feito numa largura lógica menor (L = largura final / zoom), então
  // textos, tabela e logo ficam maiores e preenchem a imagem.
  const medidor = document.createElement("canvas").getContext("2d");
  if (!medidor) throw new Error("Canvas indisponível neste navegador.");
  const infoZoom: InfoLayout = { topoTabela: 0, alturaTabela: 0, altRodape: 0 };
  const medir = (larg: number) => desenhar(medidor, dados, recursos, true, 0, larg, null, infoZoom);

  let zoom = 1;
  let L = LARGURA;
  let encontrou = false;
  for (let i = 0; i >= 0; i--) {
    const c = 1 + i * 0.02;
    const Lc = LARGURA / c;
    if (medir(Lc) * c <= ALTURA) {
      zoom = c;
      L = Lc;
      encontrou = true;
      break;
    }
  }
  if (!encontrou) {
    // Nem em 1x cabe: reduz tudo na mesma proporção, centralizado na largura.
    zoom = ALTURA / medir(LARGURA);
    L = LARGURA;
  }
  const alvo = ALTURA / zoom; // altura lógica da área de desenho

  // Centraliza a tabela na página, sem invadir o rodapé nem subir acima do cabeçalho.
  const infoFinal: InfoLayout = { topoTabela: 0, alturaTabela: 0, altRodape: 0 };
  desenhar(medidor, dados, recursos, true, alvo, L, null, infoFinal);
  const centro = alvo / 2 - infoFinal.alturaTabela / 2;
  const limiteBaixo = alvo - PAD - infoFinal.altRodape - 90 - infoFinal.alturaTabela;
  const tabelaY = Math.max(infoFinal.topoTabela, Math.min(centro, limiteBaixo));

  // Passo 2: pintar em 2x num canvas auxiliar, na largura lógica L.
  const aux = document.createElement("canvas");
  aux.width = Math.round(L * ESCALA);
  aux.height = Math.round(alvo * ESCALA);
  const auxCtx = aux.getContext("2d");
  if (!auxCtx) throw new Error("Canvas indisponível neste navegador.");
  auxCtx.scale(ESCALA, ESCALA);
  auxCtx.fillStyle = COR.fundo;
  auxCtx.fillRect(0, 0, L, alvo);
  desenhar(auxCtx, dados, recursos, false, alvo, L, tabelaY, { topoTabela: 0, alturaTabela: 0, altRodape: 0 });

  // Passo 3: canvas final com o tamanho fixo 1080 x 1350.
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const larguraFinal = L * zoom;
  ctx.drawImage(aux, 0, 0, aux.width, aux.height, (LARGURA - larguraFinal) / 2, 0, larguraFinal, ALTURA);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem."))), "image/png")
  );
}
