"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, getSession, saveSession, clearSession } from "@/lib/auth";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setReady(true);
    if (!session && pathname !== "/login") router.replace("/login");
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user && pathname !== "/login") router.replace("/login");
    if (user && pathname === "/login") router.replace("/");
  }, [user, ready, pathname]);

  function login(email: string, senha: string): boolean {
    if (!email.trim() || !senha.trim()) return false;
    const base = email.split("@")[0];
    const nome = base.charAt(0).toUpperCase() + base.slice(1);
    const u: User = { nome, email: email.trim(), role: "proprietaria" };
    saveSession(u);
    setUser(u);
    router.push("/");
    return true;
  }

  function logout() {
    clearSession();
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
