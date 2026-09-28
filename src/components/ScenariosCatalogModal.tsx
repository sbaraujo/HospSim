/**
 * HEDS - Hospital Emergency Decision Simulator
 * Scenarios & All-Hazards Catalog Browser
 */

import React, { useState } from 'react';
import { SCENARIO_CATALOG, MASTER_SCENARIO } from '../data/seedData';
import { HazardType } from '../types';
import {
  Sparkles,
  Flame,
  Zap,
  Wind,
  AlertTriangle,
  Biohazard,
  Shield,
  Layers,
  Play,
  X,
  CheckCircle2
} from 'lucide-react';

interface ScenariosCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string) => void;
  activeScenarioId: string;
}

export const ScenariosCatalogModal: React.FC<ScenariosCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  activeScenarioId
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'incendio' | 'all_hazards'>('ALL');

  if (!isOpen) return null;

  const allHazardsList = [
    { title: 'Vazamento Grave de Gases Medicinais (O2)', hazard: 'falha_oxigenio', desc: 'Ruptura na central de criogenia com risco de deflagração e asfixia.' },
    { title: 'Blecaute Estrutural com Falha de Gerador', hazard: 'falha_energia', desc: 'Parada total do grupo gerador a diesel durante tempestade; nobreaks em esgotamento.' },
    { title: 'Explosão em Caldeira / Central Térmica', hazard: 'explosao', desc: 'Sobrepressão na casa de caldeiras do subsolo com comprometimento estrutural parcial.' },
    { title: 'Incidente Químico no Laboratório Central', hazard: 'incidente_quimico', desc: 'Derramamento de formol e éter em grande escala com emanação de vapores letais.' },
    { title: 'Ameaça de Artefato Explosivo / Bomba', hazard: 'ameaca_bomba', desc: 'Mala suspeita abandonada no hall de elevadores sociais com exigência de evacuação sigilosa.' },
    { title: 'Incidente com Múltiplas Vítimas (MCI Externo)', hazard: 'multiplas_vitimas', desc: 'Desabamento rodoviário traz 40 vítimas críticas ao Pronto-Socorro simultaneamente.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CATÁLOGO DE CENÁRIOS & INCIDENTES ALL-HAZARDS</h2>
              <p className="text-xs text-slate-400">
                20 Cenários Oficiais de Incêndio Hospitalar + Incidentes Multirrisco C3
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'ALL'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Todos os Cenários (26)
          </button>
          <button
            onClick={() => setActiveFilter('incendio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'incendio'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> 20 Cenários de Incêndio
          </button>
          <button
            onClick={() => setActiveFilter('all_hazards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'all_hazards'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Biohazard className="w-3.5 h-3.5" /> All-Hazards (Multirrisco)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Master Active Scenario Banner */}
          <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 p-5 rounded-2xl border border-rose-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700 px-2 py-0.5 rounded uppercase">
                  Cenário Mestre Homologado C3
                </span>
                <span className="text-xs text-slate-400 font-mono">Início: 10:20:00</span>
              </div>
              <h3 className="text-base font-extrabold text-white">{MASTER_SCENARIO.title}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {MASTER_SCENARIO.description}
              </p>
            </div>

            <button
              onClick={() => {
                onSelectScenario(MASTER_SCENARIO.id);
                onClose();
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shrink-0"
            >
              <Play className="w-4 h-4" /> Carregar Exercício
            </button>
          </div>

          {/* 20 Scenarios Grid */}
          {(activeFilter === 'ALL' || activeFilter === 'incendio') && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" /> Catálogo dos 20 Cenários de Incêndio Hospitalar
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SCENARIO_CATALOG.map((scn) => (
                  <div
                    key={scn.id}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold text-amber-400">CENÁRIO #{scn.number}</span>
                        <span>{scn.floor === -1 ? 'Subsolo' : scn.floor === 0 ? 'Térreo' : `${scn.floor}º Pavimento`}</span>
                      </div>
                      <h5 className="font-bold text-slate-100 text-xs">{scn.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{scn.summary}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Foco: {scn.initialLocation}</span>
                      <button
                        onClick={() => {
                          onSelectScenario(scn.id);
                          onClose();
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                      >
                        Simular <Play className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All-Hazards Multi-Risk Grid */}
          {(activeFilter === 'ALL' || activeFilter === 'all_hazards') && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
                <Biohazard className="w-4 h-4 text-cyan-400" /> Cenários All-Hazards (Emergências Complexas)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allHazardsList.map((hz, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-cyan-400 shrink-0 border border-slate-800">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-100 text-xs">{hz.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{hz.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
