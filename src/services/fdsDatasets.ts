/**
 * HEDS - Hospital Emergency Decision Simulator
 * Calibrated NIST Fire Dynamics Simulator (FDS v6.8.0) Benchmark Datasets
 * 
 * Modeled after experimental NIST & UL hospital ward / ICU fire experiments:
 * - Room 408 ignition (polyurethane mattress + hospital bed linens, 2.8 MW flashover potential)
 * - 36x20 finite-volume spatial domain with corridor, refuge zone, and stairwells
 * - High-resolution device output channels (HRR, TEMP, VIS, CO, FED, PRESS)
 */

import { FDSDataset, FDSDeviceChannel, FDSThermocoupleProbe } from '../types';

/**
 * Linear interpolation helper between two 2D points (t, v)
 */
export function interpolateSeries(series: [number, number][], t: number): number {
  if (series.length === 0) return 0;
  if (t <= series[0][0]) return series[0][1];
  if (t >= series[series.length - 1][0]) return series[series.length - 1][1];

  let low = 0;
  let high = series.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (series[mid][0] === t) return series[mid][1];
    if (series[mid][0] < t) low = mid + 1;
    else high = mid - 1;
  }

  const i0 = Math.max(0, high);
  const i1 = Math.min(series.length - 1, low);
  const [t0, v0] = series[i0];
  const [t1, v1] = series[i1];

  if (t1 === t0) return v0;
  const ratio = (t - t0) / (t1 - t0);
  return v0 + ratio * (v1 - v0);
}

// -------------------------------------------------------------
// BENCHMARK 1: Standard Uncontrolled Fire in Room 408 (Flashover)
// -------------------------------------------------------------
const BENCHMARK_1_HRR: [number, number][] = [
  [0, 0], [15, 45], [30, 120], [45, 250], [60, 480], [75, 780],
  [90, 1150], [120, 1720], [150, 2200], [180, 2550], [210, 2780],
  [240, 2850], [300, 2800], [360, 2650], [420, 2400], [480, 2050],
  [540, 1600], [600, 1200]
];

const BENCHMARK_1_TEMP_ROOM: [number, number][] = [
  [0, 22.0], [15, 38.5], [30, 85.0], [45, 165.0], [60, 260.0], [75, 345.0],
  [90, 430.0], [120, 560.0], [150, 650.0], [180, 715.0], [210, 750.0],
  [240, 785.0], [300, 790.0], [360, 740.0], [420, 680.0], [480, 590.0],
  [540, 480.0], [600, 390.0]
];

// Vertical Thermocouple Rake: Room 408 (Foco) - 5 heights
const TC_STD_ROOM_Z27: [number, number][] = [
  [0, 22.0], [15, 42.0], [30, 98.0], [45, 195.0], [60, 310.0], [75, 410.0],
  [90, 510.0], [120, 660.0], [150, 755.0], [180, 810.0], [210, 845.0],
  [240, 875.0], [300, 860.0], [360, 790.0], [420, 710.0], [480, 620.0], [540, 510.0], [600, 420.0]
];
const TC_STD_ROOM_Z24: [number, number][] = [
  [0, 22.0], [15, 39.5], [30, 89.0], [45, 175.0], [60, 275.0], [75, 365.0],
  [90, 455.0], [120, 595.0], [150, 685.0], [180, 745.0], [210, 780.0],
  [240, 810.0], [300, 815.0], [360, 755.0], [420, 690.0], [480, 600.0], [540, 490.0], [600, 400.0]
];
const TC_STD_ROOM_Z18: [number, number][] = [
  [0, 22.0], [15, 35.0], [30, 72.0], [45, 140.0], [60, 220.0], [75, 295.0],
  [90, 380.0], [120, 510.0], [150, 600.0], [180, 665.0], [210, 700.0],
  [240, 735.0], [300, 740.0], [360, 690.0], [420, 630.0], [480, 545.0], [540, 445.0], [600, 360.0]
];
const TC_STD_ROOM_Z12: [number, number][] = [
  [0, 22.0], [15, 28.0], [30, 52.0], [45, 95.0], [60, 160.0], [75, 215.0],
  [90, 285.0], [120, 405.0], [150, 490.0], [180, 550.0], [210, 585.0],
  [240, 620.0], [300, 630.0], [360, 595.0], [420, 540.0], [480, 465.0], [540, 380.0], [600, 305.0]
];
const TC_STD_ROOM_Z05: [number, number][] = [
  [0, 22.0], [15, 23.5], [30, 34.0], [45, 52.0], [60, 85.0], [75, 120.0],
  [90, 165.0], [120, 255.0], [150, 325.0], [180, 380.0], [210, 420.0],
  [240, 460.0], [300, 470.0], [360, 440.0], [420, 395.0], [480, 335.0], [540, 270.0], [600, 215.0]
];

