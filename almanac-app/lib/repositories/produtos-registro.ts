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
}

export interface ProdutoInput {
  nome: string;
  categoria: string;
  receita: InsumoReceita[];
  tempoProducao: number;
  foto?: string;
  etapas3D?: Etapas3D | null;
  multiplicador?: number | null;
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

  const updated = await store.update(id, patch);
  if (!updated) throw new Error("Produto não encontrado");
  return updated;
}

export async function removerProduto(id: string): Promise<void> {
  await store.remove(id);
}
