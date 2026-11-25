import { criarProduto, editarProduto, type DadosSite, type ProdutoCalculado } from "@/lib/repositories/produtos";
import { slugify } from "@/lib/site";

// Produtos que estavam escritos à mão no site (src/data/products.ts do repositório
// gingastudio3d) até o site passar a ler do Almanac. Usado uma vez, pelo botão
// "Importar do site" em /produtos. As fotos continuam hospedadas no site ("/x.png").

const PLA = [{ rotulo: "Materiais", valor: "PLA" }];

function faixas(...pares: [number, number][]) {
  return pares.map(([quantidade, preco]) => ({ quantidade, preco }));
}

const PRODUTOS_DO_SITE: { nome: string; site: Omit<DadosSite, "publicar"> }[] = [
  {
    nome: "Porta Anel Simples",
    site: {
      categoria: "Chaveiro",
      fotos: ["/porta-anel-simples.png"],
      descricao:
        "Porta-anel para academia: potinho com tampa de click que prende no chaveiro, ideal pra guardar aliança, anéis ou brincos com segurança durante o treino. Ideal pra revenda em academias e lojas de artigos esportivos.",
      especificacoes: PLA,
      faixas: faixas([10, 120], [25, 300], [50, 600]),
    },
  },
  {
    nome: "Abridor de Latas Boca",
    site: {
      categoria: "Abridor lata",
      fotos: ["/chaveiro-boca.png", "/chaveiro-boca-2.png"],
      descricao:
        "Abridor de latas em PLA com boca ergonômica, resistente e fácil de usar no dia a dia. Ideal pra revenda em utilidades domésticas.",
      especificacoes: PLA,
      faixas: faixas([10, 106], [25, 245]),
    },
  },
  {
    nome: "Porta Anel Premium",
    site: {
      categoria: "Chaveiro",
      fotos: ["/chaveiro-portal-anel-premium.png"],
      descricao:
        "Porta-anel premium para academia: potinho com tampa rosqueável e forração interna em feltro pra não arranhar a joia, prende no chaveiro pra guardar aliança/anéis em segurança durante o treino. Personalização impressa em 3D direto na peça ou com adesivo vinílico.",
      especificacoes: PLA,
      faixas: faixas([10, 165], [25, 450]),
    },
  },
  {
    nome: "Ponteira Lápis",
    site: {
      categoria: "Utilidades",
      fotos: ["/ponteira-lapis.jpg"],
      descricao: "Ponteira de lápis em PLA, prática pra personalizar kits escolares ou brindes de papelaria.",
      especificacoes: PLA,
      faixas: faixas([10, 28], [25, 64]),
    },
  },
  {
    nome: "Suporte Celular Personalizado",
    site: {
      categoria: "Utilidades",
      fotos: ["/suporte-celular.png"],
      descricao:
        "Suporte de celular personalizável em PLA, com personalização impressa em 3D direto na peça ou adesivo com nome/design do cliente. Ideal pra revenda ou brindes corporativos.",
      especificacoes: PLA,
      faixas: faixas([10, 120], [25, 300]),
    },
  },
  {
    nome: "Porta Anel Kettlebell",
    site: {
      categoria: "Chaveiro",
      fotos: ["/porta-anel-kettlebell.png"],
      descricao:
        "Porta-anel formato kettlebell pra academia: potinho com tampa rosqueável que prende no chaveiro, guarda aliança/anéis com segurança durante o treino.",
      especificacoes: PLA,
      faixas: faixas([10, 150], [25, 375]),
    },
  },
  {
    nome: "Suporte Foto Flor",
    site: {
      categoria: "Utilidades",
      fotos: ["/suporte-foto-flor.png"],
      descricao:
        "Suporte de foto em formato de flor, em PLA — decora mesa ou escritório e segura fotos pequenas/polaroid. Ideal pra revenda em papelarias e lojas de decoração.",
      especificacoes: PLA,
      faixas: faixas([10, 50], [25, 125]),
    },
  },
  {
    nome: "Chaveiro Capacete",
    site: {
      categoria: "Chaveiro",
      fotos: ["/chaveiro-capacete.png"],
      descricao:
        "Chaveiro em formato de capacete, ideal pra quem é apaixonado por moto ou ciclismo. Leve, resistente e fácil de personalizar com cores.",
      especificacoes: PLA,
      faixas: faixas([10, 120], [25, 300], [50, 600]),
    },
  },
  {
    nome: "Porta Batom Ondas",
    site: {
      categoria: "Chaveiro",
      fotos: ["/porta-batom-onda.png", "/porta-batom-onda2.png"],
      descricao:
        "Porta batom com textura em ondas, prático pra levar batom ou protetor labial na bolsa sem sujar tudo.",
      especificacoes: PLA,
      faixas: faixas([10, 100], [25, 250], [50, 500]),
    },
  },
];

export interface ResultadoImportacao {
  vinculados: string[]; // já existiam no Almanac (mesmo nome) e ganharam os dados do site
  criados: string[]; // não existiam: criados sem receita, para completar depois
}

// Vincula pelo nome (sem acento/maiúscula). Não sobrescreve dados de site já preenchidos.
export async function importarProdutosDoSite(
  existentes: ProdutoCalculado[],
  categoriaNovos: string
): Promise<ResultadoImportacao> {
  const porSlug = new Map(existentes.map((p) => [slugify(p.nome), p]));
  const resultado: ResultadoImportacao = { vinculados: [], criados: [] };

  for (const item of PRODUTOS_DO_SITE) {
    const site: DadosSite = { publicar: true, ...item.site };
    const existente = porSlug.get(slugify(item.nome));
    if (existente) {
      if (existente.site) continue;
      await editarProduto(existente.id, { site });
      resultado.vinculados.push(existente.nome);
    } else {
      await criarProduto({ nome: item.nome, categoria: categoriaNovos, receita: [], tempoProducao: 0, site });
      resultado.criados.push(item.nome);
    }
  }
  return resultado;
}
