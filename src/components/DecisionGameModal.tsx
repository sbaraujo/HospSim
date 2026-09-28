/**
 * HEDS - Hospital Emergency Decision Simulator
 * Decision Game Modal & Pedagogical Debriefing
 */

import React, { useState, useEffect } from 'react';
import {
  ScenarioEvent,
  DecisionOption,
  SimulationMode
} from '../types';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface DecisionGameModalProps {
  event: ScenarioEvent;
  mode: SimulationMode;
  onMakeDecision: (option: DecisionOption, responseTimeSeconds: number) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const DecisionGameModal: React.FC<DecisionGameModalProps> = ({
  event,
  mode,
  onMakeDecision,
  isOpen
}) => {
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);
  const [showTrainingFeedback, setShowTrainingFeedback] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedOption(null);
    setShowTrainingFeedback(false);
    setSecondsElapsed(0);

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, event.id]);

  if (!isOpen) return null;

  const handleSelectOption = (opt: DecisionOption) => {
    setSelectedOption(opt);

    if (mode === 'treinamento') {
      // In training mode, show feedback first
      setShowTrainingFeedback(true);
    } else {
      // In evaluation mode, proceed immediately without revealing answers
      onMakeDecision(opt, secondsElapsed);
    }
  };

  const handleConfirmTrainingContinue = () => {
    if (selectedOption) {
      onMakeDecision(selectedOption, secondsElapsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Ponto de Decisão Tática Crítica • {event.locationLabel}
              </span>
              <h3 className="text-base font-bold text-white">{event.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{secondsElapsed}s decorridos</span>
            </div>

            <div className="text-[11px] font-semibold uppercase px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Modo: <strong className="text-cyan-400">{mode.toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Situation Briefing */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Situação Reportada</h4>
            <p className="text-sm text-slate-200 leading-relaxed">{event.description}</p>
            {event.availableInfo && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Informação Disponível:</strong> {event.availableInfo}</span>
              </div>
            )}
          </div>

          {/* Decision Choices */}
          {!showTrainingFeedback ? (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-cyan-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Selecione a Diretriz de Comando:
              </h4>

              <div className="space-y-3">
                {event.decisions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl transition duration-150 group flex items-start gap-3 shadow-md"
                  >
                    <span className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-700/60 font-bold flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition">
                      {opt.letter}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200 leading-snug">
                        {opt.label}
                      </p>
                      {opt.requiredResources && (
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                          <span className="text-slate-500">Recursos Requeridos:</span> {opt.requiredResources}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Training Mode Instant Pedagogical Debriefing */
            selectedOption && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    selectedOption.isOptimal
                      ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                  }`}
                >
                  {selectedOption.isOptimal ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-sm font-bold">
                      {selectedOption.isOptimal
                        ? 'Decisão Tática Recomendada (Excelente)'
                        : 'Decisão Subótima ou Inadequada'}
                    </h5>
                    <p className="text-xs mt-1 text-slate-200 leading-relaxed">
                      {selectedOption.consequence.description}
                    </p>
                  </div>
                </div>

                {/* Pedagogical Rationale Box */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Fundamentação Técnica e Normativa (C3)
                  </h6>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedOption.pedagogicalRationale}
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {mode === 'avaliacao'
              ? 'As respostas e notas serão reveladas no Relatório PDF ao final do exercício.'
              : 'Modo Treinamento: Análise imediata de causa e efeito ativada.'}
          </div>

          {showTrainingFeedback && (
            <button
              onClick={handleConfirmTrainingContinue}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-cyan-900/30"
            >
              Prosseguir com a Simulação <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
