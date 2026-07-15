export interface OpcaoInsumo {
  id: string;
  nome: string;
  unidade: string;
  precoUnitario: number;
}

export const FILAMENTOS: OpcaoInsumo[] = [
  { id: "fil-branco", nome: "Filamento PLA Branco", unidade: "g", precoUnitario: 0.09 },
  { id: "fil-preto", nome: "Filamento PLA Preto", unidade: "g", precoUnitario: 0.09 },
  { id: "fil-vermelho", nome: "Filamento PLA Vermelho", unidade: "g", precoUnitario: 0.11 },
  { id: "fil-silk-dourado", nome: "Filamento Silk Dourado", unidade: "g", precoUnitario: 0.16 },
  { id: "fil-madeira", nome: "Filamento Wood (efeito madeira)", unidade: "g", precoUnitario: 0.18 },
];

export const INSUMOS_PAPELARIA: OpcaoInsumo[] = [
  { id: "pap-color-plus", nome: "Papel Color Plus 180g", unidade: "folha", precoUnitario: 1.35 },
  { id: "pap-kraft", nome: "Papel Kraft 180g", unidade: "folha", precoUnitario: 0.95 },
  { id: "pap-cartao-perola", nome: "Cartão Perolado 250g", unidade: "folha", precoUnitario: 2.1 },
  { id: "pap-adesivo-vinil", nome: "Adesivo Vinil Fosco", unidade: "folha", precoUnitario: 3.4 },
  { id: "pap-fita-cetim", nome: "Fita de Cetim", unidade: "m", precoUnitario: 0.45 },
];

export const EMBALAGENS: OpcaoInsumo[] = [
  { id: "emb-saco-kraft", nome: "Saco Kraft pequeno", unidade: "unidade", precoUnitario: 0.8 },
  { id: "emb-caixa-simples", nome: "Caixa simples", unidade: "unidade", precoUnitario: 1.5 },
  { id: "emb-caixa-presente", nome: "Caixa presente com laço", unidade: "unidade", precoUnitario: 4.2 },
  { id: "emb-tnt", nome: "Saquinho TNT", unidade: "unidade", precoUnitario: 0.6 },
];

export const CONSTANTES = {
  custoEnergiaPorMin: 0.00123,
  depreciacaoImpressoraPorMin: 0.008,
  taxaHora: 24,
  custoPorImpressao: 0.35,
  custoPorCorteCricut: 0.18,
  margemPadrao: 0.4,
};
