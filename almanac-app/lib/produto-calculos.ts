import type { Configuracoes } from "@/lib/repositories/configuracoes";
import type { Etapas3D } from "@/lib/repositories/produtos-registro";

// Taxa horária = custos indiretos mensais ÷ horas trabalhadas por mês + valor da sua hora de trabalho
export function taxaHoraria(config: Configuracoes, totalCustos: number): number {
  const indiretosPorHora = config.horasTrabalhoMes > 0 ? totalCustos / config.horasTrabalhoMes : 0;
  return indiretosPorHora + (config.valorHoraTrabalho ?? 0);
}

export function calcPrecoSugerido(
  materialCost: number,
  tempoMin: number,
  config: Configuracoes,
  totalCustos: number
): number {
  const timeCost = (tempoMin / 60) * taxaHoraria(config, totalCustos);
  return (materialCost + timeCost) * config.multiplicadorPreco;
}

export interface Preco3D {
  custoImpressao: number;
  custoModelagem: number;
  custoAcabamento: number;
  custoTotal: number;
  precoSugerido: number;
}

export function calcPreco3D(
  materialCost: number,
  etapas: Etapas3D,
  config: Configuracoes,
  totalCustos: number
): Preco3D {
  const hourlyRate = taxaHoraria(config, totalCustos);
  const custoImpressao = ((etapas.impressao ?? 0) / 60) * config.custoHoraBambu;
  const custoModelagem = ((etapas.modelagem ?? 0) / 60) * hourlyRate;
  const custoAcabamento = ((etapas.acabamento ?? 0) / 60) * hourlyRate;
  const custoTotal = materialCost + custoImpressao + custoModelagem + custoAcabamento;
  return {
    custoImpressao,
    custoModelagem,
    custoAcabamento,
    custoTotal,
    precoSugerido: custoTotal * config.multiplicadorPreco,
  };
}
