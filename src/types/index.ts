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

export interface FireProtectionSystemItem {
  id: string;
  orderNumber: number;
  name: string;
  code: string;
  exists: boolean; // Se há ou não há no hospital
  operationalStatus: 'operacional' | 'parcial' | 'em_manutencao' | 'inoperante';
  standardRef: string; // Ex: ABNT NBR 17240, NBR 10897, NBR 14880, NFPA 99
  coveragePercent: number;
  locationScope: string;
  cfdImpactDescription: string;
  lastInspectionDate: string;
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
  buildingHeightM: number;
  floorHeightM: number;
  totalAreaM2: number;
  totalBedsCount: number;
  maxOccupancy: number;
  hasHeliport: boolean;
  phoneEmergency: string;
  notes: string;
  constructionClassification: string; // Ex: Edificação Hospitalar Tipo Z-2 / NBR 9077
  fireProtectionChecklist?: FireProtectionSystemItem[];
}

export interface Floor {
  id: number; // -1, 0, 1, 2, 3, 4
  name: string;
  purpose: string;
  areaM2: number;
  floorHeightM: number;
  ceilingHeightM: number;
  trrfRatingMin: number; // Tempo Requerido de Resistência ao Fogo em minutos (ex: 60, 90, 120)
  hasCompartmentation: boolean;
  fireDoorsCount: number;
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
  id?: string;
  type?: 'positiva' | 'negativa' | 'atraso' | 'consumo_recurso' | 'perda_recurso' | 'agravamento_fogo' | 'bloqueio_rota' | 'exposicao_paciente' | 'reforco_necessario' | string;
  description?: string;
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

// ==========================================
// CFD / FIRE DYNAMICS SIMULATOR (FDS) TYPES
// ==========================================

export type CFDVisualizationMode = 
  | 'temperatura' 
  | 'fumaca_visibilidade' 
  | 'toxicidade_co' 
  | 'vetores_escoamento' 
  | 'pathfinder_rotas';

export interface CFDGridCell {
  x: number; // grid coordinate X (0 to cols-1)
  y: number; // grid coordinate Y (0 to rows-1)
  worldX: number;
  worldZ: number;
  tempC: number;
  smokeOpticalDensity: number; // 1/m (extinction coefficient k)
  visibilityM: number; // Visibility in meters = 3 / k
  coPpm: number; // Carbon Monoxide ppm
  fedToxicity: number; // Fractional Effective Dose (0 to >1.0 lethal)
  uVel: number; // m/s X-direction
  vVel: number; // m/s Y-direction
  smokeLayerHeightM: number; // smoke layer descent from ceiling (m)
  isWall: boolean;
  isDoor: boolean;
  isFireDoorClosed: boolean;
  isVent: boolean;
  isFireSource: boolean;
  isSprinklerActive: boolean;
  isRefugeZone: boolean;
}

export interface CFDProbeSensor {
  id: string;
  name: string;
  locationLabel: string;
  gridX: number;
  gridY: number;
  tempC: number;
  visibilityM: number;
  coPpm: number;
  fedToxicity: number;
  tenabilityStatus: 'tenivel' | 'alerta_moderado' | 'inabitavel_critico';
  historyTemps: number[];
  historyVisibilities: number[];
}

// ==========================================
// FDS (FIRE DYNAMICS SIMULATOR) INTEGRATION TYPES
// ==========================================

export interface FDSThermocoupleProbe {
  id: string;
  label: string;
  heightM: number; // Elevation z in meters (ex: 0.5, 1.2, 1.8, 2.4, 2.7m)
  locationGroup: 'origin_room_408' | 'corridor_center' | 'refuge_area' | 'stairwell_north' | 'stairwell_south';
  locationGroupName: string;
  color: string;
  timeSeries: [number, number][]; // [timeSeconds, temperatureCelsius]
}

export interface FDSDeviceChannel {
  id: string; // Device ID (e.g., 'HRR', 'TEMP_408', 'VIS_CORR')
  name: string; // Human label
  quantity: 'TEMPERATURE' | 'VISIBILITY' | 'HEAT RELEASE RATE' | 'VOLUME FRACTION' | 'PRESSURE' | 'VELOCITY' | 'OPTICAL DENSITY' | 'FED' | string;
  unit: 'C' | 'kW' | 'm' | 'ppm' | 'Pa' | 'm/s' | '1/m' | '%' | '' | 'FED' | string;
  timeSeries: [number, number][]; // [timeSeconds, value]
}

export interface FDSSliceGridFrame {
  timeSec: number;
  cells: {
    x: number;
    y: number;
    tempC: number;
    visibilityM: number;
    coPpm: number;
    smokeOpticalDensity: number;
    uVel: number;
    vVel: number;
  }[];
}

export interface FDSDataset {
  id: string;
  name: string;
  sourceType: 'nist_fds_output_file' | 'pyrosim_export' | 'fds_devc_csv' | 'calibrated_benchmark';
  fileName?: string;
  importedAt: string;
  fdsVersion: string; // e.g. 'FDS 6.8.0'
  durationSec: number;
  timeStepSec: number;
  meshResolutionM: number;
  channels: FDSDeviceChannel[];
  sliceFrames: FDSSliceGridFrame[];
  description: string;
  thermocoupleProbes?: FDSThermocoupleProbe[];
}

export interface FDSFileParseResult {
  success: boolean;
  formatDetected: 'FDS_DEVC_CSV' | 'FDS_HRR_CSV' | 'FDS_JSON' | 'CUSTOM_CSV' | 'UNKNOWN';
  fileName: string;
  dataset?: FDSDataset;
  error?: string;
  channelsFoundCount: number;
  timeRowsCount: number;
  durationSec: number;
}

export interface CFDSimulationState {
  stepCount: number;
  elapsedSec: number;
  currentHRRKw: number; // Heat Release Rate in kW (ex: 2500 kW = 2.5 MW)
  peakTempC: number;
  averageCorridorVisibilityM: number;
  smokeLayerHeightM: number;
  coMaxPpm: number;
  fedMaxToxicity: number;
  fireSpreadNormalized: number; // 0 to 1 based on FDS physics
  smokeSpreadNormalized: number; // 0 to 1 based on FDS physics
  isFDSDataDriven: boolean;
  fdsDataSourceName: string;
  smokeExhaustFanActive: boolean;
  stairPressurizationActive: boolean;
  sprinklersTrippedCount: number;
  fireDoorsSealedCount: number;
  probes: CFDProbeSensor[];
}

// ==========================================
// MOTOR DE CENÁRIOS (SCENARIO ENGINE) TYPES
// ==========================================

export interface ScenarioEngineFormConfig {
  incidentType: 'incendio_estrutural' | 'incendio_uti_o2' | 'incendio_bloco_cirurgico' | 'incendio_cozinha' | 'incendio_geradores' | 'vazamento_gas_medicinal' | 'blecaute_geral';
  sectorName: string;
  floorId: number;
  originRoomNumber: string;
  originRoomName: string;
  totalPatientsCount: number;
  patientsP0: number; // Autônomo
  patientsP1: number; // Mobilidade Reduzida
  patientsP2: number; // Cadeirante
  patientsP3: number; // Acamado
  patientsP4: number; // Suporte de Vida
  
  // Falhas Injetadas / Condições de Contorno
  sprinklerUnavailable: boolean;
  stairABlocked: boolean;
  stairBDoorHeldOpen: boolean;
  pressurizationFailure: boolean;
  elevatorFailure: boolean;
  reducedBrigade50: boolean;
  medicalGasValveStuck: boolean;
  smokeExtractionFailure: boolean;
  delayedAlarmDispatch: boolean;
  oxygenZoneRisk: boolean;

  difficultyLevel: 'basico' | 'intermediario' | 'avancado';
  instructorNotes: string;
}
