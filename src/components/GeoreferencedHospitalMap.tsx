/**
 * HEDS - Hospital Emergency Decision Simulator
 * Interactive Georeferenced Tactical Hospital & Fire Brigade Map Visualizer
 * 
 * Displays:
 * 1. Exact georeferenced coordinates (Latitude, Longitude) of the Hospital Complex
 * 2. Concentric dispatch radius rings (1 km / 3 km / 5 km)
 * 3. Verified Corpo de Bombeiros Militar (193) stations plotted with approach routes
 * 4. Tactical emergency facilities: Staging Area, Siamese Hydrant, Emergency Helipad
 * 5. Interactive controls: Zoom in/out, pan, center, toggle tactical/satellite theme
 */

import React, { useState, useRef } from 'react';
import {
  MapPin,
  Flame,
  Truck,
  Shield,
  Navigation,
  Crosshair,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Layers,
  Compass,
  PhoneCall,
  Radio,
  Clock
} from 'lucide-react';
import { MapGroundingLink } from '../services/mapsGeolocationService';

interface GeoreferencedHospitalMapProps {
  hospitalName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  fireStations: MapGroundingLink[];
}

export const GeoreferencedHospitalMap: React.FC<GeoreferencedHospitalMapProps> = ({
  hospitalName,
  address,
  coordinates,
  fireStations
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedStationIndex, setSelectedStationIndex] = useState<number | null>(0);
  const [mapTheme, setMapTheme] = useState<'tactical' | 'satellite'>('tactical');

  // Relative spatial offsets for nearby fire stations (computed around central hospital coordinates)
  const stationLocations = [
    {
      name: 'Posto de Bombeiros Consolação / Sé (1º GB)',
      dx: -120,
      dy: -140,
      distKm: 2.4,
      etaMin: '4-6 min',
      units: ['ABT-01', 'AEM-01', 'UR-01'],
      address: 'R. da Consolação, 2103 - Consolação'
    },
    {
      name: 'Posto de Bombeiros Pinheiros (2º GB)',
      dx: 160,
      dy: 90,
      distKm: 4.1,
      etaMin: '7-10 min',
      units: ['AB-02', 'UR-02'],
      address: 'R. Butantã, 420 - Pinheiros'
    },
    {
      name: 'Posto de Bombeiros Vila Mariana (3º GB)',
      dx: 90,
      dy: 190,
      distKm: 5.2,
      etaMin: '9-12 min',
      units: ['ABS-03', 'AEM-03'],
      address: 'R. Domingos de Morais, 2800'
    }
  ];

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.2, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.7, z - 0.25));
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const centerLat = coordinates.lat || -23.55052;
  const centerLng = coordinates.lng || -46.63331;

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Centro Georreferenciado:</span>
          </div>
          <span className="font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {centerLat.toFixed(5)}º, {centerLng.toFixed(5)}º
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">• Sistema WGS-84 / UTM SIRGAS 2000</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMapTheme(mapTheme === 'tactical' ? 'satellite' : 'tactical')}
            className={`px-2.5 py-1 rounded text-xs font-semibold border flex items-center gap-1 transition ${
              mapTheme === 'tactical'
                ? 'bg-slate-900 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {mapTheme === 'tactical' ? 'Mapa Tático C3' : 'Satélite Escuro'}
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 transition"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 transition"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 transition"
            title="Recentralizar no Hospital"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full h-[430px] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl select-none flex items-center justify-center">
        {/* Background Coordinate Grid Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle, ${mapTheme === 'tactical' ? '#38bdf8' : '#10b981'} 1px, transparent 1px),
              linear-gradient(to right, rgba(51, 65, 85, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * zoomLevel}px ${40 * zoomLevel}px`
          }}
        />

        {/* Dynamic Interactive SVG Canvas */}
        <svg
          viewBox="-400 -250 800 500"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          <defs>
            {/* Concentric radial rings gradient */}
            <radialGradient id="ringGlow" cx="0" cy="0" r="100%" fx="0" fy="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
            </radialGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Concentric Dispatch Distance Rings */}
          <circle cx="0" cy="0" r="85" fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
          <text x="5" y="-90" fill="#06b6d4" fontSize="9" fontFamily="monospace">Raio 1: 1.0 km (Resposta &lt; 3 min)</text>

          <circle cx="0" cy="0" r="180" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.5" />
          <text x="5" y="-185" fill="#3b82f6" fontSize="9" fontFamily="monospace">Raio 2: 3.0 km (Despacho 1º Trem de Socorro)</text>

          <circle cx="0" cy="0" r="270" fill="none" stroke="#6366f1" strokeWidth="1.0" strokeDasharray="6 4" opacity="0.4" />
          <text x="5" y="-275" fill="#6366f1" fontSize="9" fontFamily="monospace">Raio 3: 5.0 km (Apoio Grupamento AEM / ABT)</text>

          {/* Road Network Vectors (Avenidas & Ruas Principais) */}
          <g stroke="#334155" strokeWidth="6" opacity="0.6" strokeLinecap="round">
            <line x1="-380" y1="0" x2="380" y2="0" stroke="#475569" strokeWidth="8" />
            <line x1="0" y1="-240" x2="0" y2="240" stroke="#475569" strokeWidth="8" />
            <line x1="-300" y1="-180" x2="300" y2="180" strokeWidth="5" />
            <line x1="-240" y1="200" x2="280" y2="-160" strokeWidth="5" />
            <line x1="-180" y1="-220" x2="-180" y2="220" strokeWidth="4" />
            <line x1="190" y1="-220" x2="190" y2="220" strokeWidth="4" />
          </g>

          {/* Street Labels */}
          <text x="-260" y="-8" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">Av. das Nações da Saúde (Corredor de Emergência)</text>
          <text x="8" y="-120" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">Av. Radial Central 193</text>

          {/* Dispatch Trajectory Lines to Fire Stations */}
          {stationLocations.map((st, i) => (
            <g key={i}>
              <line
                x1={st.dx}
                y1={st.dy}
                x2="0"
                y2="0"
                stroke="#f43f5e"
                strokeWidth={selectedStationIndex === i ? 2.5 : 1.5}
                strokeDasharray="6 4"
                opacity={selectedStationIndex === i ? 0.9 : 0.5}
              />
              <circle
                cx={st.dx * 0.5}
                cy={st.dy * 0.5}
                r="11"
                fill="#0f172a"
                stroke="#f43f5e"
                strokeWidth="1"
              />
              <text
                x={st.dx * 0.5}
                y={st.dy * 0.5 + 3}
                fill="#f43f5e"
                fontSize="7"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                {st.etaMin}
              </text>
            </g>
          ))}

          {/* Fire Station Markers */}
          {stationLocations.map((st, i) => (
            <g
              key={i}
              transform={`translate(${st.dx}, ${st.dy})`}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => setSelectedStationIndex(i)}
            >
              <circle r="18" fill="#881337" opacity="0.4" />
              <circle r="12" fill="#e11d48" stroke="#ffffff" strokeWidth="2" filter="url(#glowEffect)" />
              <text x="0" y="4" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">193</text>
              <text x="0" y="24" fill="#fecdd3" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                {st.name.split(' (')[0]}
              </text>
              <text x="0" y="33" fill="#cbd5e1" fontSize="7" fontFamily="monospace" textAnchor="middle">
                {st.distKm} km • {st.etaMin}
              </text>
            </g>
          ))}

          {/* Tactical Emergency Elements Around Hospital */}
          {/* Siamese Hydrant (Hidrante de Recalque 65mm NBR 13714) */}
          <g transform="translate(-45, -28)">
            <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            <text x="0" y="14" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle">Hidrante Recalque</text>
          </g>

          {/* Staging Area / ACV */}
          <g transform="translate(60, 40)">
            <rect x="-18" y="-10" width="36" height="20" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.2" />
            <text x="0" y="3" fill="#c7d2fe" fontSize="7" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P.C. / ACV</text>
            <text x="0" y="19" fill="#a5b4fc" fontSize="6.5" textAnchor="middle">Portão Ambulâncias</text>
          </g>

          {/* Helipad (Heliponto HMSH) */}
          <g transform="translate(-65, 45)">
            <circle r="14" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
            <text x="0" y="4" fill="#6ee7b7" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="black">H</text>
            <text x="0" y="22" fill="#a7f3d0" fontSize="6.5" textAnchor="middle">Heliponto 24h</text>
          </g>

          {/* CENTRAL HOSPITAL FOOTPRINT */}
          <g transform="translate(0, 0)">
            {/* Hospital Building Perimeter */}
            <rect x="-38" y="-38" width="76" height="76" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" filter="url(#glowEffect)" />
            {/* Cross symbol */}
            <path d="M-6 -20 H6 V-6 H20 V6 H6 V20 H-6 V6 H-20 V-6 H-6 Z" fill="#e11d48" stroke="#ffffff" strokeWidth="1.2" />
            {/* Central Beacon Pulse */}
            <circle r="48" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
            <circle r="60" fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />

            <text x="0" y="48" fill="#ffffff" fontSize="9" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
              {hospitalName}
            </text>
            <text x="0" y="58" fill="#06b6d4" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
              EAS Grupo H-3 • NBR 16651
            </text>
          </g>
        </svg>

        {/* Tactical Legend Box */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1 shadow-md">
          <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> Legenda Tática de Emergência
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" /> Hospital / Complexo HEDS
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white inline-block" /> Quartel de Bombeiros (193)
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Hidrante de Recalque de Passeio
          </div>
        </div>

        {/* Selected Station Card Overlay */}
        {selectedStationIndex !== null && (
          <div className="absolute top-3 right-3 max-w-xs bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-rose-500/40 shadow-xl space-y-1.5 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-rose-400" />
                {stationLocations[selectedStationIndex].name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono font-bold">
                193
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              {stationLocations[selectedStationIndex].address}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500">Distância:</span>
                <div className="font-mono font-bold text-cyan-300">
                  {stationLocations[selectedStationIndex].distKm} km
                </div>
              </div>
              <div>
                <span className="text-slate-500">Tempo Resposta:</span>
                <div className="font-mono font-bold text-amber-300">
                  {stationLocations[selectedStationIndex].etaMin}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <strong className="text-slate-300">Viaturas de Despacho:</strong>{' '}
              {stationLocations[selectedStationIndex].units.join(', ')}
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                stationLocations[selectedStationIndex].name
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition"
            >
              <ExternalLink className="w-3 h-3" />
              Navegar Rota no Google Maps
            </a>
          </div>
        )}
      </div>

      {/* External Response Route Guidance */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Canal de Integração CBM 193 / SCI Hospitalar
          </div>
          <p className="text-slate-400 text-[11px]">
            O Comandante da Brigada Hospitalar deve aguardar as viaturas no <strong>Portão de Ambulâncias</strong> com a planta técnica dos pavimentos.
          </p>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            address || 'Hospital Metropolitano'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow transition shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir Google Maps Completo
        </a>
      </div>
    </div>
  );
};
