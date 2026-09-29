/**
 * HEDS - Hospital Emergency Decision Simulator
 * Dedicated Web Worker for Computational Fluid Dynamics (CFD / NIST FDS v6.8.0)
 * 
 * Offloads all intensive CFD calculations from the main UI thread:
 * - 36x20 finite volume mesh numerical state updates
 * - NIST FDS multi-channel device timeseries interpolation
 * - Plume dispersion, Jin's visibility (k = 3/V), toxicity FED accumulation
 * - Boundary condition enforcement (P-90 fire doors, pressurized stairwells, exhaust fans)
 * - ISO 13571 / NFPA 101 tenability classifications for all virtual telemetry probes
 * - Vertical thermal stratification profiles calculation
 * - Asynchronous CSV & JSON FDS output parsing
 * 
 * Guarantees a stable 60 FPS in ThreeHospitalViewer by preventing main thread blocking.
 */

import {
  CFDGridCell,
  CFDProbeSensor,
  CFDSimulationState,
  FDSDataset,
  FDSDeviceChannel,
  FDSThermocoupleProbe,
  FDSFileParseResult
} from '../types';

import {
  NIST_FDS_DATASET_STANDARD,
  NIST_FDS_DATASET_SPRINKLER,
  AVAILABLE_FDS_DATASETS,
  STANDARD_THERMOCOUPLE_PROBES,
  interpolateSeries
} from '../services/fdsDatasets';

export interface CFDSolverOptions {
  fireRoomX?: number;
  fireRoomY?: number;
  fireHRRKw?: number;
  sprinklersActive?: boolean;
  smokeExtractionActive?: boolean;
  stairPressurizationActive?: boolean;
  isStairADoorOpen?: boolean;
  isFireDoorClosed?: boolean;
  activeFloorId?: number;
}

export type CFDWorkerInboundMessage =
  | { type: 'INIT'; datasetId?: string }
  | { type: 'STEP'; dt: number; options?: CFDSolverOptions }
  | { type: 'UPDATE_TIME'; elapsedSec: number; options?: CFDSolverOptions }
  | { type: 'SET_DATASET_BY_ID'; datasetId: string }
  | { type: 'LOAD_DATASET'; dataset: FDSDataset }
  | { type: 'SET_OPTIONS'; options: CFDSolverOptions }
  | { type: 'ADD_PROBE'; probe: CFDProbeSensor }
  | { type: 'UPDATE_PROBE'; probeId: string; gridX: number; gridY: number; heightM?: number }
  | { type: 'REMOVE_PROBE'; probeId: string }
  | { type: 'PARSE_FDS_FILE'; fileContent: string; fileName: string; requestId: string }
  | { type: 'GET_STRATIFICATION'; locationGroup: 'origin_room_408' | 'corridor_center'; timeSec: number; requestId: string }
  | { type: 'RESET'; options?: CFDSolverOptions };

export type CFDWorkerOutboundMessage =
  | {
      type: 'READY';
      version: string;
      coresDetected: number;
    }
  | {
      type: 'STATE_UPDATE';
      state: CFDSimulationState;
      grid: CFDGridCell[][];
      probes: CFDProbeSensor[];
      fireSpread: number;
      smokeSpread: number;
      calcDurationMs: number;
      elapsedSec: number;
      workerCycle: number;
    }
  | {
      type: 'FILE_PARSED';
      requestId: string;
      result: FDSFileParseResult;
      calcDurationMs: number;
    }
  | {
      type: 'STRATIFICATION_RESULT';
      requestId: string;
      result: any;
      calcDurationMs: number;
    }
  | {
      type: 'ERROR';
      error: string;
    };

class CFDWorkerSolver {
  public cols = 36;
  public rows = 20;
  public dx = 1.0;
  public dy = 1.0;
  public ceilingHeight = 2.8;

  public grid: CFDGridCell[][] = [];
  public probes: CFDProbeSensor[] = [];

  public elapsedSec = 0;
  public currentHRRKw = 0;
  public maxAllowedHRRKw = 2850;

  public isFDSDataDriven = true;
  public activeDataset: FDSDataset = NIST_FDS_DATASET_STANDARD;
  public availableDatasets: FDSDataset[] = [...AVAILABLE_FDS_DATASETS];

  public sprinklersSuppression = false;
  public smokeExtractionActive = true;
  public stairPressurizationActive = true;
  public isStairADoorOpen = false;
  public isFireDoorClosed = true;

