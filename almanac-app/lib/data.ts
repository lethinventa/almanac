// Dados mockados do Almanac

export type InsumoCategoria = "visivel" | "invisivel" | "ferramenta" | "maquinario";

export interface Insumo {
  id: string;
  nome: string;
  categoria: InsumoCategoria;
  unidade: string;
  precoAtual: number;
  estoque: number | null;
  estoqueMin: number | null;
  fornecedor?: string;
  historico: { data: string; preco: number }[];
}

export interface InsumoReceita {
  insumoId: string;
  quantidade: number;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  receita: InsumoReceita[];
  tempoProducao: number;
  custo: number;
  precoSugerido: number;
  margem: number;
  foto?: string;
}

export type EncomendaStatus =
  | "aguardando"
  | "em_producao"
  | "pronto"
  | "entregue"
  | "cancelado";

export interface EncomendaItem {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
}

export interface LinkUtil {
  label: string;
  url: string;
}

export interface Encomenda {
  id: string;
  cliente: string;
  canal: "whatsapp" | "presencial";
  status: EncomendaStatus;
  dataPedido: string;
  dataEntrega: string;
  itens: EncomendaItem[];
  desconto: number;
  totalCobrado: number;
  custoProducao: number;
  margem: number;
  observacoes?: string;
  observacoesInternas?: string;
  foto?: string;
  linksUteis?: LinkUtil[];
}

export interface CustoIndireto {
  id: string;
  nome: string;
  tipo: "fixo" | "mao_de_obra";
  valorMensal: number;
}

// ─────────────────────────────────────────────────────────────
// Insumos
// ─────────────────────────────────────────────────────────────
export const insumos: Insumo[] = [
  {
    id: "ins-1",
    nome: "Papel A4 premium",
    categoria: "visivel",
    unidade: "folha",
    precoAtual: 0.15,
    estoque: 420,
    estoqueMin: 100,
    fornecedor: "Papelaria Sul",
    historico: [
      { data: "2026-01-10", preco: 0.12 },
      { data: "2026-03-20", preco: 0.15 },
    ],
  },
  {
    id: "ins-2",
    nome: "Vinil transparente brilho",
    categoria: "visivel",
    unidade: "metro",
    precoAtual: 12.5,
    estoque: 3,
    estoqueMin: 10,
    fornecedor: "Vinilmax",
    historico: [
      { data: "2026-02-05", preco: 11.0 },
      { data: "2026-05-10", preco: 12.5 },
    ],
  },
  {
    id: "ins-3",
    nome: "Filamento PLA branco",
    categoria: "visivel",
    unidade: "g",
    precoAtual: 0.08,
    estoque: 850,
    estoqueMin: 200,
    fornecedor: "3D Brasil",
    historico: [{ data: "2026-04-01", preco: 0.08 }],
  },
  {
    id: "ins-4",
    nome: "Metal argola chaveiro 3cm",
    categoria: "visivel",
    unidade: "unidade",
    precoAtual: 0.45,
    estoque: 12,
    estoqueMin: 50,
    fornecedor: "Armarinhos Felix",
    historico: [
      { data: "2026-01-20", preco: 0.4 },
      { data: "2026-04-15", preco: 0.45 },
    ],
  },
  {
    id: "ins-5",
    nome: "Acrílico transparente 3mm",
    categoria: "visivel",
    unidade: "cm²",
    precoAtual: 0.022,
    estoque: 15000,
    estoqueMin: 5000,
    fornecedor: "AcrylicShop",
    historico: [{ data: "2026-03-01", preco: 0.022 }],
  },
  {
    id: "ins-6",
    nome: "Embalagem kraft P",
    categoria: "visivel",
    unidade: "unidade",
    precoAtual: 0.85,
    estoque: 80,
    estoqueMin: 30,
    fornecedor: "EmbalaMais",
    historico: [{ data: "2026-05-01", preco: 0.85 }],
  },
  {
    id: "ins-7",
    nome: "Cola quente bastão",
    categoria: "invisivel",
    unidade: "g",
    precoAtual: 0.03,
    estoque: 300,
    estoqueMin: 50,
    historico: [{ data: "2026-02-01", preco: 0.03 }],
  },
  {
    id: "ins-8",
    nome: "Tinta sublimação preta",
    categoria: "invisivel",
    unidade: "ml",
    precoAtual: 0.18,
    estoque: 45,
    estoqueMin: 20,
    fornecedor: "SubliShop",
    historico: [{ data: "2026-04-10", preco: 0.18 }],
  },
  {
    id: "ins-9",
    nome: "Cricut Maker 3",
    categoria: "maquinario",
    unidade: "—",
    precoAtual: 3800.0,
    estoque: null,
    estoqueMin: null,
    historico: [{ data: "2025-11-15", preco: 3800.0 }],
  },
  {
    id: "ins-10",
    nome: "Bambu A1 Mini",
    categoria: "maquinario",
    unidade: "—",
    precoAtual: 2200.0,
    estoque: null,
    estoqueMin: null,
    historico: [{ data: "2025-12-10", preco: 2200.0 }],
  },
  {
    id: "ins-11",
    nome: "Tesoura craft Fiskars",
    categoria: "ferramenta",
    unidade: "—",
    precoAtual: 48.0,
    estoque: null,
    estoqueMin: null,
    historico: [{ data: "2026-01-05", preco: 48.0 }],
  },
  {
    id: "ins-12",
    nome: "Régua de corte 60cm",
    categoria: "ferramenta",
    unidade: "—",
    precoAtual: 32.0,
    estoque: null,
    estoqueMin: null,
    historico: [{ data: "2026-01-05", preco: 32.0 }],
  },
];

