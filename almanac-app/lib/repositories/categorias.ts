import { createRemoteSingleton } from "@/lib/remote-store";
import { listarProdutos, editarProduto } from "@/lib/repositories/produtos-registro";

// "Impressão 3D" é protegida: o fluxo de cadastro 3D depende desse nome.
export const CATEGORIA_SISTEMA = "Impressão 3D";

export const CATEGORIAS_PADRAO = [
  "Chaveiro",
  "Adesivo",
  "Tag",
  "Cartão",
  "Planner",
  "Kit",
  "Impressão 3D",
  "Utilidades",
  "Abridor lata",
  "Mesa posta",
  "Corporativo",
  "Outro",
];

export interface Categoria {
  nome: string;
  // Arquivada: sai da lista ao cadastrar produto, mas os produtos que já a usam continuam com ela.
  arquivada?: boolean;
}

interface CategoriasDoc {
  itens: Categoria[];
}

const store = createRemoteSingleton<CategoriasDoc>("categorias", {
  itens: CATEGORIAS_PADRAO.map((nome) => ({ nome })),
});

function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

function validarNome(nome: string, itens: Categoria[], ignorar?: string): string {
  const n = normalizarNome(nome);
  if (!n) throw new Error("Informe um nome para a categoria.");
  const duplicada = itens.some(
    (c) => c.nome !== ignorar && c.nome.toLowerCase() === n.toLowerCase()
  );
  if (duplicada) throw new Error("Já existe uma categoria com esse nome.");
  return n;
}

function bloquearSistema(nome: string) {
  if (nome === CATEGORIA_SISTEMA) {
    throw new Error("Essa categoria é do sistema e não pode ser alterada.");
  }
}

export async function buscarCategorias(): Promise<Categoria[]> {
  return (await store.get()).itens;
}

export async function contarProdutosPorCategoria(): Promise<Record<string, number>> {
  const contagem: Record<string, number> = {};
  for (const p of await listarProdutos()) {
    contagem[p.categoria] = (contagem[p.categoria] ?? 0) + 1;
  }
  return contagem;
}

export async function criarCategoria(nome: string): Promise<void> {
  const doc = await store.get();
  const n = validarNome(nome, doc.itens);
  await store.set({ itens: [...doc.itens, { nome: n }] });
}

// Renomear também troca o nome em todos os produtos que usam a categoria.
export async function renomearCategoria(antigo: string, novo: string): Promise<void> {
  bloquearSistema(antigo);
  const doc = await store.get();
  const n = validarNome(novo, doc.itens, antigo);
  if (n === antigo) return;

  const produtos = (await listarProdutos()).filter((p) => p.categoria === antigo);
  for (const p of produtos) {
    await editarProduto(p.id, { categoria: n });
  }
  await store.set({
    itens: doc.itens.map((c) => (c.nome === antigo ? { ...c, nome: n } : c)),
  });
}

export async function arquivarCategoria(nome: string, arquivada: boolean): Promise<void> {
  bloquearSistema(nome);
  const doc = await store.get();
  await store.set({
    itens: doc.itens.map((c) => (c.nome === nome ? { ...c, arquivada } : c)),
  });
}

// Só exclui categoria sem produtos; com produtos, o usuário move ou arquiva.
export async function excluirCategoria(nome: string): Promise<void> {
  bloquearSistema(nome);
  const emUso = (await listarProdutos()).filter((p) => p.categoria === nome).length;
  if (emUso > 0) {
    throw new Error(
      `${emUso} ${emUso === 1 ? "produto usa" : "produtos usam"} essa categoria. Mova-os para outra ou arquive a categoria.`
    );
  }
  const doc = await store.get();
  await store.set({ itens: doc.itens.filter((c) => c.nome !== nome) });
}
