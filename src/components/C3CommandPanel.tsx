/**
 * HEDS - Hospital Emergency Decision Simulator
 * C3 Command, Control & Communication Component
 */

import React, { useState } from 'react';
import {
  EmergencyLevel,
  Team,
  ResourceItem,
  Patient,
  Equipment,
  SimulationLogEntry
} from '../types';
import {
  Radio,
  Shield,
  Flame,
  AlertTriangle,
  Users,
  Ambulance,
  PhoneCall,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Stethoscope
} from 'lucide-react';

interface C3CommandPanelProps {
  emergencyLevel: EmergencyLevel;
  onSetEmergencyLevel: (level: EmergencyLevel) => void;
  teams: Team[];
  resources: ResourceItem[];
  patients: Patient[];
  equipment: Equipment[];
  logs: SimulationLogEntry[];
  simulatedTimeStr: string;
  onDispatchTeam: (teamId: string, task: string) => void;
  onTriggerRadioBroadcast: (message: string) => void;
}

export const C3CommandPanel: React.FC<C3CommandPanelProps> = ({
  emergencyLevel,
  onSetEmergencyLevel,
  teams,
  resources,
  patients,
  equipment,
  logs,
  simulatedTimeStr,
  onDispatchTeam,
  onTriggerRadioBroadcast
}) => {
  const [activeTab, setActiveTab] = useState<'local_vs_geral' | 'equipes' | 'recursos' | 'comunicacao'>('local_vs_geral');
  const [customRadioMsg, setCustomRadioMsg] = useState('');

  // Count patients by status
  const evacuatedCount = patients.filter((p) => p.status === 'evacuado_seguro').length;
  const inRefugeCount = patients.filter((p) => p.status === 'em_area_refugio').length;
  const atRiskCount = patients.filter((p) => p.status === 'exposto_risco' || p.status === 'critico').length;
  const inBedCount = patients.filter((p) => p.status === 'em_leito' || p.status === 'preparando').length;

  // Local teams vs General external teams
  const localTeams = teams.filter((t) => t.type !== 'bombeiros_externos' && t.type !== 'samu_externo');
  const externalTeams = teams.filter((t) => t.type === 'bombeiros_externos' || t.type === 'samu_externo');

  const handleSendRadio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRadioMsg.trim()) return;
    onTriggerRadioBroadcast(customRadioMsg.trim());
    setCustomRadioMsg('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full text-slate-200">
      {/* C3 Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide text-white flex items-center gap-2">
              SISTEMA C3 — COMANDO, CONTROLE E COMUNICAÇÃO
            </h2>
            <p className="text-xs text-slate-400">
              Posto de Comando Operacional Integrado • Relógio HEDS: <span className="font-mono text-cyan-400 font-bold">{simulatedTimeStr}</span>
            </p>
          </div>
        </div>

        {/* Emergency Escalation Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSetEmergencyLevel('amarelo_alerta')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
              emergencyLevel === 'amarelo_alerta'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-amber-400/70 hover:bg-slate-900'
            }`}
          >
            Alerta (Fase 1)
          </button>
          <button
            onClick={() => onSetEmergencyLevel('laranja_emergencia_local')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
              emergencyLevel === 'laranja_emergencia_local'
                ? 'bg-orange-500 text-white shadow'
                : 'text-orange-400/70 hover:bg-slate-900'
            }`}
          >
            Emergência Local (Fase 2)
          </button>
          <button
            onClick={() => onSetEmergencyLevel('vermelho_evacuacao_geral')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
              emergencyLevel === 'vermelho_evacuacao_geral'
                ? 'bg-rose-600 text-white shadow animate-pulse'
                : 'text-rose-400/70 hover:bg-slate-900'
            }`}
          >
            Evacuação Geral (Fase 3)
          </button>
        </div>
      </div>

      {/* C3 Sub-Navigation Tabs */}
      <div className="flex gap-2 my-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('local_vs_geral')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'local_vs_geral'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Resposta Local vs Geral
        </button>

        <button
          onClick={() => setActiveTab('equipes')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'equipes'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Equipes ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('recursos')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'recursos'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Recursos ({resources.length})
        </button>

        <button
          onClick={() => setActiveTab('comunicacao')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'comunicacao'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Rádio & Despacho
        </button>
      </div>

      {/* TAB 1: RESPOSTA LOCAL INICIAL VS RESPOSTA GERAL */}
      {activeTab === 'local_vs_geral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
          {/* Box 1: Sistema de Resposta Local Inicial */}
          <div className="bg-slate-950/80 border border-cyan-900/40 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" /> Sistema de Resposta Local Inicial
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                  Primeiros 0 a 10 min
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Mobilização autônoma das forças internas do hospital antes da chegada dos órgãos públicos externos.
              </p>

              <div className="space-y-2">
                {localTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{team.name}</div>
                      <div className="text-[11px] text-slate-400">{team.membersCount} integrantes • {team.currentLocation}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      team.status === 'em_evacuacao' || team.status === 'em_combate'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {team.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
              <span>Diretriz Atual:</span>
              <span className="font-semibold text-cyan-300">Confinamento e Evacuação Horizontal Setorial</span>
            </div>
          </div>

          {/* Box 2: Sistema de Resposta Geral (Acionamento Externo) */}
          <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Ambulance className="w-4 h-4 text-rose-400" /> Sistema de Resposta Geral & Forças Externas
                </span>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">
                  Integração C3 / SCI
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Integração tática com Corpo de Bombeiros (193), SAMU (192), Defesa Civil e hospitais de retaguarda.
              </p>

              <div className="space-y-2">
                {externalTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <div className="font-semibold text-white">{team.name}</div>
                      <div className="text-[11px] text-slate-400">{team.membersCount} operadores • {team.currentLocation}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      team.status === 'deslocando'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {team.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Checklist */}
              <div className="mt-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3 text-emerald-400" /> Chamada 193 Bombeiros:</span>
                  <span className="font-bold text-emerald-400">DESPACHADO</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Ambulance className="w-3 h-3 text-cyan-400" /> Chamada 192 SAMU:</span>
                  <span className="font-bold text-cyan-400">EM ROTA</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-amber-400" /> Corte Gás Medicinal 4º Pav:</span>
                  <span className="font-bold text-emerald-400">VÁLVULA FECHADA</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
              <span>Posto de Comando (SCI):</span>
              <span className="font-semibold text-rose-400">Portaria Principal / Estacionamento</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE EQUIPES */}
      {activeTab === 'equipes' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {teams.map((t) => (
            <div key={t.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {t.name}
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Código: {t.code}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Efetivo: <strong className="text-slate-200">{t.membersCount} profissionais</strong> • Localização: <strong className="text-cyan-400">{t.currentLocation}</strong>
                </div>
                {t.assignedTask && (
                  <div className="text-xs text-amber-300 mt-0.5">
                    Missão Atual: {t.assignedTask}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDispatchTeam(t.id, 'Evacuação Prioritária')}
                  className="px-2.5 py-1 text-xs bg-cyan-700/60 hover:bg-cyan-600 text-white rounded font-medium transition"
                >
                  Designar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: GESTÃO DE RECURSOS E EQUIPAMENTOS */}
      {activeTab === 'recursos' && (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2.5 pr-1">
          {resources.map((res) => {
            const percentAvailable = Math.round((res.availableQuantity / res.totalQuantity) * 100);
            return (
              <div key={res.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">{res.name}</span>
                  <div className="text-[11px] text-slate-400 mt-1">Local: {res.storageLocation}</div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Disponíveis:</span>
                    <span className="font-bold text-white font-mono">{res.availableQuantity} / {res.totalQuantity}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${percentAvailable > 50 ? 'bg-cyan-500' : percentAvailable > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${percentAvailable}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: COMUNICAÇÃO & RÁDIO VHF */}
      {activeTab === 'comunicacao' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Radio message feed */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
            {logs.slice(-8).reverse().map((log) => (
              <div key={log.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono text-cyan-400">{log.simulatedTimeStr}</span>
                  <span className="font-semibold text-slate-300 uppercase">CANAL [{log.category}]</span>
                </div>
                <div className="font-bold text-white">{log.title}</div>
                <div className="text-slate-300 mt-0.5">{log.description}</div>
              </div>
            ))}
          </div>

          {/* Radio input form */}
          <form onSubmit={handleSendRadio} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={customRadioMsg}
              onChange={(e) => setCustomRadioMsg(e.target.value)}
              placeholder="Transmitir ordem na frequência de emergência C3..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
            >
              <Radio className="w-3.5 h-3.5" /> Transmitir
            </button>
          </form>
        </div>
      )}

      {/* Bottom Emergency Status Strip */}
      <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400">Total Pacientes</div>
          <div className="text-sm font-bold text-white font-mono">{patients.length}</div>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-emerald-400">Evacuados Seguros</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">{evacuatedCount}</div>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-cyan-400">Em Área de Refúgio</div>
          <div className="text-sm font-bold text-cyan-400 font-mono">{inRefugeCount}</div>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-rose-400">Em Risco Imediato</div>
          <div className="text-sm font-bold text-rose-400 font-mono">{atRiskCount}</div>
        </div>
      </div>
    </div>
  );
};
