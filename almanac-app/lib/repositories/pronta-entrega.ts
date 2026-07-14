import { createClient } from '@/lib/supabase/client'

export interface ProdutoPE {
  id: string
  nome: string
  descricao?: string
  foto?: string
  precoVenda: number
  estoqueAtual: number
  estoqueMin: number
}

export interface ProdutoPEInput {
  nome: string
  descricao?: string
  foto?: string
  precoVenda: number
  estoqueAtual: number
  estoqueMin: number
}

function mapRow(row: {
  id: string
  nome: string
  descricao: string | null
  foto: string | null
  preco_venda: number
  estoque_atual: number
  estoque_min: number
}): ProdutoPE {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    foto: row.foto ?? undefined,
    precoVenda: row.preco_venda,
    estoqueAtual: row.estoque_atual,
    estoqueMin: row.estoque_min,
  }
}

export async function buscarProdutosPE(): Promise<ProdutoPE[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('produtos_pe').select('*').order('nome')
  if (error || !data) return []
  return data.map(mapRow)
}

export async function buscarProdutoPE(id: string): Promise<ProdutoPE | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('produtos_pe').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapRow(data)
}

export async function criarProdutoPE(dados: ProdutoPEInput): Promise<ProdutoPE> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos_pe')
    .insert({
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      foto: dados.foto ?? null,
      preco_venda: dados.precoVenda,
      estoque_atual: dados.estoqueAtual,
      estoque_min: dados.estoqueMin,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao criar produto PE')
  return mapRow(data)
}

export async function editarProdutoPE(id: string, dados: Partial<ProdutoPEInput>): Promise<ProdutoPE> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if ('descricao' in dados) update.descricao = dados.descricao ?? null
  if ('foto' in dados) update.foto = dados.foto ?? null
  if (dados.precoVenda !== undefined) update.preco_venda = dados.precoVenda
  if (dados.estoqueAtual !== undefined) update.estoque_atual = dados.estoqueAtual
  if (dados.estoqueMin !== undefined) update.estoque_min = dados.estoqueMin

  const { data, error } = await supabase
    .from('produtos_pe')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao editar produto PE')
  return mapRow(data)
}

export async function deletarProdutoPE(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('produtos_pe').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