// ─────────────────────────────────────────────────────────────
// Produtos
// ─────────────────────────────────────────────────────────────
export const produtos: Produto[] = [
  {
    id: "prd-1",
    nome: "Chaveiro acrílico personalizado",
    categoria: "Chaveiro",
    receita: [
      { insumoId: "ins-5", quantidade: 25 },
      { insumoId: "ins-4", quantidade: 1 },
      { insumoId: "ins-7", quantidade: 2 },
    ],
    tempoProducao: 15,
    custo: 1.11,
    precoSugerido: 18.0,
    margem: 93.8,
  },
  {
    id: "prd-2",
    nome: "Adesivo vinil fosco A6",
    categoria: "Adesivo",
    receita: [
      { insumoId: "ins-2", quantidade: 0.015 },
      { insumoId: "ins-1", quantidade: 2 },
    ],
    tempoProducao: 8,
    custo: 0.49,
    precoSugerido: 10.0,
    margem: 95.1,
  },
  {
    id: "prd-3",
    nome: "Tag presente personalizada",
    categoria: "Tag",
    receita: [
      { insumoId: "ins-1", quantidade: 1 },
      { insumoId: "ins-7", quantidade: 0.5 },
    ],
    tempoProducao: 5,
    custo: 0.165,
    precoSugerido: 6.0,
    margem: 97.25,
  },
  {
    id: "prd-4",
    nome: "Cartão de visita artesanal",
    categoria: "Cartão",
    receita: [
      { insumoId: "ins-1", quantidade: 2 },
      { insumoId: "ins-2", quantidade: 0.01 },
    ],
    tempoProducao: 10,
    custo: 0.425,
    precoSugerido: 12.0,
    margem: 96.5,
  },
  {
    id: "prd-5",
    nome: "Planner semanal A5",
    categoria: "Planner",
    receita: [
      { insumoId: "ins-1", quantidade: 40 },
      { insumoId: "ins-6", quantidade: 1 },
      { insumoId: "ins-7", quantidade: 5 },
    ],
    tempoProducao: 45,
    custo: 7.0,
    precoSugerido: 35.0,
    margem: 80.0,
  },
  {
    id: "prd-6",
    nome: "Kit chaveiro + tag",
    categoria: "Kit",
    receita: [
      { insumoId: "ins-5", quantidade: 25 },
      { insumoId: "ins-4", quantidade: 1 },
      { insumoId: "ins-1", quantidade: 1 },
      { insumoId: "ins-6", quantidade: 1 },
    ],
    tempoProducao: 22,
    custo: 2.0,
    precoSugerido: 24.0,
    margem: 91.7,
  },
];

