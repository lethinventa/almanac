export type FluxoWizard = "3d" | "papelaria";

export interface ItemInsumoQtd {
  insumoId: string;
  quantidade: number;
}

/** Linha de formulário (multi-select + quantidade), antes de parsear pra número. */
export interface LinhaQtd {
  insumoId: string;
  quantidade: string;
}

export interface RespostasComuns {
  nome: string;
  embalagens: ItemInsumoQtd[];
}

export interface Respostas3D extends RespostasComuns {
  filamentos: ItemInsumoQtd[];
  tempoImpressaoMin: number | null;
  posProcessamento: boolean | null;
  posProcessamentoMin: number | null;
}

export interface RespostasPapelaria extends RespostasComuns {
  insumos: ItemInsumoQtd[];
  numImpressoes: number | null;
  corteCricut: boolean | null;
  numCortes: number | null;
}

export type GrupoCusto = "material" | "producao" | "embalagem";

export interface LinhaResumo {
  id: string;
  label: string;
  valor: number;
  grupo: GrupoCusto;
}
