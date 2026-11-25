import { supabase } from "@/lib/supabase";
import type { DadosSite } from "@/lib/repositories/produtos-registro";

export const URL_SITE = "https://www.gingastudio.com.br";

export function dadosSiteVazios(): DadosSite {
  return { publicar: false, categoria: "", descricao: "", especificacoes: [], fotos: [], faixas: [] };
}

// Fotos já hospedadas no site são guardadas como caminho ("/foto.png"); para mostrar
// no Almanac, completa com o domínio do site.
export function urlFoto(foto: string): string {
  return foto.startsWith("/") ? `${URL_SITE}${foto}` : foto;
}

// Mesmo slug que o site usa para montar o endereço da página do produto.
export function slugify(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// O que falta para o produto poder aparecer no site. Vazio = pode publicar.
export function pendenciasSite(site: DadosSite, temFotoPrincipal: boolean): string[] {
  const faltando: string[] = [];
  if (!site.categoria.trim()) faltando.push("categoria do site");
  if (site.faixas.length === 0) faltando.push("pelo menos uma faixa de preço");
  if (site.fotos.length === 0 && !temFotoPrincipal) faltando.push("uma foto");
  return faltando;
}

export type ResultadoAtualizacao = { ok: true } | { ok: false; erro: string };

// Pede para a Vercel publicar o site de novo com os produtos atuais.
export async function atualizarSite(): Promise<ResultadoAtualizacao> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, erro: "Sessão expirada. Entre de novo." };
    const resposta = await fetch("/api/site/atualizar", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };
    return resposta.ok ? { ok: true } : { ok: false, erro: corpo.erro ?? `Erro ${resposta.status}` };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}
