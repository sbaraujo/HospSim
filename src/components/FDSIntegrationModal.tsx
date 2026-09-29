/**
 * HEDS - Hospital Emergency Decision Simulator
 * FDS (Fire Dynamics Simulator v6.8.0) Integration & Thermal Stratification Inspector
 * 
 * Provides:
 * 1. Multi-Probe Temperature Temporal Evolution Chart (Thermocouple Rake / Árvore de Termopares)
 * 2. Real-Time Vertical Thermal Stratification Column (Floor to Ceiling Heat Distribution & Smoke Descent)
 * 3. Human Tenability Limits Assessment (NFPA 101, ISO 13571: 60°C, 120°C, 600°C Flashover)
 * 4. FDS Channels Inspector (HRR, CO, FED, Pressure, Optical Density)
 * 5. Native FDS Output File Upload & Calibrated Benchmark Datasets
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  FDSDataset,
  FDSFileParseResult,
  CFDSimulationState,
  FDSThermocoupleProbe,
  CFDProbeSensor
} from '../types';
import { cfdSolver } from '../services/cfdEngine';
import { interpolateSeries } from '../services/fdsDatasets';
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
  Info,
  TrendingUp,
  Thermometer,
  ShieldAlert,
  Sliders,
  User,
  Bed,
  Eye,
  ChevronRight,
  MapPin,
  Plus,
  Trash2,
  Crosshair,
  Compass,
  Cpu,
  Zap,
  ShieldCheck,
  Move,
  Target
} from 'lucide-react';

interface FDSIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cfdState: CFDSimulationState;
  onDatasetChanged: (dataset: FDSDataset) => void;
}

type ModalTab = 'stratification' | 'channels' | 'datasets' | 'probe_placement';
type LocationRakeGroup = 'origin_room_408' | 'corridor_center' | 'all';

export const FDSIntegrationModal: React.FC<FDSIntegrationModalProps> = ({
  isOpen,
  onClose,
  cfdState,
  onDatasetChanged
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('stratification');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('HRR');
  const [locationGroup, setLocationGroup] = useState<LocationRakeGroup>('origin_room_408');
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [scrubbedTime, setScrubbedTime] = useState<number | null>(null);
  const [hiddenProbeIds, setHiddenProbeIds] = useState<Set<string>>(new Set());
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Probe Placement State
  const [selectedProbeId, setSelectedProbeId] = useState<string | null>(cfdSolver.probes[0]?.id || null);
  const [probePlacementMode, setProbePlacementMode] = useState<'inspect' | 'place_new'>('inspect');
  const [newProbeName, setNewProbeName] = useState<string>('Sonda Leito UTI 402');
  const [newProbeLocation, setNewProbeLocation] = useState<string>('Ala Oeste / Leito Monitorado');
  const [newProbeHeight, setNewProbeHeight] = useState<number>(1.8);
  const [hoveredCell, setHoveredCell] = useState<{ gridX: number; gridY: number; worldX: number; worldZ: number } | null>(null);
  const [probeChangeCounter, setProbeChangeCounter] = useState<number>(0);

  if (!isOpen) return null;

  const currentDataset = cfdSolver.activeDataset;
  const thermocoupleProbes = cfdSolver.getActiveThermocoupleProbes();
  const currentTime = scrubbedTime !== null ? scrubbedTime : cfdState.elapsedSec;

  // Filter probes according to selected location group
  const displayedProbes = useMemo(() => {
    if (locationGroup === 'all') return thermocoupleProbes;
    return thermocoupleProbes.filter(p => p.locationGroup === locationGroup);
  }, [thermocoupleProbes, locationGroup]);

  const activeProbes = useMemo(() => {
    return displayedProbes.filter(p => !hiddenProbeIds.has(p.id));
  }, [displayedProbes, hiddenProbeIds]);

  // Selected channel for Tab 2
  const selectedChannel = currentDataset.channels.find(c => c.id === selectedChannelId) || currentDataset.channels[0];

  // Stratification metrics for current room / corridor
  const stratificationProfile = useMemo(() => {
    const group = locationGroup === 'corridor_center' ? 'corridor_center' : 'origin_room_408';
    return cfdSolver.getStratificationProfile(group, currentTime);
  }, [locationGroup, currentTime]);

  const toggleProbeVisibility = (probeId: string) => {
    setHiddenProbeIds(prev => {
      const next = new Set(prev);
      if (next.has(probeId)) next.delete(probeId);
      else next.add(probeId);
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadMessage({
      type: 'success',
      text: `Processando "${file.name}" em Web Worker dedicado...`
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result: FDSFileParseResult = await cfdSolver.parseFDSFileAsync(content, file.name);

      if (result.success && result.dataset) {
        cfdSolver.loadFDSDataset(result.dataset);
        onDatasetChanged(result.dataset);
        setUploadMessage({
          type: 'success',
          text: `Arquivo "${file.name}" carregado com sucesso via Web Worker (${result.formatDetected})! ${result.channelsFoundCount} canais instrumentados e ${result.timeRowsCount} passos temporais processados off-thread.`
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

  // SVG Chart Geometry
  const chartWidth = 720;
  const chartHeight = 280;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  // Max temperature in chart
  const maxTempScale = useMemo(() => {
    let max = 0;
    activeProbes.forEach(p => {
      p.timeSeries.forEach(([, temp]) => {
        if (temp > max) max = temp;
      });
    });
    if (max > 500) return 900;
    if (max > 250) return 600;
    if (max > 100) return 300;
    return 150;
  }, [activeProbes]);

  const maxTimeSec = currentDataset.durationSec || 600;

  const mapX = (t: number) => padLeft + (t / maxTimeSec) * plotW;
  const mapY = (temp: number) => padTop + plotH - (Math.min(temp, maxTempScale) / maxTempScale) * plotH;

  const generateSVGPath = (timeSeries: [number, number][]) => {
    if (!timeSeries || timeSeries.length === 0) return '';
    return timeSeries
      .map(([t, temp], idx) => {
        const x = mapX(t);
        const y = mapY(temp);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Inspect temperatures at specific time cursor
  const inspectedTime = hoveredTime !== null ? hoveredTime : currentTime;
  const inspectedProbesValues = useMemo(() => {
    return activeProbes.map(p => ({
      ...p,
      currentVal: Math.round(interpolateSeries(p.timeSeries, inspectedTime) * 10) / 10
    }));
  }, [activeProbes, inspectedTime]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg">
              <Thermometer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  PAINEL DE ESTRATIFICAÇÃO TÉRMICA & INTEGRAÇÃO FDS
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NIST FDS v6.8.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evolução temporal multi-probe (árvore de termopares) e estratificação vertical física no hospital.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setScrubbedTime(null);
                setHoveredTime(null);
              }}
              title="Sincronizar com tempo da simulação"
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Sincronizar Relógio ({cfdState.elapsedSec}s)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-950 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stratification')}
              className={`px-3.5 py-1.5 rounded-md font-medium flex items-center gap-2 transition ${
                activeTab === 'stratification'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Estratificação Térmica & Probes
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3.5 py-1.5 rounded-md font-medium flex items-center gap-2 transition ${
                activeTab === 'channels'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              Canais Globais FDS
            </button>
            <button
              onClick={() => setActiveTab('datasets')}
              className={`px-3.5 py-1.5 rounded-md font-medium flex items-center gap-2 transition ${
                activeTab === 'datasets'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Datasets & Upload FDS
            </button>
            <button
              onClick={() => setActiveTab('probe_placement')}
              className={`px-3.5 py-1.5 rounded-md font-medium flex items-center gap-2 transition ${
                activeTab === 'probe_placement'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Posicionamento de Probes (2D/3D)
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {cfdSolver.probes.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-2.5">
            <span>Dataset Ativo: <strong className="text-amber-400">{currentDataset.name}</strong></span>
            <span>•</span>
            <span>Tempo Ativo: <strong className="text-cyan-400">{currentTime}s</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Web Worker CFD: Thread Paralela (60 FPS)</span>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-200 text-xs">
          {/* TAB 1: ESTRATIFICAÇÃO TÉRMICA & MULTI-PROBE EVOLUTION */}
          {activeTab === 'stratification' && (
            <div className="space-y-4">
              {/* Header Selector & Summary Bar */}
              <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Árvore de Medição:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
                    <button
                      onClick={() => setLocationGroup('origin_room_408')}
                      className={`px-3 py-1 rounded text-xs transition ${
                        locationGroup === 'origin_room_408'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Quarto 408 (Foco do Fogo)
                    </button>
                    <button
                      onClick={() => setLocationGroup('corridor_center')}
                      className={`px-3 py-1 rounded text-xs transition ${
                        locationGroup === 'corridor_center'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Corredor Central de Evacuação
                    </button>
                    <button
                      onClick={() => setLocationGroup('all')}
                      className={`px-3 py-1 rounded text-xs transition ${
                        locationGroup === 'all'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos os Compartimentos (Multi-Probe)
                    </button>
                  </div>
                </div>

                {/* Instantaneous Stratification Metrics */}
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-slate-400">Teto (Z=2.7m): </span>
                    <strong className="text-rose-400">{stratificationProfile.ceilingTemp}°C</strong>
                  </div>
                  <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-slate-400">Piso (Z=0.5m): </span>
                    <strong className="text-cyan-400">{stratificationProfile.floorTemp}°C</strong>
                  </div>
                  <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-slate-400">Diferencial Térmico (ΔT): </span>
                    <strong className="text-amber-400">+{stratificationProfile.deltaT}°C</strong>
                  </div>
                  <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-slate-400">Gradiente Vertical: </span>
                    <strong className="text-amber-300">{stratificationProfile.gradient}°C/m</strong>
                  </div>
                </div>
              </div>

              {/* Grid: 2 Columns (Left: Temporal Multi-Probe Chart; Right: Vertical Thermal Column Stratification Profile) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT: Multi-Probe Temporal Evolution Chart (8 cols) */}
                <div className="lg:col-span-8 bg-slate-950/90 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        Evolução Temporal da Temperatura por Ponto de Medição (FDS Probes)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Clique ou passe o mouse sobre o gráfico para inspecionar temperaturas nos instantes de simulação.
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                      Cursor: {inspectedTime}s
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="relative border border-slate-800/60 rounded-md bg-slate-950/60 overflow-hidden">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-auto cursor-crosshair select-none"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clientX = e.clientX - rect.left;
                        const svgX = (clientX / rect.width) * chartWidth;
                        if (svgX >= padLeft && svgX <= padLeft + plotW) {
                          const t = Math.round(((svgX - padLeft) / plotW) * maxTimeSec);
                          setHoveredTime(Math.max(0, Math.min(maxTimeSec, t)));
                        }
                      }}
                      onMouseLeave={() => setHoveredTime(null)}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clientX = e.clientX - rect.left;
                        const svgX = (clientX / rect.width) * chartWidth;
                        if (svgX >= padLeft && svgX <= padLeft + plotW) {
                          const t = Math.round(((svgX - padLeft) / plotW) * maxTimeSec);
                          setScrubbedTime(Math.max(0, Math.min(maxTimeSec, t)));
                        }
                      }}
                    >
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const y = padTop + plotH * (1 - frac);
                        const val = Math.round(maxTempScale * frac);
                        return (
                          <g key={idx}>
                            <line
                              x1={padLeft}
                              y1={y}
                              x2={padLeft + plotW}
                              y2={y}
                              stroke="#334155"
                              strokeDasharray="3 3"
                              strokeWidth={0.8}
                            />
                            <text
                              x={padLeft - 6}
                              y={y + 3}
                              fill="#94a3b8"
                              fontSize={9}
                              textAnchor="end"
                              fontFamily="monospace"
                            >
                              {val}°C
                            </text>
                          </g>
                        );
                      })}

                      {/* Time X Grid Lines */}
                      {[0, 60, 120, 180, 240, 300, 420, 600].map((t) => {
                        if (t > maxTimeSec) return null;
                        const x = mapX(t);
                        return (
                          <g key={t}>
                            <line
                              x1={x}
                              y1={padTop}
                              x2={x}
                              y2={padTop + plotH}
                              stroke="#1e293b"
                              strokeWidth={1}
                            />
                            <text
                              x={x}
                              y={padTop + plotH + 15}
                              fill="#64748b"
                              fontSize={9}
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {t}s
                            </text>
                          </g>
                        );
                      })}

                      {/* Threshold Lines */}
                      {/* 60°C Critical Tenability Line (ISO 13571 / NFPA 101) */}
                      {maxTempScale >= 60 && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={mapY(60)}
                            x2={padLeft + plotW}
                            y2={mapY(60)}
                            stroke="#eab308"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                          />
                          <text
                            x={padLeft + plotW - 4}
                            y={mapY(60) - 3}
                            fill="#facc15"
                            fontSize={8}
                            textAnchor="end"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            60°C — Limite Crítico Evacuação Humana
                          </text>
                        </g>
                      )}

                      {/* 120°C Firefighter PPE Limit */}
                      {maxTempScale >= 120 && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={mapY(120)}
                            x2={padLeft + plotW}
                            y2={mapY(120)}
                            stroke="#f97316"
                            strokeWidth={1.2}
                            strokeDasharray="4 2"
                          />
                          <text
                            x={padLeft + plotW - 4}
                            y={mapY(120) - 3}
                            fill="#fb923c"
                            fontSize={8}
                            textAnchor="end"
                            fontFamily="monospace"
                          >
                            120°C — Limite Roupa Proteção Brigada
                          </text>
                        </g>
                      )}

                      {/* 600°C Flashover Limit */}
                      {maxTempScale >= 600 && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={mapY(600)}
                            x2={padLeft + plotW}
                            y2={mapY(600)}
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            strokeDasharray="5 3"
                          />
                          <text
                            x={padLeft + plotW - 4}
                            y={mapY(600) - 3}
                            fill="#f87171"
                            fontSize={8}
                            textAnchor="end"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            600°C — Limiar Físico Flashover FDS
                          </text>
                        </g>
                      )}

                      {/* Probe Temperature Curves */}
                      {activeProbes.map((probe) => {
                        const pathData = generateSVGPath(probe.timeSeries);
                        return (
                          <path
                            key={probe.id}
                            d={pathData}
                            fill="none"
                            stroke={probe.color}
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.92}
                          />
                        );
                      })}

                      {/* Current Simulation Cursor Line */}
                      <line
                        x1={mapX(currentTime)}
                        y1={padTop}
                        x2={mapX(currentTime)}
                        y2={padTop + plotH}
                        stroke="#06b6d4"
                        strokeWidth={2}
                      />
                      <polygon
                        points={`${mapX(currentTime) - 5},${padTop} ${mapX(currentTime) + 5},${padTop} ${mapX(currentTime)},${padTop + 7}`}
                        fill="#06b6d4"
                      />

                      {/* Hover cursor line if different */}
                      {hoveredTime !== null && hoveredTime !== currentTime && (
                        <line
                          x1={mapX(hoveredTime)}
                          y1={padTop}
                          x2={mapX(hoveredTime)}
                          y2={padTop + plotH}
                          stroke="#a855f7"
                          strokeDasharray="2 2"
                          strokeWidth={1.5}
                        />
                      )}

                      {/* Current Point Markers */}
                      {activeProbes.map((probe) => {
                        const currentTemp = interpolateSeries(probe.timeSeries, inspectedTime);
                        return (
                          <circle
                            key={probe.id}
                            cx={mapX(inspectedTime)}
                            cy={mapY(currentTemp)}
                            r={3.5}
                            fill={probe.color}
                            stroke="#0f172a"
                            strokeWidth={1.5}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Probe Toggles & Interactive Readout Legend */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Pontos de Medição Ativos (Clique para ocultar/exibir):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {displayedProbes.map((probe) => {
                        const isHidden = hiddenProbeIds.has(probe.id);
                        const curVal = Math.round(interpolateSeries(probe.timeSeries, inspectedTime) * 10) / 10;
                        const isHot = curVal >= 60;
                        const isVeryHot = curVal >= 120;

                        return (
                          <button
                            key={probe.id}
                            onClick={() => toggleProbeVisibility(probe.id)}
                            className={`px-2.5 py-1.5 rounded border text-left flex items-center justify-between text-[11px] transition ${
                              isHidden
                                ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                                : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden pr-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: isHidden ? '#64748b' : probe.color }}
                              />
                              <span className="truncate text-[10px]" title={probe.label}>
                                {probe.label.split('—')[1] || probe.label}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-bold shrink-0 ${
                                isHidden
                                  ? 'text-slate-500'
                                  : isVeryHot
                                  ? 'text-rose-400'
                                  : isHot
                                  ? 'text-amber-400'
                                  : 'text-cyan-400'
                              }`}
                            >
                              {curVal}°C
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Vertical Thermal Stratification Column & Tenability Gauge (4 cols) */}
                <div className="lg:col-span-4 bg-slate-950/90 p-4 rounded-lg border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        Perfil de Estratificação Vertical (Z)
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        H = 2.80m
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Gradiente térmico entre piso e teto no instante <strong className="text-cyan-400 font-mono">{currentTime}s</strong>.
                    </p>
                  </div>

                  {/* 2D Stratification Architectural Column */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 flex items-stretch gap-4 relative">
                    {/* Vertical Gauge Bar */}
                    <div className="w-12 h-64 rounded-md border border-slate-700 relative overflow-hidden flex flex-col justify-between shrink-0 shadow-inner">
                      {/* Thermal gradient fill */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to bottom, 
                            ${stratificationProfile.ceilingTemp > 300 ? '#b91c1c' : stratificationProfile.ceilingTemp > 100 ? '#ea580c' : '#f59e0b'} 0%,
                            ${stratificationProfile.ceilingTemp > 100 ? '#ea580c' : '#f59e0b'} 35%,
                            #3b82f6 75%,
                            #06b6d4 100%)`
                        }}
                      />

                      {/* Hot smoke layer descending boundary line */}
                      <div
                        className="absolute w-full border-b-2 border-white shadow-lg transition-all duration-300"
                        style={{
                          top: `${Math.max(10, Math.min(85, ((2.8 - stratificationProfile.smokeLayerZ) / 2.8) * 100))}%`
                        }}
                      >
                        <span className="absolute right-1 -top-3.5 text-[8px] font-bold bg-black/80 px-1 py-0.2 rounded text-white font-mono">
                          z={stratificationProfile.smokeLayerZ.toFixed(1)}m
                        </span>
                      </div>

                      {/* Height tick marks */}
                      <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none opacity-40">
                        <div className="w-full border-b border-white" />
                        <div className="w-full border-b border-white" />
                        <div className="w-full border-b border-white" />
                        <div className="w-full border-b border-white" />
                        <div className="w-full border-b border-white" />
                      </div>
                    </div>

                    {/* Probes & Heights Annotated Legend */}
                    <div className="flex-1 flex flex-col justify-between text-[11px] py-1">
                      {/* Z = 2.7m (Teto) */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[11px] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Z = 2.7m Teto
                          </div>
                          <span className="text-[10px] text-slate-400">Camada de gases quentes</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-rose-400 text-xs">
                            {stratificationProfile.ceilingTemp}°C
                          </span>
                        </div>
                      </div>

                      {/* Z = 1.8m (Respiração / Pessoa em Pé) */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
                        <div>
                          <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                            <User className="w-3 h-3 text-amber-400" />
                            Z = 1.8m Respiração
                          </div>
                          <span className="text-[10px] text-slate-400">Limiar crítico de tenabilidade</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold text-xs ${
                            (stratificationProfile.points.find(p => p.heightM === 1.8)?.tempC ?? 22) >= 60
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}>
                            {stratificationProfile.points.find(p => p.heightM === 1.8)?.tempC ?? 22}°C
                          </span>
                        </div>
                      </div>

                      {/* Z = 1.2m (Altura do Leito / Cadeirante) */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
                        <div>
                          <div className="font-bold text-yellow-300 text-[11px] flex items-center gap-1">
                            <Bed className="w-3 h-3 text-yellow-400" />
                            Z = 1.2m Leito / Maca
                          </div>
                          <span className="text-[10px] text-slate-400">Pacientes acamados / cadeira</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-yellow-400 text-xs">
                            {stratificationProfile.points.find(p => p.heightM === 1.2)?.tempC ?? 22}°C
                          </span>
                        </div>
                      </div>

                      {/* Z = 0.5m (Piso / Ar Frio) */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
                        <div>
                          <div className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            Z = 0.5m Piso
                          </div>
                          <span className="text-[10px] text-slate-400">Zona de fuga rastejante</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-cyan-400 text-xs">
                            {stratificationProfile.floorTemp}°C
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tenability Evaluation Alert Box */}
                  <div className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                    stratificationProfile.ceilingTemp >= 600
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                      : (stratificationProfile.points.find(p => p.heightM === 1.8)?.tempC ?? 22) >= 60
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  }`}>
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[11px]">
                        {stratificationProfile.ceilingTemp >= 600
                          ? 'FLASHOVER IMINENTE / COMBUSTÃO TOTAL'
                          : (stratificationProfile.points.find(p => p.heightM === 1.8)?.tempC ?? 22) >= 60
                          ? 'TENABILIDADE CRÍTICA — HIPERTERMIA'
                          : 'ATMOSFERA TENÍVEL NO PISO E LEITO'}
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                        {stratificationProfile.ceilingTemp >= 600
                          ? 'Temperatura do teto atingiu 600°C. Radiação térmica causa ignição instantânea de todos os combustíveis da sala.'
                          : (stratificationProfile.points.find(p => p.heightM === 1.8)?.tempC ?? 22) >= 60
                          ? 'Camada de respiração ultrapassa 60°C. Ocupantes de pé sofrem queimaduras térmicas nas vias aéreas. Evacuação deve ser rastejante.'
                          : 'Ar fresco preservado nas cotas inferiores (Z < 1.2m). Pacientes em leitos protegidos se portas corta-fogo permanecerem fechadas.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANAIS GLOBAIS FDS */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                      Inspetor de Canais Instrumentados FDS & Curvas Globais
                    </h3>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Instante: <span className="text-cyan-400 font-bold">{currentTime} segundos</span>
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
                        <span className="text-xs text-slate-400">Valor no Instante t = {currentTime}s:</span>
                        <div className="text-base font-bold text-amber-400 font-mono">
                          {interpolateSeries(selectedChannel.timeSeries, currentTime).toFixed(1)}{' '}
                          {selectedChannel.unit}
                        </div>
                      </div>
                    </div>

                    {/* Timeseries Sample Grid */}
                    <div className="overflow-x-auto max-h-56 border border-slate-800 rounded">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="p-2">Tempo (s)</th>
                            <th className="p-2">Valor ({selectedChannel.unit})</th>
                            <th className="p-2">Comportamento Físico no Hospital</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {selectedChannel.timeSeries.slice(0, 18).map(([t, val], idx) => {
                            const isCurrent = Math.abs(t - currentTime) <= 15;
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
            </div>
          )}

          {/* TAB 3: DATASETS CALIBRADOS & UPLOAD */}
          {activeTab === 'datasets' && (
            <div className="space-y-4">
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
                    <span>Canais: <strong>{currentDataset.channels.length}</strong></span>
                    <span>Probes Termopares: <strong>{thermocoupleProbes.length}</strong></span>
                    <span>Resolução: <strong>{currentDataset.meshResolutionM}m</strong></span>
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

              {/* Benchmark Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cfdSolver.availableDatasets.map((ds) => {
                  const isSelected = ds.id === currentDataset.id;
                  return (
                    <button
                      key={ds.id}
                      onClick={() => handleSelectBenchmark(ds.id)}
                      className={`p-3.5 rounded-lg border text-left transition flex flex-col justify-between ${
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
                      <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/80 pt-2">
                        <span>{ds.channels.length} canais FDS</span>
                        <span>0 a {ds.durationSec}s</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: INTERFACE DE POSICIONAMENTO DE PROBES (SENSORES VIRTUAIS 2D / 3D) */}
          {activeTab === 'probe_placement' && (
            <div className="space-y-4">
              {/* Header Status & Action Bar */}
              <div className="p-4 bg-slate-950/90 rounded-xl border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/40 rounded-lg">
                    <MapPin className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Instrumentação Virtual de CFD & FDS (Posicionamento de Sensores)
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {cfdSolver.probes.length} Sondas Ativas
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Clique em qualquer ponto da planta 2D para posicionar sensores virtuais e monitorar temperatura (°C), visibilidade (m) e gases em tempo real.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setProbePlacementMode('place_new');
                      setSelectedProbeId(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      probePlacementMode === 'place_new'
                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-rose-300" /> + Adicionar Nova Sonda
                  </button>
                  <button
                    onClick={() => setProbePlacementMode('inspect')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      probePlacementMode === 'inspect'
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <Crosshair className="w-4 h-4 text-cyan-300" /> Inspecionar / Mover
                  </button>
                </div>
              </div>

              {/* Presets Quick-Placement Bar */}
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> Atalhos Táticos:
                </span>
                {[
                  { name: '🔥 Quarto 408 (Foco)', label: 'Origem do Incêndio / Leito 408', x: 21, y: 15 },
                  { name: '🏢 Corredor Posto Enfermagem', label: 'Eixo Central / Posto Enfermagem', x: 18, y: 10 },
                  { name: '🚪 Escada Norte (Fuga A)', label: 'Entrada da Escada Norte', x: 3, y: 3 },
                  { name: '🛡️ Escada Sul Pressurizada', label: 'Escada de Incêndio Pressurizada', x: 3, y: 16 },
                  { name: '🏥 Área Refúgio Leste (P-90)', label: 'Setor Seguro Estanque / Leste', x: 31, y: 10 },
                  { name: '🛏️ Leito UTI 402', label: 'Ala Oeste / Leito Crítico 402', x: 12, y: 15 }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newP = cfdSolver.addCustomProbe(preset.name, preset.label, preset.x, preset.y, 1.8);
                      setSelectedProbeId(newP.id);
                      setProbeChangeCounter(c => c + 1);
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition flex items-center gap-1 font-medium text-[11px]"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Main Workspace: Interactive 2D Floor Plan (Left) + Selected Probe Editor (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 2D Interactive Floor Plan Canvas / SVG (8 Cols) */}
                <div className="lg:col-span-8 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white uppercase tracking-wider">
                        Planta Baixa 2D do 4º Pavimento (Grade CFD 36m x 20m)
                      </span>
                    </div>
                    {hoveredCell ? (
                      <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 text-[11px]">
                        X: {hoveredCell.worldX >= 0 ? '+' : ''}{hoveredCell.worldX}m | Z: {hoveredCell.worldZ >= 0 ? '+' : ''}{hoveredCell.worldZ}m (Grade {hoveredCell.gridX}, {hoveredCell.gridY})
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">
                        Passe o mouse ou clique para posicionar
                      </span>
                    )}
                  </div>

                  {/* Interactive SVG Hospital Floor */}
                  <div className="relative w-full aspect-[36/20] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner select-none cursor-crosshair">
                    <svg
                      viewBox="0 0 720 400"
                      className="w-full h-full"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const px = e.clientX - rect.left;
                        const py = e.clientY - rect.top;
                        const gx = Math.max(0, Math.min(35, Math.floor((px / rect.width) * 36)));
                        const gy = Math.max(0, Math.min(19, Math.floor((py / rect.height) * 20)));
                        const wx = Math.round((gx - 18) * 1.0 * 10) / 10;
                        const wz = Math.round((gy - 10) * 1.0 * 10) / 10;
                        setHoveredCell({ gridX: gx, gridY: gy, worldX: wx, worldZ: wz });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const px = e.clientX - rect.left;
                        const py = e.clientY - rect.top;
                        const gx = Math.max(0, Math.min(35, Math.floor((px / rect.width) * 36)));
                        const gy = Math.max(0, Math.min(19, Math.floor((py / rect.height) * 20)));

                        if (probePlacementMode === 'place_new') {
                          const p = cfdSolver.addCustomProbe(newProbeName, newProbeLocation, gx, gy, newProbeHeight);
                          setSelectedProbeId(p.id);
                          setProbePlacementMode('inspect');
                          setProbeChangeCounter(c => c + 1);
                        } else if (selectedProbeId) {
                          cfdSolver.updateProbePosition(selectedProbeId, gx, gy);
                          setProbeChangeCounter(c => c + 1);
                        }
                      }}
                    >
                      {/* Finite Volume CFD Cells Background */}
                      {cfdSolver.grid.map((row, y) =>
                        row.map((cell, x) => {
                          const px = x * 20;
                          const py = y * 20;
                          let fill = '#0a0f1d';
                          if (cell.isWall) fill = '#1e293b';
                          else if (cell.isFireSource) fill = '#7f1d1d';
                          else if (cell.isRefugeZone) fill = '#064e3b';
                          else if (cell.tempC > 150) fill = '#991b1b';
                          else if (cell.tempC > 60) fill = '#c2410c';
                          else if (cell.tempC > 38) fill = '#854d0e';
                          else if (y >= 8 && y <= 11) fill = '#172554'; // corridor

                          return (
                            <rect
                              key={`${x}-${y}`}
                              x={px}
                              y={py}
                              width={20}
                              height={20}
                              fill={fill}
                              stroke="#0f172a"
                              strokeWidth={0.5}
                              opacity={cell.isWall ? 1.0 : 0.85}
                            />
                          );
                        })
                      )}

                      {/* Floor Compartment Labels */}
                      <text x="440" y="325" fill="#fca5a5" fontSize="11" fontWeight="bold">
                        🔥 Quarto 408 (Incêndio)
                      </text>
                      <text x="360" y="200" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">
                        Corredor Central de Evacuação
                      </text>
                      <text x="630" y="200" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle">
                        Área de Refúgio Leste (P-90)
                      </text>
                      <text x="65" y="70" fill="#f87171" fontSize="10" fontWeight="bold">
                        Escada Norte
                      </text>
                      <text x="65" y="335" fill="#34d399" fontSize="10" fontWeight="bold">
                        Escada Sul (+50 Pa)
                      </text>

                      {/* Hover Crosshair Preview */}
                      {hoveredCell && (
                        <g>
                          <rect
                            x={hoveredCell.gridX * 20}
                            y={hoveredCell.gridY * 20}
                            width={20}
                            height={20}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeDasharray="3 2"
                          />
                        </g>
                      )}

                      {/* Render All Probes on Floor Plan */}
                      {cfdSolver.probes.map((probe) => {
                        const cx = probe.gridX * 20 + 10;
                        const cy = probe.gridY * 20 + 10;
                        const isSelected = selectedProbeId === probe.id;
                        const statusColor =
                          probe.tenabilityStatus === 'tenivel'
                            ? '#10b981'
                            : probe.tenabilityStatus === 'alerta_moderado'
                            ? '#f59e0b'
                            : '#ef4444';

                        return (
                          <g
                            key={probe.id}
                            className="cursor-pointer transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProbeId(probe.id);
                            }}
                          >
                            {/* Halo ring if selected */}
                            {isSelected && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={18}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2.5"
                                strokeDasharray="4 2"
                                className="animate-spin"
                              />
                            )}

                            {/* Base Pulsing Circle */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={12}
                              fill={statusColor}
                              fillOpacity={0.25}
                              stroke={statusColor}
                              strokeWidth={1.5}
                            />

                            {/* Pin Core */}
                            <circle cx={cx} cy={cy} r={6.5} fill={statusColor} />
                            <circle cx={cx} cy={cy} r={2.5} fill="#ffffff" />

                            {/* Probe Info Badge Tag */}
                            <g transform={`translate(${cx}, ${cy - 16})`}>
                              <rect
                                x="-52"
                                y="-18"
                                width="104"
                                height="18"
                                rx="4"
                                fill="#020617"
                                fillOpacity="0.92"
                                stroke={isSelected ? '#38bdf8' : statusColor}
                                strokeWidth={isSelected ? 1.8 : 1}
                              />
                              <text
                                x="0"
                                y="-6"
                                fill="#f8fafc"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {probe.tempC}°C • {probe.visibilityM}m
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tenível (&lt;38°C)
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" /> Alerta (38–60°C)
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-2" /> Inabitável (&gt;60°C)
                    </span>
                    <span className="font-mono text-slate-500">
                      Escala: 1 célula = 1.0m x 1.0m
                    </span>
                  </div>
                </div>

                {/* Selected Probe Configuration Card (4 Cols) */}
                <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                  {selectedProbeId ? (
                    (() => {
                      const probe = cfdSolver.probes.find(p => p.id === selectedProbeId) || cfdSolver.probes[0];
                      if (!probe) return null;

                      const worldX = Math.round((probe.gridX - 18) * 10) / 10;
                      const worldZ = Math.round((probe.gridY - 10) * 10) / 10;

                      return (
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-rose-400" />
                              <span className="font-bold text-white text-xs uppercase tracking-wider">
                                Parâmetros do Sensor
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                probe.tenabilityStatus === 'tenivel'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : probe.tenabilityStatus === 'alerta_moderado'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400 animate-pulse'
                              }`}
                            >
                              {probe.tenabilityStatus === 'tenivel' ? 'Tenível' : probe.tenabilityStatus === 'alerta_moderado' ? 'Alerta' : 'Crítico'}
                            </span>
                          </div>

                          {/* Probe Name Input */}
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Nome da Sonda:
                            </label>
                            <input
                              type="text"
                              value={probe.name}
                              onChange={(e) => {
                                probe.name = e.target.value;
                                setProbeChangeCounter(c => c + 1);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-rose-500 font-medium"
                            />
                          </div>

                          {/* Compartment Label */}
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Compartimento / Setor:
                            </label>
                            <input
                              type="text"
                              value={probe.locationLabel}
                              onChange={(e) => {
                                probe.locationLabel = e.target.value;
                                setProbeChangeCounter(c => c + 1);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-rose-500 font-medium"
                            />
                          </div>

                          {/* Vertical Height (Z) Selector */}
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Cota de Altura do Sensor (Estratificação Vertical):
                            </label>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              {[
                                { h: 0.5, label: '0.5m (Leito/Piso)' },
                                { h: 1.2, label: '1.2m (Cadeirante)' },
                                { h: 1.8, label: '1.8m (Em Pé / Fuga)' },
                                { h: 2.4, label: '2.4m (Teto / Forro)' }
                              ].map(({ h, label }) => (
                                <button
                                  key={h}
                                  onClick={() => {
                                    cfdSolver.updateProbePosition(probe.id, probe.gridX, probe.gridY, h);
                                    setProbeChangeCounter(c => c + 1);
                                  }}
                                  className={`p-1.5 rounded-md border text-center transition font-semibold ${
                                    (probe.heightM || 1.8) === h
                                      ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Coordinate Nudging & Display */}
                          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-slate-400">Coordenadas Métricas:</span>
                              <strong className="text-cyan-300">
                                X: {worldX >= 0 ? '+' : ''}{worldX}m | Z: {worldZ >= 0 ? '+' : ''}{worldZ}m
                              </strong>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  cfdSolver.updateProbePosition(probe.id, probe.gridX - 1, probe.gridY);
                                  setProbeChangeCounter(c => c + 1);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                                title="Mover para Oeste (-1m)"
                              >
                                ◄
                              </button>
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    cfdSolver.updateProbePosition(probe.id, probe.gridX, probe.gridY - 1);
                                    setProbeChangeCounter(c => c + 1);
                                  }}
                                  className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                                  title="Mover para Norte (-1m)"
                                >
                                  ▲
                                </button>
                                <button
                                  onClick={() => {
                                    cfdSolver.updateProbePosition(probe.id, probe.gridX, probe.gridY + 1);
                                    setProbeChangeCounter(c => c + 1);
                                  }}
                                  className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                                  title="Mover para Sul (+1m)"
                                >
                                  ▼
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  cfdSolver.updateProbePosition(probe.id, probe.gridX + 1, probe.gridY);
                                  setProbeChangeCounter(c => c + 1);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                                title="Mover para Leste (+1m)"
                              >
                                ►
                              </button>
                            </div>
                          </div>

                          {/* Live Readings Metric Badges */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Temperatura:</span>
                              <span className="text-base font-black text-rose-400 font-mono">
                                {probe.tempC}°C
                              </span>
                            </div>
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Visibilidade:</span>
                              <span className="text-base font-black text-cyan-400 font-mono">
                                {probe.visibilityM} m
                              </span>
                            </div>
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Monóxido CO:</span>
                              <span className="text-base font-black text-amber-400 font-mono">
                                {probe.coPpm} ppm
                              </span>
                            </div>
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Toxicidade FED:</span>
                              <span className="text-base font-black text-purple-400 font-mono">
                                {probe.fedToxicity}
                              </span>
                            </div>
                          </div>

                          {/* Delete Probe Button */}
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                cfdSolver.removeProbe(probe.id);
                                setSelectedProbeId(cfdSolver.probes[0]?.id || null);
                                setProbeChangeCounter(c => c + 1);
                              }}
                              className="w-full py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 font-semibold flex items-center justify-center gap-1.5 transition text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Esta Sonda
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12 space-y-2 text-slate-400">
                      <Crosshair className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs">Nenhuma sonda selecionada.</p>
                      <p className="text-[11px] text-slate-500">
                        Clique em uma sonda na planta ou selecione &quot;Adicionar Nova Sonda&quot;.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Live Telemetry Probes Table */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Painel Geral de Sondas CFD (Tempo Real {currentTime}s)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Critérios de Tenibilidade: NFPA 101 & ISO 13571
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                      <tr>
                        <th className="p-2.5">Sonda / Compartimento</th>
                        <th className="p-2.5">Coordenadas</th>
                        <th className="p-2.5">Altura (Z)</th>
                        <th className="p-2.5">Temperatura (°C)</th>
                        <th className="p-2.5">Visibilidade</th>
                        <th className="p-2.5">CO & FED</th>
                        <th className="p-2.5">Tenibilidade</th>
                        <th className="p-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {cfdSolver.probes.map((probe) => {
                        const isSelected = selectedProbeId === probe.id;
                        const worldX = Math.round((probe.gridX - 18) * 10) / 10;
                        const worldZ = Math.round((probe.gridY - 10) * 10) / 10;

                        return (
                          <tr
                            key={probe.id}
                            className={`transition ${
                              isSelected
                                ? 'bg-indigo-950/40 text-white font-semibold'
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            <td className="p-2.5">
                              <div className="font-bold text-slate-100">{probe.name}</div>
                              <div className="text-[10px] text-slate-400">{probe.locationLabel}</div>
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-400">
                              {worldX >= 0 ? '+' : ''}{worldX}m, {worldZ >= 0 ? '+' : ''}{worldZ}m
                            </td>
                            <td className="p-2.5 font-mono text-slate-300">
                              {probe.heightM || 1.8} m
                            </td>
                            <td className="p-2.5 font-mono">
                              <span
                                className={`font-bold ${
                                  probe.tempC >= 60
                                    ? 'text-rose-400 font-black'
                                    : probe.tempC >= 38
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {probe.tempC} °C
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-cyan-300 font-bold">
                              {probe.visibilityM} m
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              <span className="text-amber-300">{probe.coPpm} ppm</span> / <span className="text-purple-300">FED {probe.fedToxicity}</span>
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  probe.tenabilityStatus === 'tenivel'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : probe.tenabilityStatus === 'alerta_moderado'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                                }`}
                              >
                                {probe.tenabilityStatus === 'tenivel'
                                  ? 'Tenível'
                                  : probe.tenabilityStatus === 'alerta_moderado'
                                  ? 'Alerta'
                                  : 'Inabitável'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => setSelectedProbeId(probe.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] border border-slate-700 transition"
                              >
                                Inspecionar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Educational / Standard Note */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-start gap-2.5 text-slate-400 text-[11px]">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Física FDS e Estratificação Térmica em Hospitais:</strong> No FDS, a liberação de calor gera empuxo convectivo que transporta fumaça e gases aquecidos ao teto, formando a camada quente superior (hot gas layer). O diferencial de temperatura vertical (&Delta;T = T_teto - T_piso) dita a velocidade de descida da fumaça no corredor e comprova a eficácia de manter pacientes acamados sob proteção ou evacuar rastejando abaixo de 1.20m.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-slate-500 text-xs">
            NIST Fire Dynamics Simulator v6.8 • Formatos Suportados: FDS _devc.csv, _hrr.csv, JSON
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition"
          >
            Fechar Painel FDS
          </button>
        </div>
      </div>
    </div>
  );
};
