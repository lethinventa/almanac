import { createClient } from '@/lib/supabase/client'

export interface InsumoReceita {
  insumoId: string
  quantidade: number
}

export interface Etapas3D {
  impressao?: number
  modelagem?: number
  acabamento?: number
}

export interface LoteProducao {
  id: string
  produtoId: string
  quantidade: number
  data: string
  observacao?: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  receita: InsumoReceita[]
  tempoProducao: number
  custo: number
  precoSugerido: number
  margem: number
  foto?: string
  prontoEstoque?: number
  prontoEstoqueMin?: number
  etapas3D?: Etapas3D
  historicoLotes?: LoteProducao[]
}

export interface ProdutoInput {
  nome: string
  categoria: string
  receita: InsumoReceita[]
  tempoProducao: number
  custo: number
  precoSugerido: number
  margem: number
  foto?: string
  prontoEstoque?: number | null
  prontoEstoqueMin?: number | null
  etapas3D?: Etapas3D | null
}

export async function buscarProdutos(): Promise<Produto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      *,
      produto_receita(insumo_id, quantidade),
      produto_etapas_3d(impressao, modelagem, acabamento),
      lotes_producao(id, quantidade, data, observacao)
    `)
    .order('nome')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    receita: (row.produto_receita ?? []).map((r: { insumo_id: string; quantidade: number }) => ({
      insumoId: r.insumo_id,
      quantidade: r.quantidade,
    })),
    tempoProducao: row.tempo_producao,
    custo: row.custo,
    precoSugerido: row.preco_sugerido,
    margem: row.margem,
    foto: row.foto ?? undefined,
    prontoEstoque: row.pronto_estoque ?? undefined,
    prontoEstoqueMin: row.pronto_estoque_min ?? undefined,
    etapas3D: row.produto_etapas_3d?.[0]
      ? {
          impressao: row.produto_etapas_3d[0].impressao ?? undefined,
          modelagem: row.produto_etapas_3d[0].modelagem ?? undefined,
          acabamento: row.produto_etapas_3d[0].acabamento ?? undefined,
        }
      : undefined,
    historicoLotes: (row.lotes_producao ?? [])
      .sort((a: { data: string }, b: { data: string }) => b.data.localeCompare(a.data))
      .map((l: { id: string; quantidade: number; data: string; observacao: string | null }) => ({
        id: l.id,
        produtoId: row.id,
        quantidade: l.quantidade,
        data: l.data,
        observacao: l.observacao ?? undefined,
      })),
  }))
}

export async function criarProduto(dados: ProdutoInput): Promise<Produto> {
  const supabase = createClient()

  const { data: produto, error } = await supabase
    .from('produtos')
    .insert({
      nome: dados.nome,
      categoria: dados.categoria,
      tempo_producao: dados.tempoProducao,
      custo: dados.custo,
      preco_sugerido: dados.precoSugerido,
      margem: dados.margem,
      foto: dados.foto ?? null,
      pronto_estoque: dados.prontoEstoque ?? null,
      pronto_estoque_min: dados.prontoEstoqueMin ?? null,
    })
    .select()
    .single()

  if (error || !produto) throw new Error(error?.message ?? 'Erro ao criar produto')

  if (dados.receita.length > 0) {
    const { error: receitaError } = await supabase.from('produto_receita').insert(
      dados.receita.map(r => ({ produto_id: produto.id, insumo_id: r.insumoId, quantidade: r.quantidade }))
    )
    if (receitaError) throw new Error(receitaError.message)
  }

  if (dados.etapas3D) {
    const { error: etapasError } = await supabase.from('produto_etapas_3d').insert({
      produto_id: produto.id,
      impressao: dados.etapas3D.impressao ?? null,
      modelagem: dados.etapas3D.modelagem ?? null,
      acabamento: dados.etapas3D.acabamento ?? null,
    })
    if (etapasError) throw new Error(etapasError.message)
  }

  const produtos = await buscarProdutos()
  const created = produtos.find(p => p.id === produto.id)
  if (!created) throw new Error('Produto criado mas não encontrado ao recarregar')
  return created
}

export async function editarProduto(id: string, dados: Partial<ProdutoInput>): Promise<Produto> {
  const supabase = createClient()

  const update: Record<string, unknown> = {}
  if (dados.nome !== undefined) update.nome = dados.nome
  if (dados.categoria !== undefined) update.categoria = dados.categoria
  if (dados.tempoProducao !== undefined) update.tempo_producao = dados.tempoProducao
  if (dados.custo !== undefined) update.custo = dados.custo
  if (dados.precoSugerido !== undefined) update.preco_sugerido = dados.precoSugerido
  if (dados.margem !== undefined) update.margem = dados.margem
  if ('foto' in dados) update.foto = dados.foto ?? null
  if ('prontoEstoque' in dados) update.pronto_estoque = dados.prontoEstoque ?? null
  if ('prontoEstoqueMin' in dados) update.pronto_estoque_min = dados.prontoEstoqueMin ?? null

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from('produtos').update(update).eq('id', id)
    if (error) throw new Error(error.message)
  }

  if (dados.receita !== undefined) {
    const { error: deleteError } = await supabase.from('produto_receita').delete().eq('produto_id', id)
    if (deleteError) throw new Error(deleteError.message)
    if (dados.receita.length > 0) {
      const { error: insertError } = await supabase.from('produto_receita').insert(
        dados.receita.map(r => ({ produto_id: id, insumo_id: r.insumoId, quantidade: r.quantidade }))
      )
      if (insertError) throw new Error(insertError.message)
    }
  }

  if ('etapas3D' in dados) {
    const { error: deleteError } = await supabase.from('produto_etapas_3d').delete().eq('produto_id', id)
    if (deleteError) throw new Error(deleteError.message)
    if (dados.etapas3D) {
      const { error: insertError } = await supabase.from('produto_etapas_3d').insert({
        produto_id: id,
        impressao: dados.etapas3D.impressao ?? null,
        modelagem: dados.etapas3D.modelagem ?? null,
        acabamento: dados.etapas3D.acabamento ?? null,
      })
      if (insertError) throw new Error(insertError.message)
    }
  }

  const produtos = await buscarProdutos()
  const updated = produtos.find(p => p.id === id)
  if (!updated) throw new Error('Produto editado mas não encontrado ao recarregar')
  return updated
}

export async function deletarProduto(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function registrarLote(
  produtoId: string,
  lote: { quantidade: number; data: string; observacao?: string }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lotes_producao').insert({
    produto_id: produtoId,
    quantidade: lote.quantidade,
    data: lote.data,
    observacao: lote.observacao ?? null,
  })
  if (error) throw new Error(error.message)
}
