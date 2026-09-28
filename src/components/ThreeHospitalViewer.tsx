/**
 * HEDS - Hospital Emergency Decision Simulator
 * Interactive 3D/2D Hospital Model Viewer (Three.js)
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Floor, Room, Patient, Team, CFDVisualizationMode, CFDProbeSensor } from '../types';
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
  ChevronUp
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
  onOpenReferences
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
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
  const [cfdTelemetry, setCfdTelemetry] = useState(cfdSolver.getState());

  // Interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 45 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 10, 0));

  // Objects references for animation
  const fireParticlesRef = useRef<THREE.Points | null>(null);
  const smokeParticlesRef = useRef<THREE.Points | null>(null);
  const routeLinesGroupRef = useRef<THREE.Group | null>(null);
  const fireLightRef = useRef<THREE.PointLight | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const blueHemisphere = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    scene.add(blueHemisphere);

    // Dynamic Fire PointLight
    const fireLight = new THREE.PointLight(0xff4500, 3, 18);
    fireLight.position.set(2, 4 * 4.5 + 2, 8);
    scene.add(fireLight);
    fireLightRef.current = fireLight;

    // Ground Grid & Exterior Base
    const grid = new THREE.GridHelper(80, 40, 0x334155, 0x1e293b);
    grid.position.y = -4.5;
    scene.add(grid);

    // Build Static Hospital Architecture
    rebuildHospitalScene(scene);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Fire flickering animation
      if (fireLightRef.current && showFire) {
        fireLightRef.current.intensity = 2.5 + Math.sin(elapsedTime * 12) * 1.0 + Math.cos(elapsedTime * 23) * 0.5;
      }

      // Particle rotations
      if (fireParticlesRef.current && showFire) {
        fireParticlesRef.current.rotation.y = elapsedTime * 0.5;
        const positions = fireParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += 0.04;
          if (positions[i] > 4 * 4.5 + 4) {
            positions[i] = 4 * 4.5 + 0.5;
          }
        }
        fireParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Smoke drifting
      if (smokeParticlesRef.current && showSmoke) {
        smokeParticlesRef.current.rotation.y = elapsedTime * 0.08;
        const positions = smokeParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += Math.sin(elapsedTime + i) * 0.01;
          positions[i + 1] += 0.015;
          if (positions[i + 1] > 4 * 4.5 + 4) {
            positions[i + 1] = 4 * 4.5 + 1.2;
          }
        }
        smokeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Pulse route lines
      if (routeLinesGroupRef.current && showRoutes) {
        const s = 1 + Math.sin(elapsedTime * 4) * 0.08;
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

  // Rebuild 3D Meshes when data, selected floor or hazard states change
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
    smokeSpreadLevel
  ]);

  const rebuildHospitalScene = (scene: THREE.Scene) => {
    // Remove dynamic groups
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData.isDynamicHospitalPart) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((obj) => scene.remove(obj));

    const rootGroup = new THREE.Group();
    rootGroup.userData.isDynamicHospitalPart = true;

    // Floor height constant
    const FLOOR_SPACING = 4.5;

    // Draw Floors
    floors.forEach((flr) => {
      const isCurrentFloor = selectedFloorId === null || selectedFloorId === flr.id;
      const floorY = flr.id * FLOOR_SPACING;

      if (!isCurrentFloor && selectedFloorId !== null) return;

      // Slab mesh
      const slabGeo = new THREE.BoxGeometry(34, 0.4, 22);
      const slabMat = new THREE.MeshStandardMaterial({
        color: flr.id === 4 ? 0x1e293b : 0x0f172a,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: isCurrentFloor ? 0.95 : 0.2
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, floorY, 0);
      slab.receiveShadow = true;
      rootGroup.add(slab);

      // Floor boundary wireframe
      const edges = new THREE.EdgesGeometry(slabGeo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: flr.id === 4 ? 0x38bdf8 : 0x334155,
          linewidth: 1
        })
      );
      line.position.copy(slab.position);
      rootGroup.add(line);
    });

    // Draw Stairs (Vertical Columns)
    // Escada Norte (Left / Back)
    const stairGeo = new THREE.BoxGeometry(3.5, 24, 3.5);
    const northStairMat = new THREE.MeshStandardMaterial({
      color: isNorthStairBlocked ? 0xef4444 : 0x10b981,
      roughness: 0.5,
      transparent: true,
      opacity: 0.75
    });
    const northStair = new THREE.Mesh(stairGeo, northStairMat);
    northStair.position.set(-15, 9, -9);
    rootGroup.add(northStair);

    // Escada Sul (Right / Front - Always Pressurized)
    const southStairMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.5,
      transparent: true,
      opacity: 0.75
    });
    const southStair = new THREE.Mesh(stairGeo, southStairMat);
    southStair.position.set(15, 9, 9);
    rootGroup.add(southStair);

    // Elevators Core (Center)
    const elevGeo = new THREE.BoxGeometry(4, 24, 4);
    const elevMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      transparent: true,
      opacity: 0.5
    });
    const elevatorCore = new THREE.Mesh(elevGeo, elevMat);
    elevatorCore.position.set(0, 9, -6);
    rootGroup.add(elevatorCore);

    // Draw Rooms for visible floor(s)
    rooms.forEach((rm) => {
      const isCurrentFloor = selectedFloorId === null || selectedFloorId === rm.floorId;
      if (!isCurrentFloor && selectedFloorId !== null) return;

      const roomY = rm.floorId * FLOOR_SPACING + 1.2;

      // Color coding room status
      let roomColor = 0x1e293b;
      if (rm.fireStatus === 'em_chamas') roomColor = 0xb91c1c;
      else if (rm.fireStatus === 'alerta_fumaca') roomColor = 0xca8a04;
      else if (rm.category === 'UTI') roomColor = 0x0369a1;
      else if (rm.category === 'Centro Cirúrgico') roomColor = 0x4338ca;
      else if (rm.category === 'Apoio') roomColor = 0x334155;

      const isSelected = selectedRoomId === rm.id;
      if (isSelected) roomColor = 0x38bdf8;

      const roomGeo = new THREE.BoxGeometry(rm.width, 2.0, rm.length);
      const roomMat = new THREE.MeshStandardMaterial({
        color: roomColor,
        roughness: 0.6,
        metalness: 0.1,
        transparent: true,
        opacity: isCurrentFloor ? 0.75 : 0.15
      });

      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.position.set(rm.posX, roomY, rm.posZ);
      roomMesh.userData = { room: rm };
      rootGroup.add(roomMesh);

      // Room outline border
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

    // CFD Simulation Mesh Grid Overlay (when CFD Mode is active)
    if (cfdMode !== 'padrao_3d') {
      const cfdFloorY = (selectedFloorId ?? 4) * FLOOR_SPACING + 0.08;
      const cfdGroup = new THREE.Group();

      cfdSolver.grid.forEach((row) => {
        row.forEach((cell) => {
          if (cell.isWall) return;

          let cellColor = new THREE.Color(0x1e293b);
          let cellOpacity = 0.45;

          if (cfdMode === 'temperatura') {
            const t = cell.tempC;
            if (t <= 25) cellColor = new THREE.Color(0x0284c7);
            else if (t <= 50) cellColor = new THREE.Color(0x06b6d4);
            else if (t <= 80) cellColor = new THREE.Color(0xeab308);
            else if (t <= 160) cellColor = new THREE.Color(0xf97316);
            else if (t <= 300) cellColor = new THREE.Color(0xef4444);
            else cellColor = new THREE.Color(0xffffff); // Flashover white/hot
            cellOpacity = Math.min(0.85, 0.35 + (t / 400));
          } else if (cfdMode === 'fumaca_visibilidade') {
            const v = cell.visibilityM;
            if (v >= 20) cellColor = new THREE.Color(0x38bdf8);
            else if (v >= 10) cellColor = new THREE.Color(0x64748b);
            else if (v >= 3) cellColor = new THREE.Color(0x334155);
            else cellColor = new THREE.Color(0x0f172a); // Blind dense smoke
            cellOpacity = Math.max(0.2, 1.0 - (v / 30));
          } else if (cfdMode === 'toxicidade_co') {
            const co = cell.coPpm;
            if (co <= 20) cellColor = new THREE.Color(0x10b981);
            else if (co <= 60) cellColor = new THREE.Color(0xf59e0b);
            else if (co <= 150) cellColor = new THREE.Color(0xf43f5e);
            else cellColor = new THREE.Color(0x881337); // Lethal CO
            cellOpacity = Math.min(0.85, 0.3 + (co / 300));
          } else if (cfdMode === 'vetores_escoamento') {
            cellColor = new THREE.Color(0x6366f1);
            cellOpacity = 0.35;
          } else if (cfdMode === 'pathfinder_rotas') {
            // Pathfinder gradient streamlines
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

    // Draw Patients as agents (Hospital Beds for P3/P4, Wheelchairs for P2, Avatars for P0/P1)
    if (showPatients) {
      patients.forEach((pat) => {
        const isCurrentFloor = selectedFloorId === null || selectedFloorId === pat.floorId;
        if (!isCurrentFloor && selectedFloorId !== null) return;

        // Find room position or default
        const room = rooms.find((r) => r.roomNumber === pat.roomNumber || r.id === pat.roomNumber);
        const posX = room ? room.posX + (Math.sin(pat.age) * 1.2) : 0;
        const posZ = room ? room.posZ + (Math.cos(pat.age) * 1.2) : 0;
        const posY = pat.floorId * FLOOR_SPACING + 0.35;

        const patGroup = new THREE.Group();
        patGroup.position.set(posX, posY, posZ);
        patGroup.userData = { patient: pat };

        let agentColor = 0x06b6d4; // P0 cyan
        if (pat.category === 'P1') agentColor = 0xeab308; // P1 yellow
        if (pat.category === 'P2') agentColor = 0xf97316; // P2 orange
        if (pat.category === 'P3') agentColor = 0xd946ef; // P3 purple/magenta
        if (pat.category === 'P4') agentColor = 0xef4444; // P4 red critical
        if (pat.status === 'evacuado_seguro') agentColor = 0x10b981; // Safe green

        if (pat.category === 'P3' || pat.category === 'P4') {
          // --- REALISTIC 3D HOSPITAL BED (Leito Articulado) ---
          const mattressGeo = new THREE.BoxGeometry(1.0, 0.25, 2.0);
          const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
          const mattress = new THREE.Mesh(mattressGeo, mattressMat);
          mattress.position.y = 0.45;
          patGroup.add(mattress);

          const frameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
          const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.6, 0.08), frameMat);
          headboard.position.set(0, 0.6, 0.96);
          patGroup.add(headboard);

          const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.45, 0.08), frameMat);
          footboard.position.set(0, 0.5, -0.96);
          patGroup.add(footboard);

          // 4 Caster Wheels
          const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
          [[-0.45, 0.9], [0.45, 0.9], [-0.45, -0.9], [0.45, -0.9]].forEach(([wx, wz]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, 0.08, wz);
            patGroup.add(wheel);
          });

          // Blanket
          const blanketGeo = new THREE.BoxGeometry(0.92, 0.1, 1.4);
          const blanketMat = new THREE.MeshStandardMaterial({ color: agentColor, roughness: 0.4 });
          const blanket = new THREE.Mesh(blanketGeo, blanketMat);
          blanket.position.set(0, 0.58, -0.2);
          patGroup.add(blanket);

          // IV Drip Pole + Life support beacon for P4
          if (pat.category === 'P4') {
            const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6);
            const pole = new THREE.Mesh(poleGeo, frameMat);
            pole.position.set(0.55, 0.9, 0.6);
            patGroup.add(pole);

            const beaconGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const beacon = new THREE.Mesh(beaconGeo, beaconMat);
            beacon.position.set(0.55, 1.7, 0.6);
            patGroup.add(beacon);
          }
        } else if (pat.category === 'P2') {
          // --- REALISTIC 3D WHEELCHAIR (Cadeira de Rodas) ---
          const seatMat = new THREE.MeshStandardMaterial({ color: agentColor, roughness: 0.4 });
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), seatMat);
          seat.position.y = 0.45;
          patGroup.add(seat);

          const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.06), seatMat);
          backrest.position.set(0, 0.75, 0.3);
          patGroup.add(backrest);

          const largeWheelGeo = new THREE.TorusGeometry(0.32, 0.035, 8, 20);
          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
          const leftWheel = new THREE.Mesh(largeWheelGeo, wheelMat);
          leftWheel.rotation.y = Math.PI / 2;
          leftWheel.position.set(-0.38, 0.35, 0.1);
          patGroup.add(leftWheel);

          const rightWheel = new THREE.Mesh(largeWheelGeo, wheelMat);
          rightWheel.rotation.y = Math.PI / 2;
          rightWheel.position.set(0.38, 0.35, 0.1);
          patGroup.add(rightWheel);
        } else {
          // Ambulatory Avatar P0 / P1
          const patientGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.9, 12);
          const patientMat = new THREE.MeshStandardMaterial({ color: agentColor, roughness: 0.3 });
          const patientMesh = new THREE.Mesh(patientGeo, patientMat);
          patientMesh.position.y = 0.45;
          patGroup.add(patientMesh);
        }

        rootGroup.add(patGroup);
      });
    }

    // Draw Teams (Brigadistas & Enfermagem)
    if (showTeams) {
      teams.forEach((team, idx) => {
        const teamY = 4 * FLOOR_SPACING + 0.7; // On floor 4
        const teamX = -3 + idx * 2.2;
        const teamZ = 0; // Corridor

        const teamGeo = new THREE.ConeGeometry(0.45, 1.1, 8);
        const teamMat = new THREE.MeshStandardMaterial({
          color: team.type === 'brigada_incendio' ? 0x2563eb : 0x059669,
          roughness: 0.4
        });
        const teamMesh = new THREE.Mesh(teamGeo, teamMat);
        teamMesh.position.set(teamX, teamY, teamZ);
        rootGroup.add(teamMesh);
      });
    }

    // Dynamic Evacuation Route Arrows/Lines
    if (showRoutes) {
      const routeGroup = new THREE.Group();
      routeLinesGroupRef.current = routeGroup;

      const floor4Y = 4 * FLOOR_SPACING + 0.3;

      // Safe route: from Quarto 408 / Posto 4 to Safe Refuge Area Leste and South Stair
      const safePoints = [
        new THREE.Vector3(2, floor4Y, 7),     // Near Quarto 408
        new THREE.Vector3(2, floor4Y, 0),     // Corridor
        new THREE.Vector3(8, floor4Y, 0),     // Corridor East
        new THREE.Vector3(12, floor4Y, 3),    // Refuge Area East
        new THREE.Vector3(15, floor4Y, 8)     // South Stair (Safe)
      ];

      const safeGeo = new THREE.BufferGeometry().setFromPoints(safePoints);
      const safeMat = new THREE.LineDashedMaterial({
        color: 0x10b981,
        dashSize: 0.8,
        gapSize: 0.4,
        linewidth: 3
      });
      const safeLine = new THREE.Line(safeGeo, safeMat);
      safeLine.computeLineDistances();
      routeGroup.add(safeLine);

      // Blocked North Route (Shown Red dashed line)
      const blockedPoints = [
        new THREE.Vector3(0, floor4Y, 0),
        new THREE.Vector3(-8, floor4Y, 0),
        new THREE.Vector3(-14, floor4Y, -8)  // Toward North Stair
      ];
      const blockedGeo = new THREE.BufferGeometry().setFromPoints(blockedPoints);
      const blockedMat = new THREE.LineDashedMaterial({
        color: isNorthStairBlocked ? 0xef4444 : 0x38bdf8,
        dashSize: 0.6,
        gapSize: 0.6,
        linewidth: 2
      });
      const blockedLine = new THREE.Line(blockedGeo, blockedMat);
      blockedLine.computeLineDistances();
      routeGroup.add(blockedLine);

      rootGroup.add(routeGroup);
    }

    // Dynamic Fire Particle System (Room 408)
    if (showFire) {
      const particleCount = 200;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const fireBaseX = 2;
      const fireBaseY = 4 * FLOOR_SPACING + 0.5;
      const fireBaseZ = 8;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = fireBaseX + (Math.random() - 0.5) * 3.5;
        positions[i * 3 + 1] = fireBaseY + Math.random() * 2.8;
        positions[i * 3 + 2] = fireBaseZ + (Math.random() - 0.5) * 3.5;

        // Warm yellow-red gradients
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.6;
        colors[i * 3 + 2] = 0.05;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.45,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });

      const fireParticles = new THREE.Points(geometry, particleMat);
      fireParticlesRef.current = fireParticles;
      rootGroup.add(fireParticles);
    }

    // Volumetric Smoke Particles (Billows through corridor)
    if (showSmoke) {
      const smokeCount = 350;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(smokeCount * 3);

      const smokeY = 4 * FLOOR_SPACING + 1.8;

      for (let i = 0; i < smokeCount; i++) {
        // Dispersed along floor 4 corridor
        positions[i * 3] = -12 + Math.random() * 25;
        positions[i * 3 + 1] = smokeY + (Math.random() - 0.5) * 1.5;
        positions[i * 3 + 2] = -4 + Math.random() * 12;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const smokeMat = new THREE.PointsMaterial({
        color: 0x475569,
        size: 0.85,
        transparent: true,
        opacity: 0.55 * Math.max(0.3, smokeSpreadLevel)
      });

      const smokeParticles = new THREE.Points(geometry, smokeMat);
      smokeParticlesRef.current = smokeParticles;
      rootGroup.add(smokeParticles);
    }

    scene.add(rootGroup);
  };

  // Mouse & Touch Controls (Orbit/Rotate/Pan/Zoom)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) {
      // Raycasting for Hover tooltip
      checkHoverObject(e);
      return;
    }

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (e.buttons === 1) {
      // Left click = rotate
      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008));
    } else if (e.buttons === 2 || e.shiftKey) {
      // Right click or Shift = pan
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
    cameraAngleRef.current.radius = Math.max(12, Math.min(90, cameraAngleRef.current.radius + e.deltaY * 0.04));
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
      if (hit.object.userData?.patient) {
        const p: Patient = hit.object.userData.patient;
        setHoveredInfo(`[${p.category}] ${p.fictionalName} — Quarto ${p.roomNumber} (${p.status})`);
        return;
      }
      if (hit.object.userData?.room) {
        const r: Room = hit.object.userData.room;
        setHoveredInfo(`${r.name} — Status: ${r.fireStatus.toUpperCase()} (${r.temperatureC}°C)`);
        return;
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
      if (hit.object.userData?.room && onSelectRoom) {
        onSelectRoom(hit.object.userData.room);
        return;
      }
      if (hit.object.userData?.patient && onSelectPatient) {
        onSelectPatient(hit.object.userData.patient);
        return;
      }
    }
  };

  // Camera presets
  const resetCamera = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 45 };
    cameraTargetRef.current = new THREE.Vector3(0, 10, 0);
    setIs2DMode(false);
    updateCameraPosition();
  };

  const toggle2DView = () => {
    const nextMode = !is2DMode;
    setIs2DMode(nextMode);
    if (nextMode) {
      cameraAngleRef.current.radius = 35;
      cameraTargetRef.current = new THREE.Vector3(0, (selectedFloorId ?? 4) * 4.5, 0);
    } else {
      cameraAngleRef.current.radius = 45;
    }
    setTimeout(updateCameraPosition, 50);
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Floor Selection Pills */}
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
            {[4, 3, 2, 1, 0, -1].map((fId) => (
              <button
                key={fId}
                onClick={() => onSelectFloor(fId)}
                className={`px-2 py-1 text-xs rounded font-medium transition ${
                  selectedFloorId === fId
                    ? 'bg-rose-600 text-white font-bold shadow'
                    : fId === 4
                    ? 'text-rose-300 hover:bg-slate-800'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {fId === -1 ? 'Subsolo' : fId === 0 ? 'Térreo' : `${fId}º`}
              </button>
            ))}
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
                cameraAngleRef.current.radius = Math.min(90, cameraAngleRef.current.radius + 5);
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
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-md">
        <button
          onClick={() => setShowFire(!showFire)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showFire ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500 line-through'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-500" /> Fogo
        </button>

        <button
          onClick={() => setShowSmoke(!showSmoke)}
          className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
            showSmoke ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'text-slate-500 line-through'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" /> Fumaça
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
          <Eye className="w-3 h-3 text-cyan-400" /> Pacientes
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
