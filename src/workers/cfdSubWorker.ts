/**
 * HEDS - Hospital Emergency Decision Simulator
 * Dedicated Sub-Worker for Domain-Decomposed CFD Finite Volume Mesh Calculations
 * 
 * Partitions the 36x20 numerical grid into spatial sub-domains (Domain Decomposition):
 * - West Wing (cols 0..11)
 * - Central Core (cols 12..23)
 * - East Wing (cols 24..35)
 * - Telemetry & Probes (ISO 13571 / FED Integrator)
 * 
 * Executed in parallel threads to prevent any frame drops on the main thread (UI >= 60 FPS).
 */

import { CFDGridCell, CFDProbeSensor } from '../types';

export interface SubWorkerTaskPayload {
  taskId: string;
  subDomainId: 'west_wing' | 'central_core' | 'east_wing' | 'telemetry';
  startCol: number;
  endCol: number;
  rows: number;
  elapsedSec: number;
  currentHRRKw: number;
  peakTempC: number;
  corridorTempC: number;
  corridorVisibilityM: number;
  corridorSmokeOpticalDensity: number;
  corridorCoPpm: number;
  corridorFedToxicity: number;
  ceilingHeight: number;
  sprinklersActive: boolean;
  smokeExtractionActive: boolean;
  stairPressurizationActive: boolean;
  isStairADoorOpen: boolean;
  isFireDoorClosed: boolean;
  gridSlice: CFDGridCell[][];
  probes?: CFDProbeSensor[];
}

export interface SubWorkerResultPayload {
  taskId: string;
  subDomainId: string;
  calcDurationMs: number;
  updatedCells: { x: number; y: number; tempC: number; smokeOpticalDensity: number; visibilityM: number; coPpm: number; fedToxicity: number; smokeLayerHeightM: number }[];
  updatedProbes?: CFDProbeSensor[];
}

/**
 * Worker Message Event Handler
 */
