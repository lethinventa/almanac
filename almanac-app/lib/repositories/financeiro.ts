import { createClient } from '@/lib/supabase/client'

export interface CustoIndireto {
  id: string
  nome: string
  valorMensal: number
}

export async function buscarCustosIndiretos(): Promise<CustoIndireto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custos_indiretos')
    .select('*')
    .order('nome')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    nome: row.nome,
    valorMensal: row.valor_mensal,
  }))
}

export async function buscarTotalCustosIndiretos(): Promise<number> {
  const custos = await buscarCustosIndiretos()
  return custos.reduce((sum, c) => sum + c.valorMensal, 0)
}

export async function criarCustoIndireto(dados: { nome: string; valorMensal: number }): Promise<CustoIndireto> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('custos_indiretos')
    .insert({ nome: dados.nome, valor_mensal: dados.valorMensal })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao criar custo indireto')

  return { id: data.id, nome: data.nome, valorMensal: data.valor_mensal }
}

export async function editarCustoIndireto(
  id: string,
  dados: { nome?: string; valorMensal?: number }
): Promise<CustoIndireto> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if (dados.valorMensal !== undefined) update.valor_mensal = dados.valorMensal

  const { data, error } = await supabase
    .from('custos_indiretos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao editar custo indireto')

  return { id: data.id, nome: data.nome, valorMensal: data.valor_mensal }
}

export async function deletarCustoIndireto(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('custos_indiretos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function loadCustos(): CustoIndireto[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('almanac_custos')
    return saved ? (JSON.parse(saved) as CustoIndireto[]) : []
  } catch {
    return []
  }
}
