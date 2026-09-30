/**
 * HEDS - Hospital Emergency Decision Simulator
 * Real-Time Numerical CFD & Fire Dynamics Simulator (FDS v6.8.0) Integration Engine
 * 
 * Parallel Web Worker Architecture:
 * - Spawns a dedicated Web Worker (`/src/workers/cfdWorker.ts`) to execute all intensive
 *   FDS calculations (finite volume 36x20 mesh update, Jin's plume dynamics, optical densities,
 *   toxicity FED integration, tenability checks, and stratification profiles).
 * - Offloads calculations from the main UI thread to guarantee a solid 60 FPS in ThreeHospitalViewer.
 * - Maintains full synchronous backward-compatibility for immediate reads (`cfdSolver.grid`,
 *   `cfdSolver.probes`, `cfdSolver.getState()`) with zero UI blocking.
 * - Provides event subscriptions and asynchronous Promise methods for reactive UI workflows.
 */

import {
  CFDGridCell,
  CFDProbeSensor,
  CFDSimulationState,
  FDSDataset,
  FDSDeviceChannel,
  FDSThermocoupleProbe,
  FDSFileParseResult,
  FDSSliceGridFrame
} from '../types';

import {
  NIST_FDS_DATASET_STANDARD,
  NIST_FDS_DATASET_SPRINKLER,
  AVAILABLE_FDS_DATASETS,
  STANDARD_THERMOCOUPLE_PROBES,
  interpolateSeries
} from './fdsDatasets';

import { cfdThreadPool } from './cfdThreadPool';

import {
  CFDSolverOptions,
  CFDWorkerInboundMessage,
  CFDWorkerOutboundMessage
} from '../workers/cfdWorker';

export type { CFDSolverOptions };

export type CFDStateListener = (
  state: CFDSimulationState,
  grid: CFDGridCell[][],
  probes: CFDProbeSensor[]
) => void;

export class CFDEngine {
  public cols = 36;
  public rows = 20;
  public dx = 1.0; // 1 meter per cell
  public dy = 1.0;
  public ceilingHeight = 2.8; // meters

  public grid: CFDGridCell[][] = [];
  public probes: CFDProbeSensor[] = [];

  public elapsedSec = 0;
  public currentHRRKw = 0;
  public maxAllowedHRRKw = 2850;

  // FDS Integration Layer State
  public isFDSDataDriven = true;
  public activeDataset: FDSDataset = NIST_FDS_DATASET_STANDARD;
  public availableDatasets: FDSDataset[] = [...AVAILABLE_FDS_DATASETS];

  // Contingency & Protection system flags
  public sprinklersSuppression = false;
  public smokeExtractionActive = true;
  public stairPressurizationActive = true;
  public isStairADoorOpen = false;
  public isFireDoorClosed = true;

  // Real physical indicators computed from FDS outputs
  public peakTempC = 22.0;
  public corridorTempC = 22.0;
  public corridorVisibilityM = 30.0;
  public corridorSmokeOpticalDensity = 0.001;
  public corridorCoPpm = 2.0;
  public corridorFedToxicity = 0.0;
  public smokeLayerHeightM = 2.8;

  // Dedicated Web Worker Runtime State
  private worker: Worker | null = null;
  public isWorkerActive = false;
  public workerCalcDurationMs = 0.0;
  public workerCycleCount = 0;
  public workerCoresDetected = 4;
  private pendingRequests = new Map<string, (result: any) => void>();
  private listeners: Set<CFDStateListener> = new Set();

  constructor() {
    this.initializeMesh();
    this.initializeProbes();
    this.updateFromFDS(0);
    this.initWebWorker();
  }

  /**
   * Initializes the dedicated background Web Worker for off-thread CFD calculations
   */
  private initWebWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.isWorkerActive = false;
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/cfdWorker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent<CFDWorkerOutboundMessage>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (err) => {
        console.warn('[CFDEngine] Web Worker error, falling back to synchronous execution:', err);
        this.isWorkerActive = false;
      };

