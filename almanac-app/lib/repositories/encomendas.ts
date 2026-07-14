import { createClient } from '@/lib/supabase/client'

export type EncomendaStatus = 'aguardando' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado'

export interface EncomendaItem {
  produtoId: string
  quantidade: number
  precoUnitario: number
}

export interface LinkUtil {
  id: string
  label: string
  url: string
}

export interface Encomenda {
  id: string
  cliente: string
  canal: 'whatsapp' | 'presencial'
  status: EncomendaStatus
  dataPedido: string
  dataEntrega: string
  itens: EncomendaItem[]
  desconto: number
  totalCobrado: number
  custoProducao: number
  margem: number
  observacoes?: string
  observacoesInternas?: string
  foto?: string
  linksUteis: LinkUtil[]
}

export interface EncomendaInput {
  cliente: string
  canal: 'whatsapp' | 'presencial'
  status?: EncomendaStatus
  dataPedido: string
  dataEntrega: string
  itens: EncomendaItem[]
  desconto?: number
  totalCobrado: number
  custoProducao: number
  margem: number
  observacoes?: string
  observacoesInternas?: string
  foto?: string
}

function mapRow(row: {
  id: string
  cliente: string
  canal: string
  status: string
  data_pedido: string
  data_entrega: string
  desconto: number
  total_cobrado: number
  custo_producao: number
  margem: number
  observacoes: string | null
  observacoes_internas: string | null
  foto: string | null
  encomenda_itens?: { produto_id: string; quantidade: number; preco_unitario: number }[]
  encomenda_links_uteis?: { id: string; label: string; url: string }[]
}): Encomenda {
  return {
    id: row.id,
    cliente: row.cliente,
    canal: row.canal as 'whatsapp' | 'presencial',
    status: row.status as EncomendaStatus,
    dataPedido: row.data_pedido,
    dataEntrega: row.data_entrega,
    itens: (row.encomenda_itens ?? []).map(i => ({
      produtoId: i.produto_id,
      quantidade: i.quantidade,
      precoUnitario: i.preco_unitario,
    })),
    desconto: row.desconto,
    totalCobrado: row.total_cobrado,
    custoProducao: row.custo_producao,
    margem: row.margem,
    observacoes: row.observacoes ?? undefined,
    observacoesInternas: row.observacoes_internas ?? undefined,
    foto: row.foto ?? undefined,
    linksUteis: (row.encomenda_links_uteis ?? []).map(l => ({
      id: l.id,
      label: l.label,
      url: l.url,
    })),
  }
}

const SELECT_FULL = `
  *,
  encomenda_itens(produto_id, quantidade, preco_unitario),
  encomenda_links_uteis(id, label, url)
`

export async function buscarEncomendas(): Promise<Encomenda[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomendas')
    .select(SELECT_FULL)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

export async function buscarEncomenda(id: string): Promise<Encomenda | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('encomendas')
    .select(SELECT_FULL)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapRow(data)
}

export async function criarEncomenda(dados: EncomendaInput): Promise<Encomenda> {
  const supabase = createClient()

  const { data: enc, error } = await supabase
    .from('encomendas')
    .insert({
      cliente: dados.cliente,
      canal: dados.canal,
      status: dados.status ?? 'aguardando',
      data_pedido: dados.dataPedido,
      data_entrega: dados.dataEntrega,
      desconto: dados.desconto ?? 0,
      total_cobrado: dados.totalCobrado,
      custo_producao: dados.custoProducao,
      margem: dados.margem,
      observacoes: dados.observacoes ?? null,
      observacoes_internas: dados.observacoesInternas ?? null,
      foto: dados.foto ?? null,
    })
    .select()
    .single()

  if (error || !enc) throw new Error(error?.message ?? 'Erro ao criar encomenda')

  if (dados.itens.length > 0) {
    await supabase.from('encomenda_itens').insert(
      dados.itens.map(i => ({
        encomenda_id: enc.id,
        produto_id: i.produtoId,
        quantidade: i.quantidade,
        preco_unitario: i.precoUnitario,
      }))
    )
  }

  return (await buscarEncomenda(enc.id))!
}

export async function editarEncomenda(id: string, dados: Partial<EncomendaInput>): Promise<Encomenda> {
  const supabase = createClient()

  const update: Record<string, unknown> = {}
  if (dados.cliente !== undefined) update.cliente = dados.cliente
  if (dados.canal !== undefined) update.canal = dados.canal
  if (dados.status !== undefined) update.status = dados.status
  if (dados.dataPedido !== undefined) update.data_pedido = dados.dataPedido
  if (dados.dataEntrega !== undefined) update.data_entrega = dados.dataEntrega
  if (dados.desconto !== undefined) update.desconto = dados.desconto
  if (dados.totalCobrado !== undefined) update.total_cobrado = dados.totalCobrado
  if (dados.custoProducao !== undefined) update.custo_producao = dados.custoProducao
  if (dados.margem !== undefined) update.margem = dados.margem
  if ('observacoes' in dados) update.observacoes = dados.observacoes ?? null
  if ('observacoesInternas' in dados) update.observacoes_internas = dados.observacoesInternas ?? null
  if ('foto' in dados) update.foto = dados.foto ?? null

  if (Object.keys(update).length > 0) {
    await supabase.from('encomendas').update(update).eq('id', id)
  }

  if (dados.itens !== undefined) {
    await supabase.from('encomenda_itens').delete().eq('encomenda_id', id)
    if (dados.itens.length > 0) {
      await supabase.from('encomenda_itens').insert(
        dados.itens.map(i => ({
          encomenda_id: id,
          produto_id: i.produtoId,
          quantidade: i.quantidade,
          preco_unitario: i.precoUnitario,
        }))
      )
    }
  }

  return (await buscarEncomenda(id))!
}

export async function atualizarStatus(id: string, status: EncomendaStatus): Promise<void> {
  const supabase = createClient()
  await supabase.from('encomendas').update({ status }).eq('id', id)
}

export async function adicionarLink(
  encomendaId: string,
  link: { label: string; url: string }
): Promise<void> {
  const supabase = createClient()
  await supabase.from('encomenda_links_uteis').insert({
    encomenda_id: encomendaId,
    label: link.label,
    url: link.url,
  })
}

export async function removerLink(linkId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('encomenda_links_uteis').delete().eq('id', linkId)
}