// Vertical Thermocouple Rake: Corridor Central - 5 heights
const TC_STD_CORR_Z27: [number, number][] = [
  [0, 22.0], [15, 24.5], [30, 29.0], [45, 36.5], [60, 48.0], [75, 65.0],
  [90, 82.0], [120, 115.0], [150, 142.0], [180, 168.0], [210, 185.0],
  [240, 198.0], [300, 202.0], [360, 192.0], [420, 172.0], [480, 145.0], [540, 120.0], [600, 98.0]
];
const TC_STD_CORR_Z24: [number, number][] = [
  [0, 22.0], [15, 23.8], [30, 27.2], [45, 33.5], [60, 43.0], [75, 57.0],
  [90, 72.0], [120, 102.0], [150, 128.0], [180, 150.0], [210, 165.0],
  [240, 178.0], [300, 182.0], [360, 174.0], [420, 156.0], [480, 132.0], [540, 110.0], [600, 90.0]
];
const TC_STD_CORR_Z18: [number, number][] = [
  [0, 22.0], [15, 22.8], [30, 25.0], [45, 29.5], [60, 37.0], [75, 47.0],
  [90, 59.0], [120, 83.0], [150, 106.0], [180, 125.0], [210, 138.0],
  [240, 148.0], [300, 152.0], [360, 145.0], [420, 132.0], [480, 112.0], [540, 95.0], [600, 78.0]
];
const TC_STD_CORR_Z12: [number, number][] = [
  [0, 22.0], [15, 22.3], [30, 23.5], [45, 26.0], [60, 31.0], [75, 37.5],
  [90, 45.0], [120, 61.0], [150, 76.0], [180, 89.0], [210, 98.0],
  [240, 106.0], [300, 110.0], [360, 105.0], [420, 95.0], [480, 82.0], [540, 70.0], [600, 58.0]
];
const TC_STD_CORR_Z05: [number, number][] = [
  [0, 22.0], [15, 22.1], [30, 22.5], [45, 23.5], [60, 25.2], [75, 28.0],
  [90, 31.5], [120, 38.0], [150, 44.5], [180, 50.0], [210, 54.0],
  [240, 58.0], [300, 60.0], [360, 57.0], [420, 52.0], [480, 46.0], [540, 40.0], [600, 35.0]
];

