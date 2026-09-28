/**
 * HEDS - Hospital Emergency Decision Simulator
 * Header & Simulation Control Bar
 */

import React from 'react';
import { EmergencyLevel, SimulationMode } from '../types';
import {
  Play,
  Pause,
  FastForward,
  Square,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Flame,
  AlertTriangle,
  Building2,
  GraduationCap,
  BookOpen,
  FileCheck
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  hospitalName: string;
  simulatedTimeStr: string;
  elapsedSeconds: number;
  simulationStatus: 'em_preparacao' | 'em_andamento' | 'pausado' | 'concluido';
  emergencyLevel: EmergencyLevel;
  speedMultiplier: number;
  mode: SimulationMode;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  onTogglePlayPause: () => void;
  onChangeSpeed: (multiplier: number) => void;
  onEndSimulation: () => void;
  onTriggerSync: () => void;
  onChangeMode: (mode: SimulationMode) => void;
  onGenerateManualPDF?: () => void;
  onGenerateReportPDF?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  hospitalName,
  simulatedTimeStr,
  elapsedSeconds,
  simulationStatus,
  emergencyLevel,
  speedMultiplier,
  mode,
  isOnline,
  isSyncing,
  pendingSyncCount,
  onTogglePlayPause,
  onChangeSpeed,
  onEndSimulation,
  onTriggerSync,
  onChangeMode,
  onGenerateManualPDF,
  onGenerateReportPDF
}) => {
  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEmergencyBadge = () => {
    switch (emergencyLevel) {
      case 'verde_normal':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">NORMAL (VERDE)</span>;
      case 'amarelo_alerta':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">ALERTA (FASE 1)</span>;
      case 'laranja_emergencia_local':
        return <span className="bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded text-[11px] font-bold">EMERGÊNCIA LOCAL (FASE 2)</span>;
      case 'vermelho_evacuacao_geral':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded text-[11px] font-bold animate-pulse">EVACUAÇÃO GERAL (FASE 3)</span>;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg select-none z-20">
      {/* Hospital Title and Incident Tag */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30 flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-white tracking-wide">{hospitalName}</h1>
            {getEmergencyBadge()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Cenário Ativo: <strong className="text-rose-400 font-semibold">Incêndio no 4º Pavimento</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Modo: 
              <select
                value={mode}
                onChange={(e) => onChangeMode(e.target.value as SimulationMode)}
                className="bg-slate-950 border border-slate-700 text-cyan-300 rounded px-1.5 py-0.5 text-[11px] font-bold focus:outline-none cursor-pointer"
              >
                <option value="treinamento">Treinamento (Feedback Instantâneo)</option>
                <option value="avaliacao">Avaliação (Modo Cego)</option>
                <option value="instrutor">Instrutor (Controle Total)</option>
              </select>
            </span>
          </div>
        </div>
      </div>

      {/* Clock & Elapsed Time Counter */}
      <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Relógio do Incidente</div>
            <div className="text-sm font-mono font-bold text-cyan-300 leading-none">{simulatedTimeStr}</div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Tempo Transcorrido</div>
          <div className="text-sm font-mono font-bold text-white leading-none">{formatElapsed(elapsedSeconds)}</div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estado</div>
          <div className="text-xs font-bold capitalize text-slate-300 leading-none">
            {simulationStatus === 'em_andamento' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Em Andamento
              </span>
            ) : simulationStatus === 'pausado' ? (
              <span className="text-amber-400">Pausado</span>
            ) : simulationStatus === 'concluido' ? (
              <span className="text-cyan-400">Concluído</span>
            ) : (
              <span className="text-slate-400">Preparado</span>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Controls (Play, Pause, Speed, Finish) */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlayPause}
          disabled={simulationStatus === 'concluido'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
            simulationStatus === 'em_andamento'
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          } disabled:opacity-50`}
        >
          {simulationStatus === 'em_andamento' ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pausar
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Iniciar
            </>
          )}
        </button>

        {/* Speed multipliers */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded transition ${
                speedMultiplier === spd
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* End Simulation Button */}
        <button
          onClick={onEndSimulation}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 transition"
          title="Encerrar Simulação e Gerar Relatório de Avaliação"
        >
          <Square className="w-3.5 h-3.5" /> Encerrar
        </button>

        {/* The Two Official System & Exercise PDF Buttons */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          {onGenerateManualPDF && (
            <button
              onClick={onGenerateManualPDF}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 transition shadow hover:shadow-indigo-500/20"
              title="Gerar e Baixar o Manual Completo do Sistema HEDS em PDF"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Manual do Sistema</span>
            </button>
          )}

          {onGenerateReportPDF && (
            <button
              onClick={onGenerateReportPDF}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 transition shadow hover:shadow-emerald-500/20"
              title="Gerar e Baixar o Relatório Técnico Oficial do Exercício em PDF"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Relatório do Exercício</span>
            </button>
          )}
        </div>

        {/* Offline/Online Sync Badge & Trigger */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isOnline
                ? 'bg-slate-950 border-emerald-900/60 text-emerald-400 hover:bg-slate-850'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
            title={isOnline ? 'Online (MySQL Sincronizado)' : 'Offline (Armazenado em IndexedDB)'}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            {pendingSyncCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full">
                {pendingSyncCount}
              </span>
            )}
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