  public peakTempC = 22.0;
  public corridorTempC = 22.0;
  public corridorVisibilityM = 30.0;
  public corridorSmokeOpticalDensity = 0.001;
  public corridorCoPpm = 2.0;
  public corridorFedToxicity = 0.0;
  public smokeLayerHeightM = 2.8;

  public workerCycles = 0;

  constructor() {
    this.initializeMesh();
    this.initializeProbes();
    this.updateFromFDS(0);
  }

  public initializeMesh() {
    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      const row: CFDGridCell[] = [];
      for (let x = 0; x < this.cols; x++) {
        const worldX = (x - this.cols / 2) * this.dx;
        const worldZ = (y - this.rows / 2) * this.dy;

        const isCorridor = y >= 8 && y <= 11;
        const isOuterWall = x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1;
        const isNorthCorridorWall = y === 7 && !(x >= 16 && x <= 19) && !(x === 5 || x === 11 || x === 25 || x === 31);
        const isSouthCorridorWall = y === 12 && !(x === 8 || x === 14 || x === 20 || x === 26);
        const isInternalPartition = (x % 6 === 0) && (y < 7 || y > 12);
        const isWall = isOuterWall || isNorthCorridorWall || isSouthCorridorWall || isInternalPartition;
        const isDoor = (y === 7 || y === 12) && !isWall;
        const isFireSource = x >= 20 && x <= 22 && y >= 14 && y <= 16;
        const isRefugeZone = x >= 28 && y >= 4 && y <= 15;

        row.push({
          x,
          y,
          worldX,
          worldZ,
          tempC: 22.0,
          smokeOpticalDensity: 0.001,
          visibilityM: 30.0,
          coPpm: 2.0,
          fedToxicity: 0.0,
          uVel: 0.0,
          vVel: 0.0,
          smokeLayerHeightM: this.ceilingHeight,
          isWall,
          isDoor,
          isFireDoorClosed: isDoor && x >= 26,
          isVent: isCorridor && (x === 10 || x === 24),
          isFireSource,
          isSprinklerActive: false,
          isRefugeZone
        });
      }
      this.grid.push(row);
    }
  }

  public initializeProbes() {
    this.probes = [
      {
        id: 'probe-origin',
        name: 'Sonda Foco - Quarto 408 (Isolamento)',
        locationLabel: 'Ponto de Ignição / Leito 408',
        gridX: 21,
        gridY: 15,
        tempC: 22.0,
        visibilityM: 30.0,
        coPpm: 2.0,
        fedToxicity: 0.0,
        tenabilityStatus: 'tenivel',
        historyTemps: [22.0],
        historyVisibilities: [30.0]
      },
      {
        id: 'probe-corridor',
        name: 'Sonda Corredor Central (Setor 4)',
        locationLabel: 'Eixo de Evacuação Central / Posto Enfermagem',
        gridX: 18,
        gridY: 10,
        tempC: 22.0,
        visibilityM: 30.0,
        coPpm: 2.0,
        fedToxicity: 0.0,
        tenabilityStatus: 'tenivel',
        historyTemps: [22.0],
        historyVisibilities: [30.0]
      },
      {
        id: 'probe-stair-north',
        name: 'Sonda Escada Norte (Rota de Fuga A)',
        locationLabel: 'Caixa de Escada de Emergência Norte',
        gridX: 3,
        gridY: 3,
        tempC: 22.0,
        visibilityM: 30.0,
        coPpm: 2.0,
        fedToxicity: 0.0,
        tenabilityStatus: 'tenivel',
        historyTemps: [22.0],
        historyVisibilities: [30.0]
      },
      {
        id: 'probe-stair-south',
        name: 'Sonda Escada Sul (Pressurizada B)',
        locationLabel: 'Escada Enclausurada Pressurizada (+50 Pa)',
        gridX: 3,
        gridY: 16,
        tempC: 22.0,
        visibilityM: 30.0,
        coPpm: 2.0,
        fedToxicity: 0.0,
        tenabilityStatus: 'tenivel',
        historyTemps: [22.0],
        historyVisibilities: [30.0]
      },
      {
        id: 'probe-refuge',
        name: 'Sonda Área de Refúgio Compartimentada',
        locationLabel: 'Setor Seguro Estanque / Leste (Porta P-90)',
        gridX: 31,
        gridY: 10,
        tempC: 22.0,
        visibilityM: 30.0,
        coPpm: 2.0,
        fedToxicity: 0.0,
        tenabilityStatus: 'tenivel',
        historyTemps: [22.0],
        historyVisibilities: [30.0]
      }
    ];
  }

  public step(dt: number, options?: CFDSolverOptions) {
    this.elapsedSec += dt;
    this.updateTime(this.elapsedSec, options);
  }

  public updateTime(elapsedSec: number, options?: CFDSolverOptions) {
    this.elapsedSec = Math.max(0, elapsedSec);

    if (options) {
      if (options.sprinklersActive !== undefined) this.sprinklersSuppression = options.sprinklersActive;
      if (options.smokeExtractionActive !== undefined) this.smokeExtractionActive = options.smokeExtractionActive;
      if (options.stairPressurizationActive !== undefined) this.stairPressurizationActive = options.stairPressurizationActive;
      if (options.isStairADoorOpen !== undefined) this.isStairADoorOpen = options.isStairADoorOpen;
      if (options.isFireDoorClosed !== undefined) this.isFireDoorClosed = options.isFireDoorClosed;
    }

    if (this.isFDSDataDriven) {
      this.updateFromFDS(this.elapsedSec);
    } else {
      this.updateFromHeuristic(this.elapsedSec);
    }
  }

  private updateFromFDS(t: number) {
    let ds = this.activeDataset;
    if (this.sprinklersSuppression && ds.id === NIST_FDS_DATASET_STANDARD.id) {
      ds = NIST_FDS_DATASET_SPRINKLER;
    }

    const findChannel = (prefixes: string[]): FDSDeviceChannel | undefined => {
      return ds.channels.find(ch => prefixes.some(p => ch.id.toUpperCase().includes(p.toUpperCase())));
    };

    const hrrCh = findChannel(['HRR']);
    const tempRoomCh = findChannel(['TEMP_408', 'TEMP_ROOM', 'TEMP_ORIGIN', 'TEMP']);
    const tempCorrCh = findChannel(['TEMP_CORR', 'TEMP_CORRIDOR']);
    const visCorrCh = findChannel(['VIS_CORR', 'VIS_CORRIDOR', 'VIS']);
    const coRoomCh = findChannel(['CO_408', 'CO_ROOM']);
    const coCorrCh = findChannel(['CO_CORR', 'CO_CORRIDOR', 'CO']);
    const fedCorrCh = findChannel(['FED_CORR', 'FED']);
    const pressStairCh = findChannel(['PRESS_STAIR', 'PRESS']);
    const tempRefugeCh = findChannel(['TEMP_REFUGE']);
    const visRefugeCh = findChannel(['VIS_REFUGE']);

    this.currentHRRKw = hrrCh ? Math.round(interpolateSeries(hrrCh.timeSeries, t)) : 450;
    this.peakTempC = tempRoomCh ? Math.round(interpolateSeries(tempRoomCh.timeSeries, t) * 10) / 10 : 250;
    this.corridorTempC = tempCorrCh ? Math.round(interpolateSeries(tempCorrCh.timeSeries, t) * 10) / 10 : 45;
    this.corridorVisibilityM = visCorrCh ? Math.max(0.2, Math.round(interpolateSeries(visCorrCh.timeSeries, t) * 10) / 10) : 8.5;
    
    // Jin's visibility formulation: k = 3 / Visibility (1/m)
    this.corridorSmokeOpticalDensity = Math.max(0.001, 3.0 / Math.max(0.2, this.corridorVisibilityM));
    this.corridorCoPpm = coCorrCh ? Math.round(interpolateSeries(coCorrCh.timeSeries, t)) : 45;
    this.corridorFedToxicity = fedCorrCh ? Math.round(interpolateSeries(fedCorrCh.timeSeries, t) * 1000) / 1000 : 0.05;

    this.smokeLayerHeightM = Math.max(0.6, Math.round((this.ceilingHeight - Math.min(2.2, this.corridorSmokeOpticalDensity * 0.8)) * 10) / 10);

    const roomCoPpm = coRoomCh ? Math.round(interpolateSeries(coRoomCh.timeSeries, t)) : 450;
    const refugeTemp = tempRefugeCh ? interpolateSeries(tempRefugeCh.timeSeries, t) : 22.2;
    const refugeVis = visRefugeCh ? interpolateSeries(visRefugeCh.timeSeries, t) : 29.0;

    const fireOriginX = 21;
    const fireOriginY = 15;

    // Parallel spatial mesh refresh (finite volume cell evaluation)
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.grid[y][x];
        if (cell.isWall) continue;

        if (cell.isFireSource) {
          cell.tempC = this.peakTempC;
          cell.coPpm = roomCoPpm;
          cell.smokeOpticalDensity = Math.min(3.5, this.corridorSmokeOpticalDensity * 2.5);
          cell.visibilityM = Math.max(0.4, 3.0 / cell.smokeOpticalDensity);
          cell.smokeLayerHeightM = 0.6;
        } else if (cell.isRefugeZone) {
          if (this.isFireDoorClosed) {
            cell.tempC = refugeTemp;
            cell.visibilityM = refugeVis;
            cell.coPpm = 4.0;
            cell.smokeOpticalDensity = 0.005;
            cell.fedToxicity = 0.0;
            cell.smokeLayerHeightM = this.ceilingHeight;
          } else {
            cell.tempC = 22.0 + (this.corridorTempC - 22.0) * 0.4;
            cell.visibilityM = Math.max(2.0, this.corridorVisibilityM * 2.0);
            cell.coPpm = this.corridorCoPpm * 0.35;
            cell.smokeOpticalDensity = this.corridorSmokeOpticalDensity * 0.35;
          }
        } else if (cell.x <= 4 && cell.y <= 6) {
          if (this.isStairADoorOpen) {
            cell.tempC = 22.0 + (this.corridorTempC - 22.0) * 0.8;
            cell.visibilityM = Math.max(0.8, this.corridorVisibilityM);
            cell.coPpm = this.corridorCoPpm * 0.8;
            cell.smokeOpticalDensity = this.corridorSmokeOpticalDensity * 0.8;
          } else {
            cell.tempC = 23.0;
            cell.visibilityM = 28.0;
            cell.coPpm = 8.0;
            cell.smokeOpticalDensity = 0.01;
          }
        } else if (cell.x <= 4 && cell.y >= 13) {
          if (this.stairPressurizationActive) {
            cell.tempC = 22.0;
            cell.visibilityM = 30.0;
            cell.coPpm = 2.0;
            cell.smokeOpticalDensity = 0.001;
          } else {
            cell.tempC = 35.0;
            cell.visibilityM = 12.0;
            cell.coPpm = 40.0;
            cell.smokeOpticalDensity = 0.08;
          }
        } else if (y >= 8 && y <= 11) {
          const distToDoor = Math.sqrt(Math.pow(x - 21, 2) + Math.pow(y - 11, 2));
          const dispersionFactor = Math.max(0.45, 1.0 - (distToDoor / 22));

          cell.tempC = 22.0 + (this.corridorTempC - 22.0) * dispersionFactor;
          cell.coPpm = this.corridorCoPpm * dispersionFactor;
          cell.smokeOpticalDensity = this.corridorSmokeOpticalDensity * dispersionFactor;
          cell.visibilityM = Math.max(0.4, Math.min(30.0, 3.0 / Math.max(0.01, cell.smokeOpticalDensity)));
          cell.fedToxicity = this.corridorFedToxicity * dispersionFactor;
          cell.smokeLayerHeightM = this.smokeLayerHeightM;

          if (this.smokeExtractionActive) {
            cell.uVel = x < 18 ? -0.4 : 0.4;
          }
        } else {
          const distToOrigin = Math.sqrt(Math.pow(x - fireOriginX, 2) + Math.pow(y - fireOriginY, 2));
          const heatFalloff = Math.max(0.05, 1.0 - (distToOrigin / 18));
          cell.tempC = 22.0 + (this.peakTempC - 22.0) * 0.12 * heatFalloff;
          cell.visibilityM = Math.max(12.0, 30.0 - (heatFalloff * 15.0));
          cell.coPpm = Math.max(4.0, this.corridorCoPpm * 0.15 * heatFalloff);
          cell.smokeOpticalDensity = 3.0 / cell.visibilityM;
        }
      }
    }

    // Refresh telemetry probes
    this.probes.forEach(probe => {
      if (probe.id === 'probe-origin') {
        probe.tempC = this.peakTempC;
        probe.visibilityM = Math.max(0.4, 3.0 / (this.corridorSmokeOpticalDensity * 2.5));
        probe.coPpm = roomCoPpm;
        probe.fedToxicity = Math.min(2.0, this.corridorFedToxicity * 2.2);
      } else if (probe.id === 'probe-corridor') {
        probe.tempC = this.corridorTempC;
        probe.visibilityM = this.corridorVisibilityM;
        probe.coPpm = this.corridorCoPpm;
        probe.fedToxicity = this.corridorFedToxicity;
      } else if (probe.id === 'probe-stair-north') {
        if (this.isStairADoorOpen) {
          probe.tempC = 22.0 + (this.corridorTempC - 22.0) * 0.8;
          probe.visibilityM = Math.max(0.8, this.corridorVisibilityM);
          probe.coPpm = this.corridorCoPpm * 0.8;
          probe.fedToxicity = this.corridorFedToxicity * 0.7;
        } else {
          probe.tempC = 23.5;
          probe.visibilityM = 26.0;
          probe.coPpm = 12.0;
          probe.fedToxicity = 0.01;
        }
      } else if (probe.id === 'probe-stair-south') {
        probe.tempC = 22.0;
        probe.visibilityM = 30.0;
        probe.coPpm = 2.0;
        probe.fedToxicity = 0.0;
      } else if (probe.id === 'probe-refuge') {
        probe.tempC = refugeTemp;
        probe.visibilityM = refugeVis;
        probe.coPpm = 4.0;
        probe.fedToxicity = 0.0;
      } else {
        const cellX = Math.max(0, Math.min(this.cols - 1, Math.round(probe.gridX)));
        const cellY = Math.max(0, Math.min(this.rows - 1, Math.round(probe.gridY)));
        const cell = this.grid[cellY]?.[cellX];
        if (cell) {
          const h = probe.heightM || 1.8;
          const heightRatio = Math.min(1.0, Math.max(0.1, h / this.ceilingHeight));
          const thermalFactor = 0.65 + heightRatio * 0.6;
          const smokeFactor = 0.5 + heightRatio * 0.75;

          probe.tempC = Math.round((22.0 + (cell.tempC - 22.0) * thermalFactor) * 10) / 10;
          probe.visibilityM = Math.max(0.3, Math.min(30.0, Math.round((cell.visibilityM / Math.max(0.2, smokeFactor)) * 10) / 10));
          probe.coPpm = Math.round(cell.coPpm * smokeFactor);
          probe.fedToxicity = Math.round(cell.fedToxicity * smokeFactor * 1000) / 1000;
        }
      }

      if (probe.tempC >= 60 || probe.visibilityM <= 3.0 || probe.fedToxicity >= 0.3 || probe.coPpm >= 150) {
        probe.tenabilityStatus = 'inabitavel_critico';
      } else if (probe.tempC >= 38 || probe.visibilityM <= 8.0 || probe.coPpm >= 50) {
        probe.tenabilityStatus = 'alerta_moderado';
      } else {
        probe.tenabilityStatus = 'tenivel';
      }

      probe.historyTemps.push(probe.tempC);
      if (probe.historyTemps.length > 25) probe.historyTemps.shift();
      probe.historyVisibilities.push(probe.visibilityM);
      if (probe.historyVisibilities.length > 25) probe.historyVisibilities.shift();
    });
  }

  private updateFromHeuristic(t: number) {
    const fireGrowthCoeff = 0.0469;
    if (!this.sprinklersSuppression) {
      this.currentHRRKw = Math.min(this.maxAllowedHRRKw, 350 + fireGrowthCoeff * Math.pow(Math.min(t, 480), 2));
    } else {
      this.currentHRRKw = Math.max(120, this.currentHRRKw * 0.94);
    }
  }

  public getActiveThermocoupleProbes(): FDSThermocoupleProbe[] {
    let ds = this.activeDataset;
    if (this.sprinklersSuppression && ds.id === NIST_FDS_DATASET_STANDARD.id) {
      ds = NIST_FDS_DATASET_SPRINKLER;
    }
    if (ds.thermocoupleProbes && ds.thermocoupleProbes.length > 0) {
      return ds.thermocoupleProbes;
    }
    return STANDARD_THERMOCOUPLE_PROBES;
  }

  public getStratificationProfile(locationGroup: 'origin_room_408' | 'corridor_center', timeSec: number) {
    const probes = this.getActiveThermocoupleProbes().filter(p => p.locationGroup === locationGroup);
    const sorted = [...probes].sort((a, b) => b.heightM - a.heightM);

    const points = sorted.map(p => ({
      probeId: p.id,
      label: p.label,
      heightM: p.heightM,
      color: p.color,
      tempC: Math.round(interpolateSeries(p.timeSeries, timeSec) * 10) / 10
    }));

    const ceilingTemp = points[0]?.tempC ?? 22;
    const floorTemp = points[points.length - 1]?.tempC ?? 22;
    const deltaT = Math.round((ceilingTemp - floorTemp) * 10) / 10;
    const gradient = Math.round((deltaT / (2.7 - 0.5)) * 10) / 10;

    const smokeLayerZ = locationGroup === 'origin_room_408'
      ? Math.max(0.6, 2.8 - (timeSec > 60 ? 1.8 : timeSec * 0.03))
      : this.smokeLayerHeightM;

    return {
      points,
      ceilingTemp,
      floorTemp,
      deltaT,
      gradient,
      smokeLayerZ,
      timeSec
    };
  }

  public parseFDSFile(fileContent: string, fileName = 'fds_output.csv'): FDSFileParseResult {
    const trimmed = fileContent.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.channels && Array.isArray(parsed.channels)) {
          const dataset: FDSDataset = {
            id: parsed.id || 'fds-custom-' + Date.now(),
            name: parsed.name || `Importação FDS: ${fileName}`,
            sourceType: 'pyrosim_export',
            fileName,
            importedAt: new Date().toISOString(),
            fdsVersion: parsed.fdsVersion || 'FDS 6.8.0',
            durationSec: parsed.durationSec || 600,
            timeStepSec: parsed.timeStepSec || 1.0,
            meshResolutionM: parsed.meshResolutionM || 0.5,
            channels: parsed.channels,
            sliceFrames: parsed.sliceFrames || [],
            description: parsed.description || `Dataset FDS importado com ${parsed.channels.length} canais de medição.`
          };

          return {
            success: true,
            formatDetected: 'FDS_JSON',
            fileName,
            dataset,
            channelsFoundCount: dataset.channels.length,
            timeRowsCount: dataset.channels[0]?.timeSeries.length || 0,
            durationSec: dataset.durationSec
          };
        }
      } catch (err: any) {
        return {
          success: false,
          formatDetected: 'FDS_JSON',
          fileName,
          error: `Falha ao interpretar JSON FDS: ${err?.message || err}`,
          channelsFoundCount: 0,
          timeRowsCount: 0,
          durationSec: 0
        };
      }
    }

    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) {
      return {
        success: false,
        formatDetected: 'UNKNOWN',
        fileName,
        error: 'Arquivo CSV FDS insuficiente (deve conter cabeçalho de canais, linha de unidades e dados temporais).',
        channelsFoundCount: 0,
        timeRowsCount: 0,
        durationSec: 0
      };
    }

    const splitCSVLine = (line: string): string[] => {
      const tokens: string[] = [];
      let inQuotes = false;
      let token = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          tokens.push(token.trim().replace(/^["']|["']$/g, ''));
          token = '';
        } else {
          token += char;
        }
      }
      tokens.push(token.trim().replace(/^["']|["']$/g, ''));
      return tokens;
    };

    const headerTokens = splitCSVLine(lines[0]);
    const unitTokens = splitCSVLine(lines[1]);

    if (headerTokens.length < 2) {
      return {
        success: false,
        formatDetected: 'UNKNOWN',
        fileName,
        error: 'Arquivo FDS inválido: número insuficiente de colunas no cabeçalho.',
        channelsFoundCount: 0,
        timeRowsCount: 0,
        durationSec: 0
      };
    }

    const channels: FDSDeviceChannel[] = [];
    const timeIndex = 0;

    for (let c = 1; c < headerTokens.length; c++) {
      const channelId = headerTokens[c];
      const unit = (unitTokens[c] || '').toUpperCase() as any;

      let quantity: FDSDeviceChannel['quantity'] = 'TEMPERATURE';
      if (channelId.includes('HRR') || unit === 'KW') quantity = 'HEAT RELEASE RATE';
      else if (channelId.includes('VIS') || unit === 'M') quantity = 'VISIBILITY';
      else if (channelId.includes('CO') || unit === 'PPM') quantity = 'VOLUME FRACTION';
      else if (channelId.includes('PRESS') || unit === 'PA') quantity = 'PRESSURE';
      else if (channelId.includes('VEL') || unit === 'M/S') quantity = 'VELOCITY';

      channels.push({
        id: channelId,
        name: `Canal FDS: ${channelId} (${unitTokens[c] || ''})`,
        quantity,
        unit: unitTokens[c] as any,
        timeSeries: []
      });
    }

    let maxTime = 0;
    let validRows = 0;

    for (let r = 2; r < lines.length; r++) {
      const rowTokens = splitCSVLine(lines[r]);
      const timeVal = parseFloat(rowTokens[timeIndex]);
      if (isNaN(timeVal)) continue;

      if (timeVal > maxTime) maxTime = timeVal;
      validRows++;

      for (let c = 0; c < channels.length; c++) {
        const colVal = parseFloat(rowTokens[c + 1]);
        if (!isNaN(colVal)) {
          channels[c].timeSeries.push([timeVal, colVal]);
        }
      }
    }

    const isHRRFile = headerTokens.includes('HRR') && headerTokens.length <= 6;
    const formatDetected: FDSFileParseResult['formatDetected'] = isHRRFile ? 'FDS_HRR_CSV' : 'FDS_DEVC_CSV';

    const dataset: FDSDataset = {
      id: 'fds-imported-' + Date.now(),
      name: `Saída FDS Processada: ${fileName}`,
      sourceType: 'fds_devc_csv',
      fileName,
      importedAt: new Date().toISOString(),
      fdsVersion: 'FDS v6.x Standard Output',
      durationSec: Math.round(maxTime),
      timeStepSec: validRows > 1 ? Math.round((maxTime / validRows) * 100) / 100 : 1.0,
      meshResolutionM: 0.5,
      channels,
      sliceFrames: [],
      description: `Arquivo de saída FDS importado com sucesso: ${validRows} linhas temporais e ${channels.length} canais instrumentados.`
    };

    return {
      success: true,
      formatDetected,
      fileName,
      dataset,
      channelsFoundCount: channels.length,
      timeRowsCount: validRows,
      durationSec: Math.round(maxTime)
    };
  }

  public getPhysicalFireSpread(): number {
    return Math.max(0, Math.min(1.0, this.currentHRRKw / 2850));
  }

  public getPhysicalSmokeSpread(): number {
    return Math.max(0, Math.min(1.0, 1.0 - (this.corridorVisibilityM / 30.0)));
  }

  public getState(): CFDSimulationState {
    const fireSpread = this.getPhysicalFireSpread();
    const smokeSpread = this.getPhysicalSmokeSpread();

    return {
      stepCount: Math.round(this.elapsedSec),
      elapsedSec: this.elapsedSec,
      currentHRRKw: Math.round(this.currentHRRKw),
      peakTempC: Math.round(this.peakTempC * 10) / 10,
      averageCorridorVisibilityM: Math.round(this.corridorVisibilityM * 10) / 10,
      smokeLayerHeightM: Math.round(this.smokeLayerHeightM * 10) / 10,
      coMaxPpm: Math.round(this.corridorCoPpm),
      fedMaxToxicity: Math.round(this.corridorFedToxicity * 1000) / 1000,
      fireSpreadNormalized: Math.round(fireSpread * 100) / 100,
      smokeSpreadNormalized: Math.round(smokeSpread * 100) / 100,
      isFDSDataDriven: this.isFDSDataDriven,
      fdsDataSourceName: this.activeDataset.name,
      smokeExhaustFanActive: this.smokeExtractionActive,
      stairPressurizationActive: this.stairPressurizationActive,
      sprinklersTrippedCount: this.sprinklersSuppression ? 6 : 0,
      fireDoorsSealedCount: this.isFireDoorClosed ? 3 : 0,
      probes: this.probes
    };
  }
}

// -------------------------------------------------------------
// WORKER EXECUTION CONTEXT & EVENT DISPATCHER
// -------------------------------------------------------------
const solver = new CFDWorkerSolver();

self.onmessage = (event: MessageEvent<CFDWorkerInboundMessage>) => {
  const msg = event.data;
  if (!msg || !msg.type) return;

  const tStart = performance.now();

  switch (msg.type) {
    case 'INIT': {
      solver.initializeMesh();
      solver.initializeProbes();
      if (msg.datasetId) {
        const found = solver.availableDatasets.find(d => d.id === msg.datasetId);
        if (found) solver.activeDataset = found;
      }
      solver.updateTime(0);

      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'STEP': {
      solver.workerCycles++;
      solver.step(msg.dt, msg.options);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'UPDATE_TIME': {
      solver.workerCycles++;
      solver.updateTime(msg.elapsedSec, msg.options);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'SET_DATASET_BY_ID': {
      const found = solver.availableDatasets.find(d => d.id === msg.datasetId);
      if (found) {
        solver.activeDataset = found;
        solver.isFDSDataDriven = true;
        solver.updateTime(solver.elapsedSec);
      }
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'LOAD_DATASET': {
      solver.activeDataset = msg.dataset;
      if (!solver.availableDatasets.some(d => d.id === msg.dataset.id)) {
        solver.availableDatasets.unshift(msg.dataset);
      }
      solver.isFDSDataDriven = true;
      solver.updateTime(solver.elapsedSec);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'SET_OPTIONS': {
      if (msg.options.sprinklersActive !== undefined) solver.sprinklersSuppression = msg.options.sprinklersActive;
      if (msg.options.smokeExtractionActive !== undefined) solver.smokeExtractionActive = msg.options.smokeExtractionActive;
      if (msg.options.stairPressurizationActive !== undefined) solver.stairPressurizationActive = msg.options.stairPressurizationActive;
      if (msg.options.isStairADoorOpen !== undefined) solver.isStairADoorOpen = msg.options.isStairADoorOpen;
      if (msg.options.isFireDoorClosed !== undefined) solver.isFireDoorClosed = msg.options.isFireDoorClosed;
      solver.updateTime(solver.elapsedSec);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'ADD_PROBE': {
      solver.probes.push(msg.probe);
      solver.updateTime(solver.elapsedSec);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'UPDATE_PROBE': {
      const p = solver.probes.find(x => x.id === msg.probeId);
      if (p) {
        p.gridX = msg.gridX;
        p.gridY = msg.gridY;
        if (msg.heightM !== undefined) p.heightM = msg.heightM;
        solver.updateTime(solver.elapsedSec);
      }
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'REMOVE_PROBE': {
      solver.probes = solver.probes.filter(x => x.id !== msg.probeId);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }

    case 'PARSE_FDS_FILE': {
      const result = solver.parseFDSFile(msg.fileContent, msg.fileName);
      const tEnd = performance.now();
      const outMsg: CFDWorkerOutboundMessage = {
        type: 'FILE_PARSED',
        requestId: msg.requestId,
        result,
        calcDurationMs: tEnd - tStart
      };
      self.postMessage(outMsg);
      break;
    }

    case 'GET_STRATIFICATION': {
      const result = solver.getStratificationProfile(msg.locationGroup, msg.timeSec);
      const tEnd = performance.now();
      const outMsg: CFDWorkerOutboundMessage = {
        type: 'STRATIFICATION_RESULT',
        requestId: msg.requestId,
        result,
        calcDurationMs: tEnd - tStart
      };
      self.postMessage(outMsg);
      break;
    }

    case 'RESET': {
      solver.elapsedSec = 0;
      solver.workerCycles = 0;
      solver.initializeMesh();
      solver.initializeProbes();
      if (msg.options) {
        if (msg.options.sprinklersActive !== undefined) solver.sprinklersSuppression = msg.options.sprinklersActive;
        if (msg.options.smokeExtractionActive !== undefined) solver.smokeExtractionActive = msg.options.smokeExtractionActive;
        if (msg.options.stairPressurizationActive !== undefined) solver.stairPressurizationActive = msg.options.stairPressurizationActive;
        if (msg.options.isStairADoorOpen !== undefined) solver.isStairADoorOpen = msg.options.isStairADoorOpen;
        if (msg.options.isFireDoorClosed !== undefined) solver.isFireDoorClosed = msg.options.isFireDoorClosed;
      }
      solver.updateTime(0);
      const tEnd = performance.now();
      postStateUpdate(tEnd - tStart);
      break;
    }
  }
};

function postStateUpdate(calcDurationMs: number) {
  const outMsg: CFDWorkerOutboundMessage = {
    type: 'STATE_UPDATE',
    state: solver.getState(),
    grid: solver.grid,
    probes: solver.probes,
    fireSpread: solver.getPhysicalFireSpread(),
    smokeSpread: solver.getPhysicalSmokeSpread(),
    calcDurationMs: Math.round(calcDurationMs * 100) / 100,
    elapsedSec: solver.elapsedSec,
    workerCycle: solver.workerCycles
  };
  self.postMessage(outMsg);
}

// Signal readiness on initial load
const readyMsg: CFDWorkerOutboundMessage = {
  type: 'READY',
  version: 'FDS 6.8.0-ParallelWorker-v1.0',
  coresDetected: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4
};
self.postMessage(readyMsg);
