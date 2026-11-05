import { supabase } from "@/lib/supabase";

// Chaves antigas do localStorage e a tabela de destino no Supabase.
const COLECOES: Array<[chave: string, tabela: string]> = [
  ["almanac_insumos", "insumos"],
  ["almanac_produtos", "produtos"],
  ["almanac_encomendas", "encomendas"],
  ["almanac_pagamentos", "pagamentos"],
  ["almanac_produtos_pe", "produtos_pe"],
  ["almanac_custos_indiretos", "custos_indiretos"],
];

interface Linha {
  tabela: string;
  id: string;
  dados: object;
}

// Copia o que existe no navegador para o banco. Não apaga nada local.
// Retorna quantos registros foram enviados.
export async function importarDoNavegador(): Promise<number> {
  const linhas: Linha[] = [];

  for (const [chave, tabela] of COLECOES) {
    const raw = localStorage.getItem(chave);
    if (!raw) continue;
    for (const item of JSON.parse(raw) as Array<{ id: string }>) {
      const { id, ...dados } = item;
      linhas.push({ tabela, id, dados });
    }
  }

  const configRaw = localStorage.getItem("almanac_configuracoes");
  if (configRaw) {
    linhas.push({ tabela: "configuracoes", id: "principal", dados: JSON.parse(configRaw) });
  }

  for (let i = 0; i < linhas.length; i += 200) {
    const lote = linhas.slice(i, i + 200);
    const { error } = await supabase
      .from("registros")
      .upsert(lote, { onConflict: "user_id,tabela,id" });
    if (error) throw new Error(error.message);
  }

  return linhas.length;
}
