/**
 * HEDS - Hospital Emergency Decision Simulator
 * Core TypeScript Definitions
 */

export type PatientTypeCode = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface PatientType {
  code: PatientTypeCode;
  title: string;
  description: string;
  requiresStaffCount: number;
  prepTimeMinutes: number;
  movementSpeedMs: number;
  priorityLevel: number;
}

export type PatientStatus = 
  | 'em_leito' 
  | 'preparando' 
  | 'em_evacuacao' 
  | 'em_area_refugio' 
  | 'evacuado_seguro' 
  | 'exposto_risco' 
  | 'critico';

export interface Patient {
  id: string;
  fictionalName: string;
  age: number;
  floorId: number; // 0 to 4
  roomNumber: string;
  category: PatientTypeCode;
  mobilityStatus: 'autonomo' | 'auxilio_leve' | 'cadeirante' | 'acamado' | 'instavel';
  consciousnessLevel: 'alerta' | 'confuso' | 'sedado' | 'coma';
  clinicalCondition: string;
  needsOxygen: boolean;
  needsMechanicalVentilator: boolean;
  needsInfusionPumps: boolean;
  needsVitalMonitor: boolean;
  preparationTimeSec: number;
  assignedStaffCount: number;
  status: PatientStatus;
  destinationRefuge: string;
  exposureSmokeSeconds: number;
  vitalStabilityPercent: number;
}

export interface Hospital {
  id: string;
  code: string;
  name: string;
  tradeName: string;
  address: string;
  city: string;
  state: string;
  floorsCount: number;
  totalAreaM2: number;
  maxOccupancy: number;
  hasHeliport: boolean;
  phoneEmergency: string;
  notes: string;
}

export interface Floor {
  id: number; // -1, 0, 1, 2, 3, 4
  name: string;
  purpose: string;
  areaM2: number;
  isAffected: boolean;
  roomsCount: number;
}

export interface Room {
  id: string;
  floorId: number;
  roomNumber: string;
  name: string;
  category: string;
  capacityBeds: number;
  posX: number; // 3D coordinates
  posY: number;
  posZ: number;
  width: number;
  length: number;
  hasMedicalGas: boolean;
  hasSprinklers: boolean;
  fireStatus: 'seguro' | 'alerta_fumaca' | 'em_chamas' | 'controlado';
  temperatureC: number;
}

export interface RefugeArea {
  id: string;
  floorId: number;
  code: string;
  name: string;
  capacityBeds: number;
  capacityWheelchairs: number;
  currentOccupancy: number;
  isCompartmented: boolean;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  type: 'brigada_incendio' | 'enfermagem_evacuacao' | 'medicos_triagem' | 'seguranca_patrimonial' | 'manutencao_tecnica' | 'bombeiros_externos' | 'samu_externo';
  membersCount: number;
  currentLocation: string;
  status: 'disponivel' | 'deslocando' | 'em_combate' | 'em_evacuacao' | 'atendendo_vitimas' | 'indisponivel';
  assignedTask?: string;
}

export interface ResourceItem {
  id: string;
  type: 'maca' | 'cadeira_rodas' | 'evac_chair' | 'cilindro_o2_portatil' | 'extintor_pqs' | 'extintor_co2' | 'extintor_agua' | 'mangueira_hidrante' | 'radio_comunicador' | 'mascara_autonoma' | 'ambulancia';
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  storageLocation: string;
  iconName?: string;
}

export interface Equipment {
  id: string;
  tag: string;
  name: string;
  category: 'extintor' | 'hidrante' | 'bomba_incendio' | 'painel_alarme' | 'sprinkler_valvula' | 'pressurizador_escada' | 'gerador_emergencia' | 'central_gases';
  floorId: number;
  locationDetails: string;
  status: 'operacional' | 'acionado' | 'em_falha' | 'em_manutencao';
}

export type HazardType = 
  | 'incendio' 
  | 'explosao' 
  | 'vazamento_gas' 
  | 'falha_energia' 
  | 'falha_oxigenio' 
  | 'inundacao' 
  | 'incidente_quimico' 
  | 'ameaca_bomba' 
  | 'agressor_ativo' 
  | 'multiplas_vitimas';

