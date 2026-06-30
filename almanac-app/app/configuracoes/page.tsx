"use client";

import { useState, useEffect } from "react";
import { Settings, Calculator, Clock, Save, Printer } from "lucide-react";
import { buscarConfiguracoes, salvarConfiguracoes, type Configuracoes } from "@/lib/repositories/configuracoes";
import { buscarTotalCustosIndiretos } from "@/lib/repositories/financeiro";
import { formatBRL } from "@/lib/utils";

const DEFAULT_CONFIGURACOES: Configuracoes = {
  horasTrabalhoMes: 160,
  multiplicadorPreco: 3,
  custoHoraBambu: 4.5,
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Configuracoes>(DEFAULT_CONFIGURACOES);
  const [totalCustos, setTotalCustos] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    buscarConfiguracoes().then(setConfig);
    buscarTotalCustosIndiretos().then(setTotalCustos);
  }, []);

  const hourlyRate =
    config.horasTrabalhoMes > 0
      ? totalCustos / config.horasTrabalhoMes
      : 0;

  const exampleMaterial = 5.0;
  const exampleTempo = 30;
  const exampleTimeCost = (exampleTempo / 60) * hourlyRate;
  const examplePrice = (exampleMaterial + exampleTimeCost) * config.multiplicadorPreco;

  async function handleSave() {
    await salvarConfiguracoes(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="alm-page">
      <div className="alm-page-header">
        <div>
          <h1 className="alm-page-title">Configurações</h1>
          <p className="alm-page-subtitle">Ajuste os parâmetros do negócio</p>
        </div>
        <button
          className={`atlas-btn atlas-btn-sm ${saved ? "atlas-btn-secondary" : "atlas-btn-primary"}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={handleSave}
        >
          <Save size={13} strokeWidth={1.5} />
          {saved ? "Salvo!" : "Salvar configurações"}
        </button>
      </div>

      {/* Precificação */}
      <div className="atlas-card">
        <div className="atlas-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calculator size={14} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            <span className="atlas-panel-title">Precificação</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
            Esses valores são usados para calcular o preço de venda sugerido de cada produto.
          </p>
        </div>
        <div className="atlas-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="alm-field">
              <label className="alm-label">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} strokeWidth={1.5} />
                  Horas trabalhadas por mês
                </span>
              </label>
              <input
                className="atlas-input"
                type="number"
                min="1"
                max="744"
                step="1"
                value={config.horasTrabalhoMes}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    horasTrabalhoMes: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
              />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                Ex: 160h/mês = 8h/dia × 20 dias
              </span>
            </div>

            <div className="alm-field">
              <label className="alm-label">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Settings size={11} strokeWidth={1.5} />
                  Multiplicador de preço
                </span>
              </label>
              <input
                className="atlas-input"
                type="number"
                min="1"
                max="20"
                step="0.1"
                value={config.multiplicadorPreco}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    multiplicadorPreco: Math.max(1, parseFloat(e.target.value) || 1),
                  }))
                }
              />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                Aplica sobre (material + tempo de produção)
              </span>
            </div>
          </div>

          <div className="alm-field">
            <label className="alm-label">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Printer size={11} strokeWidth={1.5} />
                Custo/hora Bambu A1 Mini (R$)
              </span>
            </label>
            <input
              className="atlas-input"
              type="number"
              min="0"
              step="0.01"
              value={config.custoHoraBambu}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  custoHoraBambu: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
            />
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              Energia + depreciação por hora de impressão — usado em produtos "Impressão 3D"
            </span>
          </div>

          {/* Taxa horária derivada */}
          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md, 4px)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-tertiary)",
              }}
            >
              Valores derivados
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Custos indiretos mensais
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                {formatBRL(totalCustos)}/mês
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Taxa horária estimada
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                }}
              >
                {formatBRL(hourlyRate)}/h
              </span>
            </div>
          </div>

          {/* Exemplo de cálculo */}
          <div
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md, 4px)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-tertiary)",
                marginBottom: 2,
              }}
            >
              Exemplo — produto com 30min e R$5,00 em insumos
            </div>
            {[
              { label: "Material", value: exampleMaterial },
              {
                label: `Tempo (30min × ${formatBRL(hourlyRate)}/h)`,
                value: exampleTimeCost,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
                  {formatBRL(value)}
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid var(--border-default)",
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                × {config.multiplicadorPreco}× = preço sugerido
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--text-primary)",
                }}
              >
                {formatBRL(examplePrice)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
