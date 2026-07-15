"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession, saveSession, clearSession, type User } from "@/lib/auth";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string) => void;
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
    if (session && pathname === "/login") router.replace("/");
  }, [pathname]);

  function login(email: string) {
    const session = { email };
    saveSession(session);
    setUser(session);
    router.push("/");
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
