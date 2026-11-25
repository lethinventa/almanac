import { createRemoteStore, newId } from "@/lib/remote-store";

// Dados gravados do produto. Custo, preço sugerido e margem NÃO são gravados:
// são calculados a partir dos insumos e da configuração atual (ver produtos.ts).

export interface InsumoReceita {
  insumoId: string;
  quantidade: number;
}

export interface Etapas3D {
  impressao?: number;
  modelagem?: number;
  acabamento?: number;
}

// Faixa de preço do site: pacote com N unidades por um preço total.
export interface FaixaPreco {
  quantidade: number;
  preco: number;
}

export interface Especificacao {
  rotulo: string;
  valor: string;
}

// O que aparece no site (gingastudio.com.br). O site só lê produtos com `publicar` = true.
// Nunca colocar aqui nada interno (custo, receita, margem): a função pública do Supabase
// entrega este objeto inteiro.
export interface DadosSite {
  publicar: boolean;
  categoria: string;
  descricao: string;
  especificacoes: Especificacao[];
  // Data URLs (fotos enviadas pelo Almanac) ou caminhos de imagens que já estão no site ("/foto.png").
  // Vazio: o site usa a foto principal do produto.
  fotos: string[];
  faixas: FaixaPreco[];
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  receita: InsumoReceita[];
  tempoProducao: number;
  foto?: string;
  etapas3D?: Etapas3D;
  // Multiplicador próprio do produto. Se ausente, usa o multiplicador global de Configurações.
  multiplicador?: number;
  // Preço de venda definido pela proprietária (o que vai pro site). Se ausente, vale o sugerido.
  precoVenda?: number;
  site?: DadosSite;
}

export interface ProdutoInput {
  nome: string;
  categoria: string;
  receita: InsumoReceita[];
  tempoProducao: number;
  foto?: string;
  etapas3D?: Etapas3D | null;
  multiplicador?: number | null;
  precoVenda?: number | null;
  site?: DadosSite | null;
}

const store = createRemoteStore<Produto>("produtos");

export async function listarProdutos(): Promise<Produto[]> {
  return store.list();
}

export async function criarProduto(dados: ProdutoInput): Promise<Produto> {
  return store.insert({
    id: newId(),
    nome: dados.nome,
    categoria: dados.categoria,
    receita: dados.receita,
    tempoProducao: dados.tempoProducao,
    foto: dados.foto,
    etapas3D: dados.etapas3D ?? undefined,
    multiplicador: dados.multiplicador ?? undefined,
    precoVenda: dados.precoVenda ?? undefined,
    site: dados.site ?? undefined,
  });
}

export async function editarProduto(id: string, dados: Partial<ProdutoInput>): Promise<Produto> {
  const patch: Partial<Produto> = {};
  if (dados.nome !== undefined) patch.nome = dados.nome;
  if (dados.categoria !== undefined) patch.categoria = dados.categoria;
  if (dados.receita !== undefined) patch.receita = dados.receita;
  if (dados.tempoProducao !== undefined) patch.tempoProducao = dados.tempoProducao;
  if ("foto" in dados) patch.foto = dados.foto ?? undefined;
  if ("etapas3D" in dados) patch.etapas3D = dados.etapas3D ?? undefined;
  if ("multiplicador" in dados) patch.multiplicador = dados.multiplicador ?? undefined;
  if ("precoVenda" in dados) patch.precoVenda = dados.precoVenda ?? undefined;
  if ("site" in dados) patch.site = dados.site ?? undefined;

  const updated = await store.update(id, patch);
  if (!updated) throw new Error("Produto não encontrado");
  return updated;
}

export async function removerProduto(id: string): Promise<void> {
  await store.remove(id);
}
