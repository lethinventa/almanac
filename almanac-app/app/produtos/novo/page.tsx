"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { StepBifurcacao } from "@/components/produto-wizard/step-bifurcacao";
import { CampoFormulario } from "@/components/produto-wizard/campo-formulario";
import { CampoMultiInsumo } from "@/components/produto-wizard/campo-multi-insumo";
import { CampoSimNaoNumero } from "@/components/produto-wizard/campo-sim-nao-numero";
import { PrecoSugeridoCard } from "@/components/produto-wizard/preco-sugerido-card";
import { ResumoPanel } from "@/components/produto-wizard/resumo-panel";
import { calcularJustificativa, calcularLinhas3D, calcularLinhasPapelaria, calcularTotal } from "@/lib/produto-wizard/calc";
import { EMBALAGENS, FILAMENTOS, INSUMOS_PAPELARIA } from "@/lib/produto-wizard/mock-data";
import type { FluxoWizard, LinhaQtd } from "@/lib/produto-wizard/types";
import { formatBRL } from "@/lib/utils";

const AUTO_REDIRECT_APOS_SALVAR_MS = 1400;

function parseRows(rows: LinhaQtd[]) {
  return rows.map((r) => ({ insumoId: r.insumoId, quantidade: parseFloat(r.quantidade) || 0 }));
}

function rowsValidas(rows: LinhaQtd[]) {
  return rows.length > 0 && rows.every((r) => r.quantidade.trim() !== "" && parseFloat(r.quantidade) > 0);
}

interface FieldErrors {
  nome?: string;
  itens?: string;
  tempo?: string;
  posProcessamento?: string;
  corteCricut?: string;
  embalagens?: string;
  preco?: string;
}

