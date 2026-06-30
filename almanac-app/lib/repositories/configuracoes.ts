import { createClient } from '@/lib/supabase/client'

export interface Configuracoes {
  horasTrabalhoMes: number
  multiplicadorPreco: number
  custoHoraBambu: number
}

const DEFAULTS: Configuracoes = {
  horasTrabalhoMes: 160,
  multiplicadorPreco: 3,
  custoHoraBambu: 4.5,
}

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) return DEFAULTS

  return {
    horasTrabalhoMes: data.horas_trabalho_mes,
    multiplicadorPreco: data.multiplicador_preco,
    custoHoraBambu: data.custo_hora_bambu,
  }
}

export async function salvarConfiguracoes(config: Partial<Configuracoes>): Promise<void> {
  const supabase = createClient()
  const update: Record<string, number> = {}
  if (config.horasTrabalhoMes !== undefined) update.horas_trabalho_mes = config.horasTrabalhoMes
  if (config.multiplicadorPreco !== undefined) update.multiplicador_preco = config.multiplicadorPreco
  if (config.custoHoraBambu !== undefined) update.custo_hora_bambu = config.custoHoraBambu

  await supabase.from('configuracoes').upsert({ id: 1, ...update })
}
