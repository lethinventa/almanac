import { createClient } from '@/lib/supabase/client'

export type InsumoCategoria = 'visivel' | 'invisivel' | 'ferramenta' | 'maquinario'

export interface Insumo {
  id: string
  nome: string
  categoria: InsumoCategoria
  unidade: string
  precoAtual: number
  estoque: number | null
  estoqueMin: number | null
  fornecedor?: string
  historico: { data: string; preco: number }[]
}

export interface InsumoInput {
  nome: string
  categoria: InsumoCategoria
  unidade: string
  precoAtual: number
  estoque?: number | null
  estoqueMin?: number | null
  fornecedor?: string
}

export async function buscarInsumos(): Promise<Insumo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .select(`*, insumo_historico_preco(id, data, preco)`)
    .order('nome')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    nome: row.nome,
    categoria: row.categoria as InsumoCategoria,
    unidade: row.unidade,
    precoAtual: row.preco_atual,
    estoque: row.estoque,
    estoqueMin: row.estoque_min,
    fornecedor: row.fornecedor ?? undefined,
    historico: (row.insumo_historico_preco ?? [])
      .sort((a: { data: string }, b: { data: string }) => a.data.localeCompare(b.data))
      .map((h: { data: string; preco: number }) => ({ data: h.data, preco: h.preco })),
  }))
}

export async function criarInsumo(dados: InsumoInput): Promise<Insumo> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .insert({
      nome: dados.nome,
      categoria: dados.categoria,
      unidade: dados.unidade,
      preco_atual: dados.precoAtual,
      estoque: dados.estoque ?? null,
      estoque_min: dados.estoqueMin ?? null,
      fornecedor: dados.fornecedor ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao criar insumo')

  if (dados.precoAtual > 0) {
    await registrarPreco(data.id, dados.precoAtual, new Date().toISOString().slice(0, 10))
  }

  return {
    id: data.id,
    nome: data.nome,
    categoria: data.categoria as InsumoCategoria,
    unidade: data.unidade,
    precoAtual: data.preco_atual,
    estoque: data.estoque,
    estoqueMin: data.estoque_min,
    fornecedor: data.fornecedor ?? undefined,
    historico: dados.precoAtual > 0
      ? [{ data: new Date().toISOString().slice(0, 10), preco: dados.precoAtual }]
      : [],
  }
}

export async function editarInsumo(id: string, dados: Partial<InsumoInput>): Promise<Insumo> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if (dados.categoria !== undefined) update.categoria = dados.categoria
  if (dados.unidade !== undefined) update.unidade = dados.unidade
  if (dados.precoAtual !== undefined) update.preco_atual = dados.precoAtual
  if ('estoque' in dados) update.estoque = dados.estoque ?? null
  if ('estoqueMin' in dados) update.estoque_min = dados.estoqueMin ?? null
  if ('fornecedor' in dados) update.fornecedor = dados.fornecedor ?? null

  const { data, error } = await supabase
    .from('insumos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao editar insumo')

  if (dados.precoAtual !== undefined) {
    await registrarPreco(id, dados.precoAtual, new Date().toISOString().slice(0, 10))
  }

  const insumos = await buscarInsumos()
  return insumos.find(i => i.id === id)!
}

export async function deletarInsumo(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function registrarPreco(insumoId: string, preco: number, data: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('insumo_historico_preco').insert({ insumo_id: insumoId, preco, data })
}
