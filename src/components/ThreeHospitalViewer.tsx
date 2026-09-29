/**
 * HEDS - Hospital Emergency Decision Simulator
 * Interactive 3D/2D Hospital Model Viewer (Three.js)
 * 
 * High-Fidelity PBR Visualization with:
 * - Level of Detail (LOD) mesh optimization for 60 FPS evacuation simulations
 * - Realistic anatomical humanoid agents (Patients, Firefighters, Nurses, Doctors)
 * - Articulated hospital ICU beds & wheelchairs with medical equipment
 * - Ultra-realistic multi-layered procedural fire, convective smoke plume & heat layer
 * - Dynamic Floor synchronization supporting custom elevations, areas, and floor counts
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Floor, Room, Patient, Team, CFDVisualizationMode, CFDProbeSensor, CFDSimulationState } from '../types';
import { cfdSolver } from '../services/cfdEngine';
import { 
  Eye, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  Flame, 
  Compass, 
  Gauge, 
  Wind, 
  Activity, 
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  Thermometer,
  Zap
} from 'lucide-react';

interface ThreeHospitalViewerProps {
  floors: Floor[];
  rooms: Room[];
  patients: Patient[];
  teams: Team[];
  selectedFloorId: number | null; // null = all floors
  onSelectFloor: (floorId: number | null) => void;
  onSelectRoom?: (room: Room) => void;
  onSelectPatient?: (patient: Patient) => void;
  fireSpreadLevel: number; // 0 to 1
  smokeSpreadLevel: number; // 0 to 1
  isNorthStairBlocked: boolean;
  selectedRoomId?: string | null;
  onOpenReferences?: () => void;
  onOpenFDSModal?: () => void;
  cfdState?: CFDSimulationState;
}

// ==========================================
// PROCEDURAL PBR TEXTURES GENERATOR (CACHED)
// ==========================================
let cachedFabricNormal: THREE.CanvasTexture | null = null;
let cachedReflectorTexture: THREE.CanvasTexture | null = null;
let cachedMonitorTexture: THREE.CanvasTexture | null = null;
let cachedSmokeSprite: THREE.CanvasTexture | null = null;

function getFabricNormalTexture(): THREE.CanvasTexture {
  if (cachedFabricNormal) return cachedFabricNormal;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgb(128, 128, 255)'; // Base flat normal
    ctx.fillRect(0, 0, 128, 128);
    const imgData = ctx.getImageData(0, 0, 128, 128);
    const data = imgData.data;
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4;
        const weave = Math.sin(x * 0.8) * Math.cos(y * 0.8) * 22;
        data[i] = Math.min(255, Math.max(0, 128 + weave));
        data[i + 1] = Math.min(255, Math.max(0, 128 + weave));
        data[i + 2] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  cachedFabricNormal = new THREE.CanvasTexture(canvas);
  cachedFabricNormal.wrapS = THREE.RepeatWrapping;
  cachedFabricNormal.wrapT = THREE.RepeatWrapping;
  cachedFabricNormal.repeat.set(4, 4);
  return cachedFabricNormal;
}

function getReflectorTexture(): THREE.CanvasTexture {
  if (cachedReflectorTexture) return cachedReflectorTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a'; // Dark bunker fabric
    ctx.fillRect(0, 0, 128, 128);
    // Neon Yellow fluorescent band
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 36, 128, 56);
    // Retroreflective Silver stripe in middle
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 48, 128, 32);
  }
  cachedReflectorTexture = new THREE.CanvasTexture(canvas);
  return cachedReflectorTexture;
}

function getMonitorTexture(): THREE.CanvasTexture {
  if (cachedMonitorTexture) return cachedMonitorTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 256, 160);
    // Screen header
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ECG II  HR: 76 bpm', 12, 24);
    // ECG Waveform
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, 60);
    ctx.lineTo(50, 60);
    ctx.lineTo(60, 40);
    ctx.lineTo(70, 85);
    ctx.lineTo(80, 20);
    ctx.lineTo(90, 65);
    ctx.lineTo(100, 60);
    ctx.lineTo(160, 60);
    ctx.lineTo(170, 40);
    ctx.lineTo(180, 85);
    ctx.lineTo(190, 20);
    ctx.lineTo(200, 65);
    ctx.lineTo(240, 60);
    ctx.stroke();

    // SpO2 in Cyan
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('SpO2: 98%  PI: 2.4', 12, 110);
    // NIBP in Amber
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('NIBP: 120/80 (93)', 12, 140);
  }
  cachedMonitorTexture = new THREE.CanvasTexture(canvas);
  return cachedMonitorTexture;
}

function getSmokeSpriteTexture(): THREE.CanvasTexture {
  if (cachedSmokeSprite) return cachedSmokeSprite;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(230, 230, 240, 0.95)');
    grad.addColorStop(0.35, 'rgba(160, 165, 175, 0.7)');
    grad.addColorStop(0.7, 'rgba(70, 75, 85, 0.35)');
    grad.addColorStop(1, 'rgba(30, 35, 45, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
  }
  cachedSmokeSprite = new THREE.CanvasTexture(canvas);
  return cachedSmokeSprite;
}

export const ThreeHospitalViewer: React.FC<ThreeHospitalViewerProps> = ({
  floors,
  rooms,
  patients,
  teams,
  selectedFloorId,
  onSelectFloor,
  onSelectRoom,
  onSelectPatient,
  fireSpreadLevel,
  smokeSpreadLevel,
  isNorthStairBlocked,
  selectedRoomId,
  onOpenReferences,
  onOpenFDSModal,
  cfdState
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [is2DMode, setIs2DMode] = useState(false);
  const [showFire, setShowFire] = useState(true);
  const [showSmoke, setShowSmoke] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showPatients, setShowPatients] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  // CFD Fire Dynamics Simulator State
  const [cfdMode, setCfdMode] = useState<'padrao_3d' | CFDVisualizationMode>('padrao_3d');
  const [showCFDProbes, setShowCFDProbes] = useState(false);
  const [cfdTelemetry, setCfdTelemetry] = useState(cfdState || cfdSolver.getState());

  useEffect(() => {
    if (cfdState) {
      setCfdTelemetry(cfdState);
    } else {
      setCfdTelemetry(cfdSolver.getState());
    }
  }, [cfdState, fireSpreadLevel, smokeSpreadLevel]);

  // Interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 45 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 10, 0));

  // Animated objects references
  const fireTonguesRef = useRef<THREE.Mesh[]>([]);
  const flameCoreRef = useRef<THREE.Mesh | null>(null);
  const fireEmberParticlesRef = useRef<THREE.Points | null>(null);
  const smokePuffGroupRef = useRef<THREE.Group | null>(null);
  const ceilingSmokeSlabRef = useRef<THREE.Mesh | null>(null);
  const heatRingsRef = useRef<THREE.Mesh[]>([]);
  const routeLinesGroupRef = useRef<THREE.Group | null>(null);
  const fireLightRef = useRef<THREE.PointLight | null>(null);
  const fireSecondaryLightRef = useRef<THREE.PointLight | null>(null);
  const lodListRef = useRef<THREE.LOD[]>([]);

  // ==========================================
  // DYNAMIC FLOOR ELEVATION CALCULATOR
  // ==========================================
  const sortedFloors = useMemo(() => {
    return [...floors].sort((a, b) => b.id - a.id);
  }, [floors]);

  // Compute elevation for any floor ID dynamically based on floorHeightM
  const getFloorElevationY = (floorId: number): number => {
    const target = floors.find(f => f.id === floorId);
    if (!target) return floorId * 4.5;

    // Ascending floors
    const ascFloors = [...floors].sort((a, b) => a.id - b.id);
    let cumulativeY = 0;
    for (const fl of ascFloors) {
      if (fl.id === floorId) return cumulativeY;
      cumulativeY += (fl.floorHeightM || 3.5) * 1.15;
    }
    return floorId * 4.5;
  };

  // Determine active incident floor and fire location
  const fireRoom = rooms.find(r => r.fireStatus === 'em_chamas') || rooms.find(r => r.roomNumber === '408') || rooms[0];
  const fireFloorId = fireRoom ? fireRoom.floorId : (selectedFloorId ?? 4);
  const fireBaseElevation = getFloorElevationY(fireFloorId);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c18);
    scene.fog = new THREE.FogExp2(0x070c18, 0.0065);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 600);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xdbeafe, 1.35);
    dirLight.position.set(35, 70, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const blueHemisphere = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.65);
    scene.add(blueHemisphere);

    // Dynamic Fire PointLights
    const fireLight = new THREE.PointLight(0xff4500, 4.5, 24, 1.2);
    fireLight.position.set(fireRoom ? fireRoom.posX : 2, fireBaseElevation + 2.2, fireRoom ? fireRoom.posZ : 8);
    fireLight.castShadow = true;
    scene.add(fireLight);
    fireLightRef.current = fireLight;

    const fireSecLight = new THREE.PointLight(0xf59e0b, 2.5, 16, 1.5);
    fireSecLight.position.set(fireRoom ? fireRoom.posX + 1.2 : 3.2, fireBaseElevation + 3.0, fireRoom ? fireRoom.posZ - 1.0 : 7.0);
    scene.add(fireSecLight);
    fireSecondaryLightRef.current = fireSecLight;

    // Ground Grid & Base Foundation
    const grid = new THREE.GridHelper(90, 45, 0x334155, 0x1e293b);
    grid.position.y = getFloorElevationY(-1) - 1.0;
    scene.add(grid);

    // Build Static & Dynamic Hospital Architecture
    rebuildHospitalScene(scene);

    // High Performance Animation Loop (Locked 60 FPS Target)
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Update LODs based on camera distance
      if (cameraRef.current && lodListRef.current.length > 0) {
        for (let i = 0; i < lodListRef.current.length; i++) {
          lodListRef.current[i].update(cameraRef.current);
        }
      }

      // Realistic Fire Dual-Frequency Flame Flickering
      if (fireLightRef.current && showFire) {
        const flicker1 = Math.sin(elapsedTime * 14) * 0.8;
        const flicker2 = Math.cos(elapsedTime * 27) * 0.5;
        const turbulentPulse = Math.sin(elapsedTime * 45) * 0.3;
        fireLightRef.current.intensity = Math.max(1.8, 4.2 + flicker1 + flicker2 + turbulentPulse);
      }
      if (fireSecondaryLightRef.current && showFire) {
        fireSecondaryLightRef.current.intensity = Math.max(1.0, 2.8 + Math.cos(elapsedTime * 19) * 0.9);
      }

      // Procedural Volumetric Flame Tongues Displacement
      if (fireTonguesRef.current.length > 0 && showFire) {
        fireTonguesRef.current.forEach((tongue, idx) => {
          const speed = 6 + idx * 1.5;
          const scaleY = 1.0 + Math.sin(elapsedTime * speed + idx) * 0.28 + Math.cos(elapsedTime * (speed * 1.6)) * 0.15;
          const swayX = Math.sin(elapsedTime * 4 + idx * 2) * 0.12;
          const swayZ = Math.cos(elapsedTime * 5 + idx * 2.5) * 0.12;
          tongue.scale.set(1.0 + swayX * 0.5, Math.max(0.5, scaleY), 1.0 + swayZ * 0.5);
          tongue.rotation.y = elapsedTime * 0.8 + idx;
          tongue.rotation.z = swayX * 0.8;
        });
      }

      // Convective Ember Sparks Turbulence
      if (fireEmberParticlesRef.current && showFire) {
        const positions = fireEmberParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const colors = fireEmberParticlesRef.current.geometry.attributes.color.array as Float32Array;
        const count = positions.length / 3;
        const fireBaseY = fireBaseElevation + 0.3;
        const ceilingY = fireBaseElevation + 3.8;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          // Convective upward velocity
          positions[idx + 1] += 0.05 + (i % 5) * 0.008;
          // Swirling turbulent vortex
          positions[idx] += Math.sin(elapsedTime * 3 + i) * 0.02;
          positions[idx + 2] += Math.cos(elapsedTime * 3 + i) * 0.02;

          // Recycle particle at base
          if (positions[idx + 1] > ceilingY) {
            positions[idx + 1] = fireBaseY + Math.random() * 0.4;
            positions[idx] = (fireRoom ? fireRoom.posX : 2) + (Math.random() - 0.5) * 1.8;
            positions[idx + 2] = (fireRoom ? fireRoom.posZ : 8) + (Math.random() - 0.5) * 1.8;
          }

          // Cool from yellow-orange to dark red as it ascends
          const heightRatio = Math.min(1, Math.max(0, (positions[idx + 1] - fireBaseY) / 3.5));
          colors[idx] = 1.0;
          colors[idx + 1] = Math.max(0.05, 0.85 - heightRatio * 0.8);
          colors[idx + 2] = Math.max(0.02, 0.2 - heightRatio * 0.18);
        }
        fireEmberParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        fireEmberParticlesRef.current.geometry.attributes.color.needsUpdate = true;
      }

      // Volumetric Billowy Smoke Dynamics
      if (smokePuffGroupRef.current && showSmoke) {
        smokePuffGroupRef.current.children.forEach((puff, idx) => {
          puff.position.y += Math.sin(elapsedTime * 1.5 + idx) * 0.003;
          puff.position.x += Math.sin(elapsedTime * 0.8 + idx * 0.5) * 0.005;
          const s = 1.0 + Math.sin(elapsedTime * 1.2 + idx) * 0.08;
          puff.scale.set(s, s, s);
        });
      }

      // Ceiling Smoke Hot Layer Pulse
      if (ceilingSmokeSlabRef.current && showSmoke) {
        const mat = ceilingSmokeSlabRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.min(0.85, 0.45 + smokeSpreadLevel * 0.4 + Math.sin(elapsedTime * 2) * 0.04);
      }

      // Heat Radiation Shimmer Waves
      if (heatRingsRef.current.length > 0 && showFire) {
        heatRingsRef.current.forEach((ring, idx) => {
          const cycle = (elapsedTime * 1.2 + idx * 0.7) % 2.5;
          const scale = 1.0 + cycle * 1.8;
          ring.scale.set(scale, scale, 1);
          const mat = ring.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.4 - (cycle / 2.5) * 0.4);
        });
      }

      // Route lines pulsing
      if (routeLinesGroupRef.current && showRoutes) {
        const s = 1 + Math.sin(elapsedTime * 4) * 0.06;
        routeLinesGroupRef.current.scale.set(1, s, 1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // Update camera on position/mode changes
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const target = cameraTargetRef.current;

    if (is2DMode) {
      cameraRef.current.position.set(target.x, target.y + radius * 1.2, target.z + 0.01);
      cameraRef.current.lookAt(target.x, target.y, target.z);
    } else {
      const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(target);
    }
  };

  // Center camera when selected floor changes
  useEffect(() => {
    if (selectedFloorId !== null) {
      const targetY = getFloorElevationY(selectedFloorId) + 2.0;
      cameraTargetRef.current.y = targetY;
    } else {
      cameraTargetRef.current.y = 10;
    }
    updateCameraPosition();
  }, [selectedFloorId, floors]);

  // Rebuild 3D Meshes when data, floor selection or hazard state changes
  useEffect(() => {
    if (!sceneRef.current) return;
    rebuildHospitalScene(sceneRef.current);
  }, [
    floors,
    rooms,
    patients,
    teams,
    selectedFloorId,
    is2DMode,
    showFire,
    showSmoke,
    showRoutes,
    showPatients,
    showTeams,
    isNorthStairBlocked,
    selectedRoomId,
    fireSpreadLevel,
    smokeSpreadLevel,
    cfdMode
  ]);

  // ==========================================
  // SCENE REBUILD LOGIC (LOD & PBR AGENTS)
  // ==========================================
  const rebuildHospitalScene = (scene: THREE.Scene) => {
    // Clear dynamic hospital groups
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData.isDynamicHospitalPart) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((obj) => scene.remove(obj));

    const rootGroup = new THREE.Group();
    rootGroup.userData.isDynamicHospitalPart = true;

    lodListRef.current = [];
    fireTonguesRef.current = [];
    heatRingsRef.current = [];

    // PBR Textures
    const fabricNormal = getFabricNormalTexture();
    const reflectorTex = getReflectorTexture();
    const monitorTex = getMonitorTexture();
    const smokeSpriteTex = getSmokeSpriteTexture();

    // Update Fire PointLights positions dynamically to actual fire floor
    if (fireLightRef.current) {
      fireLightRef.current.position.set(
        fireRoom ? fireRoom.posX : 2,
        fireBaseElevation + 2.2,
        fireRoom ? fireRoom.posZ : 8
      );
      fireLightRef.current.visible = showFire;
    }
    if (fireSecondaryLightRef.current) {
      fireSecondaryLightRef.current.position.set(
        fireRoom ? fireRoom.posX + 1.2 : 3.2,
        fireBaseElevation + 3.0,
        fireRoom ? fireRoom.posZ - 1.0 : 7.0
      );
      fireSecondaryLightRef.current.visible = showFire;
    }

    // ------------------------------------------
    // 1. DYNAMIC FLOORS & SLABS (DATA-DRIVEN)
    // ------------------------------------------
    floors.forEach((flr) => {
      const isCurrentFloor = selectedFloorId === null || selectedFloorId === flr.id;
      const floorY = getFloorElevationY(flr.id);

      if (!isCurrentFloor && selectedFloorId !== null) return;

      // Slab dimensions calculated dynamically from areaM2 or standard 34x22
      const slabWidth = flr.areaM2 ? Math.min(48, Math.max(28, Math.sqrt(flr.areaM2) * 1.1)) : 34;
      const slabLength = flr.areaM2 ? Math.min(36, Math.max(20, Math.sqrt(flr.areaM2) * 0.75)) : 22;

      const slabGeo = new THREE.BoxGeometry(slabWidth, 0.45, slabLength);
      const isFireOnThisFloor = rooms.some(r => r.floorId === flr.id && r.fireStatus === 'em_chamas');

      const slabMat = new THREE.MeshStandardMaterial({
        color: isFireOnThisFloor ? 0x1e293b : flr.id === 0 ? 0x0f172a : 0x111827,
        roughness: 0.75,
        metalness: 0.25,
        transparent: true,
        opacity: isCurrentFloor ? 0.96 : 0.2
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, floorY, 0);
      slab.receiveShadow = true;
      rootGroup.add(slab);

      // Floor outline perimeter
      const edges = new THREE.EdgesGeometry(slabGeo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: isFireOnThisFloor ? 0xf43f5e : isCurrentFloor ? 0x38bdf8 : 0x334155,
          linewidth: isCurrentFloor ? 2 : 1
        })
      );
      line.position.copy(slab.position);
      rootGroup.add(line);
    });

    // ------------------------------------------
    // 2. VERTICAL EVACUATION CORES (STAIRS & ELEVATORS)
    // ------------------------------------------
    const totalHospitalHeight = getFloorElevationY(Math.max(...floors.map(f => f.id))) + 5.0;
    const stairGeo = new THREE.BoxGeometry(3.6, totalHospitalHeight, 3.6);
    const halfH = totalHospitalHeight / 2;

    // Escada Norte (Left / Back)
    const northStairMat = new THREE.MeshStandardMaterial({
      color: isNorthStairBlocked ? 0xef4444 : 0x10b981,
      roughness: 0.45,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const northStair = new THREE.Mesh(stairGeo, northStairMat);
    northStair.position.set(-15, halfH, -9);
    rootGroup.add(northStair);

    // Escada Sul (Right / Front - Always Pressurized +50 Pa)
    const southStairMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.45,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const southStair = new THREE.Mesh(stairGeo, southStairMat);
    southStair.position.set(15, halfH, 9);
    rootGroup.add(southStair);

    // Elevators Core (Central Core)
    const elevGeo = new THREE.BoxGeometry(4.2, totalHospitalHeight, 4.2);
    const elevMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.4,
      transparent: true,
      opacity: 0.55
    });
    const elevatorCore = new THREE.Mesh(elevGeo, elevMat);
    elevatorCore.position.set(0, halfH, -6);
    rootGroup.add(elevatorCore);

    // ------------------------------------------
    // 3. ROOMS ARCHITECTURE
    // ------------------------------------------
    rooms.forEach((rm) => {
      const isCurrentFloor = selectedFloorId === null || selectedFloorId === rm.floorId;
      if (!isCurrentFloor && selectedFloorId !== null) return;

      const roomY = getFloorElevationY(rm.floorId) + 1.25;

      let roomColor = 0x1e293b;
      if (rm.fireStatus === 'em_chamas') roomColor = 0x991b1b;
      else if (rm.fireStatus === 'alerta_fumaca') roomColor = 0xb45309;
      else if (rm.category === 'UTI') roomColor = 0x0369a1;
      else if (rm.category === 'Centro Cirúrgico') roomColor = 0x4338ca;
      else if (rm.category === 'Apoio') roomColor = 0x334155;

      const isSelected = selectedRoomId === rm.id;
      if (isSelected) roomColor = 0x38bdf8;

      const roomGeo = new THREE.BoxGeometry(rm.width, 2.1, rm.length);
      const roomMat = new THREE.MeshStandardMaterial({
        color: roomColor,
        roughness: 0.65,
        metalness: 0.15,
        transparent: true,
        opacity: isCurrentFloor ? 0.78 : 0.15
      });

      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.position.set(rm.posX, roomY, rm.posZ);
      roomMesh.userData = { room: rm };
      rootGroup.add(roomMesh);

      // Room border
      const roomEdges = new THREE.EdgesGeometry(roomGeo);
      const roomBorder = new THREE.LineSegments(
        roomEdges,
        new THREE.LineBasicMaterial({
          color: rm.fireStatus === 'em_chamas' ? 0xffffff : isSelected ? 0x67e8f9 : 0x64748b,
          linewidth: isSelected ? 2 : 1
        })
      );
      roomBorder.position.copy(roomMesh.position);
      rootGroup.add(roomBorder);
    });

    // ------------------------------------------
    // 4. CFD SIMULATION OVERLAY SLICE
    // ------------------------------------------
    if (cfdMode !== 'padrao_3d') {
      const cfdGroup = new THREE.Group();
      const targetCfdFloor = selectedFloorId ?? fireFloorId;
      const cfdFloorY = getFloorElevationY(targetCfdFloor) + 0.08;

      cfdSolver.grid.forEach((row) => {
        row.forEach((cell) => {
          let cellColor = new THREE.Color(0x334155);
          let cellOpacity = 0.4;

          if (cfdMode === 'temperatura') {
            const t = cell.tempC;
            if (t > 400) cellColor = new THREE.Color(0xef4444);
            else if (t > 200) cellColor = new THREE.Color(0xf97316);
            else if (t > 100) cellColor = new THREE.Color(0xeab308);
            else if (t > 50) cellColor = new THREE.Color(0x06b6d4);
            else cellColor = new THREE.Color(0x3b82f6);
            cellOpacity = Math.min(0.85, 0.2 + (t / 600) * 0.65);
          } else if (cfdMode === 'fumaca_visibilidade') {
            const vis = cell.visibilityM;
            if (vis < 3) cellColor = new THREE.Color(0x09090b);
            else if (vis < 8) cellColor = new THREE.Color(0x52525b);
            else if (vis < 15) cellColor = new THREE.Color(0xa1a1aa);
            else cellColor = new THREE.Color(0x22c55e);
            cellOpacity = Math.min(0.85, 0.8 - (vis / 30) * 0.6);
          } else if (cfdMode === 'toxicidade_co') {
            const co = cell.coPpm;
            if (co > 1200) cellColor = new THREE.Color(0x881337);
            else if (co > 600) cellColor = new THREE.Color(0xdb2777);
            else if (co > 200) cellColor = new THREE.Color(0xa855f7);
            else cellColor = new THREE.Color(0x38bdf8);
            cellOpacity = Math.min(0.85, 0.25 + (co / 1500) * 0.6);
          } else if (cfdMode === 'pathfinder_rotas') {
            if (cell.isRefugeZone) cellColor = new THREE.Color(0x10b981);
            else if (cell.y >= 8 && cell.y <= 11) {
              cellColor = cell.x > 18 ? new THREE.Color(0x10b981) : new THREE.Color(0xf59e0b);
            }
            cellOpacity = 0.55;
          }

          const cellQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(cfdSolver.dx * 0.95, cfdSolver.dy * 0.95),
            new THREE.MeshBasicMaterial({
              color: cellColor,
              transparent: true,
              opacity: cellOpacity,
              side: THREE.DoubleSide
            })
          );
          cellQuad.rotation.x = -Math.PI / 2;
          cellQuad.position.set(cell.worldX, cfdFloorY, cell.worldZ);
          cfdGroup.add(cellQuad);
        });
      });
      rootGroup.add(cfdGroup);
    }

    // ------------------------------------------
    // 5. AGENTS WITH LEVEL OF DETAIL (LOD) & PBR
    // ------------------------------------------
    if (showPatients) {
      patients.forEach((pat) => {
        const isCurrentFloor = selectedFloorId === null || selectedFloorId === pat.floorId;
        if (!isCurrentFloor && selectedFloorId !== null) return;

        const room = rooms.find((r) => r.roomNumber === pat.roomNumber || r.id === pat.roomNumber);
        const posX = room ? room.posX + Math.sin(pat.age * 0.5) * 1.3 : 0;
        const posZ = room ? room.posZ + Math.cos(pat.age * 0.5) * 1.3 : 0;
        const posY = getFloorElevationY(pat.floorId) + 0.35;

        let triageColor = 0x06b6d4; // P0 cyan
        if (pat.category === 'P1') triageColor = 0xeab308; // P1 yellow
        if (pat.category === 'P2') triageColor = 0xf97316; // P2 orange
        if (pat.category === 'P3') triageColor = 0xd946ef; // P3 purple/magenta
        if (pat.category === 'P4') triageColor = 0xef4444; // P4 red critical
        if (pat.status === 'evacuado_seguro') triageColor = 0x10b981; // Safe green

        // Create THREE.LOD for performance scaling
        const patientLOD = new THREE.LOD();
        patientLOD.position.set(posX, posY, posZ);
        patientLOD.userData = { patient: pat };

        // ======================================
        // LOD LEVEL 0: HIGH FIDELITY REALISTIC MODEL (< 24m)
        // ======================================
        const highMesh = new THREE.Group();

        if (pat.category === 'P3' || pat.category === 'P4') {
          // --- ARTICULATED HOSPITAL ICU BED (Hill-Rom / Stryker style) ---
          const bedFrameMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.85,
            roughness: 0.25
          });
          const mattressMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.6,
            bumpMap: fabricNormal,
            bumpScale: 0.05
          });
          const blanketMat = new THREE.MeshStandardMaterial({
            color: triageColor,
            roughness: 0.5,
            bumpMap: fabricNormal,
            bumpScale: 0.08
          });

          // Chassis Base with dual telescoping columns
          const baseChassis = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 1.8), bedFrameMat);
          baseChassis.position.y = 0.15;
          highMesh.add(baseChassis);

          // 4 Heavy-duty Caster Wheels with rubber tires
          const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
          const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
          [[-0.4, 0.75], [0.4, 0.75], [-0.4, -0.75], [0.4, -0.75]].forEach(([wx, wz]) => {
            const wheel = new THREE.Mesh(wheelGeo, tireMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, 0.08, wz);
            highMesh.add(wheel);
          });

          // Articulated Mattress Deck (reclined at 25°)
          const lowerMattress = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 1.1), mattressMat);
          lowerMattress.position.set(0, 0.45, -0.35);
          highMesh.add(lowerMattress);

          const backrestMattress = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.8), mattressMat);
          backrestMattress.position.set(0, 0.58, 0.45);
          backrestMattress.rotation.x = -0.32;
          highMesh.add(backrestMattress);

          // Headboard and Footboard
          const boardMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
          const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.65, 0.06), boardMat);
          headboard.position.set(0, 0.68, 0.92);
          highMesh.add(headboard);

          const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.5, 0.06), boardMat);
          footboard.position.set(0, 0.55, -0.92);
          highMesh.add(footboard);

          // Chrome Side Safety Rails
          const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
          [-0.46, 0.46].forEach((rx) => {
            const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 1.1), railMat);
            sideRail.position.set(rx, 0.65, 0.1);
            highMesh.add(sideRail);
          });

          // Anatomical Patient lying on bed
          const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.55 });
          const patientHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), skinMat);
          patientHead.position.set(0, 0.74, 0.6);
          highMesh.add(patientHead);

          // Hospital Cap
          const capMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7 });
          const patientCap = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
          patientCap.position.set(0, 0.75, 0.6);
          highMesh.add(patientCap);

          // Pleated Blanket draped over patient
          const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 1.25), blanketMat);
          blanket.position.set(0, 0.58, -0.25);
          highMesh.add(blanket);

          // IV Drip Pole with Saline Infusion Bags
          const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 8), railMat);
          ivPole.position.set(0.55, 0.95, 0.7);
          highMesh.add(ivPole);

          const ivBagMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.2 });
          const ivBag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.06), ivBagMat);
          ivBag.position.set(0.55, 1.65, 0.7);
          highMesh.add(ivBag);

          // ICU Vital Signs Monitor with glowing screen
          const monitorMat = new THREE.MeshStandardMaterial({
            color: 0x020617,
            roughness: 0.4,
            metalness: 0.6
          });
          const monitorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.26, 0.08), monitorMat);
          monitorMesh.position.set(-0.55, 1.25, 0.6);
          monitorMesh.rotation.y = 0.4;
          highMesh.add(monitorMesh);

          // Screen display with emissive ECG canvas texture
          const screenMat = new THREE.MeshBasicMaterial({ map: monitorTex });
          const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), screenMat);
          screenMesh.position.set(-0.54, 1.25, 0.645);
          screenMesh.rotation.y = 0.4;
          highMesh.add(screenMesh);

          // Escort Medical Staff (Nurse pushing bed)
          const nurseGroup = buildRealisticHumanFigure({
            role: 'nurse',
            uniformColor: 0x059669,
            hasStethoscope: true,
            hasCap: true
          });
          nurseGroup.position.set(0, 0, 1.2);
          nurseGroup.rotation.y = Math.PI;
          highMesh.add(nurseGroup);
        } else if (pat.category === 'P2') {
          // --- REALISTIC TRANSPORT WHEELCHAIR WITH SEATED PATIENT & ORDERLY ---
          const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
          const seatMat = new THREE.MeshStandardMaterial({ color: triageColor, roughness: 0.6, bumpMap: fabricNormal, bumpScale: 0.06 });

          // Sling Seat & Backrest
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.55), seatMat);
          seat.position.set(0, 0.45, 0.0);
          highMesh.add(seat);

          const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.05), seatMat);
          backrest.position.set(0, 0.72, 0.26);
          highMesh.add(backrest);

          // Large 24" Spoked Rear Wheels with Hand-Rims
          const rimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
          [-0.34, 0.34].forEach((wx) => {
            const bigWheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 10, 24), rimMat);
            bigWheel.rotation.y = Math.PI / 2;
            bigWheel.position.set(wx, 0.32, 0.12);
            highMesh.add(bigWheel);

            // Chrome Hand-rim
            const handRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.015, 8, 20), chromeMat);
            handRim.rotation.y = Math.PI / 2;
            handRim.position.set(wx + (wx > 0 ? 0.025 : -0.025), 0.32, 0.12);
            highMesh.add(handRim);
          });

          // Front small casters
          [-0.28, 0.28].forEach((cx) => {
            const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), rimMat);
            caster.rotation.z = Math.PI / 2;
            caster.position.set(cx, 0.06, -0.26);
            highMesh.add(caster);
          });

          // Footrests & Armrests
          [-0.24, 0.24].forEach((fx) => {
            const footrest = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.18), chromeMat);
            footrest.position.set(fx, 0.12, -0.38);
            highMesh.add(footrest);
          });

          // Seated Patient Model
          const patientSeated = buildRealisticHumanFigure({
            role: 'patient',
            uniformColor: 0x38bdf8,
            isSeated: true
          });
          patientSeated.position.set(0, 0.45, 0.05);
          highMesh.add(patientSeated);

          // Orderly / Healthcare Professional pushing wheelchair
          const orderly = buildRealisticHumanFigure({
            role: 'nurse',
            uniformColor: 0x0284c7,
            hasCap: false
          });
          orderly.position.set(0, 0, 0.65);
          orderly.rotation.y = Math.PI;
          highMesh.add(orderly);
        } else {
          // --- AMBULATORY PATIENT (P0 / P1) ---
          const walkingPatient = buildRealisticHumanFigure({
            role: 'patient',
            uniformColor: triageColor,
            hasIVStand: pat.category === 'P1',
            isWalking: true
          });
          highMesh.add(walkingPatient);
        }

        // ======================================
        // LOD LEVEL 1: MEDIUM FIDELITY MODEL (24m - 52m)
        // ======================================
        const medMesh = new THREE.Group();
        const medMat = new THREE.MeshStandardMaterial({ color: triageColor, roughness: 0.5 });
        const medFrameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });

        if (pat.category === 'P3' || pat.category === 'P4') {
          // Simplified Bed & Patient
          const simpleBed = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 1.8), medFrameMat);
          simpleBed.position.y = 0.35;
          medMesh.add(simpleBed);

          const simpleBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 1.2), medMat);
          simpleBlanket.position.set(0, 0.55, -0.2);
          medMesh.add(simpleBlanket);

          const simpleHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf5d0b5 }));
          simpleHead.position.set(0, 0.65, 0.55);
          medMesh.add(simpleHead);
        } else if (pat.category === 'P2') {
          // Simplified Wheelchair
          const simpleChair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), medMat);
          simpleChair.position.y = 0.45;
          medMesh.add(simpleChair);
        } else {
          // Simplified Human Silhouette
          const simpleTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.8, 8), medMat);
          simpleTorso.position.y = 0.65;
          medMesh.add(simpleTorso);

          const simpleHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf5d0b5 }));
          simpleHead.position.y = 1.2;
          medMesh.add(simpleHead);
        }

        // ======================================
        // LOD LEVEL 2: LOW FIDELITY PROXY (> 52m)
        // ======================================
        const lowMesh = new THREE.Group();
        const lowMat = new THREE.MeshBasicMaterial({ color: triageColor });
        const lowMarker = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.9, 6), lowMat);
        lowMarker.position.y = 0.45;
        lowMesh.add(lowMarker);

        // Add levels to LOD container
        patientLOD.addLevel(highMesh, 0);
        patientLOD.addLevel(medMesh, 24);
        patientLOD.addLevel(lowMesh, 52);

        rootGroup.add(patientLOD);
        lodListRef.current.push(patientLOD);
      });
    }

    // ------------------------------------------
    // 6. TEAMS: BRIGADISTAS & ENFERMAGEM (LOD & PBR)
    // ------------------------------------------
    if (showTeams) {
      teams.forEach((team, idx) => {
        const teamFloorY = getFloorElevationY(selectedFloorId ?? fireFloorId) + 0.1;
        const teamX = -4 + idx * 2.4;
        const teamZ = 0; // Main Corridor

        const teamLOD = new THREE.LOD();
        teamLOD.position.set(teamX, teamFloorY, teamZ);

        // --- HIGH FIDELITY TEAM MODEL (LOD 0) ---
        const highTeamGroup = new THREE.Group();
        if (team.type === 'brigada_incendio') {
          // FIREFIGHTER IN STRUCTURAL BUNKER GEAR (NFPA/EN469)
          const firefighter = buildRealisticFirefighterFigure(reflectorTex);
          highTeamGroup.add(firefighter);
        } else {
          // MEDICAL EVACUATION STAFF (Doctor / Nurse)
          const medic = buildRealisticHumanFigure({
            role: 'nurse',
            uniformColor: 0x0284c7,
            hasStethoscope: true,
            hasCap: true,
            isWalking: true
          });
          highTeamGroup.add(medic);
        }

        // --- MEDIUM FIDELITY TEAM MODEL (LOD 1) ---
        const medTeamGroup = new THREE.Group();
        const teamColor = team.type === 'brigada_incendio' ? 0x2563eb : 0x059669;
        const medTeamMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 1.4, 8),
          new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.5 })
        );
        medTeamMesh.position.y = 0.7;
        medTeamGroup.add(medTeamMesh);

        // --- LOW FIDELITY PROXY (LOD 2) ---
        const lowTeamGroup = new THREE.Group();
        const lowTeamMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 1.2, 6),
          new THREE.MeshBasicMaterial({ color: teamColor })
        );
        lowTeamMesh.position.y = 0.6;
        lowTeamGroup.add(lowTeamMesh);

        teamLOD.addLevel(highTeamGroup, 0);
        teamLOD.addLevel(medTeamGroup, 24);
        teamLOD.addLevel(lowTeamGroup, 52);

        rootGroup.add(teamLOD);
        lodListRef.current.push(teamLOD);
      });
    }

    // ------------------------------------------
    // 7. DYNAMIC EVACUATION ROUTES
    // ------------------------------------------
    if (showRoutes) {
      const routeGroup = new THREE.Group();
      routeLinesGroupRef.current = routeGroup;

      const activeFloorY = getFloorElevationY(selectedFloorId ?? fireFloorId) + 0.25;

      // Safe Route to Refuge Area Leste and Pressurized South Stair
      const safePoints = [
        new THREE.Vector3(2, activeFloorY, 7),
        new THREE.Vector3(2, activeFloorY, 0),
        new THREE.Vector3(8, activeFloorY, 0),
        new THREE.Vector3(12, activeFloorY, 3),
        new THREE.Vector3(15, activeFloorY, 8)
      ];

      const safeGeo = new THREE.BufferGeometry().setFromPoints(safePoints);
      const safeMat = new THREE.LineDashedMaterial({
        color: 0x10b981,
        dashSize: 0.8,
        gapSize: 0.35,
        linewidth: 3
      });
      const safeLine = new THREE.Line(safeGeo, safeMat);
      safeLine.computeLineDistances();
      routeGroup.add(safeLine);

      // Blocked North Route
      const blockedPoints = [
        new THREE.Vector3(0, activeFloorY, 0),
        new THREE.Vector3(-8, activeFloorY, 0),
        new THREE.Vector3(-14, activeFloorY, -8)
      ];
      const blockedGeo = new THREE.BufferGeometry().setFromPoints(blockedPoints);
      const blockedMat = new THREE.LineDashedMaterial({
        color: isNorthStairBlocked ? 0xef4444 : 0x38bdf8,
        dashSize: 0.6,
        gapSize: 0.5,
        linewidth: 2
      });
      const blockedLine = new THREE.Line(blockedGeo, blockedMat);
      blockedLine.computeLineDistances();
      routeGroup.add(blockedLine);

      rootGroup.add(routeGroup);
    }

    // ------------------------------------------
    // 8. ULTRA-REALISTIC VOLUMETRIC FIRE & EMBER SPARKS
    // ------------------------------------------
    if (showFire) {
      const fireOriginX = fireRoom ? fireRoom.posX : 2;
      const fireOriginZ = fireRoom ? fireRoom.posZ : 8;
      const fireBaseY = fireBaseElevation + 0.4;

      const fireGroup = new THREE.Group();
      fireGroup.position.set(fireOriginX, fireBaseY, fireOriginZ);

      // Multi-layer procedural volumetric flame tongues
      const coreGeo = new THREE.ConeGeometry(0.65, 2.2, 12, 4);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xfffbeb,
        transparent: true,
        opacity: 0.95
      });
      const flameCore = new THREE.Mesh(coreGeo, coreMat);
      flameCore.position.y = 1.1;
      fireGroup.add(flameCore);
      flameCoreRef.current = flameCore;
      fireTonguesRef.current.push(flameCore);

      const midGeo = new THREE.ConeGeometry(1.15, 2.8, 14, 4);
      const midMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.85
      });
      const flameMid = new THREE.Mesh(midGeo, midMat);
      flameMid.position.y = 1.4;
      fireGroup.add(flameMid);
      fireTonguesRef.current.push(flameMid);

      const outerGeo = new THREE.ConeGeometry(1.6, 3.4, 16, 4);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0.72
      });
      const flameOuter = new THREE.Mesh(outerGeo, outerMat);
      flameOuter.position.y = 1.6;
      fireGroup.add(flameOuter);
      fireTonguesRef.current.push(flameOuter);

      // Convective Ember Sparks Particle System
      const emberCount = 180;
      const emberGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(emberCount * 3);
      const colors = new Float32Array(emberCount * 3);

      for (let i = 0; i < emberCount; i++) {
        positions[i * 3] = fireOriginX + (Math.random() - 0.5) * 2.2;
        positions[i * 3 + 1] = fireBaseY + Math.random() * 3.2;
        positions[i * 3 + 2] = fireOriginZ + (Math.random() - 0.5) * 2.2;

        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
        colors[i * 3 + 2] = 0.1;
      }

      emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      emberGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const emberMat = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });

      const emberParticles = new THREE.Points(emberGeo, emberMat);
      fireEmberParticlesRef.current = emberParticles;
      rootGroup.add(emberParticles);

      // Concentric Heat Radiation Shimmer Waves (Calor Shimmer)
      [1.8, 3.2, 4.6].forEach((radius) => {
        const ringGeo = new THREE.RingGeometry(radius, radius + 0.18, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(fireOriginX, fireBaseY + 0.05, fireOriginZ);
        rootGroup.add(ringMesh);
        heatRingsRef.current.push(ringMesh);
      });

      rootGroup.add(fireGroup);
    }

    // ------------------------------------------
    // 9. ULTRA-REALISTIC VOLUMETRIC SMOKE & STRATIFICATION
    // ------------------------------------------
    if (showSmoke) {
      const smokeOriginX = fireRoom ? fireRoom.posX : 2;
      const smokeOriginZ = fireRoom ? fireRoom.posZ : 8;
      const ceilingY = fireBaseElevation + 3.5;

      const smokeGroup = new THREE.Group();
      smokePuffGroupRef.current = smokeGroup;

      // Stratified Hot Gas Upper Layer (Sub-ceiling cloud)
      const slabGeo = new THREE.BoxGeometry(26, 0.65, 18);
      const slabSmokeMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: 0.65 * Math.max(0.3, smokeSpreadLevel)
      });
      const ceilingSmoke = new THREE.Mesh(slabGeo, slabSmokeMat);
      ceilingSmoke.position.set(0, ceilingY - 0.35, 0);
      rootGroup.add(ceilingSmoke);
      ceilingSmokeSlabRef.current = ceilingSmoke;

      // Volumetric Billowy Smoke Puffs spreading through corridor
      const puffCount = 45;
      for (let i = 0; i < puffCount; i++) {
        const spriteMat = new THREE.SpriteMaterial({
          map: smokeSpriteTex,
          transparent: true,
          opacity: 0.45 * Math.max(0.3, smokeSpreadLevel),
          color: i < 10 ? 0x78716c : 0x27272a
        });
        const sprite = new THREE.Sprite(spriteMat);
        const spreadX = smokeOriginX + (Math.random() - 0.5) * 18;
        const spreadZ = smokeOriginZ + (Math.random() - 0.5) * 12;
        const spreadY = ceilingY - 0.6 - Math.random() * 1.2;

        sprite.position.set(spreadX, spreadY, spreadZ);
        const scale = 2.4 + Math.random() * 2.8;
        sprite.scale.set(scale, scale, 1);
        smokeGroup.add(sprite);
      }

      rootGroup.add(smokeGroup);
    }

    scene.add(rootGroup);
  };

  // ==========================================
  // HELPER: BUILD REALISTIC HUMANOID FIGURES
  // ==========================================
  function buildRealisticHumanFigure(opts: {
    role: 'patient' | 'nurse' | 'doctor';
    uniformColor: number;
    hasStethoscope?: boolean;
    hasCap?: boolean;
    hasIVStand?: boolean;
    isSeated?: boolean;
    isWalking?: boolean;
  }): THREE.Group {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.55 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const uniformMat = new THREE.MeshStandardMaterial({ color: opts.uniformColor, roughness: 0.55 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), skinMat);
    head.position.y = opts.isSeated ? 0.6 : 1.35;
    group.add(head);

    // Hair or Surgical Cap
    if (opts.hasCap) {
      const capMat = new THREE.MeshStandardMaterial({ color: opts.uniformColor, roughness: 0.6 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), capMat);
      cap.position.y = opts.isSeated ? 0.61 : 1.36;
      group.add(cap);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), hairMat);
      hair.position.y = opts.isSeated ? 0.61 : 1.36;
      group.add(hair);
    }

    // Torso / Scrub Top / Gown
    const torsoHeight = 0.55;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, torsoHeight, 10), uniformMat);
    torso.position.y = opts.isSeated ? 0.32 : 0.95;
    group.add(torso);

    // Stethoscope around neck
    if (opts.hasStethoscope) {
      const stethMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });
      const steth = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 16, Math.PI * 1.2), stethMat);
      steth.rotation.x = Math.PI / 2;
      steth.position.set(0, opts.isSeated ? 0.52 : 1.15, 0.05);
      group.add(steth);
    }

    // Arms
    [-0.22, 0.22].forEach((ax) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), uniformMat);
      arm.position.set(ax, opts.isSeated ? 0.32 : 0.92, 0);
      arm.rotation.z = ax > 0 ? -0.15 : 0.15;
      if (opts.isWalking) arm.rotation.x = ax > 0 ? 0.25 : -0.25;
      group.add(arm);

      // Hand
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
      hand.position.set(ax, opts.isSeated ? 0.1 : 0.68, 0);
      group.add(hand);
    });

    // Legs / Pants
    if (opts.isSeated) {
      // Seated thighs
      const thighMat = new THREE.MeshStandardMaterial({ color: opts.uniformColor, roughness: 0.6 });
      [-0.1, 0.1].forEach((lx) => {
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.38, 8), thighMat);
        thigh.rotation.x = Math.PI / 2;
        thigh.position.set(lx, 0.06, -0.18);
        group.add(thigh);

        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8), thighMat);
        shin.position.set(lx, -0.16, -0.36);
        group.add(shin);
      });
    } else {
      // Standing legs
      [-0.1, 0.1].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.65, 8), uniformMat);
        leg.position.set(lx, 0.35, 0);
        if (opts.isWalking) leg.rotation.x = lx > 0 ? -0.2 : 0.2;
        group.add(leg);

        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), shoeMat);
        shoe.position.set(lx, 0.03, 0.02);
        group.add(shoe);
      });
    }

    // Ambulatory P1 Mobile IV Pole
    if (opts.hasIVStand) {
      const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
      standPole.position.set(0.35, 0.8, -0.1);
      group.add(standPole);

      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.04), new THREE.MeshBasicMaterial({ color: 0xe0f2fe }));
      bag.position.set(0.35, 1.45, -0.1);
      group.add(bag);
    }

    return group;
  }

  // ==========================================
  // HELPER: BUILD REALISTIC FIREFIGHTER IN BUNKER GEAR
  // ==========================================
  function buildRealisticFirefighterFigure(reflectorTexture: THREE.CanvasTexture): THREE.Group {
    const group = new THREE.Group();

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      map: reflectorTexture
    });
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.05
    });
    const scbaMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      metalness: 0.75,
      roughness: 0.3
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.7
    });

    // F1 Firefighter Helmet with reflective visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), helmetMat);
    helmet.position.y = 1.38;
    group.add(helmet);

    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10, 1, true, 0, Math.PI * 0.8), visorMat);
    visor.position.set(0, 1.34, 0.04);
    visor.rotation.y = Math.PI * 0.6;
    group.add(visor);

    // Bunker Coat Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.28), coatMat);
    torso.position.y = 0.95;
    group.add(torso);

    // SCBA Air Cylinder on back
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 10), scbaMat);
    tank.position.set(0, 0.95, -0.22);
    group.add(tank);

    // Heavy Turnout Pants & Boots
    [-0.12, 0.12].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8), coatMat);
      leg.position.set(lx, 0.35, 0);
      group.add(leg);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), bootMat);
      boot.position.set(lx, 0.04, 0.04);
      group.add(boot);
    });

    // Arms with heavy gloves
    [-0.26, 0.26].forEach((ax) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.48, 8), coatMat);
      arm.position.set(ax, 0.9, 0);
      arm.rotation.z = ax > 0 ? -0.15 : 0.15;
      group.add(arm);
    });

    return group;
  }

  // Mouse & Touch Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) {
      checkHoverObject(e);
      return;
    }

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (e.buttons === 1) {
      // Rotate
      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008));
    } else if (e.buttons === 2 || e.shiftKey) {
      // Pan
      const panSpeed = 0.05;
      cameraTargetRef.current.x -= deltaX * panSpeed;
      cameraTargetRef.current.z += deltaY * panSpeed;
    }

    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngleRef.current.radius = Math.max(12, Math.min(95, cameraAngleRef.current.radius + e.deltaY * 0.04));
    updateCameraPosition();
  };

  const checkHoverObject = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (curr.userData?.patient) {
          const p: Patient = curr.userData.patient;
          setHoveredInfo(`[${p.category}] ${p.fictionalName} — Quarto ${p.roomNumber} (${p.status})`);
          return;
        }
        if (curr.userData?.room) {
          const r: Room = curr.userData.room;
          setHoveredInfo(`${r.name} — Status: ${r.fireStatus.toUpperCase()} (${r.temperatureC}°C)`);
          return;
        }
        curr = curr.parent;
      }
    }
    setHoveredInfo(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (curr.userData?.room && onSelectRoom) {
          onSelectRoom(curr.userData.room);
          return;
        }
        if (curr.userData?.patient && onSelectPatient) {
          onSelectPatient(curr.userData.patient);
          return;
        }
        curr = curr.parent;
      }
    }
  };

  const resetCamera = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 45 };
    cameraTargetRef.current = new THREE.Vector3(0, selectedFloorId !== null ? getFloorElevationY(selectedFloorId) + 2 : 10, 0);
    setIs2DMode(false);
    updateCameraPosition();
  };

  const toggle2DView = () => {
    const nextMode = !is2DMode;
    setIs2DMode(nextMode);
    if (nextMode) {
      cameraAngleRef.current.radius = 35;
      cameraTargetRef.current = new THREE.Vector3(0, selectedFloorId !== null ? getFloorElevationY(selectedFloorId) : 10, 0);
    } else {
      cameraAngleRef.current.radius = 45;
    }
    setTimeout(updateCameraPosition, 50);
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Dynamic Floor Selection Pills */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-md pointer-events-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Pavimento:
            </span>
            <button
              onClick={() => onSelectFloor(null)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                selectedFloorId === null
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Todos (3D Geral)
            </button>
            {sortedFloors.map((flr) => {
              const isSelected = selectedFloorId === flr.id;
              const hasFire = rooms.some(r => r.floorId === flr.id && r.fireStatus === 'em_chamas');
              return (
                <button
                  key={flr.id}
                  onClick={() => onSelectFloor(flr.id)}
                  className={`px-2 py-1 text-xs rounded font-medium transition flex items-center gap-1 ${
                    isSelected
                      ? hasFire
                        ? 'bg-rose-600 text-white font-bold shadow'
                        : 'bg-indigo-600 text-white font-bold shadow'
                      : hasFire
                      ? 'text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title={`${flr.name} - Pé-direito: ${flr.floorHeightM || 3.5}m`}
                >
                  {hasFire && <Flame className="w-3 h-3 text-rose-300 animate-pulse" />}
                  {flr.id === -1 ? 'Subsolo' : flr.id === 0 ? 'Térreo' : `${flr.id}º`}
                </button>
              );
            })}
          </div>

          {/* View Mode & Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-md pointer-events-auto">
            <button
              onClick={toggle2DView}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition ${
                is2DMode ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Alternar entre Planta 2D Superior e Perspectiva 3D Isométrica"
            >
              <Compass className="w-3.5 h-3.5" /> {is2DMode ? 'Planta 2D' : 'Modelo 3D'}
            </button>

            {onOpenReferences && (
              <button
                onClick={onOpenReferences}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-medium"
                title="Modelos de Referência Pathfinder & FDS"
              >
                <Activity className="w-3.5 h-3.5" /> Benchmarks
              </button>
            )}

            <button
              onClick={() => setShowCFDProbes(!showCFDProbes)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition ${
                showCFDProbes
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
              }`}
              title="Exibir Leituras das Sondas CFD"
            >
              <Gauge className="w-3.5 h-3.5" /> Sondas CFD
            </button>

            <button
              onClick={resetCamera}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Resetar Câmera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                cameraAngleRef.current.radius = Math.max(12, cameraAngleRef.current.radius - 5);
                updateCameraPosition();
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Aproximar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                cameraAngleRef.current.radius = Math.min(95, cameraAngleRef.current.radius + 5);
                updateCameraPosition();
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Afastar Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CFD FDS Visualizer Mode Bar */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-lg border border-indigo-500/40 shadow-lg pointer-events-auto self-start">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider px-2 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" /> Modo CFD:
          </span>

          <button
            onClick={() => setCfdMode('padrao_3d')}
            className={`px-2 py-0.5 text-xs rounded transition ${
              cfdMode === 'padrao_3d' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Físico
          </button>
          <button
            onClick={() => setCfdMode('temperatura')}
            className={`px-2 py-0.5 text-xs rounded transition ${
              cfdMode === 'temperatura' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Temperatura (°C)
          </button>
          <button
            onClick={() => setCfdMode('fumaca_visibilidade')}
            className={`px-2 py-0.5 text-xs rounded transition ${
              cfdMode === 'fumaca_visibilidade' ? 'bg-slate-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visibilidade (m)
          </button>
          <button
            onClick={() => setCfdMode('toxicidade_co')}
            className={`px-2 py-0.5 text-xs rounded transition ${
              cfdMode === 'toxicidade_co' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            CO ppm & FED
          </button>
          <button
            onClick={() => setCfdMode('pathfinder_rotas')}
            className={`px-2 py-0.5 text-xs rounded transition ${
              cfdMode === 'pathfinder_rotas' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pathfinder Streamlines
          </button>

          {onOpenFDSModal && (
            <button
              onClick={onOpenFDSModal}
              className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition flex items-center gap-1 font-semibold ml-1"
              title="Configurar Arquivos FDS e Cenários Físicos NIST"
            >
              <Database className="w-3 h-3" /> FDS v6.8
            </button>
          )}
        </div>
      </div>

      {/* CFD Probes Telemetry HUD Overlay */}
      {showCFDProbes && (
        <div className="absolute top-28 right-3 z-20 w-80 bg-slate-950/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 shadow-2xl space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Sondas CFD em Tempo Real
              </span>
            </div>
            <button
              onClick={() => setShowCFDProbes(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {cfdTelemetry.probes.map((probe) => (
              <div
                key={probe.id}
                className="p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{probe.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                      probe.tenabilityStatus === 'tenivel'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : probe.tenabilityStatus === 'alerta_moderado'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400 animate-pulse'
                    }`}
                  >
                    {probe.tenabilityStatus === 'tenivel'
                      ? 'Tenível'
                      : probe.tenabilityStatus === 'alerta_moderado'
                      ? 'Alerta'
                      : 'Inabitável'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-slate-400 font-mono">
                  <div>Temp: <span className="text-white font-bold">{probe.tempC}°C</span></div>
                  <div>Vis: <span className="text-cyan-300 font-bold">{probe.visibilityM}m</span></div>
                  <div>CO: <span className="text-amber-300 font-bold">{probe.coPpm}ppm</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 flex justify-between">
            <span>HRR: {cfdTelemetry.currentHRRKw} kW</span>
            <span>Pico: {cfdTelemetry.peakTempC}°C</span>
          </div>
        </div>
      )}

      {/* Layer Visibility Toggles (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-md pointer-events-auto">
        <button
          onClick={() => setShowFire(!showFire)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showFire ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500 line-through'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-500" /> Fogo Realístico
        </button>

        <button
          onClick={() => setShowSmoke(!showSmoke)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showSmoke ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'text-slate-500 line-through'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" /> Fumaça & Pluma
        </button>

        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showRoutes ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 line-through'
          }`}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Rotas
        </button>

        <button
          onClick={() => setShowPatients(!showPatients)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showPatients ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 line-through'
          }`}
        >
          <Eye className="w-3 h-3 text-cyan-400" /> Pacientes (LOD PBR)
        </button>

        <button
          onClick={() => setShowTeams(!showTeams)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showTeams ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 line-through'
          }`}
        >
          <Activity className="w-3 h-3 text-indigo-400" /> Brigada & Equipes
        </button>
      </div>

      {/* Route & Hazard Badge (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
        {isNorthStairBlocked && (
          <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500 px-3 py-1.5 rounded-lg text-rose-200 text-xs font-semibold shadow-lg animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Escada Norte Bloqueada por Fumaça! Desvio para Escada Sul Ativo.
          </div>
        )}

        {hoveredInfo && (
          <div className="bg-slate-900/95 border border-cyan-500/50 px-3 py-1.5 rounded-lg text-cyan-300 text-xs shadow-lg">
            {hoveredInfo}
          </div>
        )}
      </div>

      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
