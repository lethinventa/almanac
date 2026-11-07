// Gera o orçamento como PNG para enviar ao cliente, desenhado em <canvas>.
// Só contém o que o cliente deve ver: itens, quantidades, preços, desconto e total.
// Custo e margem são internos e não entram na imagem.

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
}

const LARGURA = 1080;
const PAD = 80;
const ESCALA = 2; // pixels de tela por unidade lógica, para nitidez
const COR = {
  fundo: "#FFFFFF",
  texto: "#161616",
  secundario: "#6B6B6B",
  linha: "#E3E3E3",
  desconto: "#B42318",
};

const FONTE = `Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const fonte = (tamanho: number, peso: number | string = 400) => `${peso} ${tamanho}px ${FONTE}`;

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBr = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
};

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

// Uma única rotina de desenho. Com `medir = true` só calcula a altura final,
// sem pintar; depois é chamada de novo para pintar no canvas já dimensionado.
function desenhar(ctx: CanvasRenderingContext2D, d: DadosImagem, medir: boolean): number {
  let y = PAD;
  const rascunho = !medir;

  const texto = (
    t: string,
    x: number,
    yy: number,
    opts: { font: string; color?: string; align?: CanvasTextAlign }
  ) => {
    if (!rascunho) return;
    ctx.font = opts.font;
    ctx.fillStyle = opts.color ?? COR.texto;
    ctx.textAlign = opts.align ?? "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(t, x, yy);
  };

  const linha = (yy: number) => {
    if (!rascunho) return;
    ctx.strokeStyle = COR.linha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, yy + 0.5);
    ctx.lineTo(LARGURA - PAD, yy + 0.5);
    ctx.stroke();
  };

  const direita = LARGURA - PAD;
  const colQtd = 700;
  const colUnit = 850;
  const larguraDescricao = colQtd - PAD - 40;

  // Cabeçalho
  texto("ORÇAMENTO", PAD, y + 22, { font: fonte(22, 600), color: COR.secundario });
  y += 22 + 30;
  const titulo = d.cliente.trim() ? `Para ${d.cliente.trim()}` : "Seu orçamento";
  ctx.font = fonte(56, 700);
  texto(titulo, PAD, y + 56, { font: fonte(56, 700) });
  y += 56 + 16;
  if (d.data) {
    texto(dataBr(d.data), PAD, y + 24, { font: fonte(24), color: COR.secundario });
    y += 24;
  }
  y += 36;
  linha(y);
  y += 24;

  // Cabeçalho da tabela
  texto("Item", PAD, y + 20, { font: fonte(20, 600), color: COR.secundario });
  texto("Qtd", colQtd, y + 20, { font: fonte(20, 600), color: COR.secundario, align: "right" });
  texto("Unitário", colUnit, y + 20, { font: fonte(20, 600), color: COR.secundario, align: "right" });
  texto("Subtotal", direita, y + 20, { font: fonte(20, 600), color: COR.secundario, align: "right" });
  y += 20 + 16;
  linha(y);

  // Itens
  for (const item of d.linhas) {
    ctx.font = fonte(28, 500);
    const linhasDesc = quebrarTexto(ctx, item.descricao, larguraDescricao);
    const topo = y + 24;
    linhasDesc.forEach((t, i) => {
      texto(t, PAD, topo + 28 + i * 38, { font: fonte(28, 500) });
    });
    const base = topo + 28 + (linhasDesc.length - 1) * 38;
    texto(String(item.quantidade), colQtd, base, { font: fonte(26), align: "right" });
    texto(moeda(item.precoUnitario), colUnit, base, { font: fonte(26), align: "right" });
    texto(moeda(item.subtotal), direita, base, { font: fonte(26, 600), align: "right" });
    y = base + 24;
    linha(y);
  }
  y += 40;

  // Totais
  const totalLinha = (rotulo: string, valor: string, opts: { cor?: string; grande?: boolean } = {}) => {
    const tam = opts.grande ? 44 : 26;
    const peso = opts.grande ? 700 : 400;
    texto(rotulo, PAD, y + tam, { font: fonte(tam, peso), color: opts.cor ?? (opts.grande ? COR.texto : COR.secundario) });
    texto(valor, direita, y + tam, { font: fonte(tam, peso), color: opts.cor ?? COR.texto, align: "right" });
    y += tam + 22;
  };

  totalLinha("Subtotal", moeda(d.subtotal));
  if (d.desconto > 0) totalLinha("Desconto", `− ${moeda(d.desconto)}`, { cor: COR.desconto });
  y += 8;
  linha(y);
  y += 26;
  totalLinha("Total", moeda(d.total), { grande: true });

  if (d.prazo.trim()) {
    y += 14;
    texto(`Prazo de entrega: ${d.prazo.trim()}`, PAD, y + 26, { font: fonte(26), color: COR.secundario });
    y += 26;
  }

  // Rodapé
  y += 70;
  linha(y);
  y += 30;
  texto("ginga.web", PAD, y + 20, { font: fonte(20, 600), color: COR.secundario });

  return y + 20 + PAD;
}

export async function gerarImagemOrcamento(dados: DadosImagem): Promise<Blob> {
  // Passo 1: medir a altura final com um canvas de medição.
  const medidor = document.createElement("canvas").getContext("2d");
  if (!medidor) throw new Error("Canvas indisponível neste navegador.");
  const altura = desenhar(medidor, dados, true);

  // Passo 2: pintar no canvas com a altura calculada.
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA * ESCALA;
  canvas.height = Math.ceil(altura) * ESCALA;
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