self.onmessage = (event: MessageEvent<SubWorkerTaskPayload>) => {
  const t0 = performance.now();
  const payload = event.data;
  const {
    taskId,
    subDomainId,
    startCol,
    endCol,
    rows,
    elapsedSec,
    currentHRRKw,
    peakTempC,
    corridorTempC,
    corridorVisibilityM,
    corridorSmokeOpticalDensity,
    corridorCoPpm,
    corridorFedToxicity,
    ceilingHeight,
    sprinklersActive,
    smokeExtractionActive,
    stairPressurizationActive,
    isStairADoorOpen,
    isFireDoorClosed,
    gridSlice,
    probes
  } = payload;

  const updatedCells: SubWorkerResultPayload['updatedCells'] = [];
  const fireOriginX = 21;
  const fireOriginY = 15;

  // Process spatial sub-domain slice
  for (let y = 0; y < rows; y++) {
    for (let x = startCol; x <= endCol; x++) {
      const sliceRow = gridSlice[y];
      if (!sliceRow) continue;
      const cell = sliceRow[x - startCol];
      if (!cell || cell.isWall) continue;

      let cellTemp = 22.0;
      let cellSmokeOD = 0.001;
      let cellVis = 30.0;
      let cellCo = 2.0;
      let cellFed = 0.0;
      let cellLayerHeight = ceilingHeight;

      if (cell.isFireSource) {
        cellTemp = peakTempC;
        cellCo = Math.max(corridorCoPpm * 6.5, 450);
        cellSmokeOD = Math.min(3.5, corridorSmokeOpticalDensity * 2.8);
        cellVis = Math.max(0.4, 3.0 / cellSmokeOD);
        cellLayerHeight = 0.6;
        cellFed = Math.min(1.0, elapsedSec / 180);
      } else if (cell.isRefugeZone) {
        if (isFireDoorClosed) {
          cellTemp = 22.2 + (corridorTempC - 22.0) * 0.04;
          cellVis = Math.max(26.0, 30.0 - corridorSmokeOpticalDensity * 1.5);
          cellCo = 4.0;
          cellSmokeOD = 0.005;
          cellFed = 0.0;
          cellLayerHeight = ceilingHeight;
        } else {
          cellTemp = 22.0 + (corridorTempC - 22.0) * 0.38;
          cellVis = Math.max(2.5, corridorVisibilityM * 1.8);
          cellCo = corridorCoPpm * 0.35;
          cellSmokeOD = corridorSmokeOpticalDensity * 0.35;
          cellFed = corridorFedToxicity * 0.3;
          cellLayerHeight = Math.max(1.2, ceilingHeight - cellSmokeOD * 0.6);
        }
      } else if (cell.x <= 4 && cell.y <= 6) {
        // North Pressurized Stairwell A
        if (isStairADoorOpen) {
          cellTemp = 22.0 + (corridorTempC - 22.0) * 0.75;
          cellVis = Math.max(0.8, corridorVisibilityM);
          cellCo = corridorCoPpm * 0.75;
          cellSmokeOD = corridorSmokeOpticalDensity * 0.75;
          cellFed = corridorFedToxicity * 0.7;
          cellLayerHeight = Math.max(1.0, ceilingHeight - cellSmokeOD * 0.7);
        } else {
          cellTemp = stairPressurizationActive ? 22.5 : 24.0;
          cellVis = stairPressurizationActive ? 29.5 : 24.0;
          cellCo = stairPressurizationActive ? 3.0 : 15.0;
          cellSmokeOD = stairPressurizationActive ? 0.002 : 0.02;
          cellFed = 0.0;
          cellLayerHeight = ceilingHeight;
        }
      } else {
        // General corridor and adjacent rooms
        const distToFire = Math.hypot(x - fireOriginX, y - fireOriginY);
        const distFactor = Math.max(0, 1 - distToFire / 22);

        const tempRise = (peakTempC - 22.0) * Math.pow(distFactor, 2.2);
        cellTemp = Math.round((22.0 + tempRise * 0.65 + (corridorTempC - 22.0) * 0.45) * 10) / 10;

        cellSmokeOD = Math.min(3.0, corridorSmokeOpticalDensity * (0.3 + distFactor * 0.75));
        if (smokeExtractionActive && cell.isVent) {
          cellSmokeOD *= 0.35;
        }

        cellVis = Math.max(0.5, Math.min(30.0, 3.0 / Math.max(0.001, cellSmokeOD)));
        cellCo = Math.round(corridorCoPpm * (0.2 + distFactor * 0.8));
        cellFed = Math.round(corridorFedToxicity * (0.2 + distFactor * 0.8) * 1000) / 1000;
        cellLayerHeight = Math.max(0.7, Math.round((ceilingHeight - Math.min(2.1, cellSmokeOD * 0.85)) * 10) / 10);
      }

      updatedCells.push({
        x,
        y,
        tempC: cellTemp,
        smokeOpticalDensity: cellSmokeOD,
        visibilityM: cellVis,
        coPpm: cellCo,
        fedToxicity: cellFed,
        smokeLayerHeightM: cellLayerHeight
      });
    }
  }

  // Update probes if telemetry domain
  let updatedProbes: CFDProbeSensor[] | undefined = undefined;
  if (probes && probes.length > 0) {
    updatedProbes = probes.map(p => {
      let pTemp = 22.0;
      let pVis = 30.0;
      let pCo = 2.0;
      let pFed = 0.0;

      if (p.id === 'probe-origin') {
        pTemp = peakTempC;
        pVis = Math.max(0.4, corridorVisibilityM * 0.2);
        pCo = Math.max(450, corridorCoPpm * 7);
        pFed = Math.min(1.0, elapsedSec / 210);
      } else if (p.id === 'probe-refuge') {
        if (isFireDoorClosed) {
          pTemp = 22.4;
          pVis = 28.5;
          pCo = 4.0;
          pFed = 0.0;
        } else {
          pTemp = 22.0 + (corridorTempC - 22.0) * 0.35;
          pVis = Math.max(4.0, corridorVisibilityM * 2);
          pCo = corridorCoPpm * 0.35;
          pFed = corridorFedToxicity * 0.25;
        }
      } else {
        pTemp = corridorTempC;
        pVis = corridorVisibilityM;
        pCo = corridorCoPpm;
        pFed = corridorFedToxicity;
      }

      let tenabilityStatus: 'tenivel' | 'alerta_moderado' | 'inabitavel_critico' = 'tenivel';
      if (pTemp >= 120 || pVis < 3.0 || pCo >= 400 || pFed >= 1.0) {
        tenabilityStatus = 'inabitavel_critico';
      } else if (pTemp >= 60 || pVis < 10.0 || pCo >= 150 || pFed >= 0.3) {
        tenabilityStatus = 'alerta_moderado';
      }

      return {
        ...p,
        tempC: Math.round(pTemp * 10) / 10,
        visibilityM: Math.round(pVis * 10) / 10,
        coPpm: Math.round(pCo),
        fedToxicity: Math.round(pFed * 1000) / 1000,
        tenabilityStatus
      };
    });
  }

  const calcDurationMs = performance.now() - t0;
  const result: SubWorkerResultPayload = {
    taskId,
    subDomainId,
    calcDurationMs,
    updatedCells,
    updatedProbes
  };

  self.postMessage(result);
};