export interface DecisionConsequence {
  id: string;
  type: 'positiva' | 'negativa' | 'atraso' | 'consumo_recurso' | 'perda_recurso' | 'agravamento_fogo' | 'bloqueio_rota' | 'exposicao_paciente' | 'reforco_necessario';
  description: string;
  scoreBonus: number;
  fireSpreadDelta: number;
  smokeSpreadDelta: number;
  evacuationDelaySec: number;
  resourcesUsed?: { resourceId: string; amount: number }[];
  compromisesStairId?: string;
  evacuatesPatientsCount?: number;
}

export interface DecisionOption {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D';
  label: string;
  actionType: string;
  requiredResources: string;
  scoreWeight: number;
  isOptimal: boolean;
  consequence: DecisionConsequence;
  pedagogicalRationale: string; // Explicação no modo treinamento
}

export interface ScenarioEvent {
  id: string;
  stepOrder: number;
  triggerTimeSec: number;
  eventType: 'deteccao' | 'confirmacao' | 'alarme' | 'falha_sistema' | 'propagacao_fogo' | 'propagacao_fumaca' | 'bloqueio_rota' | 'paciente_critico' | 'reforco_externo' | 'encerramento';
  locationLabel: string;
  title: string;
  description: string;
  availableInfo: string;
  isCritical: boolean;
  decisions: DecisionOption[];
  autoNextTimeSec?: number;
}

export interface Scenario {
  id: string;
  code: string;
  title: string;
  hazardType: HazardType;
  initialFloor: number;
  initialRoom: string;
  simulatedStartTime: string; // "10:20:00"
  severityLevel: 'baixo' | 'medio' | 'alto' | 'critico_geral';
  description: string;
  learningObjectives: string[];
  events: ScenarioEvent[];
}

export interface SimulationDecisionRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  decisionId: string;
  optionLetter: string;
  decisionLabel: string;
  timestampSec: number;
  simulatedTimeStr: string;
  responseTimeSeconds: number;
  scoreAwarded: number;
  isOptimal: boolean;
  rationale: string;
}

export interface SimulationLogEntry {
  id: string;
  timestampSec: number;
  simulatedTimeStr: string;
  category: 'DETECCAO' | 'ALARME' | 'BRIGADA' | 'EVACUACAO' | 'FOGO' | 'FUMACA' | 'C3' | 'DECISAO' | 'MEDICO';
  title: string;
  description: string;
  severity: 'info' | 'alerta' | 'critico' | 'sucesso';
}

export interface EvaluationResult {
  overallScore: number;
  gradeClassification: 'Excelente (Comando Exemplar)' | 'Satisfatório (Comando Adequado)' | 'Atenção (Falhas Táticas)' | 'Crítico (Risco Extremo)';
  decisionTimeScore: number;
  lifeProtectionScore: number;
  patientSafetyScore: number;
  coordinationScore: number;
  resourceUsageScore: number;
  communicationScore: number;
  continuityScore: number;
  evacuatedTotal: number;
  criticalSaved: number;
  patientsExposed: number;
  routesBlockedCount: number;
  evaluatorNotes: string;
  recommendations: string[];
}

export interface ReportData {
  id: string;
  reportNumber: string;
  generatedAt: string;
  participantName: string;
  instructorName: string;
  hospitalName: string;
  scenarioTitle: string;
  simulationDurationSec: number;
  evaluation: EvaluationResult;
  timeline: SimulationLogEntry[];
  decisions: SimulationDecisionRecord[];
  patientsStatusSummary: {
    total: number;
    evacuated: number;
    inRefuge: number;
    inBed: number;
    exposed: number;
  };
}

export type SimulationMode = 'treinamento' | 'avaliacao' | 'instrutor';

export type EmergencyLevel = 
  | 'verde_normal' 
  | 'amarelo_alerta' 
  | 'laranja_emergencia_local' 
  | 'vermelho_evacuacao_geral';
