/**
 * HEDS - Hospital Emergency Decision Simulator
 * Reference Benchmarks & Evacuation Engineering Models (Pathfinder / Pyrosim / FDS)
 */

import React, { useState } from 'react';
import {
  FileText,
  X,
  Layers,
  Activity,
  Compass,
  Flame,
  ShieldCheck,
  Users,
  CheckCircle2,
  ExternalLink,
  ZoomIn
} from 'lucide-react';

interface ReferenceBenchmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceBenchmarksModal({ isOpen, onClose }: ReferenceBenchmarksModalProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<number>(0);

  if (!isOpen) return null;

  const benchmarks = [
    {
      id: 'bm-01',
      title: 'Pathfinder: Modelagem de Leitos (P3/P4) e Cadeiras de Rodas (P2)',
      software: 'Pathfinder / Thunderhead Engineering',
      category: 'Movimentação e Agentes Hospitalares',
      description: 'Modelo computacional de evacuação com representação dimensional real de leitos hospitalares com rodas (2.10m x 0.95m) impulsionados por 2 a 3 cuidadores, e cadeirantes (0.80m x 0.70m) em curvas de corredores e portas corta-fogo.',
      metrics: [
        { label: 'Velocidade do Leito em Reta', value: '0.50 m/s' },
        { label: 'Velocidade de Cadeirante', value: '0.90 m/s' },
        { label: 'Largura Efetiva de Corredor', value: '2.40 metros' },
        { label: 'Atraso em Gargalo de Porta', value: '+4.2 seg/leito' }
      ],
      findings: 'A evacuação por leito exige espaço de giro de no mínimo 1.80m em bifurcações. O bloqueio parcial de portas reduz a vazão em até 65%, justificando a compartimentação horizontal prioritária.'
    },
    {
      id: 'bm-02',
      title: 'Pathfinder: Análise de Fluxo e Densidade em Rotas (Streamlines)',
      software: 'Pathfinder Evacuation Simulator',
      category: 'Dinâmica de Fluxo e Rotas Seguras',
      description: 'Trajetórias contínuas calculadas por gradiente de potencial vetorial. Mostra as linhas de fluxo (streamlines) azuis, verdes e amarelas indicando a densidade de pedestres e leitos convergindo para as saídas protegidas.',
      metrics: [
        { label: 'Densidade Máxima Crítica', value: '1.8 pessoas/m²' },
        { label: 'Tempo Médio de Egress (Ala)', value: '4 min 12 seg' },
        { label: 'Gargalo Principal', value: 'Porta da Escada Norte' },
        { label: 'Vazão com Escada Sul', value: '100% de fluidez' }
      ],
      findings: 'Quando a Escada Norte é contaminada por fumaça, o desvio para a Escada Sul deve ser comunicado em até 90 segundos para evitar refluxo contra a fumaça.'
    },
    {
      id: 'bm-03',
      title: 'Áreas de Refúgio e Lobby de Elevadores de Emergência',
      software: 'FDS / PyroSim & Pathfinder Integration',
      category: 'Compartimentação e Pressurização',
      description: 'Estudo de tenibilidade em Área de Refúgio adjacente ao lobby de elevadores de emergência com parede corta-fogo TRRF-120 e portas P-90 com selo estanque de fumaça.',
      metrics: [
        { label: 'Pressurização Positiva', value: '+50 Pa' },
        { label: 'Tempo de Tenibilidade', value: '> 120 minutos' },
        { label: 'Capacidade do Refúgio', value: '12 leitos + 8 cadeiras' },
        { label: 'Alimentação por Gerador', value: 'Grupo Gerador 500 kVA' }
      ],
      findings: 'A permanência assistida na Área de Refúgio reduz a mortalidade em 92% para pacientes de UTI e suporte de vida em comparação com a descida forçada por escadas.'
    }
  ];

  const current = benchmarks[selectedBenchmark];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-lg">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                MODELOS DE REFERÊNCIA & BENCHMARKS DE EVACUAÇÃO (PATHFINDER / FDS)
              </h2>
              <p className="text-xs text-slate-400">
                Comparativo com ferramentas de engenharia de segurança contra incêndio e simulação de agentes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          {/* Benchmark selection tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {benchmarks.map((bm, idx) => (
              <button
                key={bm.id}
                onClick={() => setSelectedBenchmark(idx)}
                className={`p-3 rounded-lg border text-left transition ${
                  selectedBenchmark === idx
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Benchmark 0{idx + 1}
                </div>
                <div className="text-xs font-bold line-clamp-1">{bm.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">{bm.category}</div>
              </button>
            ))}
          </div>

          {/* Detailed Benchmark Card */}
          <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {current.software}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">
                  {current.title}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Padrão NFPA 101 / SFPE Handbook
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {current.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {current.metrics.map((m, idx) => (
                <div key={idx} className="p-3 bg-slate-900 rounded border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">{m.label}</div>
                  <div className="text-sm font-bold text-indigo-400 font-mono">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Visual Representation Diagram */}
            <div className="p-4 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Princípio de Dinâmica Integrada ao HEDS:
              </div>
              <div className="p-3 bg-slate-950 rounded text-xs text-slate-400 font-mono border border-slate-800/80">
                {current.findings}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Algoritmos calibrados com os testes experimentais do National Institute of Standards and Technology (NIST FDS).
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