// ─────────────────────────────────────────────────────────────
// Encomendas
// ─────────────────────────────────────────────────────────────
export const encomendas: Encomenda[] = [
  {
    id: "enc-1",
    cliente: "Maria Fernanda Costa",
    canal: "whatsapp",
    status: "em_producao",
    dataPedido: "2026-06-20",
    dataEntrega: "2026-06-28",
    itens: [
      { produtoId: "prd-1", quantidade: 5, precoUnitario: 18.0 },
      { produtoId: "prd-2", quantidade: 10, precoUnitario: 10.0 },
    ],
    desconto: 10.0,
    totalCobrado: 180.0,
    custoProducao: 10.45,
    margem: 94.2,
    observacoes: "Cliente pediu embalagem especial para presente",
    observacoesInternas: "Usar fita de cetim rosa na embalagem. Conferir estoque de vinil antes de iniciar.",
  },
  {
    id: "enc-2",
    cliente: "Luiz Eduardo Martins",
    canal: "whatsapp",
    status: "aguardando",
    dataPedido: "2026-06-22",
    dataEntrega: "2026-07-02",
    itens: [{ produtoId: "prd-3", quantidade: 20, precoUnitario: 6.0 }],
    desconto: 0,
    totalCobrado: 120.0,
    custoProducao: 3.3,
    margem: 97.25,
  },
  {
    id: "enc-3",
    cliente: "Ana Carolina Souza",
    canal: "presencial",
    status: "pronto",
    dataPedido: "2026-06-18",
    dataEntrega: "2026-06-26",
    itens: [{ produtoId: "prd-5", quantidade: 2, precoUnitario: 35.0 }],
    desconto: 0,
    totalCobrado: 70.0,
    custoProducao: 14.0,
    margem: 80.0,
  },
  {
    id: "enc-4",
    cliente: "Beatriz Santos Lima",
    canal: "whatsapp",
    status: "aguardando",
    dataPedido: "2026-06-23",
    dataEntrega: "2026-07-05",
    itens: [
      { produtoId: "prd-2", quantidade: 15, precoUnitario: 10.0 },
      { produtoId: "prd-4", quantidade: 50, precoUnitario: 12.0 },
    ],
    desconto: 50.0,
    totalCobrado: 700.0,
    custoProducao: 28.6,
    margem: 95.9,
    observacoes: "Encomenda para loja física — entrega em mãos",
    observacoesInternas: "Confirmar endereço de entrega com a cliente antes de embalar.",
  },
  {
    id: "enc-5",
    cliente: "Carlos Henrique Pereira",
    canal: "presencial",
    status: "entregue",
    dataPedido: "2026-06-10",
    dataEntrega: "2026-06-17",
    itens: [{ produtoId: "prd-1", quantidade: 8, precoUnitario: 18.0 }],
    desconto: 0,
    totalCobrado: 144.0,
    custoProducao: 8.88,
    margem: 93.8,
  },
  {
    id: "enc-6",
    cliente: "Juliana Rocha Ferreira",
    canal: "whatsapp",
    status: "entregue",
    dataPedido: "2026-06-08",
    dataEntrega: "2026-06-14",
    itens: [
      { produtoId: "prd-6", quantidade: 3, precoUnitario: 24.0 },
      { produtoId: "prd-3", quantidade: 10, precoUnitario: 6.0 }
    ],
    desconto: 10.0,
    totalCobrado: 122.0,
    custoProducao: 7.65,
    margem: 93.7,
  },
  {
    id: "enc-7",
    cliente: "Rafael Oliveira",
    canal: "whatsapp",
    status: "cancelado",
    dataPedido: "2026-06-12",
    dataEntrega: "2026-06-22",
    itens: [{ produtoId: "prd-5", quantidade: 5, precoUnitario: 35.0 }],
    desconto: 0,
    totalCobrado: 175.0,
    custoProducao: 35.0,
    margem: 80.0,
    observacoes: "Cliente cancelou — mudou de ideia",
  },
  {
    id: "enc-8",
    cliente: "Fernanda Alves",
    canal: "presencial",
    status: "em_producao",
    dataPedido: "2026-06-21",
    dataEntrega: "2026-06-30",
    itens: [
      { produtoId: "prd-1", quantidade: 10, precoUnitario: 18.0 },
      { produtoId: "prd-4", quantidade: 100, precoUnitario: 10.0 },
    ],
    desconto: 50.0,
    totalCobrado: 1130.0,
    custoProducao: 53.6,
    margem: 95.3,
    observacoes: "Evento corporativo — logotipo da empresa nos chaveiros",
  },
  {
    id: "enc-9",
    cliente: "Patrícia Lima",
    canal: "whatsapp",
    status: "entregue",
    dataPedido: "2026-06-02",
    dataEntrega: "2026-06-09",
    itens: [{ produtoId: "prd-5", quantidade: 4, precoUnitario: 35.0 }],
    desconto: 0,
    totalCobrado: 140.0,
    custoProducao: 28.0,
    margem: 80.0,
  },
  {
    id: "enc-10",
    cliente: "Rodrigo Andrade",
    canal: "presencial",
    status: "entregue",
    dataPedido: "2026-06-04",
    dataEntrega: "2026-06-11",
    itens: [
      { produtoId: "prd-1", quantidade: 15, precoUnitario: 18.0 },
      { produtoId: "prd-3", quantidade: 30, precoUnitario: 6.0 },
    ],
    desconto: 30.0,
    totalCobrado: 420.0,
    custoProducao: 21.6,
    margem: 94.9,
  },
  {
    id: "enc-11",
    cliente: "Camila Torres",
    canal: "whatsapp",
    status: "entregue",
    dataPedido: "2026-06-15",
    dataEntrega: "2026-06-20",
    itens: [
      { produtoId: "prd-6", quantidade: 8, precoUnitario: 24.0 },
      { produtoId: "prd-2", quantidade: 20, precoUnitario: 10.0 },
    ],
    desconto: 20.0,
    totalCobrado: 372.0,
    custoProducao: 25.8,
    margem: 93.1,
  },
  {
    id: "enc-12",
    cliente: "Diego Machado",
    canal: "presencial",
    status: "entregue",
    dataPedido: "2026-06-05",
    dataEntrega: "2026-06-12",
    itens: [{ produtoId: "prd-4", quantidade: 200, precoUnitario: 10.0 }],
    desconto: 100.0,
    totalCobrado: 1900.0,
    custoProducao: 85.0,
    margem: 95.5,
    observacoes: "Cartões de visita para escritório de advocacia",
  },
];

