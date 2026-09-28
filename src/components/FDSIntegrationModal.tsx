/**
 * HEDS - Hospital Emergency Decision Simulator
 * FDS (Fire Dynamics Simulator v6.8.0) Integration & Output File Processing Modal
 * 
 * Allows instructors and engineers to:
 * 1. Inspect real-time FDS timeseries channels (HRR, Temperature, Visibility, CO, FED, Pressure)
 * 2. Upload custom FDS output files (_devc.csv, _hrr.csv, .json)
 * 3. Switch between pre-calibrated NIST hospital benchmark runs
 * 4. Verify data-driven CFD integration replacing heuristic approximations
 */

import React, { useState, useRef } from 'react';
import {
  FDSDataset,
  FDSFileParseResult,
  CFDSimulationState
} from '../types';
import { cfdSolver } from '../services/cfdEngine';
import {
  Flame,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Gauge,
  X,
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

interface FDSIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cfdState: CFDSimulationState;
  onDatasetChanged: (dataset: FDSDataset) => void;
}

export const FDSIntegrationModal: React.FC<FDSIntegrationModalProps> = ({
  isOpen,
  onClose,
  cfdState,
  onDatasetChanged
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('HRR');
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentDataset = cfdSolver.activeDataset;
  const selectedChannel = currentDataset.channels.find(c => c.id === selectedChannelId) || currentDataset.channels[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result: FDSFileParseResult = cfdSolver.parseFDSFile(content, file.name);

      if (result.success && result.dataset) {
        cfdSolver.loadFDSDataset(result.dataset);
        onDatasetChanged(result.dataset);
        setUploadMessage({
          type: 'success',
          text: `Arquivo "${file.name}" carregado com sucesso (${result.formatDetected})! ${result.channelsFoundCount} canais instrumentados e ${result.timeRowsCount} passos temporais processados.`
        });
      } else {
        setUploadMessage({
          type: 'error',
          text: `Erro ao processar arquivo FDS: ${result.error || 'Formato não reconhecido.'}`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSelectBenchmark = (datasetId: string) => {
    const success = cfdSolver.setFDSDatasetById(datasetId);
    if (success) {
      onDatasetChanged(cfdSolver.activeDataset);
      setUploadMessage({
        type: 'success',
        text: `Dataset ativo alterado para "${cfdSolver.activeDataset.name}".`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  CAMADA DE INTEGRAÇÃO FDS (FIRE DYNAMICS SIMULATOR)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dados Físicos Reais (NIST FDS v6.8)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Processamento direto de arquivos de saída FDS (<code className="text-amber-300">_devc.csv</code>, <code className="text-amber-300">_hrr.csv</code>, JSON) para alimentação em tempo real do estado de incêndio e fumaça.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200 text-xs">
          {/* Active Dataset Overview Banner */}
          <div className="p-4 bg-slate-950/80 rounded-lg border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentDataset.fdsVersion}
                </span>
                <span className="font-bold text-white text-sm">
                  {currentDataset.name}
                </span>
              </div>
              <p className="text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {currentDataset.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                <span>Duração FDS: <strong>{currentDataset.durationSec}s</strong></span>
                <span>Canais de Medição: <strong>{currentDataset.channels.length}</strong></span>
                <span>Tempo Atual: <strong className="text-cyan-400">{cfdState.elapsedSec}s</strong></span>
                <span>Resolução da Malha: <strong>{currentDataset.meshResolutionM}m</strong></span>
              </div>
            </div>

            {/* Upload Button */}
            <div className="shrink-0 flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.json,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                Carregar Arquivo FDS (_devc.csv / JSON)
              </button>
              <span className="text-[10px] text-slate-400 text-center">
                Suporta saídas diretas do NIST FDS e PyroSim
              </span>
            </div>
          </div>

          {/* Feedback message */}
          {uploadMessage && (
            <div
              className={`p-3 rounded-lg border flex items-center justify-between ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {uploadMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>{uploadMessage.text}</span>
              </div>
              <button
                onClick={() => setUploadMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Calibrated Benchmark Selector */}
          <div className="space-y-2">
            <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-amber-400" />
              Datasets Calibrados do NIST Fire Dynamics Simulator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cfdSolver.availableDatasets.map((ds) => {
                const isSelected = ds.id === currentDataset.id;
                return (
                  <button
                    key={ds.id}
                    onClick={() => handleSelectBenchmark(ds.id)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          {ds.sourceType === 'nist_fds_output_file' ? 'NIST FDS Calibrado' : 'Arquivo Importado'}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                            ATIVO
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-100 line-clamp-1">{ds.name}</div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {ds.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      {ds.channels.length} canais • t = 0 a {ds.durationSec}s
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-Time FDS Channel Inspector */}
          <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                  Inspetor de Canais Instrumentados FDS & Curvas Temporais
                </h3>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Ponto de Leitura: <span className="text-cyan-400 font-bold">{cfdState.elapsedSec} segundos</span>
              </div>
            </div>

            {/* Channels Pill Selector */}
            <div className="flex flex-wrap gap-1.5">
              {currentDataset.channels.map((ch) => {
                const isSelected = ch.id === selectedChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannelId(ch.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                      isSelected
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {ch.id} ({ch.unit})
                  </button>
                );
              })}
            </div>

            {/* Channel Timeseries Table / Preview */}
            {selectedChannel && (
              <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">{selectedChannel.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">Grandeza: {selectedChannel.quantity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Valor no Instante t = {cfdState.elapsedSec}s:</span>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {cfdSolver.activeDataset.channels.find(c => c.id === selectedChannel.id)?.timeSeries.find(t => t[0] === cfdState.elapsedSec)?.[1] ??
                       cfdState.currentHRRKw}{' '}
                      {selectedChannel.unit}
                    </div>
                  </div>
                </div>

                {/* Timeseries Sample Grid */}
                <div className="overflow-x-auto max-h-48 border border-slate-800 rounded">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2">Tempo (s)</th>
                        <th className="p-2">Valor ({selectedChannel.unit})</th>
                        <th className="p-2">Comportamento Físico no Hospital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedChannel.timeSeries.slice(0, 15).map(([t, val], idx) => {
                        const isCurrent = Math.abs(t - cfdState.elapsedSec) <= 15;
                        return (
                          <tr
                            key={idx}
                            className={isCurrent ? 'bg-amber-950/30 text-amber-200 font-bold' : 'text-slate-300'}
                          >
                            <td className="p-2">{t.toFixed(1)}s</td>
                            <td className="p-2">{val.toFixed(1)} {selectedChannel.unit}</td>
                            <td className="p-2 text-slate-400">
                              {t === 0
                                ? 'Condição ambiente inicial (22°C)'
                                : t < 60
                                ? 'Fase de crescimento incipiente da pluma'
                                : t < 150
                                ? 'Propagação de fumaça e estratificação no corredor'
                                : t < 240
                                ? 'Temperatura crítica / aproximação de flashover'
                                : 'Combustão plenamente desenvolvida ou rescaldo'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Explanation Box */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-start gap-2.5 text-slate-400 text-[11px]">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Substituição da Lógica Heurística por Física Real FDS:</strong> As leituras do painel direito (temperatura de pico, visibilidade de Jin $S = 3/k$, concentração de CO e FED de Purser) são calculadas em tempo real a partir dos canais deste arquivo FDS, refletindo rigorosamente o comportamento térmico e tóxico validado pelo NIST.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-slate-500 text-xs">
            NIST Fire Dynamics Simulator • Formatos Suportados: FDS _devc.csv, _hrr.csv, JSON
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition"
          >
            Fechar Inspetor FDS
          </button>
        </div>
      </div>
    </div>
  );
};
