/**
 * HEDS - Hospital Emergency Decision Simulator
 * Hospital Infrastructure & 15 Fire Protection Systems Checklist Configuration Modal
 */

import React, { useState } from 'react';
import {
  Hospital,
  Floor,
  Room,
  FireProtectionSystemItem
} from '../types';
import {
  Building2,
  ShieldCheck,
  Layers,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  X,
  Plus,
  Sliders,
  Info,
  SlidersHorizontal,
  Check,
  MapPin
} from 'lucide-react';

interface HospitalProtectionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  floors: Floor[];
  rooms: Room[];
  onSaveHospital: (updatedHospital: Hospital, updatedFloors: Floor[]) => void;
  onOpenGeolocation?: () => void;
}

export function HospitalProtectionConfigModal({
  isOpen,
  onClose,
  hospital,
  floors,
  rooms,
  onSaveHospital,
  onOpenGeolocation
}: HospitalProtectionConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'hospital' | 'pavimentos'>('checklist');

  // Local state for editable hospital and checklist
  const [localHospital, setLocalHospital] = useState<Hospital>(hospital);
  const [localFloors, setLocalFloors] = useState<Floor[]>(floors);
  const [checklist, setChecklist] = useState<FireProtectionSystemItem[]>(
    hospital.fireProtectionChecklist || []
  );

  if (!isOpen) return null;

  const handleToggleExists = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              exists: !item.exists,
              operationalStatus: !item.exists ? 'operacional' : 'inoperante'
            }
          : item
      )
    );
  };

  const handleStatusChange = (
    id: string,
    status: 'operacional' | 'parcial' | 'em_manutencao' | 'inoperante'
  ) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, operationalStatus: status } : item))
    );
  };

  const handleFloorChange = (floorId: number, field: keyof Floor, value: any) => {
    setLocalFloors((prev) =>
      prev.map((fl) => (fl.id === floorId ? { ...fl, [field]: value } : fl))
    );
  };

  const handleSave = () => {
    const updated = {
      ...localHospital,
      fireProtectionChecklist: checklist
    };
    onSaveHospital(updated, localFloors);
    onClose();
  };

  const presentCount = checklist.filter((c) => c.exists).length;
  const operationalCount = checklist.filter((c) => c.exists && c.operationalStatus === 'operacional').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  CONFIGURAÇÃO DE INFRAESTRUTURA & SISTEMAS DE PROTEÇÃO CONTRA INCÊNDIO
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Checklist Oficial 15 Sistemas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hospital, alturas, pavimentos, setores críticos e matriz de proteção conforme NBR 9077, NBR 17240 e NFPA 99/101.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'checklist'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            CHECKLIST DOS 15 SISTEMAS ({presentCount}/15 PRESENTES)
          </button>

          <button
            onClick={() => setActiveTab('hospital')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'hospital'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            DADOS GERAIS DO HOSPITAL & EDIFICAÇÃO
          </button>

          <button
            onClick={() => setActiveTab('pavimentos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'pavimentos'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            PAVIMENTOS, ALTURAS & COMPARTIMENTAÇÃO ({localFloors.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          {/* TAB 1: CHECKLIST OF THE 15 FIRE PROTECTION SYSTEMS */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    Relação Obrigatória dos 15 Elementos de Proteção Contra Incêndio Hospitalar
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Indique o que há e não há na edificação. O estado desses sistemas altera diretamente o comportamento no CFD e a velocidade de evacuação.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{presentCount} de 15 Presentes</div>
                    <div className="text-[11px] text-emerald-400 font-bold">{operationalCount} 100% Operacionais</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-rose-500/40 bg-rose-500/10 flex items-center justify-center font-bold text-sm text-white">
                    {Math.round((presentCount / 15) * 100)}%
                  </div>
                </div>
              </div>

              {/* Systems Checklist Table */}
              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      item.exists
                        ? item.operationalStatus === 'operacional'
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-rose-950/20 border-rose-500/30 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 text-xs font-bold flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                        {item.orderNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.standardRef}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                            {item.code}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          <span className="text-slate-300 font-medium">Escopo:</span> {item.locationScope}
                        </div>

                        <div className="text-[11px] text-amber-400/90 mt-0.5 italic flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>Impacto CFD/Evacuação: {item.cfdImpactDescription}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls: Exists Toggle & Status */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      {/* Exists toggle button */}
                      <button
                        onClick={() => handleToggleExists(item.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                          item.exists
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                            : 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40'
                        }`}
                      >
                        {item.exists ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            HÁ NO HOSPITAL
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            NÃO HÁ (AUSENTE)
                          </>
                        )}
                      </button>

                      {/* Operational Status Selector */}
                      {item.exists && (
                        <select
                          value={item.operationalStatus}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded p-1.5 focus:border-rose-500"
                        >
                          <option value="operacional">100% Operacional</option>
                          <option value="parcial">Operação Parcial</option>
                          <option value="em_manutencao">Em Manutenção</option>
                          <option value="inoperante">Inoperante / Fora de Serviço</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL HOSPITAL DATA & HEIGHTS */}
          {activeTab === 'hospital' && (
            <div className="space-y-5">
              <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-rose-400" />
                  Identificação e Parâmetros Físicos do Hospital
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">Nome da Instituição Hospitalar</label>
                    <input
                      type="text"
                      value={localHospital.name}
                      onChange={(e) => setLocalHospital({ ...localHospital, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">Razão Social / Complexo</label>
                    <input
                      type="text"
                      value={localHospital.tradeName}
                      onChange={(e) => setLocalHospital({ ...localHospital, tradeName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">Endereço Completo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={localHospital.address}
                        onChange={(e) => setLocalHospital({ ...localHospital, address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                      {onOpenGeolocation && (
                        <button
                          type="button"
                          onClick={onOpenGeolocation}
                          className="px-3 py-2 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
                          title="Abrir Mapa Georreferenciado e Quartéis de Bombeiros"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>Ver no Mapa & 193</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">Cidade</label>
                      <input
                        type="text"
                        value={localHospital.city}
                        onChange={(e) => setLocalHospital({ ...localHospital, city: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">UF</label>
                      <input
                        type="text"
                        value={localHospital.state}
                        onChange={(e) => setLocalHospital({ ...localHospital, state: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <label className="block text-slate-400 mb-1 font-bold">Altura Total (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={localHospital.buildingHeightM || 22.5}
                      onChange={(e) => setLocalHospital({ ...localHospital, buildingHeightM: parseFloat(e.target.value) || 22.5 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-bold text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">Do térreo à cumeeira</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <label className="block text-slate-400 mb-1 font-bold">Pé-Direito Padrão (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={localHospital.floorHeightM || 3.5}
                      onChange={(e) => setLocalHospital({ ...localHospital, floorHeightM: parseFloat(e.target.value) || 3.5 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-bold text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">Piso a piso</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <label className="block text-slate-400 mb-1 font-bold">Área Total (m²)</label>
                    <input
                      type="number"
                      value={localHospital.totalAreaM2}
                      onChange={(e) => setLocalHospital({ ...localHospital, totalAreaM2: parseFloat(e.target.value) || 18500 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-bold text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">Construída coberta</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <label className="block text-slate-400 mb-1 font-bold">Capacidade de Leitos</label>
                    <input
                      type="number"
                      value={localHospital.totalBedsCount || 180}
                      onChange={(e) => setLocalHospital({ ...localHospital, totalBedsCount: parseInt(e.target.value) || 180 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-bold text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">Internação + UTI + PS</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs">
                  <label className="block text-slate-400 mb-1 font-bold">Classificação Estrutural e Normativa</label>
                  <input
                    type="text"
                    value={localHospital.constructionClassification || 'Edificação Hospitalar Tipo Z-2 / NBR 9077'}
                    onChange={(e) => setLocalHospital({ ...localHospital, constructionClassification: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLOORS, ROOMS, SURGERY & WARDS */}
          {activeTab === 'pavimentos' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-rose-400" />
                  Pavimentos, Alturas, Blocos Cirúrgicos e Enfermarias
                </h3>
                <p className="text-xs text-slate-400">
                  Configure pé-direito, tempo de resistência ao fogo (TRRF), compartimentação e barreiras corta-fogo para cada nível do hospital.
                </p>
              </div>

              <div className="space-y-3">
                {localFloors.map((fl) => (
                  <div
                    key={fl.id}
                    className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Nível {fl.id}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {fl.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {fl.purpose}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Pé-Direito Piso a Piso (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={fl.floorHeightM || 3.5}
                          onChange={(e) => handleFloorChange(fl.id, 'floorHeightM', parseFloat(e.target.value) || 3.5)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Pé-Direito Útil / Teto (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={fl.ceilingHeightM || 2.8}
                          onChange={(e) => handleFloorChange(fl.id, 'ceilingHeightM', parseFloat(e.target.value) || 2.8)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Área Construída (m²)</label>
                        <input
                          type="number"
                          value={fl.areaM2}
                          onChange={(e) => handleFloorChange(fl.id, 'areaM2', parseFloat(e.target.value) || 2400)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">TRRF Estrutural (min)</label>
                        <select
                          value={fl.trrfRatingMin || 120}
                          onChange={(e) => handleFloorChange(fl.id, 'trrfRatingMin', parseInt(e.target.value) || 120)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-bold"
                        >
                          <option value={60}>60 minutos (TRRF-60)</option>
                          <option value={90}>90 minutos (TRRF-90)</option>
                          <option value={120}>120 minutos (TRRF-120)</option>
                          <option value={180}>180 minutos (TRRF-180)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Portas Corta-Fogo P-90</label>
                        <input
                          type="number"
                          value={fl.fireDoorsCount || 4}
                          onChange={(e) => handleFloorChange(fl.id, 'fireDoorsCount', parseInt(e.target.value) || 4)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-rose-400" />
            As alterações nos sistemas de proteção sincronizam em tempo real com o motor CFD e o relatório oficial AAR.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              SALVAR E ATUALIZAR SISTEMAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