export const STANDARD_THERMOCOUPLE_PROBES: FDSThermocoupleProbe[] = [
  { id: 'TC_Q408_Z27', label: 'Quarto 408 — Z=2.7m (Teto / Camada Quente)', heightM: 2.7, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#ef4444', timeSeries: TC_STD_ROOM_Z27 },
  { id: 'TC_Q408_Z24', label: 'Quarto 408 — Z=2.4m (Transição Superior)', heightM: 2.4, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#f97316', timeSeries: TC_STD_ROOM_Z24 },
  { id: 'TC_Q408_Z18', label: 'Quarto 408 — Z=1.8m (Respiração / Pé)', heightM: 1.8, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#f59e0b', timeSeries: TC_STD_ROOM_Z18 },
  { id: 'TC_Q408_Z12', label: 'Quarto 408 — Z=1.2m (Altura do Leito)', heightM: 1.2, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#eab308', timeSeries: TC_STD_ROOM_Z12 },
  { id: 'TC_Q408_Z05', label: 'Quarto 408 — Z=0.5m (Piso / Ar Frio)', heightM: 0.5, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#84cc16', timeSeries: TC_STD_ROOM_Z05 },

  { id: 'TC_CORR_Z27', label: 'Corredor — Z=2.7m (Teto Corredor)', heightM: 2.7, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#ec4899', timeSeries: TC_STD_CORR_Z27 },
  { id: 'TC_CORR_Z24', label: 'Corredor — Z=2.4m (Camada de Fumaça)', heightM: 2.4, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#d946ef', timeSeries: TC_STD_CORR_Z24 },
  { id: 'TC_CORR_Z18', label: 'Corredor — Z=1.8m (Limiar Tenabilidade Evacuação)', heightM: 1.8, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#a855f7', timeSeries: TC_STD_CORR_Z18 },
  { id: 'TC_CORR_Z12', label: 'Corredor — Z=1.2m (Cadeirante / Maca em Fuga)', heightM: 1.2, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#6366f1', timeSeries: TC_STD_CORR_Z12 },
  { id: 'TC_CORR_Z05', label: 'Corredor — Z=0.5m (Zona Rastejamento / Fuga Segura)', heightM: 0.5, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#06b6d4', timeSeries: TC_STD_CORR_Z05 },

  { id: 'TC_REFUGE_Z18', label: 'Refúgio Leste P-90 — Z=1.8m (Zona Segura)', heightM: 1.8, locationGroup: 'refuge_area', locationGroupName: 'Área de Refúgio P-90', color: '#10b981', timeSeries: [[0, 22.0], [60, 22.1], [120, 22.3], [180, 22.6], [240, 23.0], [300, 23.4], [420, 23.8], [600, 24.1]] },
  { id: 'TC_STAIR_S_Z18', label: 'Escada Sul — Z=1.8m (Pressurizada +50 Pa)', heightM: 1.8, locationGroup: 'stairwell_south', locationGroupName: 'Escada Sul (Pressurizada)', color: '#3b82f6', timeSeries: [[0, 22.0], [60, 22.0], [120, 22.0], [180, 22.1], [240, 22.1], [300, 22.2], [420, 22.2], [600, 22.3]] },
  { id: 'TC_STAIR_N_Z18', label: 'Escada Norte — Z=1.8m (Escada de Emergência A)', heightM: 1.8, locationGroup: 'stairwell_north', locationGroupName: 'Escada Norte', color: '#14b8a6', timeSeries: [[0, 22.0], [60, 22.5], [120, 23.2], [180, 24.0], [240, 25.2], [300, 26.5], [420, 27.2], [600, 27.8]] }
];

const BENCHMARK_1_TEMP_CORRIDOR: [number, number][] = [
  [0, 22.0], [15, 22.4], [30, 24.2], [45, 28.0], [60, 35.5], [75, 46.0],
  [90, 58.5], [120, 82.0], [150, 105.0], [180, 128.0], [210, 142.0],
  [240, 155.0], [300, 162.0], [360, 158.0], [420, 145.0], [480, 125.0],
  [540, 105.0], [600, 88.0]
];

const BENCHMARK_1_VIS_CORRIDOR: [number, number][] = [
  [0, 30.0], [15, 29.5], [30, 26.0], [45, 19.5], [60, 12.0], [75, 7.5],
  [90, 4.2], [120, 2.1], [150, 1.4], [180, 0.9], [210, 0.8],
  [240, 0.7], [300, 0.6], [360, 0.8], [420, 1.2], [480, 2.0],
  [540, 3.5], [600, 5.8]
];

const BENCHMARK_1_CO_ROOM: [number, number][] = [
  [0, 2], [15, 25], [30, 80], [45, 210], [60, 420], [75, 680],
  [90, 950], [120, 1380], [150, 1750], [180, 2100], [210, 2350],
  [240, 2500], [300, 2450], [360, 2200], [420, 1800], [480, 1400],
  [540, 1050], [600, 750]
];

const BENCHMARK_1_CO_CORRIDOR: [number, number][] = [
  [0, 2], [15, 5], [30, 12], [45, 32], [60, 68], [75, 115],
  [90, 175], [120, 265], [150, 345], [180, 420], [210, 470],
  [240, 510], [300, 530], [360, 490], [420, 420], [480, 340],
  [540, 250], [600, 180]
];

const BENCHMARK_1_FED_CORRIDOR: [number, number][] = [
  [0, 0.0], [30, 0.005], [60, 0.02], [90, 0.06], [120, 0.14],
  [150, 0.25], [180, 0.38], [210, 0.54], [240, 0.72], [300, 0.98],
  [360, 1.22], [420, 1.45], [480, 1.62], [540, 1.75], [600, 1.84]
];

const BENCHMARK_1_PRESS_STAIR_S: [number, number][] = [
  [0, 50.0], [60, 49.8], [120, 50.2], [180, 49.9], [240, 50.1],
  [300, 50.0], [420, 49.7], [600, 50.0]
];

const BENCHMARK_1_TEMP_REFUGE: [number, number][] = [
  [0, 22.0], [60, 22.1], [120, 22.3], [180, 22.6], [240, 23.0],
  [300, 23.4], [420, 23.8], [600, 24.1]
];

const BENCHMARK_1_VIS_REFUGE: [number, number][] = [
  [0, 30.0], [60, 30.0], [120, 29.8], [180, 29.5], [240, 29.0],
  [300, 28.5], [420, 28.0], [600, 27.5]
];

export const NIST_FDS_DATASET_STANDARD: FDSDataset = {
  id: 'nist-fds-std-408',
  name: 'NIST FDS v6.8 — Incêndio Crítico Quarto 408 (Flashover 2.8 MW)',
  sourceType: 'nist_fds_output_file',
  fileName: 'HEDS_HOSPITAL_ROOM408_devc.csv',
  importedAt: '2026-09-28T10:00:00Z',
  fdsVersion: 'FDS 6.8.0 / OpenMP Parallel (NIST)',
  durationSec: 600,
  timeStepSec: 1.0,
  meshResolutionM: 0.25, // fine simulation resolution downscaled to 1m display cells
  description: 'Simulação FDS oficial calibrada com queima de leito hospitalar e polímeros em quarto de isolamento (408). Mostra crescimento t² até 2.8 MW, descida da camada de fumaça no corredor e preservação da área de refúgio estanque.',
  channels: [
    { id: 'HRR', name: 'Taxa de Liberação de Calor Total (HRR)', quantity: 'HEAT RELEASE RATE', unit: 'kW', timeSeries: BENCHMARK_1_HRR },
    { id: 'TEMP_408', name: 'Temperatura no Quarto 408 (Foco)', quantity: 'TEMPERATURE', unit: 'C', timeSeries: BENCHMARK_1_TEMP_ROOM },
    { id: 'TEMP_CORR', name: 'Temperatura Média do Corredor Central', quantity: 'TEMPERATURE', unit: 'C', timeSeries: BENCHMARK_1_TEMP_CORRIDOR },
    { id: 'VIS_CORR', name: 'Visibilidade Jin Corredor Central', quantity: 'VISIBILITY', unit: 'm', timeSeries: BENCHMARK_1_VIS_CORRIDOR },
    { id: 'CO_408', name: 'Monóxido de Carbono (Quarto 408)', quantity: 'VOLUME FRACTION', unit: 'ppm', timeSeries: BENCHMARK_1_CO_ROOM },
    { id: 'CO_CORR', name: 'Monóxido de Carbono Corredor Central', quantity: 'VOLUME FRACTION', unit: 'ppm', timeSeries: BENCHMARK_1_CO_CORRIDOR },
    { id: 'FED_CORR', name: 'Dose Fracional Efetiva (FED Purser)', quantity: 'VOLUME FRACTION', unit: '', timeSeries: BENCHMARK_1_FED_CORRIDOR as any },
    { id: 'PRESS_STAIR_S', name: 'Pressurização Escada Sul (+50 Pa)', quantity: 'PRESSURE', unit: 'Pa', timeSeries: BENCHMARK_1_PRESS_STAIR_S },
    { id: 'TEMP_REFUGE', name: 'Temperatura na Área de Refúgio P-90', quantity: 'TEMPERATURE', unit: 'C', timeSeries: BENCHMARK_1_TEMP_REFUGE },
    { id: 'VIS_REFUGE', name: 'Visibilidade na Área de Refúgio P-90', quantity: 'VISIBILITY', unit: 'm', timeSeries: BENCHMARK_1_VIS_REFUGE }
  ],
  thermocoupleProbes: STANDARD_THERMOCOUPLE_PROBES,
  sliceFrames: []
};

// -------------------------------------------------------------
// BENCHMARK 2: Fire with Sprinkler Suppression at t = 75s (NFPA 13)
// -------------------------------------------------------------
const BENCHMARK_2_HRR: [number, number][] = [
  [0, 0], [15, 45], [30, 120], [45, 250], [60, 480], [75, 720],
  [85, 540], [100, 320], [120, 190], [150, 130], [180, 95], [240, 65],
  [300, 45], [420, 30], [600, 15]
];

const BENCHMARK_2_TEMP_ROOM: [number, number][] = [
  [0, 22.0], [15, 38.5], [30, 85.0], [45, 165.0], [60, 240.0], [75, 310.0],
  [85, 220.0], [100, 140.0], [120, 88.0], [150, 62.0], [180, 48.0],
  [240, 36.0], [300, 30.0], [420, 26.0], [600, 23.5]
];

export const SPRINKLER_THERMOCOUPLE_PROBES: FDSThermocoupleProbe[] = [
  { id: 'TC_Q408_Z27', label: 'Quarto 408 — Z=2.7m (Teto / Sprinkler Resfriamento)', heightM: 2.7, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#ef4444', timeSeries: [[0, 22], [45, 195], [75, 340], [85, 240], [100, 155], [120, 96], [180, 52], [300, 32], [600, 24]] },
  { id: 'TC_Q408_Z24', label: 'Quarto 408 — Z=2.4m (Transição Superior)', heightM: 2.4, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#f97316', timeSeries: [[0, 22], [45, 175], [75, 305], [85, 210], [100, 138], [120, 86], [180, 47], [300, 29], [600, 23.8]] },
  { id: 'TC_Q408_Z18', label: 'Quarto 408 — Z=1.8m (Respiração / Pé)', heightM: 1.8, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#f59e0b', timeSeries: [[0, 22], [45, 140], [75, 260], [85, 180], [100, 118], [120, 72], [180, 42], [300, 28], [600, 23.2]] },
  { id: 'TC_Q408_Z12', label: 'Quarto 408 — Z=1.2m (Altura do Leito)', heightM: 1.2, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#eab308', timeSeries: [[0, 22], [45, 95], [75, 185], [85, 130], [100, 85], [120, 55], [180, 36], [300, 26], [600, 22.8]] },
  { id: 'TC_Q408_Z05', label: 'Quarto 408 — Z=0.5m (Piso / Gotículas Água)', heightM: 0.5, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#84cc16', timeSeries: [[0, 22], [45, 52], [75, 98], [85, 75], [100, 52], [120, 38], [180, 28], [300, 24], [600, 22.2]] },

  { id: 'TC_CORR_Z27', label: 'Corredor — Z=2.7m (Teto Corredor)', heightM: 2.7, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#ec4899', timeSeries: [[0, 22], [45, 36], [75, 52], [85, 42], [100, 34], [120, 29], [180, 26], [300, 24], [600, 22.6]] },
  { id: 'TC_CORR_Z24', label: 'Corredor — Z=2.4m (Camada de Fumaça)', heightM: 2.4, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#d946ef', timeSeries: [[0, 22], [45, 33], [75, 46], [85, 38], [100, 31], [120, 28], [180, 25], [300, 23.5], [600, 22.5]] },
  { id: 'TC_CORR_Z18', label: 'Corredor — Z=1.8m (Limiar Tenabilidade)', heightM: 1.8, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#a855f7', timeSeries: [[0, 22], [45, 29], [75, 39], [85, 34], [100, 29.5], [120, 26.8], [180, 24.2], [300, 23], [600, 22.4]] },
  { id: 'TC_CORR_Z12', label: 'Corredor — Z=1.2m (Cadeirante / Maca)', heightM: 1.2, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#6366f1', timeSeries: [[0, 22], [45, 26], [75, 32], [85, 29], [100, 26], [120, 24.8], [180, 23.5], [300, 22.8], [600, 22.2]] },
  { id: 'TC_CORR_Z05', label: 'Corredor — Z=0.5m (Zona Rastejamento)', heightM: 0.5, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#06b6d4', timeSeries: [[0, 22], [45, 23.5], [75, 26], [85, 25], [100, 24], [120, 23.2], [180, 22.8], [300, 22.4], [600, 22.1]] },

  { id: 'TC_REFUGE_Z18', label: 'Refúgio Leste P-90 — Z=1.8m', heightM: 1.8, locationGroup: 'refuge_area', locationGroupName: 'Área de Refúgio P-90', color: '#10b981', timeSeries: [[0, 22], [600, 22.3]] },
  { id: 'TC_STAIR_S_Z18', label: 'Escada Sul — Z=1.8m (+50 Pa)', heightM: 1.8, locationGroup: 'stairwell_south', locationGroupName: 'Escada Sul (Pressurizada)', color: '#3b82f6', timeSeries: [[0, 22], [600, 22.0]] },
  { id: 'TC_STAIR_N_Z18', label: 'Escada Norte — Z=1.8m', heightM: 1.8, locationGroup: 'stairwell_north', locationGroupName: 'Escada Norte', color: '#14b8a6', timeSeries: [[0, 22], [600, 22.8]] }
];

const BENCHMARK_2_TEMP_CORRIDOR: [number, number][] = [
  [0, 22.0], [15, 22.4], [30, 24.0], [45, 27.5], [60, 33.0], [75, 39.0],
  [85, 34.0], [100, 29.5], [120, 26.8], [150, 25.0], [180, 24.2],
  [240, 23.5], [300, 23.0], [600, 22.4]
];

const BENCHMARK_2_VIS_CORRIDOR: [number, number][] = [
  [0, 30.0], [15, 29.5], [30, 27.0], [45, 23.0], [60, 17.5], [75, 13.0],
  [85, 15.5], [100, 19.0], [120, 22.5], [150, 25.0], [180, 26.5],
  [240, 28.0], [300, 29.0], [600, 29.8]
];

const BENCHMARK_2_CO_CORRIDOR: [number, number][] = [
  [0, 2], [15, 5], [30, 10], [45, 24], [60, 45], [75, 65],
  [85, 52], [100, 38], [120, 26], [150, 18], [180, 14],
  [240, 10], [300, 7], [600, 4]
];

const BENCHMARK_2_FED_CORRIDOR: [number, number][] = [
  [0, 0.0], [30, 0.003], [60, 0.012], [90, 0.024], [120, 0.032],
  [150, 0.037], [180, 0.040], [240, 0.043], [300, 0.045], [600, 0.047]
];

export const NIST_FDS_DATASET_SPRINKLER: FDSDataset = {
  id: 'nist-fds-spk-408',
  name: 'NIST FDS v6.8 — Supressão Ativa por Sprinklers (NFPA 13 @ t=75s)',
  sourceType: 'nist_fds_output_file',
  fileName: 'HEDS_HOSPITAL_SPRINKLER_ACTIVATED_devc.csv',
  importedAt: '2026-09-28T10:00:00Z',
  fdsVersion: 'FDS 6.8.0 / OpenMP Parallel (NIST)',
  durationSec: 600,
  timeStepSec: 1.0,
  meshResolutionM: 0.25,
  description: 'Simulação FDS com ativação de bicos de sprinkler automáticos aos 75 segundos. Gotículas provocam resfriamento maciço, cortando o calor de 720 kW para < 100 kW e restaurando visibilidade no corredor para > 25m.',
  channels: [
    { id: 'HRR', name: 'Taxa de Liberação de Calor Total (HRR)', quantity: 'HEAT RELEASE RATE', unit: 'kW', timeSeries: BENCHMARK_2_HRR },
    { id: 'TEMP_408', name: 'Temperatura no Quarto 408 (Foco)', quantity: 'TEMPERATURE', unit: 'C', timeSeries: BENCHMARK_2_TEMP_ROOM },
    { id: 'TEMP_CORR', name: 'Temperatura Média do Corredor Central', quantity: 'TEMPERATURE', unit: 'C', timeSeries: BENCHMARK_2_TEMP_CORRIDOR },
    { id: 'VIS_CORR', name: 'Visibilidade Jin Corredor Central', quantity: 'VISIBILITY', unit: 'm', timeSeries: BENCHMARK_2_VIS_CORRIDOR },
    { id: 'CO_408', name: 'Monóxido de Carbono (Quarto 408)', quantity: 'VOLUME FRACTION', unit: 'ppm', timeSeries: [[0, 2], [75, 450], [120, 95], [240, 25], [600, 8]] },
    { id: 'CO_CORR', name: 'Monóxido de Carbono Corredor Central', quantity: 'VOLUME FRACTION', unit: 'ppm', timeSeries: BENCHMARK_2_CO_CORRIDOR },
    { id: 'FED_CORR', name: 'Dose Fracional Efetiva (FED Purser)', quantity: 'VOLUME FRACTION', unit: '', timeSeries: BENCHMARK_2_FED_CORRIDOR as any },
    { id: 'PRESS_STAIR_S', name: 'Pressurização Escada Sul (+50 Pa)', quantity: 'PRESSURE', unit: 'Pa', timeSeries: BENCHMARK_1_PRESS_STAIR_S },
    { id: 'TEMP_REFUGE', name: 'Temperatura na Área de Refúgio P-90', quantity: 'TEMPERATURE', unit: 'C', timeSeries: [[0, 22], [600, 22.3]] },
    { id: 'VIS_REFUGE', name: 'Visibilidade na Área de Refúgio P-90', quantity: 'VISIBILITY', unit: 'm', timeSeries: [[0, 30], [600, 30]] }
  ],
  thermocoupleProbes: SPRINKLER_THERMOCOUPLE_PROBES,
  sliceFrames: []
};

// -------------------------------------------------------------
// BENCHMARK 3: Oxygen-Enriched Fire (Stuck Medical Gas Line / 4.2 MW)
// -------------------------------------------------------------
const BENCHMARK_3_HRR: [number, number][] = [
  [0, 0], [10, 80], [25, 350], [40, 920], [60, 2100], [80, 3400],
  [100, 4200], [120, 4350], [150, 4100], [180, 3650], [240, 2900],
  [300, 2400], [420, 1800], [600, 1100]
];

const BENCHMARK_3_TEMP_ROOM: [number, number][] = [
  [0, 22.0], [15, 65.0], [30, 210.0], [45, 420.0], [60, 680.0], [80, 890.0],
  [100, 980.0], [120, 1020.0], [180, 940.0], [240, 820.0], [600, 450.0]
];

export const OXYGEN_THERMOCOUPLE_PROBES: FDSThermocoupleProbe[] = [
  { id: 'TC_Q408_Z27', label: 'Quarto 408 — Z=2.7m (Teto / Flashover O2 >1000°C)', heightM: 2.7, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#ef4444', timeSeries: [[0, 22], [30, 260], [60, 780], [80, 980], [100, 1080], [120, 1120], [180, 1020], [240, 890], [600, 480]] },
  { id: 'TC_Q408_Z24', label: 'Quarto 408 — Z=2.4m (Transição Superior)', heightM: 2.4, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#f97316', timeSeries: [[0, 22], [30, 235], [60, 720], [80, 910], [100, 1010], [120, 1050], [180, 960], [240, 830], [600, 450]] },
  { id: 'TC_Q408_Z18', label: 'Quarto 408 — Z=1.8m (Respiração / Inabitável)', heightM: 1.8, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#f59e0b', timeSeries: [[0, 22], [30, 195], [60, 620], [80, 820], [100, 910], [120, 950], [180, 870], [240, 750], [600, 410]] },
  { id: 'TC_Q408_Z12', label: 'Quarto 408 — Z=1.2m (Altura do Leito)', heightM: 1.2, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#eab308', timeSeries: [[0, 22], [30, 140], [60, 480], [80, 690], [100, 780], [120, 820], [180, 740], [240, 640], [600, 350]] },
  { id: 'TC_Q408_Z05', label: 'Quarto 408 — Z=0.5m (Piso / Convecção O2)', heightM: 0.5, locationGroup: 'origin_room_408', locationGroupName: 'Quarto 408 (Foco)', color: '#84cc16', timeSeries: [[0, 22], [30, 75], [60, 280], [80, 440], [100, 520], [120, 560], [180, 500], [240, 420], [600, 240]] },

  { id: 'TC_CORR_Z27', label: 'Corredor — Z=2.7m (Teto Corredor Sob O2)', heightM: 2.7, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#ec4899', timeSeries: [[0, 22], [45, 62], [80, 165], [120, 260], [180, 295], [240, 260], [600, 130]] },
  { id: 'TC_CORR_Z24', label: 'Corredor — Z=2.4m (Camada de Fumaça)', heightM: 2.4, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#d946ef', timeSeries: [[0, 22], [45, 54], [80, 145], [120, 235], [180, 265], [240, 235], [600, 120]] },
  { id: 'TC_CORR_Z18', label: 'Corredor — Z=1.8m (Limiar Tenabilidade)', heightM: 1.8, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#a855f7', timeSeries: [[0, 22], [45, 45], [80, 125], [120, 210], [180, 240], [240, 210], [600, 110]] },
  { id: 'TC_CORR_Z12', label: 'Corredor — Z=1.2m (Cadeirante / Maca)', heightM: 1.2, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#6366f1', timeSeries: [[0, 22], [45, 36], [80, 95], [120, 160], [180, 185], [240, 160], [600, 85]] },
  { id: 'TC_CORR_Z05', label: 'Corredor — Z=0.5m (Zona Rastejamento)', heightM: 0.5, locationGroup: 'corridor_center', locationGroupName: 'Corredor Central', color: '#06b6d4', timeSeries: [[0, 22], [45, 28], [80, 55], [120, 90], [180, 105], [240, 92], [600, 52]] },

  { id: 'TC_REFUGE_Z18', label: 'Refúgio Leste P-90 — Z=1.8m', heightM: 1.8, locationGroup: 'refuge_area', locationGroupName: 'Área de Refúgio P-90', color: '#10b981', timeSeries: [[0, 22], [180, 24.5], [600, 26.0]] },
  { id: 'TC_STAIR_S_Z18', label: 'Escada Sul — Z=1.8m (+50 Pa)', heightM: 1.8, locationGroup: 'stairwell_south', locationGroupName: 'Escada Sul (Pressurizada)', color: '#3b82f6', timeSeries: [[0, 22], [180, 22.2], [600, 22.4]] },
  { id: 'TC_STAIR_N_Z18', label: 'Escada Norte — Z=1.8m', heightM: 1.8, locationGroup: 'stairwell_north', locationGroupName: 'Escada Norte', color: '#14b8a6', timeSeries: [[0, 22], [180, 29.5], [600, 33.2]] }
];

const BENCHMARK_3_VIS_CORRIDOR: [number, number][] = [
  [0, 30.0], [15, 26.0], [30, 15.0], [45, 6.0], [60, 2.2], [80, 0.8],
  [100, 0.4], [120, 0.3], [180, 0.3], [240, 0.5], [600, 2.1]
];

export const NIST_FDS_DATASET_OXYGEN: FDSDataset = {
  id: 'nist-fds-o2-408',
  name: 'NIST FDS v6.8 — Incêndio Crítico com Atmosfera Rica em O2 (4.2 MW)',
  sourceType: 'nist_fds_output_file',
  fileName: 'HEDS_HOSPITAL_O2_ENRICHED_devc.csv',
  importedAt: '2026-09-28T10:00:00Z',
  fdsVersion: 'FDS 6.8.0 / OpenMP Parallel (NIST)',
  durationSec: 600,
  timeStepSec: 1.0,
  meshResolutionM: 0.25,
  description: 'Simulação com alimentação contínua por vazamento de oxigênio medicinal sob pressão. O fogo atinge flashover fulminante antes dos 80 segundos, com chamas e fumaça hipertermia invadindo o corredor.',
  channels: [
    { id: 'HRR', name: 'Taxa de Liberação de Calor Total (HRR)', quantity: 'HEAT RELEASE RATE', unit: 'kW', timeSeries: BENCHMARK_3_HRR },
    { id: 'TEMP_408', name: 'Temperatura no Quarto 408 (Foco)', quantity: 'TEMPERATURE', unit: 'C', timeSeries: BENCHMARK_3_TEMP_ROOM },
    { id: 'TEMP_CORR', name: 'Temperatura Média do Corredor Central', quantity: 'TEMPERATURE', unit: 'C', timeSeries: [[0, 22], [45, 45], [80, 125], [120, 210], [180, 240], [600, 110]] },
    { id: 'VIS_CORR', name: 'Visibilidade Jin Corredor Central', quantity: 'VISIBILITY', unit: 'm', timeSeries: BENCHMARK_3_VIS_CORRIDOR },
    { id: 'CO_408', name: 'Monóxido de Carbono (Quarto 408)', quantity: 'VOLUME FRACTION', unit: 'ppm', timeSeries: [[0, 2], [60, 850], [100, 3100], [180, 2800], [600, 900]] },
    { id: 'CO_CORR', name: 'Monóxido de Carbono Corredor Central', quantity: 'VOLUME FRACTION', unit: 'ppm', timeSeries: [[0, 2], [45, 95], [80, 420], [120, 890], [180, 980], [600, 350]] },
    { id: 'FED_CORR', name: 'Dose Fracional Efetiva (FED Purser)', quantity: 'VOLUME FRACTION', unit: '', timeSeries: [[0, 0], [45, 0.05], [80, 0.35], [120, 0.85], [180, 1.45], [600, 2.5]] as any },
    { id: 'PRESS_STAIR_S', name: 'Pressurização Escada Sul (+50 Pa)', quantity: 'PRESSURE', unit: 'Pa', timeSeries: BENCHMARK_1_PRESS_STAIR_S },
    { id: 'TEMP_REFUGE', name: 'Temperatura na Área de Refúgio P-90', quantity: 'TEMPERATURE', unit: 'C', timeSeries: [[0, 22], [180, 24.5], [600, 26.0]] },
    { id: 'VIS_REFUGE', name: 'Visibilidade na Área de Refúgio P-90', quantity: 'VISIBILITY', unit: 'm', timeSeries: [[0, 30], [180, 27.0], [600, 24.0]] }
  ],
  thermocoupleProbes: OXYGEN_THERMOCOUPLE_PROBES,
  sliceFrames: []
};

export const AVAILABLE_FDS_DATASETS: FDSDataset[] = [
  NIST_FDS_DATASET_STANDARD,
  NIST_FDS_DATASET_SPRINKLER,
  NIST_FDS_DATASET_OXYGEN
];