// ─────────────────────────────────────────────────────────────
// Custos indiretos
// ─────────────────────────────────────────────────────────────
export const custosIndiretos: CustoIndireto[] = [
  { id: "ci-1", nome: "Energia elétrica", tipo: "fixo", valorMensal: 110.0 },
  { id: "ci-2", nome: "Internet", tipo: "fixo", valorMensal: 99.9 },
  { id: "ci-3", nome: "Assinatura Canva Pro", tipo: "fixo", valorMensal: 54.99 },
  { id: "ci-4", nome: "Aluguel da sala", tipo: "fixo", valorMensal: 450.0 },
  { id: "ci-5", nome: "Mão de obra (proprietária)", tipo: "mao_de_obra", valorMensal: 60.0 },
];

// ─────────────────────────────────────────────────────────────
// Dashboard helpers
// ─────────────────────────────────────────────────────────────
export const insumosEmAlerta = insumos.filter(
  (i) => i.estoque !== null && i.estoqueMin !== null && i.estoque <= i.estoqueMin
);

export const encomendasAbertas = encomendas.filter(
  (e) => e.status !== "entregue" && e.status !== "cancelado"
);

export const encomendasEntregues = encomendas.filter((e) => e.status === "entregue");

export const receitaMes = encomendasEntregues.reduce(
  (sum, e) => sum + e.totalCobrado,
  0
);

export const custoMes = encomendasEntregues.reduce(
  (sum, e) => sum + e.custoProducao,
  0
);

export const totalCustosIndiretos = custosIndiretos.reduce(
  (sum, c) => sum + c.valorMensal,
  0
);

export const lucroBruto = receitaMes - custoMes;
export const lucroLiquido = lucroBruto - totalCustosIndiretos;

// ─────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export const statusLabels: Record<EncomendaStatus, string> = {
  aguardando: "Aguardando",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const statusBadge: Record<EncomendaStatus, string> = {
  aguardando: "atlas-badge",
  em_producao: "atlas-badge atlas-badge-warning",
  pronto: "atlas-badge atlas-badge-info",
  entregue: "atlas-badge atlas-badge-success",
  cancelado: "atlas-badge atlas-badge-error",
};

export const categoriaLabel: Record<InsumoCategoria, string> = {
  visivel: "Rotativo visível",
  invisivel: "Rotativo invisível",
  ferramenta: "Ferramenta",
  maquinario: "Maquinário",
};
