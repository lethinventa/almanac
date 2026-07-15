"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { WizardProgress } from "./wizard-progress";
import { ResumoPanel } from "./resumo-panel";
import { StepBifurcacao } from "./step-bifurcacao";
import { StepTexto } from "./step-texto";
import { StepMultiInsumo } from "./step-multi-insumo";
import { StepNumero } from "./step-numero";
import { StepSimNao } from "./step-sim-nao";
import { StepFinal } from "./step-final";
import { calcularJustificativa, calcularLinhas3D, calcularLinhasPapelaria, calcularTotal } from "@/lib/produto-wizard/calc";
import { EMBALAGENS, FILAMENTOS, INSUMOS_PAPELARIA } from "@/lib/produto-wizard/mock-data";
import type { FluxoWizard, LinhaQtd } from "@/lib/produto-wizard/types";

const TOTAL_STEPS = 7;
const CLOSE_ANIM_MS = 340;
const AUTO_CLOSE_APOS_SALVAR_MS = 1400;

function parseRows(rows: LinhaQtd[]) {
  return rows.map((r) => ({ insumoId: r.insumoId, quantidade: parseFloat(r.quantidade) || 0 }));
}

function StepTransition({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setActive(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, []);
  return <div className={`alm-wizard-step${active ? " is-active" : ""}`}>{children}</div>;
}

export function ProdutoWizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const [flow, setFlow] = useState<FluxoWizard | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showExitBanner, setShowExitBanner] = useState(false);
  const exitBannerRef = useRef<HTMLDivElement>(null);
  const suppressCloseAttemptRef = useRef(false);

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
  const [salvo, setSalvo] = useState(false);

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
  }

  function resetState() {
    setFlow(null);
    setStepIndex(0);
    setError(null);
    setShowExitBanner(false);
    setNome("");
    setSalvo(false);
    resetFluxoEspecifico();
  }

  useEffect(() => {
    if (open) {
      setMounted(true);
      resetState();
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), CLOSE_ANIM_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleCloseAttempt();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flow, nome]);

  useEffect(() => {
    if (!showExitBanner) return;
    function onPointerDown(e: MouseEvent) {
      if (exitBannerRef.current && !exitBannerRef.current.contains(e.target as Node)) {
        suppressCloseAttemptRef.current = true;
        setShowExitBanner(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showExitBanner]);

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

  useEffect(() => {
    if (stepIndex === 6 && precoEditado === "" && justificativa.precoSugerido > 0) {
      setPrecoEditado(justificativa.precoSugerido.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, justificativa.precoSugerido]);

  function goNext() {
    setError(null);
    setStepIndex((i) => Math.min(TOTAL_STEPS - 1, i + 1));
  }

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleFlowSelect(f: FluxoWizard) {
    if (flow !== null && flow !== f) resetFluxoEspecifico();
    setFlow(f);
    goNext();
  }

  function handlePosProcessamentoSelect(v: boolean) {
    setPosProcessamento(v);
    setError(null);
    if (!v) {
      setPosProcessamentoMin("");
      goNext();
    }
  }

  function handleCorteCricutSelect(v: boolean) {
    setCorteCricut(v);
    setError(null);
    if (!v) {
      setNumCortes("");
      goNext();
    }
  }

  function rowsValidas(rows: LinhaQtd[]) {
    return rows.length > 0 && rows.every((r) => r.quantidade.trim() !== "");
  }

  function tryContinue() {
    switch (stepIndex) {
      case 1:
        if (!nome.trim()) return setError("Informe o nome do produto.");
        break;
      case 2:
        if (flow === "3d") {
          if (!rowsValidas(filamentosRows)) return setError("Adicione ao menos um filamento e informe as gramas usadas.");
        } else {
          if (!rowsValidas(insumosRows)) return setError("Adicione ao menos um insumo e informe a quantidade.");
        }
        break;
      case 3:
        if (flow === "3d") {
          if (!tempoImpressaoMin.trim()) return setError("Informe o tempo de impressão.");
        } else {
          if (!numImpressoes.trim()) return setError("Informe o número de impressões.");
        }
        break;
      case 4:
        if (flow === "3d") {
          if (posProcessamento === null) return setError("Selecione uma opção.");
          if (posProcessamento && !posProcessamentoMin.trim()) return setError("Informe os minutos gastos.");
        } else {
          if (corteCricut === null) return setError("Selecione uma opção.");
          if (corteCricut && !numCortes.trim()) return setError("Informe o número de cortes.");
        }
        break;
      case 5:
        if (!rowsValidas(embalagensRows)) return setError("Adicione ao menos uma embalagem e informe a quantidade.");
        break;
    }
    goNext();
  }

  function handleSalvar() {
    const valor = parseFloat(precoEditado);
    if (!precoEditado.trim() || isNaN(valor) || valor <= 0) {
      setError("Informe um preço válido.");
      return;
    }
    setError(null);
    setSalvo(true);
    setTimeout(() => onClose(), AUTO_CLOSE_APOS_SALVAR_MS);
  }

  function handleCloseAttempt() {
    if (suppressCloseAttemptRef.current) {
      suppressCloseAttemptRef.current = false;
      return;
    }
    if (salvo || stepIndex <= 1) {
      onClose();
      return;
    }
    setShowExitBanner(true);
  }

  if (!mounted) return null;

  return (
    <>
      <div className={`alm-backdrop${visible ? " is-open" : ""}`} onClick={handleCloseAttempt} />
      <div className={`alm-wizard-modal${visible ? " is-open" : ""}`} style={{ position: "fixed" }}>
        <div className="alm-wizard-header">
          {stepIndex > 0 && !salvo && (
            <button type="button" className="atlas-btn atlas-btn-ghost atlas-btn-sm" style={{ padding: "0 4px" }} onClick={goBack}>
              <ArrowLeft size={14} strokeWidth={1.5} />
            </button>
          )}
          <WizardProgress step={stepIndex + 1} total={TOTAL_STEPS} />
          <span className="alm-wizard-progress-label">
            {stepIndex + 1} de {TOTAL_STEPS}
          </span>
          <button
            type="button"
            className="atlas-btn atlas-btn-ghost atlas-btn-sm"
            style={{ marginLeft: "auto", padding: "0 4px" }}
            onClick={handleCloseAttempt}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {showExitBanner && (
          <div ref={exitBannerRef} className="alm-wizard-exit-banner">
            <span>Sair sem salvar?</span>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button className="atlas-btn atlas-btn-ghost atlas-btn-sm" onClick={() => setShowExitBanner(false)}>
                Cancelar
              </button>
              <button className="atlas-btn atlas-btn-destructive atlas-btn-sm" onClick={onClose}>
                Sair
              </button>
            </div>
          </div>
        )}

        <div className="alm-wizard-body">
          <div className="alm-wizard-question-pane">
            <div className="alm-wizard-question-inner">
              <StepTransition key={stepIndex}>
                {stepIndex === 0 && <StepBifurcacao selected={flow} onSelect={handleFlowSelect} />}

                {stepIndex === 1 && (
                  <StepTexto value={nome} onChange={setNome} onContinue={tryContinue} error={error} />
                )}

                {stepIndex === 2 && flow === "3d" && (
                  <StepMultiInsumo
                    title="Qual filamento foi usado?"
                    hint="Você pode adicionar mais de um filamento (ex: cores diferentes) e informar as gramas de cada um."
                    options={FILAMENTOS}
                    rows={filamentosRows}
                    onChange={setFilamentosRows}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}
                {stepIndex === 2 && flow === "papelaria" && (
                  <StepMultiInsumo
                    title="Quais insumos foram usados?"
                    hint="Selecione um ou mais insumos e informe a quantidade de cada."
                    options={INSUMOS_PAPELARIA}
                    rows={insumosRows}
                    onChange={setInsumosRows}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}

                {stepIndex === 3 && flow === "3d" && (
                  <StepNumero
                    title="Quantos minutos de impressão?"
                    placeholder="Ex: 90"
                    value={tempoImpressaoMin}
                    onChange={setTempoImpressaoMin}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}
                {stepIndex === 3 && flow === "papelaria" && (
                  <StepNumero
                    title="Quantas impressões você usou?"
                    hint="Frente e verso conta como 2 impressões."
                    placeholder="Ex: 4"
                    value={numImpressoes}
                    onChange={setNumImpressoes}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}

                {stepIndex === 4 && flow === "3d" && (
                  <StepSimNao
                    title="Precisou de pós-processamento?"
                    hint="Lixar, pintar ou montar peças."
                    selected={posProcessamento}
                    onSelect={handlePosProcessamentoSelect}
                    numeroLabel="Minutos gastos"
                    numeroValue={posProcessamentoMin}
                    onNumeroChange={setPosProcessamentoMin}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}
                {stepIndex === 4 && flow === "papelaria" && (
                  <StepSimNao
                    title="Usou corte na Cricut?"
                    selected={corteCricut}
                    onSelect={handleCorteCricutSelect}
                    numeroLabel="Quantos cortes?"
                    numeroValue={numCortes}
                    onNumeroChange={setNumCortes}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}

                {stepIndex === 5 && (
                  <StepMultiInsumo
                    title="Qual embalagem foi usada?"
                    hint="Você pode adicionar mais de uma embalagem."
                    options={EMBALAGENS}
                    rows={embalagensRows}
                    onChange={setEmbalagensRows}
                    onContinue={tryContinue}
                    error={error}
                  />
                )}

                {stepIndex === 6 && (
                  <StepFinal
                    nome={nome}
                    justificativa={justificativa}
                    precoEditado={precoEditado}
                    onPrecoChange={setPrecoEditado}
                    onSalvar={handleSalvar}
                    salvo={salvo}
                    error={error}
                  />
                )}
              </StepTransition>
            </div>
          </div>

          <ResumoPanel linhas={linhas} total={total} />
        </div>
      </div>
    </>
  );
}
