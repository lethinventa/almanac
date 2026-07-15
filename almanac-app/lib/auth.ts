export interface User {
  email: string;
}

const KEY = "almanac_session";

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as User) : null;
  } catch { return null; }
}

export function saveSession(user: User): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