export default function NovoProdutoPage() {
  const router = useRouter();

  const [flow, setFlow] = useState<FluxoWizard | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [salvo, setSalvo] = useState(false);

  const [nome, setNome] = useState("");
  const [filamentosRows, setFilamentosRows] = useState<LinhaQtd[]>([]);
  const [tempoImpressaoMin, setTempoImpressaoMin] = useState("");
  const [posProcessamento, setPosProcessamento] = useState<boolean | null>(null);
  const [posProcessamentoMin, setPosProcessamentoMin] = useState("");

  const [insumosRows, setInsumosRows] = useState<LinhaQtd[]>([]);
  const [numImpressoes, setNumImpressoes] = useState("");
  const [corteCricut, setCorteCricut] = useState<boolean | null>(null);
  const [numCortes, setNumCortes] = useState("");

  const [embalagensRows, setEmbalagensRows] = useState<LinhaQtd[]>([]);
  const [precoEditado, setPrecoEditado] = useState("");

  function resetFluxoEspecifico() {
    setFilamentosRows([]);
    setTempoImpressaoMin("");
    setPosProcessamento(null);
    setPosProcessamentoMin("");
    setInsumosRows([]);
    setNumImpressoes("");
    setCorteCricut(null);
    setNumCortes("");
    setEmbalagensRows([]);
    setPrecoEditado("");
    setErrors({});
  }

  function handleFlowSelect(f: FluxoWizard) {
    if (flow !== null && flow !== f) resetFluxoEspecifico();
    setFlow(f);
  }

  function handleTrocarCategoria() {
    resetFluxoEspecifico();
    setFlow(null);
  }

  const linhas = useMemo(() => {
    if (flow === "3d") {
      return calcularLinhas3D({
        filamentos: parseRows(filamentosRows),
        tempoImpressaoMin: tempoImpressaoMin.trim() ? parseFloat(tempoImpressaoMin) : null,
        posProcessamento,
        posProcessamentoMin: posProcessamentoMin.trim() ? parseFloat(posProcessamentoMin) : null,
        embalagens: parseRows(embalagensRows),
        nome,
      });
    }
    if (flow === "papelaria") {
      return calcularLinhasPapelaria({
        insumos: parseRows(insumosRows),
        numImpressoes: numImpressoes.trim() ? parseFloat(numImpressoes) : null,
        corteCricut,
        numCortes: numCortes.trim() ? parseFloat(numCortes) : null,
        embalagens: parseRows(embalagensRows),
        nome,
      });
    }
    return [];
  }, [flow, filamentosRows, tempoImpressaoMin, posProcessamento, posProcessamentoMin, insumosRows, numImpressoes, corteCricut, numCortes, embalagensRows, nome]);

  const total = calcularTotal(linhas);
  const justificativa = useMemo(() => calcularJustificativa(linhas), [linhas]);

  const precoSugeridoStr = precoEditado === "" && justificativa.precoSugerido > 0 ? justificativa.precoSugerido.toFixed(2) : precoEditado;

  function validar(): FieldErrors {
    const proximosErros: FieldErrors = {};
    if (!nome.trim()) proximosErros.nome = "Informe o nome do produto.";

    if (flow === "3d") {
      if (!rowsValidas(filamentosRows)) proximosErros.itens = "Adicione ao menos um filamento e informe as gramas usadas.";
      if (!tempoImpressaoMin.trim()) proximosErros.tempo = "Informe o tempo de impressão.";
      if (posProcessamento === null) proximosErros.posProcessamento = "Selecione uma opção.";
      else if (posProcessamento && !posProcessamentoMin.trim()) proximosErros.posProcessamento = "Informe os minutos gastos.";
    } else if (flow === "papelaria") {
      if (!rowsValidas(insumosRows)) proximosErros.itens = "Adicione ao menos um insumo e informe a quantidade.";
      if (!numImpressoes.trim()) proximosErros.tempo = "Informe o número de impressões.";
      if (corteCricut === null) proximosErros.corteCricut = "Selecione uma opção.";
      else if (corteCricut && !numCortes.trim()) proximosErros.corteCricut = "Informe o número de cortes.";
    }

    if (!rowsValidas(embalagensRows)) proximosErros.embalagens = "Adicione ao menos uma embalagem e informe a quantidade.";

    const precoNum = parseFloat(precoSugeridoStr);
    if (!precoSugeridoStr.trim() || isNaN(precoNum) || precoNum <= 0) proximosErros.preco = "Informe um preço válido.";

    return proximosErros;
  }

  function handleSalvar() {
    const proximosErros = validar();
    setErrors(proximosErros);
    if (Object.keys(proximosErros).length > 0) return;

    setSalvo(true);
    setTimeout(() => router.push("/produtos"), AUTO_REDIRECT_APOS_SALVAR_MS);
  }

  if (salvo) {
    const precoNum = parseFloat(precoSugeridoStr);
    return (
      <div className="alm-page">
        <div className="alm-produto-sucesso">
          <CheckCircle2 size={40} strokeWidth={1.3} style={{ color: "var(--status-success)" }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Produto salvo!</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {nome || "Seu produto"} foi cadastrado com preço de {formatBRL(isNaN(precoNum) ? justificativa.precoSugerido : precoNum)}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <Link
          href="/produtos"
          className="atlas-btn atlas-btn-ghost atlas-btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Voltar para produtos
        </Link>
      </div>

      {flow === null ? (
        <div className="alm-produto-bifurcacao">
          <StepBifurcacao selected={flow} onSelect={handleFlowSelect} />
        </div>
      ) : (
        <div className="alm-produto-form-grid">
          <div className="alm-produto-form-col">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 className="alm-page-title">Novo produto — {flow === "3d" ? "Impressão 3D" : "Papelaria"}</h1>
              <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" onClick={handleTrocarCategoria}>
                Trocar categoria
              </button>
            </div>

            <CampoFormulario label="Nome do produto" error={errors.nome}>
              <input
                className="atlas-input"
                style={{ height: 40, fontSize: 15 }}
                placeholder="Ex: Chaveiro acrílico personalizado"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </CampoFormulario>

            {flow === "3d" ? (
              <CampoMultiInsumo
                label="Filamento usado"
                hint="Você pode adicionar mais de um filamento (ex: cores diferentes) e informar as gramas de cada um."
                options={FILAMENTOS}
                rows={filamentosRows}
                onChange={setFilamentosRows}
                error={errors.itens}
              />
            ) : (
              <CampoMultiInsumo
                label="Insumos usados"
                hint="Selecione um ou mais insumos e informe a quantidade de cada."
                options={INSUMOS_PAPELARIA}
                rows={insumosRows}
                onChange={setInsumosRows}
                error={errors.itens}
              />
            )}

            {flow === "3d" ? (
              <CampoFormulario label="Tempo de impressão (minutos)" error={errors.tempo}>
                <input
                  className="atlas-input"
                  style={{ height: 40, fontSize: 15 }}
                  type="number"
                  min="0"
                  placeholder="Ex: 90"
                  value={tempoImpressaoMin}
                  onChange={(e) => setTempoImpressaoMin(e.target.value)}
                />
              </CampoFormulario>
            ) : (
              <CampoFormulario label="Quantas impressões você usou?" hint="Frente e verso conta como 2 impressões." error={errors.tempo}>
                <input
                  className="atlas-input"
                  style={{ height: 40, fontSize: 15 }}
                  type="number"
                  min="0"
                  placeholder="Ex: 4"
                  value={numImpressoes}
                  onChange={(e) => setNumImpressoes(e.target.value)}
                />
              </CampoFormulario>
            )}

            {flow === "3d" ? (
              <CampoSimNaoNumero
                label="Precisou de pós-processamento?"
                hint="Lixar, pintar ou montar peças."
                selected={posProcessamento}
                onSelect={setPosProcessamento}
                numeroLabel="Minutos gastos"
                numeroValue={posProcessamentoMin}
                onNumeroChange={setPosProcessamentoMin}
                error={errors.posProcessamento}
              />
            ) : (
              <CampoSimNaoNumero
                label="Usou corte na Cricut?"
                selected={corteCricut}
                onSelect={setCorteCricut}
                numeroLabel="Quantos cortes?"
                numeroValue={numCortes}
                onNumeroChange={setNumCortes}
                error={errors.corteCricut}
              />
            )}

            <CampoMultiInsumo
              label="Embalagem"
              hint="Você pode adicionar mais de uma embalagem."
              options={EMBALAGENS}
              rows={embalagensRows}
              onChange={setEmbalagensRows}
              error={errors.embalagens}
            />

            <PrecoSugeridoCard
              justificativa={justificativa}
              precoEditado={precoSugeridoStr}
              onPrecoChange={setPrecoEditado}
              error={errors.preco}
            />

            <button
              type="button"
              className="atlas-btn atlas-btn-primary atlas-btn-lg"
              style={{ alignSelf: "flex-start" }}
              onClick={handleSalvar}
            >
              Salvar produto
            </button>
          </div>

          <ResumoPanel linhas={linhas} total={total} />
        </div>
      )}
    </div>
  );
}
