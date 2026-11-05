"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface User {
  email: string;
}

interface AuthCtx {
  user: User | null;
  ready: boolean;
  // Retorna a mensagem de erro, ou null se entrou.
  login: (email: string, senha: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

function paraUsuario(email: string | null | undefined): User | null {
  return email ? { email } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const usuario = paraUsuario(data.session?.user.email);
      setUser(usuario);
      setReady(true);
      if (!usuario && pathname !== "/login") router.replace("/login");
      if (usuario && pathname === "/login") router.replace("/");
    });
    const { data: escuta } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(paraUsuario(session?.user.email));
    });
    return () => {
      ativo = false;
      escuta.subscription.unsubscribe();
    };
  }, [pathname]);

  async function login(email: string, senha: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return "E-mail ou senha incorretos.";
    router.push("/");
    return null;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
