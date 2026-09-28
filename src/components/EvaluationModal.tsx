/**
 * HEDS - Hospital Emergency Decision Simulator
 * Evaluation Results & PDF Report Generator Modal
 */

import React from 'react';
import { ReportData } from '../types';
import { generateHEDSReportPDF } from '../services/pdfReportGenerator';
import {
  Award,
  Download,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HeartPulse,
  Users,
  Shield,
  X,
  FileText,
  Printer
} from 'lucide-react';

interface EvaluationModalProps {
  report: ReportData;
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  report,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    const doc = generateHEDSReportPDF(report);
    doc.save(`HEDS-Relatorio-Avaliacao-${report.reportNumber}.pdf`);
  };

  const score = Math.round(report.evaluation.overallScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AVALIAÇÃO DO COMANDANTE & RELATÓRIO TÉCNICO</h2>
              <p className="text-xs text-slate-400">
                Relatório de Desempenho Homologado HEDS • Nº {report.reportNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              <Download className="w-4 h-4" /> Baixar Relatório PDF Oficial
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Big Scorecard Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-700 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                <span className="text-3xl font-black font-mono leading-none">{score}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-90">Score Global</span>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Classificação Final
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {report.evaluation.gradeClassification}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Comandante: <strong className="text-white">{report.participantName}</strong> • Instrutor: <strong className="text-white">{report.instructorName}</strong>
                </p>
              </div>
            </div>

            {/* Core Stats Pills */}
            <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Pacientes Evacuados</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  {report.evaluation.evacuatedTotal}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Suporte de Vida (P4) Salvo</div>
                <div className="text-base font-extrabold text-cyan-400 font-mono">
                  {report.evaluation.criticalSaved}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Rotas Bloqueadas</div>
                <div className="text-base font-extrabold text-amber-400 font-mono">
                  {report.evaluation.routesBlockedCount}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Tempo de Resposta</div>
                <div className="text-base font-extrabold text-white font-mono">
                  {Math.floor(report.simulationDurationSec / 60)}m {report.simulationDurationSec % 60}s
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Competency Bars */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" /> Dimensões de Competência Tática (Radar de Avaliação)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Proteção da Vida e Pacientes (Peso 30%):</span>
                  <span className="font-bold text-emerald-400 font-mono">{report.evaluation.lifeProtectionScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${report.evaluation.lifeProtectionScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Rapidez e Tempo de Decisão (Peso 20%):</span>
                  <span className="font-bold text-cyan-400 font-mono">{report.evaluation.decisionTimeScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${report.evaluation.decisionTimeScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Coordenação Tática e Liderança C3 (Peso 20%):</span>
                  <span className="font-bold text-indigo-400 font-mono">{report.evaluation.coordinationScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${report.evaluation.coordinationScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Uso Racional de Recursos (Peso 15%):</span>
                  <span className="font-bold text-amber-400 font-mono">{report.evaluation.resourceUsageScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${report.evaluation.resourceUsageScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Decisions Table Summary */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Histórico de Decisões Auditadas no Exercício
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Horário</th>
                    <th className="pb-2">Evento Crítico</th>
                    <th className="pb-2">Decisão Adotada</th>
                    <th className="pb-2 text-center">T. Resposta</th>
                    <th className="pb-2 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {report.decisions.map((dec, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="py-2.5 font-mono text-cyan-400">{dec.simulatedTimeStr}</td>
                      <td className="py-2.5 font-semibold text-slate-200">{dec.eventTitle}</td>
                      <td className="py-2.5 text-slate-300">
                        <span className="font-bold text-white mr-1">[{dec.optionLetter}]</span>
                        {dec.decisionLabel}
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-400">{dec.responseTimeSeconds}s</td>
                      <td className="py-2.5 text-right">
                        {dec.isOptimal ? (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            Ótima (+{dec.scoreAwarded}pts)
                          </span>
                        ) : (
                          <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
                            Subótima
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Relatório auditado e assinado digitalmente pelo Simulador HEDS.
          </span>
          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-4 h-4" /> Download PDF Oficial
          </button>
        </div>
      </div>
    </div>
  );
};
