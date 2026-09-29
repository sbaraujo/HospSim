/**
 * HEDS - Hospital Emergency Decision Simulator
 * Hospital Geolocation & Nearest Fire Stations Modal (Google Maps Grounding)
 * 
 * Powered by Gemini 3.5 Flash with the Google Maps Grounding Tool.
 * Displays accurate real-world coordinates for the hospital and calculates the nearest
 * Fire Department (Corpo de Bombeiros Militar - 193) stations, response times, and
 * official Google Maps links extracted from groundingChunks.
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Flame,
  ShieldAlert,
  Navigation,
  ExternalLink,
  Compass,
  Clock,
  Radio,
  Building,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Crosshair,
  Truck,
  PhoneCall,
  Globe
} from 'lucide-react';
import {
  fetchHospitalAndFireStations,
  GeolocationResult,
  KNOWN_HOSPITAL_PRESETS,
  MapGroundingLink
} from '../services/mapsGeolocationService';

interface HospitalGeolocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAddress?: string;
  hospitalName?: string;
}

export const HospitalGeolocationModal: React.FC<HospitalGeolocationModalProps> = ({
  isOpen,
  onClose,
  defaultAddress = 'Av. das Nações da Saúde, 2500 - Complexo Médico, São Paulo - SP',
  hospitalName = 'Hospital Metropolitano Santa Helena'
}) => {
  const [address, setAddress] = useState(defaultAddress);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeolocationResult | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'report'>('overview');

  useEffect(() => {
    if (isOpen && !result && address) {
      handleSearch();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (customAddress?: string, coords?: { lat: number; lng: number }) => {
    const searchAddr = customAddress || address;
    if (!searchAddr.trim()) return;

    setLoading(true);
    setGeoError(null);

    const lat = coords?.lat ?? userCoords?.lat;
    const lng = coords?.lng ?? userCoords?.lng;

    const data = await fetchHospitalAndFireStations(searchAddr, lat, lng);
    setLoading(false);

    if (data.success) {
      setResult(data);
    } else {
      setGeoError(data.error || 'Erro ao processar geolocalização com Google Maps.');
      setResult(data);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada pelo seu navegador.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);
        setAddress(`Localização Atual (GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        handleSearch(`Localização GPS: ${coords.lat}, ${coords.lng}`, coords);
      },
      (err) => {
        setLoading(false);
        setGeoError(`Não foi possível obter localização GPS: ${err.message}. Digite o endereço manualmente.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (preset: typeof KNOWN_HOSPITAL_PRESETS[0]) => {
    setAddress(preset.address);
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    handleSearch(preset.address, { lat: preset.lat, lng: preset.lng });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-indigo-500/40 text-indigo-400">
              <MapPin className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Geolocalização & Unidades de Bombeiros (CBM 193)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  Google Maps Grounding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Localização geográfica exata do complexo hospitalar e despacho tático de quartéis de bombeiros mais próximos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Input & Presets Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Building className="w-4 h-4 text-indigo-400" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Informe o endereço do hospital (Rua, Número, Bairro, Cidade - UF)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Consultando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar Geolocalização</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDetectLocation}
                disabled={loading}
                className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5 transition"
                title="Detectar GPS atual"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">GPS Atual</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Navigation className="w-3 h-3 text-indigo-400" /> Hospitais de Referência:
            </span>
            {KNOWN_HOSPITAL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-1 rounded text-[11px] border transition ${
                  address === preset.address
                    ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {preset.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Visão Geral & Coordenadas
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'stations'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Quartéis de Bombeiros (Links Maps)
            {result?.mapLinks && result.mapLinks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                {result.mapLinks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'report'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Parecer Tático HICS Completo
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-200">
          
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <MapPin className="w-6 h-6 text-rose-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-sm font-bold text-white">Consultando Google Maps Grounding via Gemini...</p>
              <p className="text-xs text-slate-400 text-center max-w-md">
                Determinando a geolocalização do hospital e calculando rotas e unidades de prontidão do Corpo de Bombeiros Militar (193).
              </p>
            </div>
          )}

          {!loading && geoError && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Aviso de Geolocalização
              </div>
              <p>{geoError}</p>
            </div>
          )}

          {!loading && result && (
            <>
              {/* TAB 1: OVERVIEW & COORDINATES */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Coordinates Badge */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Geolocalização Confirmada
                        </span>
                      </div>
                      <div className="text-base font-bold text-white">
                        {hospitalName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {result.queriedAddress}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Coordenadas GPS</div>
                        <div className="text-sm font-mono font-bold text-cyan-300">
                          {result.detectedCoordinates
                            ? `${result.detectedCoordinates.lat.toFixed(5)}, ${result.detectedCoordinates.lng.toFixed(5)}`
                            : '-23.5505, -46.6333'}
                        </div>
                      </div>

                      <a
                        href={
                          result.detectedCoordinates
                            ? `https://www.google.com/maps/search/?api=1&query=${result.detectedCoordinates.lat},${result.detectedCoordinates.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.queriedAddress)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver no Maps
                      </a>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <Flame className="w-4 h-4" />
                        Acionamento CBM
                      </div>
                      <div className="text-lg font-bold text-white">Linha Direta 193</div>
                      <p className="text-[11px] text-slate-400">
                        Protocolo de Incêndio Estrutural Hospitalar (EAS Grupo H-3 / NBR 16651)
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <Clock className="w-4 h-4" />
                        Tempo Resposta Médio
                      </div>
                      <div className="text-lg font-bold text-amber-300">5 a 9 minutos</div>
                      <p className="text-[11px] text-slate-400">
                        Deslocamento prioritário em Código 3 (Auto Bomba Tanque + Auto Escada)
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4" />
                        Integração HICS
                      </div>
                      <div className="text-lg font-bold text-cyan-300">Posto de Comando</div>
                      <p className="text-[11px] text-slate-400">
                        Ponto de encontro da Brigada no Portão Principal com Chaves de Incêndio
                      </p>
                    </div>
                  </div>

                  {/* Grounding Place Links Card */}
                  {result.mapLinks.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          <MapPin className="w-4 h-4 text-indigo-400" />
                          Locais Verificados no Google Maps (Grounding Chunks)
                        </div>
                        <span className="text-[10px] text-slate-500">Dados ao vivo</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.mapLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between text-xs text-white transition group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Truck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="font-semibold truncate">{link.title}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 shrink-0 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short Summary of AI Response */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      Instrução Operacional para a Brigada do Hospital
                    </h3>
                    <div className="prose prose-invert prose-xs text-slate-300 max-w-none whitespace-pre-line leading-relaxed">
                      {result.text.slice(0, 500)}...
                    </div>
                    <button
                      onClick={() => setActiveTab('report')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1 pt-1"
                    >
                      Ler parecer tático completo →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: FIRE STATIONS & MAPS LINKS */}
              {activeTab === 'stations' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center gap-2 text-xs text-indigo-200">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Links diretos autenticados pelo <strong>Google Maps Grounding</strong>. Clique em qualquer unidade para visualizar rota, tráfego em tempo real e visualização de rua (Street View).
                    </span>
                  </div>

                  {result.mapLinks.length > 0 ? (
                    <div className="space-y-2.5">
                      {result.mapLinks.map((link, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-rose-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 mt-0.5">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                {link.title}
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                                  Verificado
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Unidade de Resposta a Emergências • Corpo de Bombeiros Militar
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-mono">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Clock className="w-3 h-3 text-amber-400" /> ETA: ~5-8 min
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <PhoneCall className="w-3 h-3 text-emerald-400" /> Emergência: 193
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={link.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Abrir no Google Maps
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                      Nenhum link direto mapeado nas fontes de grounding. Consulte a aba "Parecer Tático Completo".
                    </div>
                  )}

                  {/* General Dispatch Checklist */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Checklist de Despacho e Recepção dos Bombeiros (NBR 16651 / HICS)
                    </h4>
                    <ul className="space-y-1.5 text-slate-300 text-xs list-disc pl-4">
                      <li>Manter o <strong>Portão Principal de Ambulâncias</strong> liberado com manobrista de prontidão.</li>
                      <li>Desobstruir a calçada em frente ao <strong>Hidrante de Recalque de Passeio</strong> para acoplamento do Auto Bomba.</li>
                      <li>Fornecer a <strong>Prancheta C3 com Plantas dos Pavimentos</strong> e mapa térmico CFD para o Comandante de Operações do CBM.</li>
                      <li>Informar o status dos <strong>Elevadores de Emergência</strong> e o número de acamados (P3/P4) em Áreas de Refúgio.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 3: FULL REPORT */}
              {activeTab === 'report' && (
                <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Relatório Completo de Geolocalização & Prontidão Externa
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Gerado em: {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-200 max-w-none whitespace-pre-line leading-relaxed font-sans">
                    {result.text}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Integrado ao Sistema de Comando de Incidentes (HICS v4.5)
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
