import { createClient } from '@/lib/supabase/client'

export interface Pagamento {
  id: string
  encomendaId: string
  valor: number
  metodo: 'pix' | 'dinheiro' | 'cartao'
  data: string
  tipo: 'recebimento' | 'estorno'
  motivoEstorno?: string
}

export interface PagamentoInput {
  encomendaId: string
  valor: number
  metodo: 'pix' | 'dinheiro' | 'cartao'
  data: string
  observacao?: string
}

export async function buscarPagamentos(encomendaId: string): Promise<Pagamento[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomenda_pagamentos')
    .select('*')
    .eq('encomenda_id', encomendaId)
    .order('created_at')

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    encomendaId: row.encomenda_id,
    valor: row.valor,
    metodo: row.metodo as 'pix' | 'dinheiro' | 'cartao',
    data: row.data,
    tipo: row.tipo as 'recebimento' | 'estorno',
    motivoEstorno: row.motivo_estorno ?? undefined,
  }))
}

export async function registrarPagamento(dados: PagamentoInput): Promise<Pagamento> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomenda_pagamentos')
    .insert({
      encomenda_id: dados.encomendaId,
      valor: dados.valor,
      metodo: dados.metodo,
      data: dados.data,
      tipo: 'recebimento',
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erro ao registrar pagamento')

  return {
    id: data.id,
    encomendaId: data.encomenda_id,
    valor: data.valor,
    metodo: data.metodo as 'pix' | 'dinheiro' | 'cartao',
    data: data.data,
    tipo: 'recebimento',
  }
}

export async function buscarTodosPagamentos(): Promise<Record<string, Array<{ id: string; valor: number; data: string; forma: string; observacao?: string }>>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomenda_pagamentos')
    .select('*')
    .order('created_at')

  if (error || !data) return {}

  const result: Record<string, Array<{ id: string; valor: number; data: string; forma: string; observacao?: string }>> = {}
  for (const row of data) {
    if (!result[row.encomenda_id]) result[row.encomenda_id] = []
    result[row.encomenda_id].push({
      id: row.id,
      valor: row.valor,
      data: row.data,
      forma: row.metodo,
      observacao: row.motivo_estorno ?? undefined,
    })
  }
  return result
}

export async function estornarPagamento(pagamentoId: string, motivo: string): Promise<void> {
  const supabase = createClient()
  const { data: original } = await supabase
    .from('encomenda_pagamentos')
    .select('*')
    .eq('id', pagamentoId)
    .single()

  if (!original) throw new Error('Pagamento não encontrado')

  await supabase.from('encomenda_pagamentos').insert({
    encomenda_id: original.encomenda_id,
    valor: -Math.abs(original.valor),
    metodo: original.metodo,
    data: new Date().toISOString().slice(0, 10),
    tipo: 'estorno',
    motivo_estorno: motivo,
  })
}
