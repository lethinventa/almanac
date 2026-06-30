"use client";

import { useState, FormEvent } from "react";
import { BookMarked } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-raised)",
              border: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookMarked size={22} strokeWidth={1.5} style={{ color: "var(--text-primary)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Almanac</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>Papelaria criativa</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>Entrar</div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">E-mail</label>
            <input
              className="atlas-input"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="alm-field" style={{ margin: 0 }}>
            <label className="alm-label">Senha</label>
            <input
              className="atlas-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <div style={{ fontSize: 12, color: "var(--status-error)", padding: "6px 10px", background: "rgba(244,71,71,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(244,71,71,0.2)" }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="atlas-btn atlas-btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
