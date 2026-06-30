export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export const statusLabels: Record<string, string> = {
  aguardando: 'Aguardando',
  em_producao: 'Em produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const statusBadge: Record<string, string> = {
  aguardando: 'atlas-badge',
  em_producao: 'atlas-badge atlas-badge-warning',
  pronto: 'atlas-badge atlas-badge-info',
  entregue: 'atlas-badge atlas-badge-success',
  cancelado: 'atlas-badge atlas-badge-error',
}

export const categoriaLabel: Record<string, string> = {
  visivel: 'Rotativo visível',
  invisivel: 'Rotativo invisível',
  ferramenta: 'Ferramenta',
  maquinario: 'Maquinário',
}
