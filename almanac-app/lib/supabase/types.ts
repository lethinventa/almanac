export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      insumos: {
        Row: {
          id: string
          nome: string
          categoria: 'visivel' | 'invisivel' | 'ferramenta' | 'maquinario'
          unidade: string
          preco_atual: number
          estoque: number | null
          estoque_min: number | null
          fornecedor: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['insumos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['insumos']['Insert']>
      }
      insumo_historico_preco: {
        Row: { id: string; insumo_id: string; data: string; preco: number }
        Insert: Omit<Database['public']['Tables']['insumo_historico_preco']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['insumo_historico_preco']['Insert']>
      }
      produtos: {
        Row: {
          id: string
          nome: string
          categoria: string
          tempo_producao: number
          custo: number
          preco_sugerido: number
          margem: number
          foto: string | null
          pronto_estoque: number | null
          pronto_estoque_min: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['produtos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produtos']['Insert']>
      }
      produto_receita: {
        Row: { id: string; produto_id: string; insumo_id: string; quantidade: number }
        Insert: Omit<Database['public']['Tables']['produto_receita']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produto_receita']['Insert']>
      }
      produto_etapas_3d: {
        Row: { id: string; produto_id: string; impressao: number | null; modelagem: number | null; acabamento: number | null }
        Insert: Omit<Database['public']['Tables']['produto_etapas_3d']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produto_etapas_3d']['Insert']>
      }
      lotes_producao: {
        Row: { id: string; produto_id: string; quantidade: number; data: string; observacao: string | null }
        Insert: Omit<Database['public']['Tables']['lotes_producao']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['lotes_producao']['Insert']>
      }
      encomendas: {
        Row: {
          id: string
          cliente: string
          canal: 'whatsapp' | 'presencial'
          status: 'aguardando' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado'
          data_pedido: string
          data_entrega: string
          desconto: number
          total_cobrado: number
          custo_producao: number
          margem: number
          observacoes: string | null
          observacoes_internas: string | null
          foto: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['encomendas']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomendas']['Insert']>
      }
      encomenda_itens: {
        Row: { id: string; encomenda_id: string; produto_id: string; quantidade: number; preco_unitario: number }
        Insert: Omit<Database['public']['Tables']['encomenda_itens']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomenda_itens']['Insert']>
      }
      encomenda_pagamentos: {
        Row: {
          id: string
          encomenda_id: string
          valor: number
          metodo: 'pix' | 'dinheiro' | 'cartao'
          data: string
          tipo: 'recebimento' | 'estorno'
          motivo_estorno: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['encomenda_pagamentos']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomenda_pagamentos']['Insert']>
      }
      encomenda_links_uteis: {
        Row: { id: string; encomenda_id: string; label: string; url: string }
        Insert: Omit<Database['public']['Tables']['encomenda_links_uteis']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['encomenda_links_uteis']['Insert']>
      }
      produtos_pe: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          foto: string | null
          preco_venda: number
          estoque_atual: number
          estoque_min: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['produtos_pe']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['produtos_pe']['Insert']>
      }
      custos_indiretos: {
        Row: { id: string; nome: string; valor_mensal: number }
        Insert: Omit<Database['public']['Tables']['custos_indiretos']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['custos_indiretos']['Insert']>
      }
      configuracoes: {
        Row: { id: number; horas_trabalho_mes: number; multiplicador_preco: number; custo_hora_bambu: number }
        Insert: Partial<Database['public']['Tables']['configuracoes']['Row']>
        Update: Partial<Database['public']['Tables']['configuracoes']['Row']>
      }
    }
  }
}
