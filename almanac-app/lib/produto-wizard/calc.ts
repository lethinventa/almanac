import { CONSTANTES, EMBALAGENS, FILAMENTOS, INSUMOS_PAPELARIA, type OpcaoInsumo } from "./mock-data";
import type { GrupoCusto, ItemInsumoQtd, LinhaResumo, Respostas3D, RespostasPapelaria } from "./types";

function acharOpcao(lista: OpcaoInsumo[], id: string | null | undefined): OpcaoInsumo | undefined {
  if (!id) return undefined;
  return lista.find((o) => o.id === id);
}

function linhasItens(lista: OpcaoInsumo[], itens: ItemInsumoQtd[], grupo: GrupoCusto, prefixo: string): LinhaResumo[] {
  const linhas: LinhaResumo[] = [];
  for (const item of itens) {
    const opcao = acharOpcao(lista, item.insumoId);
    if (!opcao || !item.quantidade || item.quantidade <= 0) continue;
    linhas.push({
      id: `${prefixo}-${item.insumoId}`,
      label: `${opcao.nome} (${item.quantidade} ${opcao.unidade}${item.quantidade !== 1 ? "s" : ""})`,
      valor: opcao.precoUnitario * item.quantidade,
      grupo,
    });
  }
  return linhas;
}

function linhasEmbalagens(embalagens: ItemInsumoQtd[]): LinhaResumo[] {
  return linhasItens(EMBALAGENS, embalagens, "embalagem", "embalagem");
}

export function calcularLinhas3D(r: Partial<Respostas3D>): LinhaResumo[] {
  const linhas: LinhaResumo[] = [];

  linhas.push(...linhasItens(FILAMENTOS, r.filamentos ?? [], "material", "filamento"));

  if (r.tempoImpressaoMin && r.tempoImpressaoMin > 0) {
    linhas.push({
      id: "energia",
      label: `Energia (${r.tempoImpressaoMin}min)`,
      valor: r.tempoImpressaoMin * CONSTANTES.custoEnergiaPorMin,
      grupo: "producao",
    });
    linhas.push({
      id: "depreciacao",
      label: `Depreciação da impressora (${r.tempoImpressaoMin}min)`,
      valor: r.tempoImpressaoMin * CONSTANTES.depreciacaoImpressoraPorMin,
      grupo: "producao",
    });
  }

  if (r.posProcessamento && r.posProcessamentoMin && r.posProcessamentoMin > 0) {
    linhas.push({
      id: "pos-processamento",
      label: `Pós-processamento (${r.posProcessamentoMin}min)`,
      valor: (r.posProcessamentoMin / 60) * CONSTANTES.taxaHora,
      grupo: "producao",
    });
  }

  linhas.push(...linhasEmbalagens(r.embalagens ?? []));

  return linhas;
}

export function calcularLinhasPapelaria(r: Partial<RespostasPapelaria>): LinhaResumo[] {
  const linhas: LinhaResumo[] = [];

  linhas.push(...linhasItens(INSUMOS_PAPELARIA, r.insumos ?? [], "material", "insumo"));

  if (r.numImpressoes && r.numImpressoes > 0) {
    linhas.push({
      id: "impressoes",
      label: `Impressões (${r.numImpressoes}×)`,
      valor: r.numImpressoes * CONSTANTES.custoPorImpressao,
      grupo: "producao",
    });
  }

  if (r.corteCricut && r.numCortes && r.numCortes > 0) {
    linhas.push({
      id: "cortes",
      label: `Cortes na Cricut (${r.numCortes}×)`,
      valor: r.numCortes * CONSTANTES.custoPorCorteCricut,
      grupo: "producao",
    });
  }

  linhas.push(...linhasEmbalagens(r.embalagens ?? []));

  return linhas;
}

export function calcularTotal(linhas: LinhaResumo[]): number {
  return linhas.reduce((sum, l) => sum + l.valor, 0);
}

export function calcularPrecoSugerido(custoTotal: number): number {
  return custoTotal * (1 + CONSTANTES.margemPadrao);
}

export interface JustificativaPreco {
  material: number;
  producao: number;
  embalagem: number;
  custoTotal: number;
  margemPct: number;
  precoSugerido: number;
}

export function calcularJustificativa(linhas: LinhaResumo[]): JustificativaPreco {
  const somaPorGrupo = (g: GrupoCusto) => linhas.filter((l) => l.grupo === g).reduce((s, l) => s + l.valor, 0);
  const custoTotal = calcularTotal(linhas);
  return {
    material: somaPorGrupo("material"),
    producao: somaPorGrupo("producao"),
    embalagem: somaPorGrupo("embalagem"),
    custoTotal,
    margemPct: CONSTANTES.margemPadrao * 100,
    precoSugerido: calcularPrecoSugerido(custoTotal),
  };
}
