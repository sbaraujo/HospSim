/**
 * HEDS - Hospital Emergency Decision Simulator
 * Main Application Orchestrator
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Hospital,
  Floor,
  Room,
  Patient,
  Team,
  ResourceItem,
  Equipment,
  Scenario,
  ScenarioEvent,
  DecisionOption,
  SimulationMode,
  EmergencyLevel,
  SimulationDecisionRecord,
  SimulationLogEntry,
  EvaluationResult,
  ReportData
} from './types';

import {
  INITIAL_HOSPITAL,
  INITIAL_FLOORS,
  INITIAL_ROOMS,
  INITIAL_PATIENTS,
  INITIAL_TEAMS,
  INITIAL_RESOURCES,
  INITIAL_EQUIPMENT,
  MASTER_SCENARIO
} from './data/seedData';

import { dbService } from './services/db';
import { syncService, SyncStatus } from './services/syncService';
import { generateHEDSReportPDF } from './services/pdfReportGenerator';

import { TopBar } from './components/TopBar';
import { NavigationSidebar, ActiveSidebarTab } from './components/NavigationSidebar';
import { ThreeHospitalViewer } from './components/ThreeHospitalViewer';
import { RightStatusPanel } from './components/RightStatusPanel';
import { C3CommandPanel } from './components/C3CommandPanel';
import { DecisionGameModal } from './components/DecisionGameModal';
import { PatientsCrudModal } from './components/PatientsCrudModal';
import { ScenariosCatalogModal } from './components/ScenariosCatalogModal';
import { EvaluationModal } from './components/EvaluationModal';
import { ConfigSyncModal } from './components/ConfigSyncModal';

import {
  Play,
  RotateCcw,
  Award,
  FileText,
  Flame,
  Shield,
  Activity,
  Users,
  Compass,
  Radio,
  Layers,
  Sparkles,
  AlertTriangle,
  Building,
  CheckCircle2,
  FileCode
} from 'lucide-react';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<ActiveSidebarTab>('simulacao');
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(4); // Default to Floor 4 (Incident Floor)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Modals visibility
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isPatientsModalOpen, setIsPatientsModalOpen] = useState(false);
  const [isScenariosModalOpen, setIsScenariosModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Entities Data
  const [hospital, setHospital] = useState<Hospital>(INITIAL_HOSPITAL);
  const [floors, setFloors] = useState<Floor[]>(INITIAL_FLOORS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);

  // Simulation Scenario & Execution State
  const [activeScenario, setActiveScenario] = useState<Scenario>(MASTER_SCENARIO);
  const [simulationStatus, setSimulationStatus] = useState<'em_preparacao' | 'em_andamento' | 'pausado' | 'concluido'>('em_preparacao');
  const [mode, setMode] = useState<SimulationMode>('treinamento');
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('amarelo_alerta');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [simulatedClockBaseSec] = useState<number>(10 * 3600 + 20 * 60); // 10:20:00

  // Dynamic Hazard Variables
  const [fireSpreadLevel, setFireSpreadLevel] = useState<number>(0.35);
  const [smokeSpreadLevel, setSmokeSpreadLevel] = useState<number>(0.25);
  const [isNorthStairBlocked, setIsNorthStairBlocked] = useState<boolean>(false);

  // Decision & Audit Records
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [pendingEvent, setPendingEvent] = useState<ScenarioEvent | null>(MASTER_SCENARIO.events[0]);
  const [decisionsHistory, setDecisionsHistory] = useState<SimulationDecisionRecord[]>([]);
  const [simulationLogs, setSimulationLogs] = useState<SimulationLogEntry[]>([
    {
      id: 'log-0',
      timestampSec: 0,
      simulatedTimeStr: '10:20:00',
      category: 'DETECCAO',
      title: 'Disparo de Alarme de Incêndio Quarto 408',
      description: 'Central de alarme óptico detecta fumaça no Quarto 408 (Isolamento). Posto de enfermagem acionado.',
      severity: 'alerta'
    }
  ]);

  // Final Generated Report
  const [finalReport, setFinalReport] = useState<ReportData | null>(null);

  // Offline Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null
  });

  // Load from IndexedDB on startup
  useEffect(() => {
    async function initDB() {
      await dbService.initializeWithSeedData();
      const localPatients = await dbService.getAll<Patient>('patients');
      if (localPatients.length > 0) setPatients(localPatients);

      const localTeams = await dbService.getAll<Team>('teams');
      if (localTeams.length > 0) setTeams(localTeams);

      const localResources = await dbService.getAll<ResourceItem>('resources');
      if (localResources.length > 0) setResources(localResources);

      // Register Service Worker for PWA
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[SW Registration Error]', err);
        });
      }
    }
    initDB();

    const unsubscribe = syncService.subscribe((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, []);

  // Format current simulated clock time
  const getSimulatedTimeStr = () => {
    const totalSec = simulatedClockBaseSec + elapsedSeconds;
    const hours = Math.floor((totalSec / 3600) % 24);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Simulation Clock Tick Effect
  useEffect(() => {
    if (simulationStatus !== 'em_andamento') return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const nextElapsed = prev + 1;

        // Check if a scheduled event should trigger
        const nextEvent = activeScenario.events.find(
          (ev, idx) => idx > currentEventIndex && ev.triggerTimeSec <= nextElapsed
        );

        if (nextEvent) {
          setCurrentEventIndex((i) => i + 1);
          setPendingEvent(nextEvent);

          // Log event
          const newLog: SimulationLogEntry = {
            id: 'log-' + Date.now(),
            timestampSec: nextElapsed,
            simulatedTimeStr: getSimulatedTimeStr(),
            category: nextEvent.eventType === 'reforco_externo' ? 'C3' : 'FOGO',
            title: nextEvent.title,
            description: nextEvent.description,
            severity: nextEvent.isCritical ? 'critico' : 'alerta'
          };
          setSimulationLogs((logs) => [...logs, newLog]);

          // Automatically pause simulation when critical decision arrives
          setSimulationStatus('pausado');
          setIsDecisionModalOpen(true);
        }

        return nextElapsed;
      });
    }, 1000 / speedMultiplier);

    return () => clearInterval(interval);
  }, [simulationStatus, speedMultiplier, currentEventIndex, activeScenario]);

  // Handle Participant Decision
  const handleMakeDecision = (option: DecisionOption, responseTimeSeconds: number) => {
    if (!pendingEvent) return;

    const simulatedTime = getSimulatedTimeStr();

    const decisionRecord: SimulationDecisionRecord = {
      id: 'dec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      eventId: pendingEvent.id,
      eventTitle: pendingEvent.title,
      decisionId: option.id,
      optionLetter: option.letter,
      decisionLabel: option.label,
      timestampSec: elapsedSeconds,
      simulatedTimeStr: simulatedTime,
      responseTimeSeconds,
      scoreAwarded: option.scoreWeight,
      isOptimal: option.isOptimal,
      rationale: option.pedagogicalRationale
    };

    setDecisionsHistory((prev) => [...prev, decisionRecord]);

    // Apply consequences to fire, smoke, stair blockage and patients
    const csq = option.consequence;
    setFireSpreadLevel((prev) => Math.max(0, Math.min(1, prev + csq.fireSpreadDelta)));
    setSmokeSpreadLevel((prev) => Math.max(0, Math.min(1, prev + csq.smokeSpreadDelta)));

    if (csq.compromisesStairId === 'escada-norte') {
      setIsNorthStairBlocked(true);
      setEmergencyLevel('vermelho_evacuacao_geral');
    }

    // Evacuate patients if consequence specifies
    if (csq.evacuatesPatientsCount && csq.evacuatesPatientsCount > 0) {
      setPatients((prev) => {
        let remainingToEvac = csq.evacuatesPatientsCount!;
        return prev.map((p) => {
          if (p.floorId === 4 && p.status === 'em_leito' && remainingToEvac > 0) {
            remainingToEvac--;
            return { ...p, status: 'evacuado_seguro' };
          }
          return p;
        });
      });
    }

    // Log decision in C3 timeline
    const logItem: SimulationLogEntry = {
      id: 'log-' + Date.now(),
      timestampSec: elapsedSeconds,
      simulatedTimeStr: simulatedTime,
      category: 'DECISAO',
      title: `Decisão Tomada: [${option.letter}] ${option.label.substring(0, 45)}...`,
      description: csq.description,
      severity: option.isOptimal ? 'sucesso' : 'alerta'
    };
    setSimulationLogs((prev) => [...prev, logItem]);

    // Store in IndexedDB
    dbService.put('simulation_decisions', decisionRecord);

    setIsDecisionModalOpen(false);
    setPendingEvent(null);

    // If more events exist in scenario, resume simulation; otherwise complete exercise
    if (currentEventIndex < activeScenario.events.length - 1) {
      setSimulationStatus('em_andamento');
    } else {
      handleCompleteSimulation();
    }
  };

  // Complete Simulation and Calculate Evaluation Scorecard
  const handleCompleteSimulation = () => {
    setSimulationStatus('concluido');

    // Calculate score
    const totalDecisions = decisionsHistory.length || 1;
    const optimalCount = decisionsHistory.filter((d) => d.isOptimal).length;
    const overallScore = Math.min(100, Math.round((optimalCount / totalDecisions) * 100) + 10);

    const gradeClassification =
      overallScore >= 85
        ? 'Excelente (Comando Exemplar)'
        : overallScore >= 70
        ? 'Satisfatório (Comando Adequado)'
        : overallScore >= 50
        ? 'Atenção (Falhas Táticas)'
        : 'Crítico (Risco Extremo)';

    const evalResult: EvaluationResult = {
      overallScore,
      gradeClassification,
      decisionTimeScore: Math.min(100, 90 - Math.floor(elapsedSeconds / 30)),
      lifeProtectionScore: isNorthStairBlocked ? 95 : 85,
      patientSafetyScore: 92,
      coordinationScore: 88,
      resourceUsageScore: 85,
      communicationScore: 90,
      continuityScore: 84,
      evacuatedTotal: patients.filter((p) => p.status === 'evacuado_seguro' || p.status === 'em_area_refugio').length,
      criticalSaved: patients.filter((p) => p.category === 'P4' && p.status !== 'critico').length,
      patientsExposed: patients.filter((p) => p.status === 'exposto_risco').length,
      routesBlockedCount: isNorthStairBlocked ? 1 : 0,
      evaluatorNotes: 'O Comandante demonstrou excelente clareza na resposta local inicial, corte seletivo de gases e integração com o Corpo de Bombeiros militar.',
      recommendations: [
        'Treinar rotinas semestrais de transporte em escadas com Evac-Chair.',
        'Auditar anualmente o sistema elétrico do pressurizador de escada.',
        'Reforçar o isolamento de portas corta-fogo para evitar travamento inadvertido.'
      ]
    };

    const repNum = 'HEDS-2026-' + Math.floor(1000 + Math.random() * 9000);
    const report: ReportData = {
      id: repNum,
      reportNumber: repNum,
      generatedAt: new Date().toISOString(),
      participantName: 'Capitão da Brigada / Comandante de Plantão',
      instructorName: 'Tenente Instrutor Chefe de Emergência HEDS',
      hospitalName: hospital.name,
      scenarioTitle: activeScenario.title,
      simulationDurationSec: elapsedSeconds,
      evaluation: evalResult,
      timeline: simulationLogs,
      decisions: decisionsHistory,
      patientsStatusSummary: {
        total: patients.length,
        evacuated: evalResult.evacuatedTotal,
        inRefuge: patients.filter((p) => p.status === 'em_area_refugio').length,
        inBed: patients.filter((p) => p.status === 'em_leito').length,
        exposed: evalResult.patientsExposed
      }
    };

    setFinalReport(report);
    dbService.put('reports', report);
    setIsEvaluationModalOpen(true);
  };

  // Dispatch Team Action
  const handleDispatchTeam = (teamId: string, task: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: 'em_evacuacao', assignedTask: task } : t))
    );
    const log: SimulationLogEntry = {
      id: 'log-' + Date.now(),
      timestampSec: elapsedSeconds,
      simulatedTimeStr: getSimulatedTimeStr(),
      category: 'BRIGADA',
      title: `Equipe Despachada: ${teams.find((t) => t.id === teamId)?.name}`,
      description: `Tarefa atribuída pelo C3: ${task}`,
      severity: 'info'
    };
    setSimulationLogs((prev) => [...prev, log]);
  };

  // Radio Broadcast Action
  const handleTriggerRadioBroadcast = (msg: string) => {
    const log: SimulationLogEntry = {
      id: 'log-' + Date.now(),
      timestampSec: elapsedSeconds,
      simulatedTimeStr: getSimulatedTimeStr(),
      category: 'C3',
      title: 'Transmissão Geral via Rádio VHF',
      description: msg,
      severity: 'info'
    };
    setSimulationLogs((prev) => [...prev, log]);
  };

  // Patient CRUD Handlers
  const handleSavePatient = async (updatedPatient: Patient) => {
    await dbService.put('patients', updatedPatient);
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedPatient.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedPatient;
        return copy;
      }
      return [...prev, updatedPatient];
    });
  };

  const handleDeletePatient = async (patientId: string) => {
    await dbService.delete('patients', patientId);
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  };

  // Reset Database Handler
  const handleResetDatabase = async () => {
    await dbService.resetToDefaults();
    setPatients(INITIAL_PATIENTS);
    setTeams(INITIAL_TEAMS);
    setResources(INITIAL_RESOURCES);
    setEquipment(INITIAL_EQUIPMENT);
    setElapsedSeconds(0);
    setSimulationStatus('em_preparacao');
    setDecisionsHistory([]);
    setIsConfigModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar with Simulation Controls & Status */}
      <TopBar
        hospitalName={hospital.name}
        simulatedTimeStr={getSimulatedTimeStr()}
        elapsedSeconds={elapsedSeconds}
        simulationStatus={simulationStatus}
        emergencyLevel={emergencyLevel}
        speedMultiplier={speedMultiplier}
        mode={mode}
        isOnline={syncStatus.isOnline}
        isSyncing={syncStatus.isSyncing}
        pendingSyncCount={syncStatus.pendingCount}
        onTogglePlayPause={() => {
          if (simulationStatus === 'em_andamento') {
            setSimulationStatus('pausado');
          } else {
            setSimulationStatus('em_andamento');
            if (activeScenario.events.length > 0 && !pendingEvent && decisionsHistory.length === 0) {
              setPendingEvent(activeScenario.events[0]);
              setIsDecisionModalOpen(true);
            }
          }
        }}
        onChangeSpeed={setSpeedMultiplier}
        onEndSimulation={handleCompleteSimulation}
        onTriggerSync={() => syncService.triggerSync()}
        onChangeMode={setMode}
      />

      {/* Main View Area: Left Sidebar + Center Workspace + Right Status Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <NavigationSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'pacientes') setIsPatientsModalOpen(true);
            if (tab === 'cenarios') setIsScenariosModalOpen(true);
            if (tab === 'configuracoes') setIsConfigModalOpen(true);
            if (tab === 'avaliacao' && finalReport) setIsEvaluationModalOpen(true);
            if (tab === 'relatorios' && finalReport) setIsEvaluationModalOpen(true);
          }}
          patientsCount={patients.length}
          criticalEventsCount={activeScenario.events.length}
          teamsCount={teams.length}
        />

        {/* Center Workspace (Switchable View based on Active Tab) */}
        <main className="flex-1 flex flex-col p-3 overflow-hidden bg-slate-950">
          {activeTab === 'simulacao' || activeTab === 'dashboard' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <ThreeHospitalViewer
                floors={floors}
                rooms={rooms}
                patients={patients}
                teams={teams}
                selectedFloorId={selectedFloorId}
                onSelectFloor={setSelectedFloorId}
                onSelectRoom={(r) => setSelectedRoom(r)}
                onSelectPatient={(p) => {
                  setSelectedPatient(p);
                  setIsPatientsModalOpen(true);
                }}
                fireSpreadLevel={fireSpreadLevel}
                smokeSpreadLevel={smokeSpreadLevel}
                isNorthStairBlocked={isNorthStairBlocked}
                selectedRoomId={selectedRoom?.id}
              />
            </div>
          ) : activeTab === 'comando_c3' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <C3CommandPanel
                emergencyLevel={emergencyLevel}
                onSetEmergencyLevel={setEmergencyLevel}
                teams={teams}
                resources={resources}
                patients={patients}
                equipment={equipment}
                logs={simulationLogs}
                simulatedTimeStr={getSimulatedTimeStr()}
                onDispatchTeam={handleDispatchTeam}
                onTriggerRadioBroadcast={handleTriggerRadioBroadcast}
              />
            </div>
          ) : (
            // Fallback content card for structural views
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-400" /> Detalhamento Estrutural: {activeTab.toUpperCase()}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O complexo hospitalar conta com 5 pavimentos estruturados em alvenaria e concreto armado, sistema de pressurização mecânica de escadas, redes de hidrantes e sprinklers automáticos, além de áreas de refúgio compartimentadas com resistência ao fogo de 120 minutos (TRRF 120 min).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {floors.map((flr) => (
                    <div
                      key={flr.id}
                      onClick={() => {
                        setSelectedFloorId(flr.id);
                        setActiveTab('simulacao');
                      }}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{flr.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{flr.areaM2} m²</span>
                      </div>
                      <p className="text-xs text-slate-400">{flr.purpose}</p>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>{flr.roomsCount} ambientes cadastrados</span>
                        <span className="text-cyan-400 font-semibold">Inspecionar em 3D →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Status Panel (Telemetry, Decisions, Routes, At-risk Patients) */}
        <RightStatusPanel
          currentEvent={pendingEvent}
          onOpenDecisionModal={() => setIsDecisionModalOpen(true)}
          patients={patients}
          resources={resources}
          logs={simulationLogs}
          isNorthStairBlocked={isNorthStairBlocked}
          fireSpreadLevel={fireSpreadLevel}
          smokeSpreadLevel={smokeSpreadLevel}
          onSelectPatient={(p) => {
            setSelectedPatient(p);
            setIsPatientsModalOpen(true);
          }}
        />
      </div>

      {/* Decision Game Modal */}
      {pendingEvent && (
        <DecisionGameModal
          event={pendingEvent}
          mode={mode}
          onMakeDecision={handleMakeDecision}
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
        />
      )}

      {/* Patients CRUD Modal */}
      <PatientsCrudModal
        patients={patients}
        onSavePatient={handleSavePatient}
        onDeletePatient={handleDeletePatient}
        isOpen={isPatientsModalOpen}
        onClose={() => {
          setIsPatientsModalOpen(false);
          setSelectedPatient(null);
        }}
        selectedPatientDetail={selectedPatient}
      />

      {/* Scenarios Catalog Modal */}
      <ScenariosCatalogModal
        isOpen={isScenariosModalOpen}
        onClose={() => setIsScenariosModalOpen(false)}
        onSelectScenario={(id) => {
          setActiveScenario(MASTER_SCENARIO);
          setCurrentEventIndex(0);
          setPendingEvent(MASTER_SCENARIO.events[0]);
          setElapsedSeconds(0);
          setSimulationStatus('em_preparacao');
          setIsDecisionModalOpen(true);
        }}
        activeScenarioId={activeScenario.id}
      />

      {/* Evaluation Results & PDF Report Modal */}
      {finalReport && (
        <EvaluationModal
          report={finalReport}
          isOpen={isEvaluationModalOpen}
          onClose={() => setIsEvaluationModalOpen(false)}
        />
      )}

      {/* Configuration, Offline Sync & MySQL Schema Modal */}
      <ConfigSyncModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        syncStatus={syncStatus}
        onTriggerSync={() => syncService.triggerSync()}
        onResetDatabase={handleResetDatabase}
      />
    </div>
  );
}
