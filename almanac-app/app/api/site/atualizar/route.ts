import { createClient } from "@supabase/supabase-js";

// Pede para a Vercel publicar o site de novo (Deploy Hook). O site busca os produtos
// no Supabase durante a publicação, então cada chamada deixa o site igual ao Almanac.
// O endereço do hook fica só no servidor (SITE_DEPLOY_HOOK_URL) e a chamada exige
// uma sessão válida do Almanac, para ninguém de fora disparar publicações.
export async function POST(request: Request) {
  const hook = process.env.SITE_DEPLOY_HOOK_URL;
  if (!hook) {
    return Response.json({ ok: false, erro: "SITE_DEPLOY_HOOK_URL não configurado." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ ok: false, erro: "Sem sessão." }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return Response.json({ ok: false, erro: "Sessão inválida." }, { status: 401 });

  const resposta = await fetch(hook, { method: "POST" });
  if (!resposta.ok) {
    return Response.json({ ok: false, erro: `A Vercel respondeu ${resposta.status}.` }, { status: 502 });
  }
  return Response.json({ ok: true });
}
