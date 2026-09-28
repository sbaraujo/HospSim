/**
 * HEDS - Hospital Emergency Decision Simulator
 * Patients CRUD Management Module (P0 to P4)
 */

import React, { useState } from 'react';
import { Patient, PatientTypeCode, PatientStatus } from '../types';
import { PATIENT_TYPES } from '../data/seedData';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Activity,
  Heart,
  AlertCircle,
  X,
  Save,
  Check
} from 'lucide-react';

interface PatientsCrudModalProps {
  patients: Patient[];
  onSavePatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedPatientDetail?: Patient | null;
}

export const PatientsCrudModal: React.FC<PatientsCrudModalProps> = ({
  patients,
  onSavePatient,
  onDeletePatient,
  isOpen,
  onClose,
  selectedPatientDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterFloor, setFilterFloor] = useState<string>('ALL');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(selectedPatientDetail || null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.fictionalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clinicalCondition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || p.category === filterType;
    const matchesFloor = filterFloor === 'ALL' || p.floorId.toString() === filterFloor;
    return matchesSearch && matchesType && matchesFloor;
  });

  const handleStartCreate = () => {
    const newPat: Patient = {
      id: 'pat-' + Date.now(),
      fictionalName: 'Novo Paciente Simulado',
      age: 45,
      floorId: 4,
      roomNumber: '401',
      category: 'P1',
      mobilityStatus: 'auxilio_leve',
      consciousnessLevel: 'alerta',
      clinicalCondition: 'Internação clínica estável.',
      needsOxygen: false,
      needsMechanicalVentilator: false,
      needsInfusionPumps: false,
      needsVitalMonitor: false,
      preparationTimeSec: 60,
      assignedStaffCount: 1,
      status: 'em_leito',
      destinationRefuge: 'Área de Refúgio Leste',
      exposureSmokeSeconds: 0,
      vitalStabilityPercent: 100
    };
    setEditingPatient(newPat);
    setIsCreating(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    onSavePatient(editingPatient);
    setEditingPatient(null);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">MÓDULO DE PACIENTES — HEDS AGENTS</h2>
              <p className="text-xs text-slate-400">
                Cadastro e Controle Nominal de Pacientes Fictícios (Categorias P0 a P4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Paciente
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit/Create Form Drawer or Table View */}
        {editingPatient ? (
          <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-cyan-400">
                {isCreating ? 'Cadastrar Novo Paciente Agente' : `Editar: ${editingPatient.fictionalName}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Voltar à listagem
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome Fictício</label>
                <input
                  type="text"
                  value={editingPatient.fictionalName}
                  onChange={(e) => setEditingPatient({ ...editingPatient, fictionalName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Categoria de Dependência</label>
                <select
                  value={editingPatient.category}
                  onChange={(e) => setEditingPatient({ ...editingPatient, category: e.target.value as PatientTypeCode })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-bold"
                >
                  <option value="P0">P0 — Autônomo (Caminha sozinho)</option>
                  <option value="P1">P1 — Mobilidade Reduzida (Auxílio leve)</option>
                  <option value="P2">P2 — Cadeirante (Evac-Chair / Cadeira)</option>
                  <option value="P3">P3 — Acamado (Maca / Leito)</option>
                  <option value="P4">P4 — Suporte de Vida (Ventilador + O2 + Equipe)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Pavimento / Quarto</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editingPatient.floorId}
                    onChange={(e) => setEditingPatient({ ...editingPatient, floorId: parseInt(e.target.value, 10) })}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                  >
                    <option value={4}>4º Pavimento</option>
                    <option value={3}>3º Pavimento (UTI)</option>
                    <option value={2}>2º Pavimento (CC)</option>
                    <option value={1}>1º Pavimento</option>
                    <option value={0}>Térreo</option>
                    <option value={-1}>Subsolo</option>
                  </select>
                  <input
                    type="text"
                    value={editingPatient.roomNumber}
                    onChange={(e) => setEditingPatient({ ...editingPatient, roomNumber: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="Nº Quarto"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Condição Clínica Detalhada</label>
              <textarea
                value={editingPatient.clinicalCondition}
                onChange={(e) => setEditingPatient({ ...editingPatient, clinicalCondition: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                required
              />
            </div>

            {/* Equipment requirements toggles */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Equipamentos Críticos e Suporte Vital Requeridos
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPatient.needsOxygen}
                    onChange={(e) => setEditingPatient({ ...editingPatient, needsOxygen: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Oxigênio (O2)</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPatient.needsMechanicalVentilator}
                    onChange={(e) => setEditingPatient({ ...editingPatient, needsMechanicalVentilator: e.target.checked })}
                    className="rounded border-slate-700 text-rose-600 focus:ring-0"
                  />
                  <span className="text-rose-300 font-semibold">Ventilador Mecânico</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPatient.needsInfusionPumps}
                    onChange={(e) => setEditingPatient({ ...editingPatient, needsInfusionPumps: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Bombas de Infusão</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPatient.needsVitalMonitor}
                    onChange={(e) => setEditingPatient({ ...editingPatient, needsVitalMonitor: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Monitor Multiparamétrico</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tempo de Preparação (Segundos)</label>
                <input
                  type="number"
                  value={editingPatient.preparationTimeSec}
                  onChange={(e) => setEditingPatient({ ...editingPatient, preparationTimeSec: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Profissionais Necessários</label>
                <input
                  type="number"
                  value={editingPatient.assignedStaffCount}
                  onChange={(e) => setEditingPatient({ ...editingPatient, assignedStaffCount: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Status Atual</label>
                <select
                  value={editingPatient.status}
                  onChange={(e) => setEditingPatient({ ...editingPatient, status: e.target.value as PatientStatus })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="em_leito">Em Leito</option>
                  <option value="preparando">Preparando</option>
                  <option value="em_evacuacao">Em Evacuação</option>
                  <option value="em_area_refugio">Em Área de Refúgio</option>
                  <option value="evacuado_seguro">Evacuado Seguro</option>
                  <option value="exposto_risco">Exposto ao Risco</option>
                  <option value="critico">Crítico</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" /> Salvar Paciente
              </button>
            </div>
          </form>
        ) : (
          /* Table View */
          <div className="flex flex-col flex-1 overflow-hidden p-6 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente por nome, quarto ou condição..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-cyan-300 font-bold"
                >
                  <option value="ALL">Todas as Categorias</option>
                  <option value="P0">P0 — Autônomo</option>
                  <option value="P1">P1 — Mobilidade Reduzida</option>
                  <option value="P2">P2 — Cadeirante</option>
                  <option value="P3">P3 — Acamado</option>
                  <option value="P4">P4 — Suporte de Vida</option>
                </select>

                <select
                  value={filterFloor}
                  onChange={(e) => setFilterFloor(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-300 font-semibold"
                >
                  <option value="ALL">Todos Pavimentos</option>
                  <option value="4">4º Pavimento</option>
                  <option value="3">3º Pavimento (UTI)</option>
                  <option value="2">2º Pavimento (CC)</option>
                  <option value="1">1º Pavimento</option>
                  <option value="0">Térreo</option>
                  <option value="-1">Subsolo</option>
                </select>
              </div>
            </div>

            {/* Patients Table */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Paciente / Quarto</th>
                    <th className="p-3">Condição Clínica</th>
                    <th className="p-3">Equipamentos</th>
                    <th className="p-3">Staff / Tempo</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredPatients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          pat.category === 'P4' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-black' :
                          pat.category === 'P3' ? 'bg-fuchsia-950 text-fuchsia-300' :
                          pat.category === 'P2' ? 'bg-orange-950 text-orange-300' :
                          pat.category === 'P1' ? 'bg-amber-950 text-amber-300' : 'bg-cyan-950 text-cyan-300'
                        }`}>
                          {pat.category}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white">{pat.fictionalName}</div>
                        <div className="text-[10px] text-slate-400">Pav {pat.floorId}º • Quarto {pat.roomNumber} ({pat.age} anos)</div>
                      </td>

                      <td className="p-3 max-w-xs text-slate-300 truncate" title={pat.clinicalCondition}>
                        {pat.clinicalCondition}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {pat.needsOxygen && <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded">O2</span>}
                          {pat.needsMechanicalVentilator && <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-bold">VENT</span>}
                          {pat.needsInfusionPumps && <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">BOMBA</span>}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{pat.assignedStaffCount} profissionais</div>
                        <div className="text-[10px] text-slate-400">{pat.preparationTimeSec}s prep</div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pat.status === 'evacuado_seguro' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          pat.status === 'em_area_refugio' ? 'bg-cyan-950 text-cyan-300' :
                          pat.status === 'exposto_risco' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {pat.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingPatient(pat);
                              setIsCreating(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded"
                            title="Editar Paciente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePatient(pat.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
                            title="Remover Paciente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
