/**
 * HEDS - Hospital Emergency Decision Simulator
 * Left Navigation Sidebar Component
 */

import React from 'react';
import {
  LayoutDashboard,
  Building,
  Layers,
  DoorOpen,
  Users,
  Shield,
  Activity,
  Sparkles,
  ListOrdered,
  Flame,
  Radio,
  Award,
  FileText,
  Settings,
  ShieldAlert,
  Boxes
} from 'lucide-react';

export type ActiveSidebarTab =
  | 'dashboard'
  | 'hospital'
  | 'edificacao'
  | 'pavimentos'
  | 'ambientes'
  | 'pacientes'
  | 'equipes'
  | 'recursos'
  | 'cenarios'
  | 'eventos'
  | 'simulacao'
  | 'comando_c3'
  | 'avaliacao'
  | 'relatorios'
  | 'configuracoes';

interface NavigationSidebarProps {
  activeTab: ActiveSidebarTab;
  onSelectTab: (tab: ActiveSidebarTab) => void;
  patientsCount: number;
  criticalEventsCount: number;
  teamsCount: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onSelectTab,
  patientsCount,
  criticalEventsCount,
  teamsCount
}) => {
  const navItems: { id: ActiveSidebarTab; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'simulacao', label: 'Simulação 3D', icon: <Flame className="w-4 h-4 text-rose-500 animate-pulse" />, badge: 'Ao Vivo', badgeColor: 'bg-rose-900 text-rose-300' },
    { id: 'comando_c3', label: 'Comando C3', icon: <Radio className="w-4 h-4 text-cyan-400" /> },
    { id: 'hospital', label: 'Hospital', icon: <Building className="w-4 h-4" /> },
    { id: 'edificacao', label: 'Edificação', icon: <Boxes className="w-4 h-4" /> },
    { id: 'pavimentos', label: 'Pavimentos', icon: <Layers className="w-4 h-4" />, badge: '5+1' },
    { id: 'ambientes', label: 'Ambientes', icon: <DoorOpen className="w-4 h-4" /> },
    { id: 'pacientes', label: 'Pacientes', icon: <Users className="w-4 h-4" />, badge: patientsCount, badgeColor: 'bg-cyan-950 text-cyan-300' },
    { id: 'equipes', label: 'Equipes', icon: <Shield className="w-4 h-4" />, badge: teamsCount },
    { id: 'recursos', label: 'Recursos', icon: <Activity className="w-4 h-4" /> },
    { id: 'cenarios', label: 'Cenários', icon: <Sparkles className="w-4 h-4 text-amber-400" />, badge: '20+' },
    { id: 'eventos', label: 'Eventos', icon: <ListOrdered className="w-4 h-4" />, badge: criticalEventsCount, badgeColor: 'bg-amber-950 text-amber-300' },
    { id: 'avaliacao', label: 'Avaliação', icon: <Award className="w-4 h-4 text-emerald-400" /> },
    { id: 'relatorios', label: 'Relatórios PDF', icon: <FileText className="w-4 h-4" /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-56 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Brand Insignia */}
      <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
          H
        </div>
        <div>
          <div className="text-sm font-black tracking-wider text-white">HEDS SIMULATOR</div>
          <div className="text-[10px] text-cyan-400 font-semibold tracking-tight">Comando Hospitalar C3</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-medium">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-left group ${
                isActive
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span>Engine:</span>
          <span className="font-mono text-cyan-400">EventEngine v2.4</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Database:</span>
          <span className="font-mono text-emerald-400">IndexedDB + MySQL</span>
        </div>
      </div>
    </aside>
  );
};
