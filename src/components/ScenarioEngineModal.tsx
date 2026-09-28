/**
 * HEDS - Hospital Emergency Decision Simulator
 * Scenario Engine / Motor de Cenários
 * 
 * Allows instructors to assemble complex hospital emergency exercises without coding:
 * Incident -> Sector -> Floor -> Patients P0-P4 -> Injected Failures -> Algorithmic Event & Decision Generation
 */

import React, { useState } from 'react';
import {
  Scenario,
  ScenarioEvent,
  DecisionOption,
  ScenarioEngineFormConfig,
  Floor,
  Room
} from '../types';
import {
  Wand2,
  Flame,
  AlertTriangle,
  Building2,
  Users,
  ShieldAlert,
  Play,
  Save,
  CheckCircle2,
  X,
  Sliders,
  Layers,
  Sparkles,
  Zap,
  RotateCcw,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface ScenarioEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Floor[];
  rooms: Room[];
  onApplyScenario: (generatedScenario: Scenario, config: ScenarioEngineFormConfig) => void;
  onSaveScenarioToCatalog?: (scenario: Scenario) => void;
}

export function ScenarioEngineModal({
  isOpen,
  onClose,
  floors,
  rooms,
  onApplyScenario,
  onSaveScenarioToCatalog
}: ScenarioEngineModalProps) {
  // Scenario Generator Form State
  const [config, setConfig] = useState<ScenarioEngineFormConfig>({
    incidentType: 'incendio_uti_o2',
    sectorName: 'UTI Geral Adulto e Leitos de Cuidados Especiais',
    floorId: 4,
    originRoomNumber: '408',
    originRoomName: 'Quarto 408 (Isolamento / UTI)',
    totalPatientsCount: 12,
    patientsP0: 2, // Autônomos
    patientsP1: 3, // Mobilidade reduzida
    patientsP2: 2, // Cadeirantes
    patientsP3: 3, // Acamados
    patientsP4: 2, // Suporte de vida (ventilação mecânica)
    
    // Injected Contingencies
    sprinklerUnavailable: true,
    stairABlocked: true,
    stairBDoorHeldOpen: false,
    pressurizationFailure: false,
    elevatorFailure: false,
    reducedBrigade50: true,
    medicalGasValveStuck: true,
    smokeExtractionFailure: false,
    delayedAlarmDispatch: false,
    oxygenZoneRisk: true,

    difficultyLevel: 'avancado',
    instructorNotes: 'Exercício tático de alta exigência com falha de sprinkler, fumaça em rota de fuga e pacientes de alta dependência.'
  });

  const [generatedScenario, setGeneratedScenario] = useState<Scenario | null>(null);
  const [activeStep, setActiveStep] = useState<'config' | 'preview'>('config');

  if (!isOpen) return null;

  // Total patient verification
  const currentTotal = config.patientsP0 + config.patientsP1 + config.patientsP2 + config.patientsP3 + config.patientsP4;

  const handlePatientCountChange = (cat: 'P0' | 'P1' | 'P2' | 'P3' | 'P4', val: number) => {
    const newVal = Math.max(0, val);
    setConfig((prev) => {
      const updated = {
        ...prev,
        patientsP0: cat === 'P0' ? newVal : prev.patientsP0,
        patientsP1: cat === 'P1' ? newVal : prev.patientsP1,
        patientsP2: cat === 'P2' ? newVal : prev.patientsP2,
        patientsP3: cat === 'P3' ? newVal : prev.patientsP3,
        patientsP4: cat === 'P4' ? newVal : prev.patientsP4,
      };
      updated.totalPatientsCount = updated.patientsP0 + updated.patientsP1 + updated.patientsP2 + updated.patientsP3 + updated.patientsP4;
      return updated;
    });
  };

  /**
   * Procedural AI Engine: Synthesizes fully articulated chronological timeline events & tactical decision trees
   */
  const handleGenerateScenario = () => {
    const scenarioId = 'scen-dyn-' + Date.now();
    const floorLabel = floors.find((f) => f.id === config.floorId)?.name || `${config.floorId}º Pavimento`;

    // Dynamic Title
    let incidentTitle = 'Emergência Hospitalar';
    if (config.incidentType === 'incendio_uti_o2') incidentTitle = 'Incêndio em UTI com Atmosfera Rica em O2';
    else if (config.incidentType === 'incendio_estrutural') incidentTitle = 'Incêndio Estrutural em Ala de Internação';
    else if (config.incidentType === 'incendio_bloco_cirurgico') incidentTitle = 'Incêndio em Bloco Cirúrgico em Pleno Ato Operatório';
    else if (config.incidentType === 'incendio_cozinha') incidentTitle = 'Incêndio em Cozinha Central com Propagação Vertical';
    else if (config.incidentType === 'incendio_geradores') incidentTitle = 'Incêndio em Subsolo Técnico / Geradores com Blecaute Total';
    else if (config.incidentType === 'vazamento_gas_medicinal') incidentTitle = 'Vazamento Crítico na Central de Gases Medicinais';

    const fullTitle = `${incidentTitle} — ${floorLabel} (${config.originRoomName})`;

    // Synthesize 6 realistic chronological events with tactical dilemmas
    const events: ScenarioEvent[] = [
      {
        id: 'dyn-ev-1',
        stepOrder: 1,
        triggerTimeSec: 0,
        eventType: 'deteccao',
        locationLabel: `${floorLabel} - ${config.originRoomName}`,
        title: 'Detecção Inicial e Disparo de Alarme Setorial',
        description: `Central de Alarme Óptico acusa fumaça densa no ${config.originRoomName}. ${config.delayedAlarmDispatch ? 'ATENÇÃO: Houve retardo de 90 segundos no sinal central.' : 'Detector de teto com disparo imediato.'} Posto de enfermagem visualiza fumaça saindo pela fresta da porta.`,
        availableInfo: `No setor encontram-se ${config.totalPatientsCount} pacientes, sendo ${config.patientsP4} pacientes em Suporte de Vida (P4), ${config.patientsP3} acamados (P3) e ${config.patientsP2} cadeirantes (P2). ${config.sprinklerUnavailable ? 'AVISO: Chuveiros automáticos (Sprinklers) estão desativados para manutenção.' : 'Sprinklers em stand-by.'}`,
        isCritical: true,
        decisions: [
          {
            id: 'dyn-dec-1-a',
            letter: 'A',
            label: 'Confirmar in loco com brigadista, acionar Código Vermelho hospitalar e isolar setor',
            actionType: 'confirmacao_e_alarme',
            requiredResources: '1 Brigadista + Rádio C3',
            scoreWeight: 100,
            isOptimal: true,
            pedagogicalRationale: 'A confirmação simultânea com acionamento do Código Vermelho mobiliza a resposta sem retardar a evacuação protetiva.',
            consequence: {
              scoreBonus: 20,
              fireSpreadDelta: 0.05,
              smokeSpreadDelta: 0.05,
              evacuationDelaySec: 0
            }
          },
          {
            id: 'dyn-dec-1-b',
            letter: 'B',
            label: 'Aguardar 2 minutos para verificar se é falso alarme provocado por vapor hospitalar',
            actionType: 'espera_passiva',
            requiredResources: 'Nenhum',
            scoreWeight: 20,
            isOptimal: false,
            pedagogicalRationale: 'GRAVE: Em ambientes hospitalares, a queima de colchões e lençóis atinge flashover em menos de 4 minutos.',
            consequence: {
              scoreBonus: -30,
              fireSpreadDelta: 0.25,
              smokeSpreadDelta: 0.30,
              evacuationDelaySec: 120
            }
          },
          {
            id: 'dyn-dec-1-c',
            letter: 'C',
            label: 'Evacuar imediatamente todo o hospital pelo sistema de som sem confirmar o foco',
            actionType: 'evacuacao_desordenada',
            requiredResources: 'Alarme Geral',
            scoreWeight: 45,
            isOptimal: false,
            pedagogicalRationale: 'Evacuação geral prematura de todo o complexo hospitalar sobrecarrega as escadas e desestabiliza UTIs não afetadas.',
            consequence: {
              scoreBonus: -10,
              fireSpreadDelta: 0.10,
              smokeSpreadDelta: 0.15,
              evacuationDelaySec: 60
            }
          }
        ]
      },
      {
        id: 'dyn-ev-2',
        stepOrder: 2,
        triggerTimeSec: 75,
        eventType: 'propagacao_fogo',
        locationLabel: `${floorLabel} - Corredor Adjacente`,
        title: 'Propagação Rápida e Bloqueio de Gases Medicinais',
        description: `O fogo no ${config.originRoomName} expande-se para a rede elétrica e forro. Temperatura estimada no teto ultrapassa 260°C. Há risco de alimentação do foco pela linha de oxigênio medicinal.`,
        availableInfo: `${config.medicalGasValveStuck ? 'ALERTA TÁTICO: A válvula de corte setorial de oxigênio apresenta rigidez mecânica.' : 'Válvula de corte setorial de O2 identificada.'} Pacientes P4 dependem de ventilação artificial imediata.`,
        isCritical: true,
        decisions: [
          {
            id: 'dyn-dec-2-a',
            letter: 'A',
            label: 'Fechar válvula de corte de O2 do setor e conectar pacientes P4 em cilindros móveis de transporte',
            actionType: 'bloqueio_gases_seguro',
            requiredResources: 'Técnico de Manutenção + 2 Cilindros O2 Portáteis',
            scoreWeight: 100,
            isOptimal: true,
            pedagogicalRationale: 'Elimina o comburente do incêndio sem interromper a oxigenação dos pacientes de alta complexidade em suporte de vida.',
            consequence: {
              scoreBonus: 25,
              fireSpreadDelta: -0.10,
              smokeSpreadDelta: 0.05,
              evacuationDelaySec: 15
            }
          },
          {
            id: 'dyn-dec-2-b',
            letter: 'B',
            label: 'Manter a linha de O2 aberta para garantir que nenhum paciente desestabilize',
            actionType: 'negligencia_comburente',
            requiredResources: 'Nenhum',
            scoreWeight: 10,
            isOptimal: false,
            pedagogicalRationale: 'CRÍTICO: O oxigênio sob pressão que vaza em ambiente em chamas deflagra uma queima explosiva imediata.',
            consequence: {
              scoreBonus: -40,
              fireSpreadDelta: 0.35,
              smokeSpreadDelta: 0.35,
              evacuationDelaySec: 90
            }
          },
          {
            id: 'dyn-dec-2-c',
            letter: 'C',
            label: 'Cortar a energia elétrica geral de todo o hospital e desligar os gases da central',
            actionType: 'corte_indiscriminado',
            requiredResources: 'Manutenção Central',
            scoreWeight: 35,
            isOptimal: false,
            pedagogicalRationale: 'O corte geral interrompe ventiladores e bombas de infusão de pacientes estáveis em outros andares não afetados.',
            consequence: {
              scoreBonus: -15,
              fireSpreadDelta: -0.05,
              smokeSpreadDelta: 0.10,
              evacuationDelaySec: 45
            }
          }
        ]
      },
      {
        id: 'dyn-ev-3',
        stepOrder: 3,
        triggerTimeSec: 150,
        eventType: 'bloqueio_rota',
        locationLabel: `${floorLabel} - Caixa de Escada de Emergência Norte`,
        title: config.stairABlocked ? 'Falha Crítica: Escada Norte Invadida por Fumaça Densa' : 'Avaliação das Rotas de Fuga e Escadas',
        description: config.stairABlocked 
          ? `Porta corta-fogo da Escada Norte foi aberta indevidamente e a coluna de fumaça invadiu a caixa de escada. Visibilidade na Escada Norte cai para menos de 1.5 metros. ${config.pressurizationFailure ? 'Sistema de pressurização falhou.' : ''}`
          : `Fumaça espalha-se pelo corredor central. Escada Sul pressurizada permanece com tenibilidade preservada (+50 Pa).`,
        availableInfo: `A Área de Refúgio Leste (compartimentada P-90) encontra-se intacta e pressurizada. Restam ${config.patientsP3 + config.patientsP4} pacientes acamados e de suporte de vida a transferir.`,
        isCritical: true,
        decisions: [
          {
            id: 'dyn-dec-3-a',
            letter: 'A',
            label: 'Interditar a Escada Norte, acionar evacuação horizontal para Área de Refúgio Leste e redirecionar para Escada Sul',
            actionType: 'evacuacao_horizontal_refugio',
            requiredResources: 'Brigada de Incêndio + Portas Corta-Fogo Fechadas',
            scoreWeight: 100,
            isOptimal: true,
            pedagogicalRationale: 'Doutrina hospitalar preconiza a evacuação horizontal para área de refúgio estanque, isolando os pacientes sem precisar descê-los na fumaça.',
            consequence: {
              scoreBonus: 25,
              fireSpreadDelta: 0.05,
              smokeSpreadDelta: -0.05,
              evacuationDelaySec: 20,
              compromisesStairId: config.stairABlocked ? 'escada-norte' : undefined,
              evacuatesPatientsCount: Math.ceil(config.totalPatientsCount * 0.5)
            }
          },
          {
            id: 'dyn-dec-3-b',
            letter: 'B',
            label: 'Forçar a descida de macas pela Escada Norte contaminada com máscaras cirúrgicas',
            actionType: 'exposicao_toxica',
            requiredResources: 'Máscaras Simples',
            scoreWeight: 15,
            isOptimal: false,
            pedagogicalRationale: 'GRAVÍSSIMO: Máscaras cirúrgicas não filtram Monóxido de Carbono (CO) nem cianeto; intoxicação em menos de 1 minuto.',
            consequence: {
              scoreBonus: -50,
              fireSpreadDelta: 0.15,
              smokeSpreadDelta: 0.20,
              evacuationDelaySec: 100
            }
          }
        ]
      },
      {
        id: 'dyn-ev-4',
        stepOrder: 4,
        triggerTimeSec: 240,
        eventType: 'paciente_critico',
        locationLabel: `${floorLabel} - Posto de Enfermagem e Leitos Críticos`,
        title: 'Manejo de Pacientes em Suporte de Vida (P4) e Acamados (P3)',
        description: `Com efetivo de enfermagem ${config.reducedBrigade50 ? 'reduzido em 50%' : 'operando no limite'}, a equipe precisa retirar os ${config.patientsP4} pacientes de Suporte de Vida (P4) entubados e os ${config.patientsP3} acamados (P3) sob calor crescente.`,
        availableInfo: `A Área de Refúgio possui tomadas elétricas de emergência e pontos de oxigênio de reserva. ${config.elevatorFailure ? 'Elevadores de emergência bloqueados.' : 'Elevador de macas disponível para uso assistido da brigada.'}`,
        isCritical: true,
        decisions: [
          {
            id: 'dyn-dec-4-a',
            letter: 'A',
            label: 'Formar duplas mistas (1 enfermeiro + 1 brigadista por leito) e transferir pacientes P4 com monitor e AMBU para Refúgio',
            actionType: 'transferencia_assistida_p4',
            requiredResources: 'Enfermagem + AMBU + Macas',
            scoreWeight: 100,
            isOptimal: true,
            pedagogicalRationale: 'Garante continuidade do suporte ventilatório manual e monitoramento dos sinais vitais durante o trajeto protegido.',
            consequence: {
              scoreBonus: 30,
              fireSpreadDelta: 0.05,
              smokeSpreadDelta: 0.05,
              evacuationDelaySec: 30,
              evacuatesPatientsCount: config.patientsP4 + Math.ceil(config.patientsP3 * 0.5)
            }
          },
          {
            id: 'dyn-dec-4-b',
            letter: 'B',
            label: 'Desconectar ventiladores mecânicos dos P4 para agilizar e correr com os leitos',
            actionType: 'desconexao_inapropriada',
            requiredResources: 'Nenhum',
            scoreWeight: 20,
            isOptimal: false,
            pedagogicalRationale: 'Desconectar pacientes sem suporte ventilatório conduz à hipóxia grave e parada respiratória em segundos.',
            consequence: {
              scoreBonus: -45,
              fireSpreadDelta: 0.10,
              smokeSpreadDelta: 0.10,
              evacuationDelaySec: 60
            }
          }
        ]
      },
      {
        id: 'dyn-ev-5',
        stepOrder: 5,
        triggerTimeSec: 360,
        eventType: 'reforco_externo',
        locationLabel: 'Entrada Principal / Portaria de Emergência Térreo',
        title: 'Chegada das Viaturas do Corpo de Bombeiros e SAMU',
        description: `3 Viaturas de Combate a Incêndio (Auto-Bomba) e 2 Unidades de Suporte Avançado (USA SAMU) chegam ao hospital. Comandante do Corpo de Bombeiros se reporta ao Posto de Comando Hospitalar (C3).`,
        availableInfo: 'Corpo de Bombeiros solicita planta atualizada do 4º pavimento, relatório de pacientes pendentes e estado das válvulas de gases.',
        isCritical: true,
        decisions: [
          {
            id: 'dyn-dec-5-a',
            letter: 'A',
            label: 'Fornecer briefing estruturado C3, planta física com sonometria de fumaça e designar brigadista guia para a linha de ataque',
            actionType: 'integracao_sci_bombeiros',
            requiredResources: 'Planta Técnica + Rádio Canal 3',
            scoreWeight: 100,
            isOptimal: true,
            pedagogicalRationale: 'A integração imediata com compartilhamento de plantas operacionais acelera a montagem da linha de adutora e controle do incêndio.',
            consequence: {
              scoreBonus: 25,
              fireSpreadDelta: -0.25,
              smokeSpreadDelta: -0.20,
              evacuationDelaySec: 0
            }
          },
          {
            id: 'dyn-dec-5-b',
            letter: 'B',
            label: 'Pedir que os bombeiros entrem por conta própria sem fornecer informações do setor',
            actionType: 'falha_coordenacao',
            requiredResources: 'Nenhum',
            scoreWeight: 30,
            isOptimal: false,
            pedagogicalRationale: 'Retarda o reconhecimento do foco e expõe a guarnição a riscos ignorados de gases medicinais e leitos ocupados.',
            consequence: {
              scoreBonus: -20,
              fireSpreadDelta: 0.15,
              smokeSpreadDelta: 0.15,
              evacuationDelaySec: 90
            }
          }
        ]
      },
      {
        id: 'dyn-ev-6',
        stepOrder: 6,
        triggerTimeSec: 480,
        eventType: 'encerramento',
        locationLabel: `${floorLabel} - Área de Refúgio e Térreo`,
        title: 'Controle Total do Incêndio, Rescaldo e Censo de Vítimas',
        description: `Linha de hidrantes do Corpo de Bombeiros debela as chamas no ${config.originRoomName}. Exaustão mecânica e ventilação tática limpam o corredor. Todos os ${config.totalPatientsCount} pacientes são catalogados e acomodados com estabilidade clínica.`,
        availableInfo: 'Exercício concluído. O Comandante de Incidente deve homologar os relatórios de evacuação e iniciar a auditoria pós-ação (AAR).',
        isCritical: false,
        decisions: [
          {
            id: 'dyn-dec-6-a',
            letter: 'A',
            label: 'Realizar censo nominal leito a leito, registrar prontuários e homologar relatório oficial AAR',
            actionType: 'homologacao_exercicio',
            requiredResources: 'Prontuários + Sistema C3',
            scoreWeight: 100,
            isOptimal: true,
            pedagogicalRationale: 'Fechamento de conformidade médico-legal e garantia de que nenhum paciente ou profissional ficou retido na edificação.',
            consequence: {
              scoreBonus: 20,
              fireSpreadDelta: -0.10,
              smokeSpreadDelta: -0.10,
              evacuationDelaySec: 0,
              evacuatesPatientsCount: config.totalPatientsCount
            }
          }
        ]
      }
    ];

    const scenario: Scenario = {
      id: scenarioId,
      code: `HEDS-GEN-${Math.floor(100 + Math.random() * 900)}`,
      title: fullTitle,
      hazardType: 'incendio',
      initialFloor: config.floorId,
      initialRoom: config.originRoomNumber,
      simulatedStartTime: '10:20:00',
      severityLevel: config.difficultyLevel === 'avancado' ? 'critico_geral' : config.difficultyLevel === 'intermediario' ? 'alto' : 'medio',
      description: `Exercício gerado dinamicamente pelo Motor de Cenários HEDS. Simulação de emergência no ${floorLabel} (${config.originRoomName}) envolvendo ${config.totalPatientsCount} pacientes (${config.patientsP4} P4 Suporte de Vida, ${config.patientsP3} P3 Acamados, ${config.patientsP2} P2 Cadeirantes, ${config.patientsP1} P1 e ${config.patientsP0} P0). Falhas ativas: ${config.sprinklerUnavailable ? 'Sprinkler Inoperante' : ''}, ${config.stairABlocked ? 'Escada Norte Bloqueada' : ''}, ${config.reducedBrigade50 ? 'Brigada -50%' : ''}, ${config.medicalGasValveStuck ? 'Corte O2 Comprometido' : ''}.`,
      learningObjectives: [
        'Comando e Controle C3 segundo a doutrina HEICS hospitalar',
        'Priorização da evacuação horizontal com transposição para Área de Refúgio P-90',
        'Manejo seguro de gases medicinais e pacientes em ventilação mecânica invasiva (P4)',
        'Integração tática entre Brigada Orgânica, Corpo de Bombeiros e SAMU',
        'Auditoria e tomada de decisão sob pressão temporal extrema'
      ],
      events
    };

    setGeneratedScenario(scenario);
    setActiveStep('preview');
  };

  const handleStartSimulation = () => {
    if (!generatedScenario) return;
    onApplyScenario(generatedScenario, config);
    onClose();
  };

  const handleSaveToCatalog = () => {
    if (!generatedScenario) return;
    if (onSaveScenarioToCatalog) {
      onSaveScenarioToCatalog(generatedScenario);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-lg">
              <Wand2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  MOTOR DE CENÁRIOS HEDS — CONSTRUTOR DINÂMICO
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gerador Automático
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monte exercícios de emergência sem programar: selecione incidente, leitos, contingências e o sistema gera eventos e decisões.
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

        {/* Step Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveStep('config')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeStep === 'config'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            1. CONFIGURAÇÃO DE CONTORNO & FALHAS
          </button>
          <button
            onClick={() => {
              if (generatedScenario) setActiveStep('preview');
              else handleGenerateScenario();
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeStep === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            2. SEQUÊNCIA DE EVENTOS E DECISÕES GERADAS {generatedScenario ? `(${generatedScenario.events.length})` : ''}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          {activeStep === 'config' ? (
            <div className="space-y-6">
              {/* Row 1: Incident & Sector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Tipo de Incidente
                  </label>
                  <select
                    value={config.incidentType}
                    onChange={(e) => setConfig({ ...config, incidentType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="incendio_uti_o2">Incêndio em UTI com Atmosfera de O2</option>
                    <option value="incendio_estrutural">Incêndio Estrutural em Internação / Enfermaria</option>
                    <option value="incendio_bloco_cirurgico">Incêndio em Centro Cirúrgico (Ato Operatório)</option>
                    <option value="incendio_cozinha">Incêndio em Cozinha Central (Classe K)</option>
                    <option value="incendio_geradores">Incêndio em Subsolo / Geradores com Blecaute</option>
                    <option value="vazamento_gas_medicinal">Vazamento em Central de Gases Medicinais</option>
                  </select>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Pavimento do Hospital
                  </label>
                  <select
                    value={config.floorId}
                    onChange={(e) => {
                      const fid = Number(e.target.value);
                      setConfig({
                        ...config,
                        floorId: fid,
                        originRoomNumber: fid === 4 ? '408' : fid === 3 ? 'UTI-01' : fid === 2 ? 'CC-02' : 'PS-01',
                        originRoomName: fid === 4 ? 'Quarto 408 (Isolamento)' : fid === 3 ? 'UTI Geral Adulto' : fid === 2 ? 'Sala Cirúrgica 02' : 'Ala de Emergência'
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {floors.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} — {fl.purpose}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Ambiente Foco de Origem
                  </label>
                  <input
                    type="text"
                    value={config.originRoomName}
                    onChange={(e) => setConfig({ ...config, originRoomName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Ex: Quarto 408 / Leito 08"
                  />
                </div>
              </div>

              {/* Row 2: Patient Distribution Matrix */}
              <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      População e Perfil Clínico dos Pacientes no Setor
                    </h3>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                    Total: {currentTotal} Pacientes
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* P0 */}
                  <div className="p-3 bg-slate-900/90 border border-emerald-500/30 rounded-lg text-center">
                    <div className="text-xs font-bold text-emerald-400 mb-1">P0 — AUTÔNOMO</div>
                    <div className="text-[10px] text-slate-400 mb-2">Caminha sozinho</div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePatientCountChange('P0', config.patientsP0 - 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-white w-6">{config.patientsP0}</span>
                      <button
                        onClick={() => handlePatientCountChange('P0', config.patientsP0 + 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* P1 */}
                  <div className="p-3 bg-slate-900/90 border border-blue-500/30 rounded-lg text-center">
                    <div className="text-xs font-bold text-blue-400 mb-1">P1 — REDUZIDA</div>
                    <div className="text-[10px] text-slate-400 mb-2">Auxílio leve / 1 staff</div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePatientCountChange('P1', config.patientsP1 - 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-white w-6">{config.patientsP1}</span>
                      <button
                        onClick={() => handlePatientCountChange('P1', config.patientsP1 + 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* P2 */}
                  <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-lg text-center">
                    <div className="text-xs font-bold text-amber-400 mb-1">P2 — CADEIRANTE</div>
                    <div className="text-[10px] text-slate-400 mb-2">Cadeira / Evac-Chair</div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePatientCountChange('P2', config.patientsP2 - 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-white w-6">{config.patientsP2}</span>
                      <button
                        onClick={() => handlePatientCountChange('P2', config.patientsP2 + 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* P3 */}
                  <div className="p-3 bg-slate-900/90 border border-orange-500/30 rounded-lg text-center">
                    <div className="text-xs font-bold text-orange-400 mb-1">P3 — ACAMADO</div>
                    <div className="text-[10px] text-slate-400 mb-2">Maca / Leito (2 a 3 staff)</div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePatientCountChange('P3', config.patientsP3 - 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-white w-6">{config.patientsP3}</span>
                      <button
                        onClick={() => handlePatientCountChange('P3', config.patientsP3 + 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* P4 */}
                  <div className="p-3 bg-slate-900/90 border border-rose-500/40 rounded-lg text-center bg-rose-950/20">
                    <div className="text-xs font-bold text-rose-400 mb-1">P4 — SUPORTE VIDA</div>
                    <div className="text-[10px] text-slate-400 mb-2">Ventilador / O2 / UTI</div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePatientCountChange('P4', config.patientsP4 - 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-white w-6">{config.patientsP4}</span>
                      <button
                        onClick={() => handlePatientCountChange('P4', config.patientsP4 + 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Injected Failures Checklist */}
              <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Falhas Injetadas e Condições Adversas (Impacto no CFD e Evacuação)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Selecione as falhas que o instrutor deseja impor ao participante. O sistema ajustará dinamicamente os tempos de resposta, bloqueios e consequências das decisões.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-start gap-3 p-3 bg-slate-900/90 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.sprinklerUnavailable}
                      onChange={(e) => setConfig({ ...config, sprinklerUnavailable: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white">Sprinkler Indisponível</div>
                      <div className="text-slate-400 text-[11px]">Chuveiros automáticos desativados; fogo cresce 3x mais rápido no CFD.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-900/90 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.stairABlocked}
                      onChange={(e) => setConfig({ ...config, stairABlocked: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white">Escada Norte (A) Bloqueada</div>
                      <div className="text-slate-400 text-[11px]">Fumaça contamina rota principal nos primeiros 150 segundos.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-900/90 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.reducedBrigade50}
                      onChange={(e) => setConfig({ ...config, reducedBrigade50: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white">Equipe Reduzida (-50%)</div>
                      <div className="text-slate-400 text-[11px]">Turno noturno ou feriado com efetivo de brigada e enfermagem pela metade.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-900/90 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.medicalGasValveStuck}
                      onChange={(e) => setConfig({ ...config, medicalGasValveStuck: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white">Válvula de Corte O2 Travada</div>
                      <div className="text-slate-400 text-[11px]">Requer ferramenta especial de manutenção para interrupção de fluxo.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-900/90 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.elevatorFailure}
                      onChange={(e) => setConfig({ ...config, elevatorFailure: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white">Elevador de Macas Inoperante</div>
                      <div className="text-slate-400 text-[11px]">Obriga o uso de Área de Refúgio horizontal ou descida manual.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-900/90 rounded border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.stairBDoorHeldOpen}
                      onChange={(e) => setConfig({ ...config, stairBDoorHeldOpen: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-white">Porta Corta-Fogo Calçada Aberta</div>
                      <div className="text-slate-400 text-[11px]">Falha humana clássica; fumaça se esvai pelo vão da escada secundária.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Nível de Dificuldade:</span>
                  <select
                    value={config.difficultyLevel}
                    onChange={(e) => setConfig({ ...config, difficultyLevel: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded p-1.5"
                  >
                    <option value="basico">Básico (Procedimental)</option>
                    <option value="intermediario">Intermediário (Tático)</option>
                    <option value="avancado">Avançado (Múltiplas Falhas / Major Incident)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateScenario}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  <Wand2 className="w-5 h-5" />
                  GERAR SEQUÊNCIA DE EVENTOS & DECISÕES
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW OF GENERATED SCENARIO */
            <div className="space-y-6">
              {generatedScenario && (
                <>
                  <div className="p-4 bg-slate-950/80 border border-indigo-500/40 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {generatedScenario.code}
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {generatedScenario.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                        {generatedScenario.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleSaveToCatalog}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                      >
                        <Save className="w-4 h-4 text-emerald-400" />
                        Salvar no Catálogo
                      </button>
                      <button
                        onClick={handleStartSimulation}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        INICIAR EXERCÍCIO COM ESTE CENÁRIO
                      </button>
                    </div>
                  </div>

                  {/* Events Timeline Cards */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Sequência Cronológica Gerada ({generatedScenario.events.length} Eventos)
                    </h4>

                    {generatedScenario.events.map((ev, idx) => (
                      <div
                        key={ev.id}
                        className="p-4 bg-slate-950/90 border border-slate-800 rounded-lg relative pl-12"
                      >
                        {/* Step Marker */}
                        <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {ev.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ev.locationLabel}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Disparo: {Math.floor(ev.triggerTimeSec / 60)}m {ev.triggerTimeSec % 60}s
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mb-3">
                          {ev.description}
                        </p>

                        {/* Decisions list preview */}
                        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Opções de Decisão Tática:
                          </div>
                          {ev.decisions.map((dec) => (
                            <div
                              key={dec.id}
                              className={`text-xs p-2 rounded flex items-start gap-2 ${
                                dec.isOptimal
                                  ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-200'
                                  : 'bg-slate-950/40 border border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="font-bold text-white shrink-0">
                                [{dec.letter}]
                              </span>
                              <div className="flex-1">
                                <div>{dec.label}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 italic">
                                  {dec.pedagogicalRationale}
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                dec.isOptimal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {dec.scoreWeight} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Start Button */}
                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      onClick={() => setActiveStep('config')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700"
                    >
                      Ajustar Parâmetros
                    </button>
                    <button
                      onClick={handleStartSimulation}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      INICIAR EXERCÍCIO COM ESTE CENÁRIO
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
