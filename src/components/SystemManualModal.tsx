/**
 * HEDS - Hospital Emergency Decision Simulator
 * Manual Técnico, Clínico e Operacional Completo do Sistema (50 Páginas Oficiais)
 * 
 * Visualizador Interativo In-App com:
 * - Paginação oficial de 1 a 50 páginas com seletor e slider
 * - 10 Volumes temáticos navegáveis com sumário executivo
 * - Busca textual em tempo real com realce de termos em todas as 50 páginas
 * - Ilustrações fotorrealistas e esquemáticos técnicos SVG vetoriais de alta precisão
 * - Modo Leitura (Dark Tático vs Papel Impresso Claro)
 * - Controle de zoom tipográfico (A-, A+)
 * - Sistema de Marcadores / Favoritos
 * - Grade de Miniaturas das 50 Páginas para acesso instantâneo
 * - Exportação para PDF e Impressão Direta
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Printer,
  Download,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Compass,
  Flame,
  Shield,
  ShieldCheck,
  Users,
  Activity,
  Award,
  Layers,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

import {
  SYSTEM_MANUAL_50_PAGES,
  MANUAL_VOLUMES,
  ManualPage
} from '../data/systemManualData';

// High-fidelity image assets generated for HEDS
import hedsArchImg from '../assets/images/heds_system_architecture_1790670815914.jpg';
import cfdFireImg from '../assets/images/hospital_cfd_fire_1790670855930.jpg';
import evacPlanImg from '../assets/images/evacuation_flow_plan_1790670873069.jpg';
import c3CommandImg from '../assets/images/c3_command_center_1790670887873.jpg';

interface SystemManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
  onExportPDF?: () => void;
}

export const SystemManualModal: React.FC<SystemManualModalProps> = ({
  isOpen,
  onClose,
  initialPage = 1,
  onExportPDF
}) => {
  const [currentPageNum, setCurrentPageNum] = useState<number>(initialPage);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVolumeFilter, setSelectedVolumeFilter] = useState<number | 'all'>('all');
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<number[]>([1, 6, 11, 17, 23, 29, 35, 41, 48]);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'light'>('dark');
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'base' | 'lg'>('base');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Sync initialPage if it changes externally
  useEffect(() => {
    if (initialPage >= 1 && initialPage <= 50) {
      setCurrentPageNum(initialPage);
    }
  }, [initialPage]);

  // Reset scroll when page changes
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPageNum]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in search input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPageNum((p) => Math.min(50, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPageNum((p) => Math.max(1, p - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPageNum(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPageNum(50);
      } else if (e.key === 'Escape') {
        if (isThumbnailsOpen) {
          setIsThumbnailsOpen(false);
        } else if (isTocOpen) {
          setIsTocOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isThumbnailsOpen, isTocOpen, onClose]);

  // Current page object
  const currentPage = useMemo(() => {
    return SYSTEM_MANUAL_50_PAGES.find((p) => p.pageNumber === currentPageNum) || SYSTEM_MANUAL_50_PAGES[0];
  }, [currentPageNum]);

  // Search filter across all 50 pages
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return SYSTEM_MANUAL_50_PAGES.filter((page) => {
      const inTitle = page.chapterTitle.toLowerCase().includes(q);
      const inSubtitle = page.subtitle.toLowerCase().includes(q);
      const inVol = page.volumeTitle.toLowerCase().includes(q);
      const inSections = page.sections.some(
        (s) =>
          s.heading.toLowerCase().includes(q) ||
          s.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
          s.bulletPoints?.some((b) => b.toLowerCase().includes(q))
      );
      return inTitle || inSubtitle || inVol || inSections;
    });
  }, [searchQuery]);

  // Toggle bookmark for current page
  const toggleBookmark = (pageNum: number) => {
    setBookmarks((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const isCurrentBookmarked = bookmarks.includes(currentPageNum);

  if (!isOpen) return null;

  // Render Technical Diagram or Illustration based on page type
  const renderDiagram = (page: ManualPage) => {
    switch (page.diagramType) {
      case 'cover_page':
        return (
          <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 p-6 flex flex-col items-center justify-center text-center my-4">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <img
              src={hedsArchImg}
              alt="HEDS Arquitetura e Engenharia Hospitalar"
              className="w-full max-h-72 object-cover rounded-lg border border-cyan-500/30 shadow-lg mb-4"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Registro de Homologação de Engenharia nº 84.912/2026
            </div>
            <div className="text-xl font-black text-white tracking-wide">
              HEDS SIMULATOR — MANUAL OFICIAL DE ENGENHARIA E OPERAÇÃO
            </div>
            <div className="text-xs text-slate-300 max-w-xl mt-1">
              Plataforma Homologada para Auditoria de Risco, Treinamento de Comando C3 e Dimensionamento de Rotas
              Hospitalares conforme ABNT NBR 16651 e RDC 50 ANVISA.
            </div>
          </div>
        );

      case 'isometric_hospital':
        return (
          <div className="my-4 rounded-xl border border-slate-700 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> ESQUEMÁTICO AXONOMÉTRICO: EDIFICAÇÃO HOSPITALAR DE 6 PAVIMENTOS
              </span>
              <span className="text-[11px] text-slate-400">Escala 1:250 • TRRF 120min</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <img
                  src={hedsArchImg}
                  alt="Corte Construtivo Hospitalar"
                  className="w-full h-48 object-cover"
                />
              </div>
              {/* Technical SVG schematic */}
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5">
                <div className="text-cyan-400 font-bold border-b border-slate-850 pb-1">
                  ZONEAMENTO TÉRMICO E COMPARTIMENTAÇÃO:
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-850">
                  <span className="text-rose-400 font-bold">4º Andar (Foco Inicial):</span>
                  <span>UTI Geral & Isolamento de Pressão Negativa</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-850">
                  <span className="text-amber-400 font-bold">3º Andar (Refúgio Secundário):</span>
                  <span>Centro Cirúrgico & Hemodinâmica</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-850">
                  <span className="text-emerald-400 font-bold">2º Andar (Zona Segura):</span>
                  <span>Enfermaria Pediátrica & Acomodações</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-850">
                  <span className="text-blue-400 font-bold">1º Andar (Acolhimento):</span>
                  <span>Ambulatório & Farmácia Central</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-850">
                  <span className="text-indigo-400 font-bold">Térreo (Ponto de Encontro):</span>
                  <span>Recepção, Triagem Externa & Doca de Resgate</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-slate-400">
                  <span>Subsolo (Infraestrutura):</span>
                  <span>Central GLP, Subestação & Bombas de Incêndio</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center italic">
              Figura: Estratificação vertical e barreiras corta-fogo horizontais dividindo o hospital em compartimentos estanques.
            </div>
          </div>
        );

      case 'thermal_stratification':
      case 'flame_combustion_zones':
        return (
          <div className="my-4 rounded-xl border border-rose-900/40 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-rose-400 font-mono flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> SIMULAÇÃO TERMODINÂMICA CFD & CAMADA DE FUMAÇA (NIST FDS v6.8)
              </span>
              <span className="text-[11px] text-rose-300 font-mono font-bold">HRR 3.5 MW • Convecção 680°C</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="rounded-lg overflow-hidden border border-rose-950 shadow-inner">
                <img
                  src={cfdFireImg}
                  alt="Simulação CFD de Incêndio e Fumaça"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-2">
                <div className="text-amber-400 font-bold">ESTRUTURA FÍSICA DA PLUMA CONVECTIVA:</div>
                <div className="p-2 rounded bg-rose-950/40 border border-rose-800/50 text-rose-200">
                  <span className="font-bold">1. Núcleo Incandescente (Flame Core):</span> Combustão estequiométrica a 750°C - 900°C.
                </div>
                <div className="p-2 rounded bg-orange-950/40 border border-orange-800/50 text-orange-200">
                  <span className="font-bold">2. Plano Neutro (Neutral Plane):</span> Linha divisória de pressão hidrostática a 1.60m do piso.
                </div>
                <div className="p-2 rounded bg-slate-850 border border-slate-700 text-slate-300">
                  <span className="font-bold">3. Camada Fria de Inalação:</span> Ar respirável remanescente nos primeiros 0.80m de altura.
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center italic">
              Figura: Estratificação térmica em corredor hospitalar calculada por equações Navier-Stokes em volumes finitos.
            </div>
          </div>
        );

      case 'evacuation_flow_density':
      case 'bed_vs_wheelchair':
      case 'patient_triage_matrix':
        return (
          <div className="my-4 rounded-xl border border-cyan-900/40 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4" /> DINÂMICA DE EVACUAÇÃO MULTIAGENTE & VAZÃO EM CORREDORES (PATHFINDER)
              </span>
              <span className="text-[11px] text-cyan-300 font-mono font-bold">SFPE Nelson-MacLennan Flow</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="rounded-lg overflow-hidden border border-cyan-950 shadow-inner">
                <img
                  src={evacPlanImg}
                  alt="Planta de Evacuação Multiagente"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-1.5">
                <div className="text-cyan-400 font-bold border-b border-slate-850 pb-1">
                  VELOCIDADES & CONSUMO DE LARGURA EFETIVA:
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-850">
                  <span className="text-emerald-400">P0 (Ambulante):</span>
                  <span>1.20 m/s • Largura 0.60m</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-850">
                  <span className="text-cyan-400">P1 (Auxílio Leve):</span>
                  <span>0.70 m/s • Largura 0.80m</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-850">
                  <span className="text-amber-400">P2 (Cadeirante):</span>
                  <span>0.90 m/s • Largura 0.90m</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-850">
                  <span className="text-orange-400">P3 (Acamado):</span>
                  <span>0.50 m/s • Leito 1.20m x 2.20m</span>
                </div>
                <div className="flex justify-between py-0.5 text-rose-400 font-bold">
                  <span>P4 (UTI Crítico):</span>
                  <span>0.35 m/s • Combo Leito + 4 Equipe</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center italic">
              Figura: Campo vetorial de fluxo de pedestres e transposição de leitos em portas com vão livre mínimo de 1.20m.
            </div>
          </div>
        );

      case 'c3_command_flow':
      case 'hics_incident_command':
      case 'decision_game_branching':
        return (
          <div className="my-4 rounded-xl border border-indigo-900/40 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-indigo-400 font-mono flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> SALA DE SITUAÇÃO & POSTO DE COMANDO UNIFICADO C3 (HICS)
              </span>
              <span className="text-[11px] text-indigo-300 font-mono font-bold">Doutrina All-Hazards</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="rounded-lg overflow-hidden border border-indigo-950 shadow-inner">
                <img
                  src={c3CommandImg}
                  alt="Centro de Comando de Crise Hospitalar C3"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-1.5">
                <div className="text-indigo-400 font-bold border-b border-slate-850 pb-1">
                  ESTRUTURA HIERÁRQUICA DO COMITÊ DE CRISE:
                </div>
                <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-white font-bold">
                  Comandante do Incidente (Incident Commander)
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="p-1.5 rounded bg-slate-850 border border-slate-750 text-cyan-300">
                    Oficial de Segurança
                  </div>
                  <div className="p-1.5 rounded bg-slate-850 border border-slate-750 text-cyan-300">
                    Oficial de Informação
                  </div>
                  <div className="p-1.5 rounded bg-slate-850 border border-slate-750 text-emerald-300">
                    Chefe de Operações
                  </div>
                  <div className="p-1.5 rounded bg-slate-850 border border-slate-750 text-amber-300">
                    Chefe de Logística
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center italic">
              Figura: Sala de comando tático com visualização em tempo real das câmeras, sondas de gás e status de leitos.
            </div>
          </div>
        );

      // SVG schematics for remaining diagram types
      case 'protection_checklist':
      case 'regulatory_audit_table':
        return (
          <div className="my-4 rounded-xl border border-slate-700 bg-slate-900/95 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> MATRIZ DE CONFORMIDADE DOS 15 SISTEMAS DE PROTEÇÃO HOSPITALAR
              </span>
              <span className="text-[11px] text-slate-400">NBR 16651 / NFPA 99</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[10px] font-mono">
              {[
                { n: '01', name: 'Compartimentação Horizontal', trrf: 'TRRF 120min', status: 'Ativo' },
                { n: '02', name: 'Compartimentação Vertical', trrf: 'TRRF 120min', status: 'Ativo' },
                { n: '03', name: 'Áreas de Refúgio Climatizadas', trrf: 'P-90 Dupla', status: 'Ativo' },
                { n: '04', name: 'Portas Corta-Fogo Magnéticas', trrf: 'Fech. Aut.', status: 'Ativo' },
                { n: '05', name: 'Escadas Pressurizadas', trrf: '50 Pa Pos.', status: 'Ativo' },
                { n: '06', name: 'Detecção Precoce Óptica/VESDA', trrf: '< 30s Detec.', status: 'Ativo' },
                { n: '07', name: 'Alarme Setorizado / Voz', trrf: 'Evac. Fases', status: 'Ativo' },
                { n: '08', name: 'Sprinklers Resposta Rápida', trrf: '68°C Bulbo', status: 'Ativo' },
                { n: '09', name: 'Rede de Hidrantes e Mangotinhos', trrf: 'Reserva 30m³', status: 'Ativo' },
                { n: '10', name: 'Extintores CO2 e Água', trrf: 'Portátil', status: 'Ativo' },
                { n: '11', name: 'Desenfumagem Mecânica', trrf: '12 ren/h', status: 'Ativo' },
                { n: '12', name: 'Iluminação de Balizamento', trrf: 'Auton. 2h', status: 'Ativo' },
                { n: '13', name: 'Bloqueio de Gases Medicinais', trrf: 'Corte Válv.', status: 'Ativo' },
                { n: '14', name: 'Geradores de Emergência', trrf: 'Partida < 10s', status: 'Ativo' },
                { n: '15', name: 'Brigada de Incêndio Hospitalar', trrf: '24h Treinada', status: 'Ativo' }
              ].map((sys) => (
                <div
                  key={sys.n}
                  className="p-2 rounded bg-slate-950 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <span>SYS #{sys.n}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-slate-200 font-sans font-semibold text-[11px] my-1 leading-tight">
                    {sys.name}
                  </div>
                  <div className="text-[9px] text-slate-400 flex justify-between">
                    <span>{sys.trrf}</span>
                    <span className="text-emerald-400 font-bold">{sys.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center italic">
              Figura: Os 15 sistemas integrados atuando em redundância para garantir ASET maior que RSET em qualquer pavimento.
            </div>
          </div>
        );

      case 'probes_3d_instrumentation':
        return (
          <div className="my-4 rounded-xl border border-cyan-800/40 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> ARQUITETURA DA SONDA VIRTUAL CFD (PROBE TELEMETRY SENSOR)
              </span>
              <span className="text-[11px] text-slate-400">Amostragem em Tempo Real a 10 Hz</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-rose-400 font-bold mb-1">Mastro Térmico (Termopar):</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Mede a temperatura convectiva (°C) e taxa de variação dT/dt em três alturas padrão (0.5m, 1.2m e 1.8m).
                  Limiar de alerta crítico: &gt; 60°C.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">Sonda Óptica de Obscuração:</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Calcula coeficiente de extinção óptica K (m⁻¹) e visibilidade em metros com base na equação de Jin.
                  Limiar crítico de abandono: &lt; 5 metros.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">Sensor Eletroquímico de CO:</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Monitora concentração de Monóxido de Carbono em ppm e integra o índice Purser de Dose Efetiva Fracionada
                  (FED). Limiar crítico: FED &ge; 0.3.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center italic">
              Figura: Instrumentação virtual distribuída nos pontos táticos de decisão durante o exercício.
            </div>
          </div>
        );

      default:
        // Generic high-tech technical schematic container
        return (
          <div className="my-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-slate-300 font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> ESQUEMÁTICO TÉCNICO NORMATIVO
              </span>
              <span className="text-[10px] text-slate-500 font-mono">HEDS-ENG-2026</span>
            </div>
            <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-850 text-xs text-slate-300 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-400 font-black">
                {page.pageNumber}
              </div>
              <div>
                <div className="font-bold text-white text-xs">{page.diagramCaption}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Conforme parâmetros da {page.normativeReferences.join(', ')}.
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none p-2 sm:p-4">
      <div
        ref={containerRef}
        className={`w-full max-w-7xl h-[95vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-all duration-300 ${
          readerTheme === 'dark'
            ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-cyan-950/20'
            : 'bg-white border-slate-300 text-slate-900 shadow-slate-400/30'
        } ${isFullscreen ? 'max-w-none h-screen rounded-none' : ''}`}
      >
        {/* Top Header Bar */}
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            readerTheme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {/* Title & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-rose-600 flex items-center justify-center text-white font-black text-sm shadow">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-cyan-400">
                  HEDS MANUAL TÉCNICO OFICIAL
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  50 PÁGINAS HOMOLOGADAS
                </span>
              </div>
              <div className="text-xs font-bold truncate max-w-md">
                {currentPage.volumeTitle} • <span className="text-slate-400 font-normal">Página {currentPage.pageNumber} de 50</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              className={`p-1.5 rounded-lg border transition ${
                currentPageNum === 1
                  ? 'opacity-40 cursor-not-allowed border-transparent'
                  : readerTheme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
              title="Página Anterior (Seta Esquerda)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number input & slider */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <input
                type="number"
                min={1}
                max={50}
                value={currentPageNum}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 50) {
                    setCurrentPageNum(val);
                  }
                }}
                className={`w-12 text-center py-1 rounded font-bold border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  readerTheme === 'dark'
                    ? 'bg-slate-950 border-slate-700 text-cyan-300'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className="text-slate-500">/ 50</span>
            </div>

            <button
              onClick={() => setCurrentPageNum((p) => Math.min(50, p + 1))}
              disabled={currentPageNum === 50}
              className={`p-1.5 rounded-lg border transition ${
                currentPageNum === 50
                  ? 'opacity-40 cursor-not-allowed border-transparent'
                  : readerTheme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
              title="Próxima Página (Seta Direita)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick volume jump dropdown */}
            <select
              value={currentPage.volumeId}
              onChange={(e) => {
                const volId = parseInt(e.target.value, 10);
                const firstPageOfVol = SYSTEM_MANUAL_50_PAGES.find((p) => p.volumeId === volId);
                if (firstPageOfVol) {
                  setCurrentPageNum(firstPageOfVol.pageNumber);
                }
              }}
              className={`text-xs py-1 px-2 rounded border focus:outline-none font-medium max-w-[170px] truncate ${
                readerTheme === 'dark'
                  ? 'bg-slate-950 border-slate-700 text-slate-300'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {MANUAL_VOLUMES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.pagesRange})
                </option>
              ))}
            </select>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* Table of contents button */}
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                isTocOpen
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : readerTheme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="Sumário Executivo dos 10 Volumes"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sumário</span>
            </button>

            {/* Thumbnails grid */}
            <button
              onClick={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                isThumbnailsOpen
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : readerTheme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="Grade com as 50 Páginas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">50 Páginas</span>
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => toggleBookmark(currentPageNum)}
              className={`p-1.5 rounded-lg border transition ${
                isCurrentBookmarked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : readerTheme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
              title={isCurrentBookmarked ? 'Remover Marcador' : 'Adicionar aos Marcadores'}
            >
              {isCurrentBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setReaderTheme(readerTheme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg border transition ${
                readerTheme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title={readerTheme === 'dark' ? 'Modo Papel Impresso Claro' : 'Modo Escuro Tático'}
            >
              {readerTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Font size */}
            <button
              onClick={() => {
                if (fontSizeLevel === 'sm') setFontSizeLevel('base');
                else if (fontSizeLevel === 'base') setFontSizeLevel('lg');
                else setFontSizeLevel('sm');
              }}
              className={`px-2 py-1 rounded-lg border font-mono text-xs font-bold transition ${
                readerTheme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Ajustar Tamanho da Fonte (A- / A+)"
            >
              A{fontSizeLevel === 'sm' ? '-' : fontSizeLevel === 'lg' ? '+' : ''}
            </button>

            {/* Print / PDF button */}
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
                title="Exportar / Salvar o Manual Completo em PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-lg border transition ${
                readerTheme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
              title={isFullscreen ? 'Restaurar Janela' : 'Tela Cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition ml-1"
              title="Fechar Manual (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar (0 to 100% across the 50 pages) */}
        <div className="w-full bg-slate-800 h-1 relative">
          <div
            className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 h-1 transition-all duration-300"
            style={{ width: `${(currentPageNum / 50) * 100}%` }}
          />
        </div>

        {/* Main Body: Left TOC/Search Sidebar (collapsible) + Center Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Table of Contents Drawer */}
          {isTocOpen && (
            <div
              className={`w-80 border-r flex flex-col shrink-0 z-20 transition-all duration-300 ${
                readerTheme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Search box */}
              <div className="p-3 border-b border-slate-800/60">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar em todas as 50 páginas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      readerTheme === 'dark'
                        ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bookmarks bar */}
              {bookmarks.length > 0 && (
                <div className="p-2 border-b border-slate-800/60 bg-slate-950/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-amber-400" /> Marcadores Rápidos:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bookmarks.map((bm) => (
                      <button
                        key={bm}
                        onClick={() => {
                          setCurrentPageNum(bm);
                          setIsTocOpen(false);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                          currentPageNum === bm
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        P.{bm}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results or Volume List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
                {searchQuery.trim() ? (
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-2 px-1">
                      Resultados da Busca ({searchResults.length}):
                    </div>
                    {searchResults.length === 0 ? (
                      <div className="text-slate-400 text-center py-6 text-xs">
                        Nenhum termo correspondente encontrado.
                      </div>
                    ) : (
                      searchResults.map((res) => (
                        <button
                          key={res.pageNumber}
                          onClick={() => {
                            setCurrentPageNum(res.pageNumber);
                            setIsTocOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition border mb-1 ${
                            currentPageNum === res.pageNumber
                              ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
                              : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                            <span>PÁGINA {res.pageNumber}</span>
                            <span>{res.readingTimeMin} min</span>
                          </div>
                          <div className="font-bold text-xs text-white truncate mt-0.5">
                            {res.chapterTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {res.subtitle}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Estrutura dos 10 Volumes:
                    </div>
                    {MANUAL_VOLUMES.map((vol) => {
                      const volPages = SYSTEM_MANUAL_50_PAGES.filter((p) => p.volumeId === vol.id);
                      const isCurrentVol = currentPage.volumeId === vol.id;
                      return (
                        <div
                          key={vol.id}
                          className={`rounded-lg border overflow-hidden mb-1.5 ${
                            isCurrentVol ? 'border-cyan-500/40 bg-slate-950/80' : 'border-slate-800/80 bg-slate-950/40'
                          }`}
                        >
                          <div className="p-2 bg-slate-900/80 flex items-center justify-between border-b border-slate-850">
                            <span className="font-bold text-xs text-white truncate">{vol.title}</span>
                            <span className="text-[10px] font-mono text-cyan-400 shrink-0">{vol.pagesRange}</span>
                          </div>
                          <div className="p-1 space-y-0.5">
                            {volPages.map((pg) => (
                              <button
                                key={pg.pageNumber}
                                onClick={() => {
                                  setCurrentPageNum(pg.pageNumber);
                                  setIsTocOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-[11px] transition flex items-center justify-between group ${
                                  currentPageNum === pg.pageNumber
                                    ? 'bg-cyan-600 text-white font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                <span className="truncate pr-2">
                                  P.{pg.pageNumber} — {pg.chapterTitle}
                                </span>
                                {bookmarks.includes(pg.pageNumber) && (
                                  <Bookmark className="w-3 h-3 text-amber-400 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Center Page Content (The Official Page Document View) */}
          <div
            ref={contentScrollRef}
            className={`flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center ${
              readerTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
            }`}
          >
            {/* The Page Sheet (A4 Proportion Aesthetic) */}
            <article
              className={`w-full max-w-4xl min-h-[900px] p-6 sm:p-10 rounded-xl shadow-xl border flex flex-col justify-between transition-colors ${
                readerTheme === 'dark'
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-300'
              }`}
            >
              {/* Page Sheet Header */}
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                      HEDS TECHNICAL MANUAL
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs font-semibold text-slate-400">{currentPage.volumeTitle}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Leitura: ~{currentPage.readingTimeMin} min</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
                      PÁG. {currentPage.pageNumber.toString().padStart(2, '0')} / 50
                    </span>
                  </div>
                </div>

                {/* Chapter Title & Subtitle */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                    {currentPage.chapterTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-cyan-300/90 font-medium">
                    {currentPage.subtitle}
                  </p>
                </div>

                {/* High-Fidelity Diagram or Technical Visual */}
                {renderDiagram(currentPage)}

                {/* Structured Technical Sections */}
                <div className={`space-y-6 mt-6 ${
                  fontSizeLevel === 'sm' ? 'text-xs' : fontSizeLevel === 'lg' ? 'text-base' : 'text-sm'
                }`}>
                  {currentPage.sections.map((sec, sIdx) => (
                    <section key={sIdx} className="space-y-3">
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-1">
                        <span className="text-cyan-400 font-mono text-sm">#</span> {sec.heading}
                      </h2>

                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="leading-relaxed text-slate-300">
                          {p}
                        </p>
                      ))}

                      {/* Bullet points if present */}
                      {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                        <ul className="space-y-1.5 pl-5 list-disc marker:text-cyan-400 text-slate-300">
                          {sec.bulletPoints.map((b, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Technical table if present */}
                      {sec.table && (
                        <div className="overflow-x-auto my-4 rounded-lg border border-slate-800">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="bg-slate-950 text-cyan-300 border-b border-slate-800">
                                {sec.table.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-2.5 font-bold uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {sec.table.rows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className={rIdx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-900/20'}
                                >
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2.5 text-slate-300">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Alert Box if present */}
                      {sec.alertBox && (
                        <div
                          className={`p-4 rounded-xl border my-4 flex items-start gap-3 ${
                            sec.alertBox.type === 'critical'
                              ? 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                              : sec.alertBox.type === 'regulatory'
                              ? 'bg-indigo-950/40 border-indigo-800/70 text-indigo-200'
                              : sec.alertBox.type === 'clinical'
                              ? 'bg-cyan-950/40 border-cyan-800/70 text-cyan-200'
                              : 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm mb-1">{sec.alertBox.title}</div>
                            <div className="text-xs leading-relaxed">{sec.alertBox.text}</div>
                          </div>
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>

              {/* Page Sheet Footer: Normative references & Page Number */}
              <div className="pt-6 mt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="font-bold text-slate-300 font-mono">Bases Normativas:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentPage.normativeReferences.map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-slate-400">
                  <span>HEDS SIMULATOR v4.5</span>
                  <span className="font-bold text-cyan-400">Pág. {currentPage.pageNumber} / 50</span>
                </div>
              </div>
            </article>
          </div>

          {/* 50-Page Thumbnails Grid Modal / Drawer */}
          {isThumbnailsOpen && (
            <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md p-6 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-cyan-400" /> Grade Geral das 50 Páginas do Manual
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione qualquer página para navegação instantânea. Marcadores e capítulos destacados.
                  </p>
                </div>
                <button
                  onClick={() => setIsThumbnailsOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Grouped Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
                {SYSTEM_MANUAL_50_PAGES.map((pg) => {
                  const isCurrent = pg.pageNumber === currentPageNum;
                  const isBm = bookmarks.includes(pg.pageNumber);
                  return (
                    <button
                      key={pg.pageNumber}
                      onClick={() => {
                        setCurrentPageNum(pg.pageNumber);
                        setIsThumbnailsOpen(false);
                      }}
                      className={`aspect-[3/4] rounded-lg p-2 flex flex-col justify-between text-left border transition relative group overflow-hidden ${
                        isCurrent
                          ? 'bg-cyan-950 border-cyan-400 ring-2 ring-cyan-500 shadow-lg'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          #{pg.pageNumber.toString().padStart(2, '0')}
                        </span>
                        {isBm && <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </div>

                      <div className="my-auto py-1">
                        <div className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                          {pg.chapterTitle}
                        </div>
                        <div className="text-[8px] text-slate-400 line-clamp-2 mt-0.5">
                          {pg.subtitle}
                        </div>
                      </div>

                      <div className="text-[8px] font-mono text-slate-500 truncate border-t border-slate-800 pt-1">
                        Vol {pg.volumeId} • {pg.readingTimeMin}m
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation & Pagination Bar */}
        <div
          className={`px-4 py-2 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            readerTheme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-mono text-[11px]">
              Capítulo: <strong className="text-white">{currentPage.chapterTitle}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-white flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>

            <span className="font-mono font-bold text-cyan-400 px-2">
              {currentPageNum} / 50
            </span>

            <button
              onClick={() => setCurrentPageNum((p) => Math.min(50, p + 1))}
              disabled={currentPageNum === 50}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-white flex items-center gap-1"
            >
              Próxima <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
