import { createRemoteStore, newId } from "@/lib/remote-store";

// Planejamento de conteúdo para o Instagram (v1: só Instagram).
// Uma "ideia" é um post sem data, com status "ideia" — fica no banco de ideias.

export const FORMATOS_INSTAGRAM = ["feed", "reels", "stories", "carrossel"] as const;
export type FormatoInstagram = (typeof FORMATOS_INSTAGRAM)[number];

export const STATUS_POST = ["ideia", "roteiro", "produzido", "agendado", "publicado"] as const;
export type StatusPost = (typeof STATUS_POST)[number];

export const ROTULO_STATUS: Record<StatusPost, string> = {
  ideia: "Ideia",
  roteiro: "Roteiro",
  produzido: "Produzido",
  agendado: "Agendado",
  publicado: "Publicado",
};

export const ROTULO_FORMATO: Record<FormatoInstagram, string> = {
  feed: "Feed",
  reels: "Reels",
  stories: "Stories",
  carrossel: "Carrossel",
};

// Vínculo opcional com algo que já existe no negócio (sem dados de cliente).
export interface VinculoPost {
  tipo: "produto" | "pe";
  id: string;
}

export interface PostInstagram {
  id: string;
  titulo: string;
  formato: FormatoInstagram;
  status: StatusPost;
  // Data de publicação planejada, no formato AAAA-MM-DD. Ausente em ideias.
  data?: string;
  legenda?: string;
  hashtags?: string;
  observacoes?: string;
  vinculo?: VinculoPost;
  criadoEm: string;
}

export type PostInstagramInput = Omit<PostInstagram, "id" | "criadoEm">;

const store = createRemoteStore<PostInstagram>("planejamento_instagram");

export async function buscarPosts(): Promise<PostInstagram[]> {
  return (await store.list()).sort((a, b) => {
    const da = a.data ?? "";
    const db = b.data ?? "";
    if (da !== db) return da < db ? -1 : 1;
    return a.criadoEm.localeCompare(b.criadoEm);
  });
}

export async function criarPost(dados: PostInstagramInput): Promise<PostInstagram> {
  const post: PostInstagram = {
    ...dados,
    id: newId(),
    criadoEm: new Date().toISOString(),
  };
  return store.insert(post);
}

export async function editarPost(id: string, dados: Partial<PostInstagramInput>): Promise<PostInstagram> {
  const updated = await store.update(id, dados);
  if (!updated) throw new Error("Post não encontrado");
  return updated;
}

export async function deletarPost(id: string): Promise<void> {
  await store.remove(id);
}
