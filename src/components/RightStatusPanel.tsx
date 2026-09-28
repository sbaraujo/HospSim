/**
 * HEDS - Hospital Emergency Decision Simulator
 * Right Status Panel: Current Situation, Events, Decisions, At-Risk Patients, Routes
 */

import React from 'react';
import {
  ScenarioEvent,
  Patient,
  ResourceItem,
  SimulationLogEntry
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
  HeartPulse
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
  onSelectPatient: (patient: Patient) => void;
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
  onSelectPatient
}) => {
  // Patients in acute risk (in fire room or heavy smoke zone)
  const atRiskPatients = patients.filter(
    (p) => p.status === 'exposto_risco' || p.status === 'critico' || (p.floorId === 4 && p.status === 'em_leito')
  );

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

      {/* 2. SITUAÇÃO ATUAL & DINÂMICA DE INCÊNDIO/FUMAÇA */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Dinâmica do Incêndio
          </span>
          <span className="text-[10px] font-mono text-cyan-400">4º Pavimento</span>
        </div>

        {/* Heat & Smoke Bars */}
        <div className="space-y-1.5 pt-1">
          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-slate-400">Temperatura Foco (Quarto 408):</span>
              <span className="font-bold text-rose-400 font-mono">285°C</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-rose-600 h-full" style={{ width: '75%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-slate-400">Densidade da Fumaça no Corredor:</span>
              <span className="font-bold text-amber-400 font-mono">
                {Math.round(smokeSpreadLevel * 100)}% (Camada a 1.6m)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-400 h-full transition-all"
                style={{ width: `${Math.round(smokeSpreadLevel * 100)}%` }}
              />
            </div>
          </div>
        </div>
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
