/**
 * HEDS - Hospital Emergency Decision Simulator
 * Right Status Panel: Current Situation, Events, Decisions, At-Risk Patients, Routes
 */

import React from 'react';
import {
  ScenarioEvent,
  Patient,
  ResourceItem,
  SimulationLogEntry,
  CFDSimulationState
} from '../types';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  Users,
  Compass,
  BellRing,
  Radio,
  ChevronRight,
  Sparkles,
  HeartPulse,
  Database,
  Gauge,
  Wind
} from 'lucide-react';

interface RightStatusPanelProps {
  currentEvent: ScenarioEvent | null;
  onOpenDecisionModal: () => void;
  patients: Patient[];
  resources: ResourceItem[];
  logs: SimulationLogEntry[];
  isNorthStairBlocked: boolean;
  fireSpreadLevel: number;
  smokeSpreadLevel: number;
  cfdState?: CFDSimulationState;
  onSelectPatient: (patient: Patient) => void;
  onOpenFDSModal?: () => void;
}

export const RightStatusPanel: React.FC<RightStatusPanelProps> = ({
  currentEvent,
  onOpenDecisionModal,
  patients,
  resources,
  logs,
  isNorthStairBlocked,
  fireSpreadLevel,
  smokeSpreadLevel,
  cfdState,
  onSelectPatient,
  onOpenFDSModal
}) => {
  // Patients in acute risk (in fire room or heavy smoke zone)
  const atRiskPatients = patients.filter(
    (p) => p.status === 'exposto_risco' || p.status === 'critico' || (p.floorId === 4 && p.status === 'em_leito')
  );

  const displayPeakTemp = cfdState ? cfdState.peakTempC : 285;
  const displayVisibility = cfdState ? cfdState.averageCorridorVisibilityM : 8.5;
  const displayHRR = cfdState ? cfdState.currentHRRKw : Math.round(fireSpreadLevel * 2800);
  const displaySmokePct = cfdState ? Math.round(cfdState.smokeSpreadNormalized * 100) : Math.round(smokeSpreadLevel * 100);
  const displayLayerHeight = cfdState ? cfdState.smokeLayerHeightM : 1.6;
  const displayCO = cfdState ? cfdState.coMaxPpm : 45;
  const displayFED = cfdState ? cfdState.fedMaxToxicity : 0.05;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 p-3.5 flex flex-col gap-3 shrink-0 h-full overflow-y-auto text-slate-200 text-xs">
      {/* 1. DECISÃO TÁTICA PENDENTE / ATIVA */}
      {currentEvent ? (
        <div className="bg-gradient-to-br from-rose-950/80 to-slate-900 p-3.5 rounded-xl border border-rose-600/60 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Decisão Pendente
            </span>
            <span className="text-[10px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded font-bold">
              Etapa {currentEvent.stepOrder}
            </span>
          </div>

          <h3 className="font-bold text-white text-xs leading-snug">{currentEvent.title}</h3>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {currentEvent.description}
          </p>

          <button
            onClick={onOpenDecisionModal}
            className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition shadow-md shadow-rose-950 flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> Tomar Decisão de Comando ({currentEvent.decisions.length} opções)
          </button>
        </div>
      ) : (
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Nenhuma decisão imediata pendente. O sinistro está sendo monitorado.</span>
        </div>
      )}

      {/* 2. SITUAÇÃO ATUAL & DINÂMICA DE INCÊNDIO/FUMAÇA (FDS REAL-TIME DATA) */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Dinâmica FDS em Tempo Real
          </span>
          {onOpenFDSModal && (
            <button
              onClick={onOpenFDSModal}
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition flex items-center gap-1"
              title="Abrir Camada de Integração e Arquivos FDS"
            >
              <Database className="w-2.5 h-2.5" /> FDS v6.8
            </button>
          )}
        </div>

        {/* Heat & Smoke Physical Bars driven by FDS */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-slate-400">Temperatura Foco (Quarto 408):</span>
              <span className="font-bold text-rose-400 font-mono">{displayPeakTemp}°C</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-700 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((displayPeakTemp / 800) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
              <span>HRR: {displayHRR} kW</span>
              <span>Flashover: ~2800 kW</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-slate-400">Visibilidade Jin Corredor:</span>
              <span className={`font-bold font-mono ${displayVisibility <= 3.0 ? 'text-rose-400 animate-pulse' : displayVisibility <= 8.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {displayVisibility}m ({displaySmokePct}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${displayVisibility <= 3.0 ? 'bg-rose-500' : displayVisibility <= 8.0 ? 'bg-amber-400' : 'bg-slate-400'}`}
                style={{ width: `${displaySmokePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
              <span>Camada: {displayLayerHeight}m do piso</span>
              <span>CO: {displayCO} ppm | FED: {displayFED}</span>
            </div>
          </div>
        </div>

        {onOpenFDSModal && (
          <button
            onClick={onOpenFDSModal}
            className="w-full mt-1.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border border-slate-800 rounded font-medium flex items-center justify-center gap-1 transition"
          >
            <Gauge className="w-3 h-3 text-cyan-400" /> Inspecionar Saídas e Arquivos FDS
          </button>
        )}
      </div>

      {/* 3. ROTAS DE FUGA & ALERTAS */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" /> Rotas de Evacuação Disponíveis
        </span>

        <div className="space-y-1.5">
          {/* North Stair */}
          <div className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
            isNorthStairBlocked
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <span className="font-semibold">Escada Norte (Ala Oeste)</span>
            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
              isNorthStairBlocked ? 'bg-rose-900 text-rose-200' : 'bg-emerald-950 text-emerald-300'
            }`}>
              {isNorthStairBlocked ? 'BLOQUEADA' : 'LIVRE'}
            </span>
          </div>

          {/* South Stair */}
          <div className="p-2 rounded-lg border bg-slate-900 border-slate-800 flex items-center justify-between text-[11px] text-slate-200">
            <span className="font-semibold">Escada Sul (Pressurizada)</span>
            <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[9px]">
              LIVRE (ROTA PRINCIPAL)
            </span>
          </div>

          {/* Refuge Area East */}
          <div className="p-2 rounded-lg border bg-slate-900 border-slate-800 flex items-center justify-between text-[11px] text-slate-200">
            <span className="font-semibold">Área de Refúgio Leste (4º Pav)</span>
            <span className="bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-bold text-[9px]">
              COMPARTIMENTADA
            </span>
          </div>
        </div>
      </div>

      {/* 4. PACIENTES EM RISCO IMEDIATO */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Pacientes no 4º Pavimento ({atRiskPatients.length})
          </span>
          <span className="text-[10px] text-cyan-400">Clique para inspecionar</span>
        </div>

        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {atRiskPatients.map((pat) => (
            <button
              key={pat.id}
              onClick={() => onSelectPatient(pat)}
              className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition group"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-1 rounded text-[9px] font-bold ${
                    pat.category === 'P4' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    pat.category === 'P3' ? 'bg-fuchsia-950 text-fuchsia-300' :
                    pat.category === 'P2' ? 'bg-orange-950 text-orange-300' : 'bg-cyan-950 text-cyan-300'
                  }`}>
                    {pat.category}
                  </span>
                  <span className="font-bold text-white group-hover:text-cyan-300">{pat.fictionalName}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Quarto {pat.roomNumber} • {pat.clinicalCondition.substring(0, 32)}...
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            </button>
          ))}
        </div>
      </div>

      {/* 5. ÚLTIMAS TRANSMISSÕES DE RÁDIO */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-cyan-400" /> Feed de Rádio e Alarmes
        </span>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {logs.slice(-5).reverse().map((log) => (
            <div key={log.id} className="p-1.5 bg-slate-900/90 rounded border border-slate-850 text-[11px]">
              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>{log.simulatedTimeStr}</span>
                <span className="text-cyan-400 font-bold">{log.category}</span>
              </div>
              <div className="font-semibold text-slate-200 mt-0.5">{log.title}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