      // Send initial configuration to worker
      this.postToWorker({
        type: 'INIT',
        datasetId: this.activeDataset.id
      });

      this.isWorkerActive = true;
    } catch (err) {
      console.warn('[CFDEngine] Could not instantiate Web Worker:', err);
      this.isWorkerActive = false;
    }
  }

  /**
   * Handles incoming processed CFD data from the dedicated Web Worker
   */
  private handleWorkerMessage(data: CFDWorkerOutboundMessage) {
    if (!data) return;

    switch (data.type) {
      case 'READY':
        this.isWorkerActive = true;
        this.workerCoresDetected = data.coresDetected || 4;
        break;

      case 'STATE_UPDATE':
        this.grid = data.grid;
        this.probes = data.probes;
        this.workerCalcDurationMs = data.calcDurationMs;
        this.workerCycleCount = data.workerCycle;
        this.elapsedSec = data.elapsedSec;

        // Sync local telemetry indicators from worker's computed state
        this.peakTempC = data.state.peakTempC;
        this.corridorTempC = data.state.peakTempC; // corridor or peak
        this.currentHRRKw = data.state.currentHRRKw;
        this.corridorVisibilityM = data.state.averageCorridorVisibilityM;
        this.corridorSmokeOpticalDensity = Math.max(0.001, 3.0 / Math.max(0.2, this.corridorVisibilityM));
        this.corridorCoPpm = data.state.coMaxPpm;
        this.corridorFedToxicity = data.state.fedMaxToxicity;
        this.smokeLayerHeightM = data.state.smokeLayerHeightM;

        // Notify UI subscribers
        this.notifyListeners(data.state, this.grid, this.probes);
        break;

      case 'FILE_PARSED': {
        const resolver = this.pendingRequests.get(data.requestId);
        if (resolver) {
          resolver(data.result);
          this.pendingRequests.delete(data.requestId);
        }
        break;
      }

      case 'STRATIFICATION_RESULT': {
        const resolver = this.pendingRequests.get(data.requestId);
        if (resolver) {
          resolver(data.result);
          this.pendingRequests.delete(data.requestId);
        }
        break;
      }

      case 'ERROR':
        console.error('[CFDEngine Worker Error]', data.error);
        break;
    }
  }

  /**
   * Sends an inbound message to the dedicated Web Worker
   */
  private postToWorker(msg: CFDWorkerInboundMessage) {
    if (this.worker && this.isWorkerActive) {
      try {
        this.worker.postMessage(msg);
      } catch (err) {
        console.warn('[CFDEngine] Failed to post message to worker, fallback to local math', err);
        this.isWorkerActive = false;
      }
    }
  }

  /**
   * Subscribes a listener to receive real-time CFD state updates emitted by the Web Worker
   */
  public subscribe(listener: CFDStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(state: CFDSimulationState, grid: CFDGridCell[][], probes: CFDProbeSensor[]) {
    this.listeners.forEach((fn) => {
      try {
        fn(state, grid, probes);
      } catch (e) {
        console.error('[CFDEngine] Listener execution error', e);
      }
    });
  }

  /**
   * Returns current parallel Web Worker performance status
   */
  public getWorkerTelemetry() {
    return {
      isWorkerActive: this.isWorkerActive,
      calcDurationMs: this.workerCalcDurationMs,
      workerCycles: this.workerCycleCount,
      coresDetected: this.workerCoresDetected,
      mode: this.isWorkerActive ? 'Web Worker Dedicado (60 FPS)' : 'Thread Principal (Fallback)'
    };
  }

  // =========================================================================
  // MESH & PROBE INITIALIZATION
  // =========================================================================

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

  // =========================================================================
  // FDS FILE PARSER (ASYNC WITH WORKER OR SYNC FALLBACK)
  // =========================================================================

  /**
   * Synchronous parser for immediate inspection
   */
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

  /**
   * Asynchronous offloaded parser using the dedicated background Web Worker
   */
  public parseFDSFileAsync(fileContent: string, fileName = 'fds_output.csv'): Promise<FDSFileParseResult> {
    if (!this.isWorkerActive || !this.worker) {
      return Promise.resolve(this.parseFDSFile(fileContent, fileName));
    }

    return new Promise((resolve) => {
      const requestId = 'req-parse-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      this.pendingRequests.set(requestId, resolve);

      this.postToWorker({
        type: 'PARSE_FDS_FILE',
        fileContent,
        fileName,
        requestId
      });
    });
  }

  // =========================================================================
  // DATASET INGESTION & SELECTION
  // =========================================================================

  public loadFDSDataset(dataset: FDSDataset) {
    this.activeDataset = dataset;
    if (!this.availableDatasets.some(d => d.id === dataset.id)) {
      this.availableDatasets.unshift(dataset);
    }
    this.isFDSDataDriven = true;
    this.updateFromFDS(this.elapsedSec);

    this.postToWorker({
      type: 'LOAD_DATASET',
      dataset
    });
  }

  public setFDSDatasetById(id: string): boolean {
    const found = this.availableDatasets.find(d => d.id === id);
    if (found) {
      this.activeDataset = found;
      this.isFDSDataDriven = true;
      this.updateFromFDS(this.elapsedSec);

      this.postToWorker({
        type: 'SET_DATASET_BY_ID',
        datasetId: id
      });
      return true;
    }
    return false;
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

  // =========================================================================
  // CORE SIMULATION UPDATE / FDS INTEGRATION LAYER
  // =========================================================================

  /**
   * Advances simulation step by dt seconds.
   * Dispatches calculation to the dedicated Web Worker, leaving UI thread free for 60 FPS Three.js rendering.
   */
  public step(dt: number, options?: CFDSolverOptions) {
    this.elapsedSec += dt;

    if (options) {
      if (options.sprinklersActive !== undefined) this.sprinklersSuppression = options.sprinklersActive;
      if (options.smokeExtractionActive !== undefined) this.smokeExtractionActive = options.smokeExtractionActive;
      if (options.stairPressurizationActive !== undefined) this.stairPressurizationActive = options.stairPressurizationActive;
      if (options.isStairADoorOpen !== undefined) this.isStairADoorOpen = options.isStairADoorOpen;
      if (options.isFireDoorClosed !== undefined) this.isFireDoorClosed = options.isFireDoorClosed;
    }

    if (this.isWorkerActive && this.worker) {
      this.postToWorker({
        type: 'STEP',
        dt,
        options
      });
      // Synchronize fast scalar values for immediate synchronous readers
      this.syncScalarState(this.elapsedSec);
    } else {
      this.updateTime(this.elapsedSec, options);
    }
  }

  /**
   * Updates state at exact simulated time `elapsedSec`
   */
  public updateTime(elapsedSec: number, options?: CFDSolverOptions) {
    this.elapsedSec = Math.max(0, elapsedSec);

    if (options) {
      if (options.sprinklersActive !== undefined) this.sprinklersSuppression = options.sprinklersActive;
      if (options.smokeExtractionActive !== undefined) this.smokeExtractionActive = options.smokeExtractionActive;
      if (options.stairPressurizationActive !== undefined) this.stairPressurizationActive = options.stairPressurizationActive;
      if (options.isStairADoorOpen !== undefined) this.isStairADoorOpen = options.isStairADoorOpen;
      if (options.isFireDoorClosed !== undefined) this.isFireDoorClosed = options.isFireDoorClosed;
    }

    if (this.isWorkerActive && this.worker) {
      this.postToWorker({
        type: 'UPDATE_TIME',
        elapsedSec: this.elapsedSec,
        options
      });
      this.syncScalarState(this.elapsedSec);
    } else {
      if (this.isFDSDataDriven) {
        this.updateFromFDS(this.elapsedSec);
      } else {
        this.updateFromHeuristic(this.elapsedSec);
      }
    }
  }

  /**
   * Fast scalar synchronization to ensure synchronous readers never observe stale values
   */
  private syncScalarState(t: number) {
    let ds = this.activeDataset;
    if (this.sprinklersSuppression && ds.id === NIST_FDS_DATASET_STANDARD.id) {
      ds = NIST_FDS_DATASET_SPRINKLER;
    }

    const hrrCh = ds.channels.find(ch => ch.id.toUpperCase().includes('HRR'));
    const tempRoomCh = ds.channels.find(ch => ch.id.toUpperCase().includes('TEMP_408') || ch.id.toUpperCase().includes('TEMP_ROOM'));
    const visCorrCh = ds.channels.find(ch => ch.id.toUpperCase().includes('VIS_CORR') || ch.id.toUpperCase().includes('VIS'));

    if (hrrCh) this.currentHRRKw = Math.round(interpolateSeries(hrrCh.timeSeries, t));
    if (tempRoomCh) this.peakTempC = Math.round(interpolateSeries(tempRoomCh.timeSeries, t) * 10) / 10;
    if (visCorrCh) {
      this.corridorVisibilityM = Math.max(0.2, Math.round(interpolateSeries(visCorrCh.timeSeries, t) * 10) / 10);
      this.corridorSmokeOpticalDensity = Math.max(0.001, 3.0 / Math.max(0.2, this.corridorVisibilityM));
    }
  }

  /**
   * Local calculation fallback when Web Worker is disabled or initializing
   */
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
    const tempRefugeCh = findChannel(['TEMP_REFUGE']);
    const visRefugeCh = findChannel(['VIS_REFUGE']);

    this.currentHRRKw = hrrCh ? Math.round(interpolateSeries(hrrCh.timeSeries, t)) : 450;
    this.peakTempC = tempRoomCh ? Math.round(interpolateSeries(tempRoomCh.timeSeries, t) * 10) / 10 : 250;
    this.corridorTempC = tempCorrCh ? Math.round(interpolateSeries(tempCorrCh.timeSeries, t) * 10) / 10 : 45;
    this.corridorVisibilityM = visCorrCh ? Math.max(0.2, Math.round(interpolateSeries(visCorrCh.timeSeries, t) * 10) / 10) : 8.5;
    
    this.corridorSmokeOpticalDensity = Math.max(0.001, 3.0 / Math.max(0.2, this.corridorVisibilityM));
    this.corridorCoPpm = coCorrCh ? Math.round(interpolateSeries(coCorrCh.timeSeries, t)) : 45;
    this.corridorFedToxicity = fedCorrCh ? Math.round(interpolateSeries(fedCorrCh.timeSeries, t) * 1000) / 1000 : 0.05;

    this.smokeLayerHeightM = Math.max(0.6, Math.round((this.ceilingHeight - Math.min(2.2, this.corridorSmokeOpticalDensity * 0.8)) * 10) / 10);

    const roomCoPpm = coRoomCh ? Math.round(interpolateSeries(coRoomCh.timeSeries, t)) : 450;
    const refugeTemp = tempRefugeCh ? interpolateSeries(tempRefugeCh.timeSeries, t) : 22.2;
    const refugeVis = visRefugeCh ? interpolateSeries(visRefugeCh.timeSeries, t) : 29.0;

    const fireOriginX = 21;
    const fireOriginY = 15;

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

    // Parallel Sub-Worker Task Partitioning (keeps UI thread at steady 60+ FPS)
    cfdThreadPool.executeDomainDecomposition(this.grid, {
      elapsedSec: t,
      currentHRRKw: this.currentHRRKw,
      peakTempC: this.peakTempC,
      corridorTempC: this.corridorTempC,
      corridorVisibilityM: this.corridorVisibilityM,
      corridorSmokeOpticalDensity: this.corridorSmokeOpticalDensity,
      corridorCoPpm: this.corridorCoPpm,
      corridorFedToxicity: this.corridorFedToxicity,
      ceilingHeight: this.ceilingHeight,
      sprinklersActive: this.sprinklersSuppression,
      smokeExtractionActive: this.smokeExtractionActive,
      stairPressurizationActive: this.stairPressurizationActive,
      isStairADoorOpen: this.isStairADoorOpen,
      isFireDoorClosed: this.isFireDoorClosed,
      probes: this.probes
    }).catch(err => {
      console.warn('[CFDEngine] Thread pool execution notice:', err);
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

  // =========================================================================
  // PROBE MANAGEMENT
  // =========================================================================

  public addCustomProbe(
    name: string,
    locationLabel: string,
    gridX: number,
    gridY: number,
    heightM = 1.8
  ): CFDProbeSensor {
    const clX = Math.max(0, Math.min(this.cols - 1, Math.round(gridX)));
    const clY = Math.max(0, Math.min(this.rows - 1, Math.round(gridY)));
    const worldX = Math.round((clX - this.cols / 2) * this.dx * 10) / 10;
    const worldZ = Math.round((clY - this.rows / 2) * this.dy * 10) / 10;

    const newProbe: CFDProbeSensor = {
      id: 'probe-custom-' + Date.now(),
      name: name || `Sonda Virtual #${this.probes.length + 1}`,
      locationLabel: locationLabel || `Posição (${worldX >= 0 ? '+' : ''}${worldX}m, ${worldZ >= 0 ? '+' : ''}${worldZ}m)`,
      gridX: clX,
      gridY: clY,
      heightM,
      tempC: 22.0,
      visibilityM: 30.0,
      coPpm: 2.0,
      fedToxicity: 0.0,
      tenabilityStatus: 'tenivel',
      historyTemps: [22.0],
      historyVisibilities: [30.0]
    };

    const cell = this.grid[clY]?.[clX];
    if (cell) {
      newProbe.tempC = Math.round(cell.tempC * 10) / 10;
      newProbe.visibilityM = Math.round(cell.visibilityM * 10) / 10;
      newProbe.coPpm = Math.round(cell.coPpm);
      newProbe.fedToxicity = Math.round(cell.fedToxicity * 1000) / 1000;
      newProbe.historyTemps = [newProbe.tempC];
      newProbe.historyVisibilities = [newProbe.visibilityM];
    }

    this.probes.push(newProbe);

    this.postToWorker({
      type: 'ADD_PROBE',
      probe: newProbe
    });

    return newProbe;
  }

  public removeProbe(probeId: string): boolean {
    const prev = this.probes.length;
    this.probes = this.probes.filter(p => p.id !== probeId);

    this.postToWorker({
      type: 'REMOVE_PROBE',
      probeId
    });

    return this.probes.length < prev;
  }

  public updateProbePosition(probeId: string, gridX: number, gridY: number, heightM?: number) {
    const probe = this.probes.find(p => p.id === probeId);
    if (!probe) return;

    probe.gridX = Math.max(0, Math.min(this.cols - 1, Math.round(gridX)));
    probe.gridY = Math.max(0, Math.min(this.rows - 1, Math.round(gridY)));
    if (heightM !== undefined) probe.heightM = heightM;

    const cell = this.grid[probe.gridY]?.[probe.gridX];
    if (cell) {
      probe.tempC = Math.round(cell.tempC * 10) / 10;
      probe.visibilityM = Math.round(cell.visibilityM * 10) / 10;
      probe.coPpm = Math.round(cell.coPpm);
      probe.fedToxicity = Math.round(cell.fedToxicity * 1000) / 1000;
    }

    this.postToWorker({
      type: 'UPDATE_PROBE',
      probeId,
      gridX: probe.gridX,
      gridY: probe.gridY,
      heightM
    });
  }

  // =========================================================================
  // PUBLIC TELEMETRY & PHYSICAL OUTPUTS FOR DASHBOARDS
  // =========================================================================

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
      probes: this.probes,
      threadPoolMetrics: cfdThreadPool.getMetrics()
    };
  }
}

export const cfdSolver = new CFDEngine();
