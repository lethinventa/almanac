import { supabase } from "@/lib/supabase";

export function newId(): string {
  return crypto.randomUUID();
}

function falha(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

// Uma tabela genérica `registros` guarda todas as entidades como JSON, por usuário (RLS).
export function createRemoteStore<T extends { id: string }>(tabela: string) {
  async function ler(): Promise<T[]> {
    const { data, error } = await supabase.from("registros").select("id, dados").eq("tabela", tabela);
    falha(error);
    return (data ?? []).map((l) => ({ ...(l.dados as object), id: l.id }) as T);
  }

  async function gravar(item: T): Promise<void> {
    const { id, ...dados } = item;
    const { error } = await supabase
      .from("registros")
      .upsert({ tabela, id, dados }, { onConflict: "user_id,tabela,id" });
    falha(error);
  }

  return {
    list: ler,

    async find(id: string): Promise<T | null> {
      const { data, error } = await supabase
        .from("registros")
        .select("id, dados")
        .eq("tabela", tabela)
        .eq("id", id)
        .maybeSingle();
      falha(error);
      return data ? ({ ...(data.dados as object), id: data.id } as T) : null;
    },

    async insert(item: T): Promise<T> {
      await gravar(item);
      return item;
    },

    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const atual = await this.find(id);
      if (!atual) return null;
      const atualizado = { ...atual, ...patch, id };
      await gravar(atualizado);
      return atualizado;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("registros").delete().eq("tabela", tabela).eq("id", id);
      falha(error);
    },
  };
}

// Documento único (ex.: configurações), guardado com id fixo "principal".
export function createRemoteSingleton<T extends object>(tabela: string, padrao: T) {
  return {
    async get(): Promise<T> {
      const { data, error } = await supabase
        .from("registros")
        .select("dados")
        .eq("tabela", tabela)
        .eq("id", "principal")
        .maybeSingle();
      falha(error);
      return data ? ({ ...padrao, ...(data.dados as object) } as T) : padrao;
    },

    async set(patch: Partial<T>): Promise<void> {
      const atual = await this.get();
      const { error } = await supabase
        .from("registros")
        .upsert({ tabela, id: "principal", dados: { ...atual, ...patch } }, { onConflict: "user_id,tabela,id" });
      falha(error);
    },
  };
}
