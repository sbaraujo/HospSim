/**
 * HEDS - Hospital Emergency Decision Simulator
 * Interactive 3D/2D Hospital Model Viewer (Three.js)
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Floor, Room, Patient, Team } from '../types';
import { Eye, Layers, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ShieldCheck, Flame, Compass } from 'lucide-react';

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
  selectedRoomId
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

    // Draw Patients as agents
    if (showPatients) {
      patients.forEach((pat) => {
        const isCurrentFloor = selectedFloorId === null || selectedFloorId === pat.floorId;
        if (!isCurrentFloor && selectedFloorId !== null) return;

        // Find room position or default
        const room = rooms.find((r) => r.roomNumber === pat.roomNumber || r.id === pat.roomNumber);
        const posX = room ? room.posX + (Math.sin(pat.age) * 1.2) : 0;
        const posZ = room ? room.posZ + (Math.cos(pat.age) * 1.2) : 0;
        const posY = pat.floorId * FLOOR_SPACING + 0.6;

        let agentColor = 0x06b6d4; // P0 cyan
        if (pat.category === 'P1') agentColor = 0xeab308; // P1 yellow
        if (pat.category === 'P2') agentColor = 0xf97316; // P2 orange
        if (pat.category === 'P3') agentColor = 0xd946ef; // P3 purple/magenta
        if (pat.category === 'P4') agentColor = 0xef4444; // P4 red critical

        if (pat.status === 'evacuado_seguro') agentColor = 0x10b981; // Safe green

        // Patient Sphere
        const patientGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12);
        const patientMat = new THREE.MeshStandardMaterial({
          color: agentColor,
          roughness: 0.3,
          metalness: 0.2
        });
        const patientMesh = new THREE.Mesh(patientGeo, patientMat);
        patientMesh.position.set(posX, posY, posZ);
        patientMesh.userData = { patient: pat };
        rootGroup.add(patientMesh);

        // Ring indicator for critical life support (P4)
        if (pat.category === 'P4') {
          const ringGeo = new THREE.RingGeometry(0.5, 0.7, 16);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0044, side: THREE.DoubleSide });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.position.set(posX, posY - 0.4, posZ);
          rootGroup.add(ringMesh);
        }
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
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
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
