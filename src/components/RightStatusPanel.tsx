/**
 * HEDS - Hospital Emergency Decision Simulator
 * Right Status Panel: Current Situation, Events, Decisions, At-Risk Patients, Routes
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ScenarioEvent,
  Patient,
  ResourceItem,
  SimulationLogEntry,
  CFDSimulationState,
  Floor
} from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
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
  Wind,
  TrendingUp,
  Thermometer,
  Layers
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
  selectedFloorId?: number | null;
  floors?: Floor[];
  onSelectFloor?: (floorId: number) => void;
}

const DEFAULT_FLOOR_OPTIONS = [
  { id: 4, shortLabel: '4º Pav', name: '4º Pavimento (Internação/Foco)', purpose: 'Foco Inicial do Incêndio' },
  { id: 3, shortLabel: '3º Pav', name: '3º Pavimento (UTI Geral)', purpose: 'UTI Adulto & Coronariana' },
  { id: 2, shortLabel: '2º Pav', name: '2º Pavimento (C. Cirúrgico)', purpose: 'Centro Cirúrgico (6 Salas)' },
  { id: 1, shortLabel: '1º Pav', name: '1º Pavimento (Diagnóstico)', purpose: 'Imagem, Tomografia e Farmácia' },
  { id: 0, shortLabel: 'Térreo', name: 'Pavimento Térreo (Pronto-Socorro)', purpose: 'Pronto-Socorro & Triagem' },
  { id: -1, shortLabel: 'Subsolo', name: 'Subsolo Técnico', purpose: 'Central de Gases e Bombas' }
];

/**
 * Computes average temperature curve (°C) across time (0 to 600s) for a given floor
 * calibrated with physical FDS outputs and live cfdState values.
 */
function getFloorThermalEvolution(
  floorId: number,
  cfdState?: CFDSimulationState,
  isNorthStairBlocked?: boolean
) {
  const currentElapsed = cfdState?.elapsedSec ?? 0;
  const isSprinklerActive = (cfdState?.sprinklersTrippedCount ?? 0) > 0;
  const livePeakTemp = cfdState?.peakTempC ?? 285;
  const maxTime = 600;
  const step = 15;
  const points: { time: number; avgTemp: number; peakTemp?: number }[] = [];

  for (let t = 0; t <= maxTime; t += step) {
    let avg = 22.0;
    let peak = 22.0;

    if (floorId === 4) {
      // 4º Pavimento (Andar do Incêndio / Foco Quarto 408)
      if (isSprinklerActive) {
        // Sprinklers trip, suppressing peak HRR and bringing thermal load down
        const tPeak = Math.min(t, 90);
        const growth = Math.pow(tPeak / 90, 1.8);
        const maxFloorAvg = 38.5;
        if (t <= 90) {
          avg = 22.0 + (maxFloorAvg - 22.0) * growth;
          peak = 22.0 + (320 - 22.0) * growth;
        } else {
          const decay = Math.exp(-(t - 90) / 130);
          avg = 25.0 + (maxFloorAvg - 25.0) * decay;
          peak = 45.0 + (320 - 45.0) * decay;
        }
      } else {
        // Standard uncontrolled flashover profile (2400 m² floor)
        const growth = Math.min(1.0, Math.pow(t / 420, 1.6));
        avg = 22.0 + (78.5 - 22.0) * growth;
        peak = 22.0 + (790.0 - 22.0) * Math.min(1.0, Math.pow(t / 300, 1.4));
      }

      // Synchronize curve with live cfdState near current simulation time
      if (currentElapsed > 0 && Math.abs(t - currentElapsed) <= step) {
        if (cfdState?.probes && cfdState.probes.length > 0) {
          const probeTemps = cfdState.probes.map(p => p.tempC);
          const liveAvg = probeTemps.reduce((a, b) => a + b, 0) / probeTemps.length;
          avg = (avg + liveAvg) / 2;
        }
        peak = livePeakTemp;
      }
    } else if (floorId === 3) {
      // 3º Pavimento (UTI Geral - laje de concreto TRRF 120min, condução vertical lenta)
      const stairFactor = isNorthStairBlocked ? 1.5 : 1.0;
      const conduction = Math.min(1.0, Math.pow(t / 600, 1.3));
      avg = 21.0 + (28.5 - 21.0) * conduction * stairFactor;
      peak = avg + 3.5 * conduction;
    } else if (floorId === 2) {
      // 2º Pavimento (Centro Cirúrgico - Pressurização Positiva)
      const conduction = Math.min(1.0, t / 600);
      avg = 19.5 + 2.0 * conduction;
      peak = avg + 1.2;
    } else if (floorId === 1) {
      // 1º Pavimento (Diagnóstico por Imagem e Farmácia)
      const conduction = Math.min(1.0, t / 600);
      avg = 22.0 + 1.5 * conduction;
      peak = avg + 1.0;
    } else if (floorId === 0) {
      // Pavimento Térreo (Pronto-Socorro / Portas Abertas)
      const conduction = Math.min(1.0, t / 600);
      avg = 23.0 + 1.2 * conduction;
      peak = avg + 0.8;
    } else {
      // Subsolo Técnico (-1)
      const conduction = Math.min(1.0, t / 600);
      avg = 25.0 + 0.8 * conduction;
      peak = avg + 0.6;
    }

    points.push({
      time: t,
      avgTemp: Math.round(avg * 10) / 10,
      peakTemp: floorId === 4 ? Math.round(peak * 10) / 10 : undefined
    });
  }

  return points;
}

const CustomThermalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const minutes = Math.floor(label / 60);
    const seconds = label % 60;
    const timeStr = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    const avg = data.avgTemp;
    const peak = data.peakTemp;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-[11px] backdrop-blur-sm z-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 mb-1.5 font-mono text-[10px] text-slate-400">
          <span>Tempo Sim: {timeStr}</span>
          <span className="text-cyan-400 font-bold">{label}s</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Temp. Média:
            </span>
            <span className="font-bold font-mono text-amber-300">{avg}°C</span>
          </div>
          {peak !== undefined && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Pico Foco (408):
              </span>
              <span className="font-mono text-rose-400">{peak}°C</span>
            </div>
          )}
          <div className="pt-1 mt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Tenabilidade:</span>
            <span className={avg >= 60 ? 'text-rose-400 font-bold' : avg >= 38 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {avg >= 60 ? 'Inabitável (>60°C)' : avg >= 38 ? 'Alerta Térmico' : 'Tenível (<38°C)'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
  onOpenFDSModal,
  selectedFloorId = 4,
  floors,
  onSelectFloor
}) => {
  // Synchronized floor selection state
  const [internalFloorId, setInternalFloorId] = useState<number>(selectedFloorId ?? 4);

  useEffect(() => {
    if (selectedFloorId !== undefined && selectedFloorId !== null) {
      setInternalFloorId(selectedFloorId);
    }
  }, [selectedFloorId]);

  const activeFloorId = internalFloorId;

  const handleSelectFloor = (floorId: number) => {
    setInternalFloorId(floorId);
    if (onSelectFloor) {
      onSelectFloor(floorId);
    }
  };

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

  const simulationTimeSec = cfdState?.elapsedSec ?? 0;

  // Thermal evolution dataset for the active selected floor
  const chartData = useMemo(() => {
    return getFloorThermalEvolution(activeFloorId, cfdState, isNorthStairBlocked);
  }, [activeFloorId, cfdState, isNorthStairBlocked]);

  // Current average temperature on selected floor interpolated at current simulation time
  const currentFloorAvgTemp = useMemo(() => {
    if (!chartData || chartData.length === 0) return 22.0;
    const clampedT = Math.max(0, Math.min(600, simulationTimeSec));
    const lowerPoint = chartData.reduce((prev, curr) => (curr.time <= clampedT ? curr : prev), chartData[0]);
    const upperPoint = chartData.find(p => p.time >= clampedT) || chartData[chartData.length - 1];

    if (lowerPoint.time === upperPoint.time) return lowerPoint.avgTemp;
    const ratio = (clampedT - lowerPoint.time) / (upperPoint.time - lowerPoint.time);
    return Math.round((lowerPoint.avgTemp + ratio * (upperPoint.avgTemp - lowerPoint.avgTemp)) * 10) / 10;
  }, [chartData, simulationTimeSec]);

  // Critical temperature for the active selected floor (origin/peak temperature for Floor 4, or peak sector for others)
  const selectedFloorCriticalTemp = useMemo(() => {
    if (activeFloorId === 4) {
      return cfdState ? cfdState.peakTempC : 285;
    }
    const clampedT = Math.max(0, Math.min(600, simulationTimeSec));
    const pt = chartData.reduce((prev, curr) => (curr.time <= clampedT ? curr : prev), chartData[0]);
    return pt.peakTemp ?? pt.avgTemp;
  }, [activeFloorId, cfdState, chartData, simulationTimeSec]);

  // Flashover Risk Assessment (Verde -> Amarelo -> Vermelho baseado na temperatura crítica)
  const flashoverRisk = useMemo(() => {
    const temp = selectedFloorCriticalTemp;
    if (temp < 300) {
      return {
        level: 'baixo',
        label: 'Baixo (Seguro)',
        colorName: 'verde',
        textClass: 'text-emerald-400',
        bgClass: 'bg-gradient-to-br from-emerald-950/40 to-slate-950/80',
        borderClass: 'border-emerald-600/40',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        barColor: 'from-emerald-500 to-emerald-400',
        iconColor: 'text-emerald-400',
        description: activeFloorId === 4
          ? 'Gases aquecidos sob controle inicial. Temperatura bem abaixo do limiar de ignição súbita (flashover < 300°C).'
          : 'Pavimento sem foco ativo. Lajes e compartimentação corta-fogo (TRRF 120 min) garantem isolamento térmico estanque.'
      };
    } else if (temp < 500) {
      return {
        level: 'moderado',
        label: 'Moderado (Alerta)',
        colorName: 'amarelo',
        textClass: 'text-amber-400',
        bgClass: 'bg-gradient-to-br from-amber-950/50 to-slate-950/90',
        borderClass: 'border-amber-600/50 shadow-md shadow-amber-950/30',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse',
        barColor: 'from-amber-500 to-amber-400',
        iconColor: 'text-amber-400 animate-bounce',
        description: 'Camada de fumaça sob o teto irradiando calor significativo (300°C a 500°C). Risco iminente de rollover e pirolisação dos revestimentos.'
      };
    } else {
      return {
        level: 'critico',
        label: 'Crítico (Flashover Iminente)',
        colorName: 'vermelho',
        textClass: 'text-rose-400',
        bgClass: 'bg-gradient-to-br from-rose-950/70 to-slate-950/90 shadow-lg shadow-rose-950/60',
        borderClass: 'border-rose-500/80',
        badgeClass: 'bg-rose-600 text-white border-rose-400 animate-pulse font-extrabold shadow-md shadow-rose-950',
        barColor: 'from-rose-600 to-rose-400',
        iconColor: 'text-rose-500 animate-pulse',
        description: 'Temperatura crítica de flashover atingida (≥500°C / limite 600°C). Radiação térmica extrema (>20 kW/m²). Conflagração súbita e generalizada no setor!'
      };
    }
  }, [selectedFloorCriticalTemp, activeFloorId]);

  // Display name of selected floor
  const currentFloorOption = DEFAULT_FLOOR_OPTIONS.find(f => f.id === activeFloorId) || {
    id: activeFloorId,
    shortLabel: `${activeFloorId}º Pav`,
    name: `${activeFloorId}º Pavimento`,
    purpose: 'Setor Hospitalar'
  };

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

      {/* 2.3 INDICADOR VISUAL: RISCO DE FLASHOVER (CONFORME TEMPERATURA CRÍTICA DO CFDSTATE DO ANDAR) */}
      <div className={`p-3 rounded-xl border transition-all duration-300 shadow-md ${flashoverRisk.bgClass} ${flashoverRisk.borderClass}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {flashoverRisk.level === 'critico' ? (
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            ) : flashoverRisk.level === 'moderado' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
              Risco de Flashover
            </span>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${flashoverRisk.badgeClass}`}>
            {flashoverRisk.label}
          </span>
        </div>

        {/* Temperature Critical Value & Floor Information */}
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
          <span className="text-slate-300 font-sans text-[10px]">
            {currentFloorOption.shortLabel}: <span className="font-mono font-bold text-white">{selectedFloorCriticalTemp.toFixed(1)}°C</span>
          </span>
          <span className={`text-[10px] font-bold ${flashoverRisk.textClass}`}>
            Limite: 600°C ({Math.min(100, Math.round((selectedFloorCriticalTemp / 600) * 100))}%)
          </span>
        </div>

        {/* Dynamic Flashover Gauge Bar (Verde -> Amarelo -> Vermelho) */}
        <div className="space-y-1">
          <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${flashoverRisk.barColor}`}
              style={{ width: `${Math.max(4, Math.min(100, Math.round((selectedFloorCriticalTemp / 600) * 100)))}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-500 px-0.5">
            <span className="text-emerald-500/80">0°C Seguro</span>
            <span className="text-amber-500/80">300°C Alerta</span>
            <span className="text-rose-500/80 font-bold">≥500°C Flashover</span>
          </div>
        </div>

        {/* Contextual physical diagnosis */}
        <p className="text-[10px] text-slate-300 mt-2 leading-relaxed border-t border-slate-800/60 pt-1.5">
          {flashoverRisk.description}
        </p>
      </div>

      {/* 2.5 GRÁFICO RECHARTS: EVOLUÇÃO DA TEMPERATURA MÉDIA DO ANDAR VS TEMPO (CFDSTATE) */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Evolução Térmica Média
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              currentFloorAvgTemp >= 60 ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' :
              currentFloorAvgTemp >= 38 ? 'bg-amber-950 text-amber-300 border-amber-800' :
              'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              {currentFloorAvgTemp.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Floor Selection Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {DEFAULT_FLOOR_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectFloor(f.id)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition shrink-0 ${
                activeFloorId === f.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title={`${f.name} — ${f.purpose}`}
            >
              {f.shortLabel}
            </button>
          ))}
        </div>

        {/* Selected Floor Subtitle and Simulation Time Marker */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-mono">
          <span className="truncate max-w-[170px] text-slate-300 font-sans font-medium" title={currentFloorOption.name}>
            {currentFloorOption.name}
          </span>
          <span className="text-cyan-400">
            t = {simulationTimeSec}s
          </span>
        </div>

        {/* Recharts Responsive Line Chart */}
        <div className="w-full h-36 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 9 }}
                tickFormatter={(val) => `${val}s`}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 9 }}
                unit="°C"
                domain={[15, 'auto']}
              />
              <Tooltip content={<CustomThermalTooltip />} />
              <ReferenceLine
                y={60}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: '60°C Limite', fill: '#f43f5e', fontSize: 8, position: 'insideRight' }}
              />
              <ReferenceLine
                x={simulationTimeSec}
                stroke="#38bdf8"
                strokeDasharray="2 2"
                strokeWidth={1.5}
                label={{ value: 'Agora', fill: '#38bdf8', fontSize: 8, position: 'insideTopLeft' }}
              />
              <Line
                type="monotone"
                dataKey="avgTemp"
                name="Temp. Média"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              {activeFloorId === 4 && (
                <Line
                  type="monotone"
                  dataKey="peakTemp"
                  name="Pico Foco"
                  stroke="#ef4444"
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Standards Footnote */}
        <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2.5 h-0.5 bg-amber-500 inline-block rounded" /> Temp. Média Andar
            </span>
            {activeFloorId === 4 && (
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block border-t border-dashed" /> Pico RM 408
              </span>
            )}
          </div>
          <span className="font-mono text-slate-500">ISO 13571 / CFD</span>
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
