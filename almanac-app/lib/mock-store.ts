export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAll<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw) as T[];
    } catch {
      /* seed on parse failure */
    }
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function writeAll<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function createStore<T extends { id: string }>(key: string, seed: T[]) {
  return {
    list(): T[] {
      return readAll(key, seed);
    },
    find(id: string): T | null {
      return readAll(key, seed).find((i) => i.id === id) ?? null;
    },
    insert(item: T): T {
      const items = readAll(key, seed);
      items.push(item);
      writeAll(key, items);
      return item;
    },
    update(id: string, patch: Partial<T>): T | null {
      const items = readAll(key, seed);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...patch };
      writeAll(key, items);
      return items[idx];
    },
    remove(id: string): void {
      writeAll(key, readAll(key, seed).filter((i) => i.id !== id));
    },
  };
}

export function createSingletonStore<T>(key: string, seed: T) {
  return {
    get(): T {
      if (typeof window === "undefined") return seed;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw) as T;
        } catch {
          /* seed on parse failure */
        }
      }
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    },
    set(patch: Partial<T>): T {
      const current = this.get();
      const next = { ...current, ...patch };
      if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(next));
      return next;
    },
  };
}
