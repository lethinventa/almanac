import { gerarImagemOrcamento, type LinhaImagem } from "@/lib/orcamento-imagem";
import { buscarConfiguracoes } from "@/lib/repositories/configuracoes";

// Gera a imagem de orçamento (mesmo modelo do módulo Orçamento) para uma encomenda.
// Devolve data URL PNG, guardada junto com o registro da encomenda.

export interface DadosOrcamentoEncomenda {
  cliente: string;
  prazo: string;
  data: string; // ISO yyyy-mm-dd
  linhas: LinhaImagem[];
  desconto: number;
  total: number;
}

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

export async function gerarOrcamentoEncomenda(dados: DadosOrcamentoEncomenda): Promise<string> {
  const config = await buscarConfiguracoes();
  const subtotal = dados.linhas.reduce((s, l) => s + l.subtotal, 0);
  const blob = await gerarImagemOrcamento({
    cliente: dados.cliente,
    prazo: dados.prazo,
    linhas: dados.linhas,
    subtotal,
    desconto: dados.desconto,
    total: dados.total,
    data: dados.data,
    nomeLoja: config.nomeLoja,
    instagram: config.instagram,
    telefone: config.telefone,
    email: config.email,
    endereco: config.endereco,
    validadeDias: config.validadeDias,
  });
  return blobParaDataUrl(blob);
}
