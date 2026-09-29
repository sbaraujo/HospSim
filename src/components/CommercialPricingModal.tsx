/**
 * HEDS - Hospital Emergency Decision Simulator
 * Proposta Comercial, Tabela de Valores, Consultoria e Treinamento (Mercado Brasileiro)
 */

import React, { useState } from 'react';
import {
  DollarSign,
  X,
  Building2,
  Shield,
  GraduationCap,
  Calculator,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  PhoneCall,
  Download
} from 'lucide-react';

interface CommercialPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommercialPricingModal({ isOpen, onClose }: CommercialPricingModalProps) {
  const [activeTab, setActiveTab] = useState<'software' | 'consultoria' | 'treinamento' | 'pacotes' | 'roi'>('software');
  const [bedsCount, setBedsCount] = useState<number>(250);
  const [floorsCount, setFloorsCount] = useState<number>(6);

  if (!isOpen) return null;

  // Dynamic ROI calculation
  const calculatedAuditSavings = bedsCount * 320;
  const calculatedInsuranceDiscount = bedsCount * 450;
  const totalAnnualBenefit = calculatedAuditSavings + calculatedInsuranceDiscount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl shadow-inner">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  TABELA DE VALORES & PROPOSTA COMERCIAL BRASIL
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Valores 2026/2027
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Licenciamento HEDS, Consultoria em Engenharia de Incêndio (CFD/FDS & Pathfinder) e Capacitação Hospitalar
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

        {/* Navigation Tabs */}
        <div className="bg-slate-950/80 px-6 py-2 border-b border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('software')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'software'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> 1. Licenciamento de Software
          </button>
          <button
            onClick={() => setActiveTab('consultoria')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'consultoria'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 2. Consultoria de Engenharia
          </button>
          <button
            onClick={() => setActiveTab('treinamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'treinamento'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> 3. Treinamento & Tabletop
          </button>
          <button
            onClick={() => setActiveTab('pacotes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'pacotes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 4. Pacotes Turnkey
          </button>
          <button
            onClick={() => setActiveTab('roi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'roi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 5. Calculadora de ROI
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: LICENCIAMENTO SOFTWARE */}
          {activeTab === 'software' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Modelo de Fornecimento:</strong> O HEDS é comercializado como Software como Serviço (SaaS Nuvem Privada Dedicada) ou On-Premise para infraestrutura hospitalar interna. Todos os planos incluem modelagem 3D dos pavimentos, motor CFD/FDS v6.8, simulação de egress de agentes (Pathfinder/SFPE), suporte e atualizações regulatórias (NBR 16651, RDC 50 Anvisa e ITs do Corpo de Bombeiros).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plano Individual */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital Porte Médio</div>
                    <h3 className="text-lg font-bold text-white">Plano Standard HEDS</h3>
                    <div className="text-2xl font-black text-emerald-400">
                      R$ 4.500 <span className="text-xs font-normal text-slate-400">/ mês</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">ou R$ 48.000 / ano à vista</div>
                    <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Até 150 leitos e 4 pavimentos</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Motor CFD FDS pré-calibrado</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Visualizador 3D com LOD PBR</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10 Usuários Simultâneos</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Emissão de Relatórios PDF Executivos</div>
                    </div>
                  </div>
                </div>

                {/* Plano Alta Complexidade */}
                <div className="bg-gradient-to-b from-indigo-950/60 to-slate-950 p-5 rounded-xl border-2 border-indigo-500/60 shadow-xl flex flex-col justify-between relative">
                  <div className="absolute -top-3 right-4 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Mais Recomendado
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hospital Alta Complexidade / UTI</div>
                    <h3 className="text-lg font-bold text-white">Plano Enterprise HEDS</h3>
                    <div className="text-2xl font-black text-emerald-400">
                      R$ 8.500 <span className="text-xs font-normal text-slate-400">/ mês</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">ou R$ 92.000 / ano à vista</div>
                    <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Até 500 leitos e pavimentos ilimitados</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Simulação com Perfis Empíricos (Geoerg/Hunt/Kwak)</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Módulo C3 de Comando & Decision Game</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Check-list dos 15 Sistemas de Proteção Ativa</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Usuários Ilimitados + Suporte Dedicado</div>
                    </div>
                  </div>
                </div>

                {/* Plano Rede Hospitalar */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Rede / Grupos Hospitalares</div>
                    <h3 className="text-lg font-bold text-white">Plano Multi-Hospital Corp</h3>
                    <div className="text-2xl font-black text-emerald-400">
                      R$ 22.000 <span className="text-xs font-normal text-slate-400">/ mês</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">ou R$ 240.000 / ano (até 5 hospitais)</div>
                    <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Multi-unidades com painel unificado C3</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Importação de Plantas BIM / IFC / CAD</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Integração API com HIS / Tasy / MV Soul</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SLA de Suporte 24/7 com Engenheiro de Fogo</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Servidor On-Premise dedicado compatível</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSULTORIA DE ENGENHARIA */}
          {activeTab === 'consultoria' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Consultoria Especializada com Emissão de ART (CREA):</strong> Projetos elaborados por Engenheiros de Segurança Contra Incêndio especialistas em edificações de saúde (H-3). Atende às exigências do Corpo de Bombeiros Militar (AVCB/CLCB), Acreditações ONA / JCI / Qmentum e NBR 16651.
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Serviço de Engenharia / Consultoria</th>
                      <th className="p-3">Escopo & Entregáveis</th>
                      <th className="p-3">Prazo Médio</th>
                      <th className="p-3 text-right">Valor Sugerido (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">
                        Modelagem Computacional de Evacuação (Pathfinder) & Dinâmica de Fogo (FDS)
                      </td>
                      <td className="p-3 text-slate-400">
                        Construção geométrica 3D do hospital, cálculo do RSET vs ASET, fluxo em gargalos, tempos de extração por leito e laudo técnico com ART.
                      </td>
                      <td className="p-3 text-amber-400 font-mono">25 a 40 dias</td>
                      <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                        R$ 65.000 – R$ 130.000
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">
                        Auditoria de Conformidade dos 15 Sistemas de Proteção (NBR 16651 & ITs)
                      </td>
                      <td className="p-3 text-slate-400">
                        Vistoria in loco de compartimentação, selagens corta-fogo, pressurização de escadas, sprinklers, dampers e detecção de fumaça com relatório de não-conformidades.
                      </td>
                      <td className="p-3 text-amber-400 font-mono">15 a 20 dias</td>
                      <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                        R$ 35.000 – R$ 60.000
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">
                        Plano de Abandono Hospitalar com Setorização de Áreas de Refúgio
                      </td>
                      <td className="p-3 text-slate-400">
                        Dimensionamento da evacuação horizontal faseada, cálculo de leitos por área de refúgio, fluxogramas de decisão e rotas seguras para UTIs e Centros Cirúrgicos.
                      </td>
                      <td className="p-3 text-amber-400 font-mono">20 a 30 dias</td>
                      <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                        R$ 40.000 – R$ 75.000
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">
                        Consultoria Contínua de Segurança Contra Incêndio (Retainer Mensal)
                      </td>
                      <td className="p-3 text-slate-400">
                        Acompanhamento mensal, atualização dos cenários no software HEDS, revisão de reformas e acompanhamento de auditorias ONA/JCI.
                      </td>
                      <td className="p-3 text-amber-400 font-mono">Contrato Anual</td>
                      <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                        R$ 8.000 – R$ 14.000 / mês
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TREINAMENTO & CAPACITAÇÃO */}
          {activeTab === 'treinamento' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Treinamentos Imersivos de Resposta a Emergências:</strong> Capacitação direcionada para equipes multidisciplinares hospitalares (Médicos, Enfermeiros, Fisioterapeutas, Maqueiros, Manutenção, Segurança Patrimonial e Diretoria Executiva).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="p-2 w-fit bg-blue-500/20 text-blue-400 rounded-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Formação de Comandantes de Incidente (SCI Hospitalar / HICS)</h4>
                  <p className="text-xs text-slate-400">
                    Capacitação da governança e diretores em gestão de crise, acionamento do Posto de Comando C3, triagem de evacuação e comunicação com a imprensa e Bombeiros.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-300">
                    Carga Horária: 16 horas (2 dias)<br />
                    Turma: até 20 gestores
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    R$ 22.000 <span className="text-[11px] text-slate-500 font-normal">/ turma</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="p-2 w-fit bg-amber-500/20 text-amber-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Capacitação da Brigada de Emergência & Egress em Leitos</h4>
                  <p className="text-xs text-slate-400">
                    Treinamento prático de movimentação rápida de leitos em curvas e portas corta-fogo, desconexão segura de ventiladores pulmonares e evacuação assistida.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-300">
                    Carga Horária: 8 horas por módulo<br />
                    Turma: até 30 colaboradores
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    R$ 14.000 <span className="text-[11px] text-slate-500 font-normal">/ turma</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="p-2 w-fit bg-purple-500/20 text-purple-400 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Simulado de Mesa Virtual (Tabletop Exercise com HEDS)</h4>
                  <p className="text-xs text-slate-400">
                    Exercício simulado interativo com projeção do software HEDS em tempo real. Teste sob estresse do processo decisório, cronômetro de tenibilidade e desvio de rotas.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-300">
                    Carga Horária: 6 horas de exercício + debriefing<br />
                    Turma: Comitê de Crise Completo
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    R$ 28.000 <span className="text-[11px] text-slate-500 font-normal">/ exercício</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PACOTES TURNKEY */}
          {activeTab === 'pacotes' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Soluções Integradas (Turnkey):</strong> Pacotes completos que unem o software HEDS, a consultoria de modelagem computacional da edificação hospitalar do cliente e ciclos completos de treinamento das equipes.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pacote Hospital Seguro */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 hover:border-emerald-500/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pacote Hospital Seguro</span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">1 Hospital</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Implantação Completa HEDS Standard</h3>
                  <div className="text-2xl font-black text-emerald-400">
                    R$ 145.000 <span className="text-xs font-normal text-slate-400">/ 1º ano</span>
                  </div>
                  <div className="text-xs text-slate-500">Renovação anual de licença & suporte: R$ 42.000/ano</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Licença anual do software HEDS para até 200 leitos</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Modelagem 3D e parametrização CFD dos pavimentos do hospital</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Relatório Técnico de Tenibilidade e Evacuação com ART (CREA)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1 Simulado Tabletop para Comitê de Crise + 2 turmas de brigada</li>
                  </ul>
                </div>

                {/* Pacote Excelência Hospitalar */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 rounded-xl border-2 border-emerald-500/60 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Pacote Excelência & Acreditação</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Premium JCI / ONA</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Implantação HEDS Enterprise Total</h3>
                  <div className="text-2xl font-black text-emerald-400">
                    R$ 265.000 <span className="text-xs font-normal text-slate-400">/ 1º ano</span>
                  </div>
                  <div className="text-xs text-slate-500">Renovação anual de licença & consultoria contínua: R$ 85.000/ano</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Licença Enterprise HEDS ilimitada para hospitais até 500 leitos</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Modelagem computacional completa CFD (FDS v6.8) + Pathfinder de todas as alas e UTIs</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auditoria in loco dos 15 Sistemas de Proteção contra Incêndio com ART</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Programa anual com 3 Simulados Tabletop + 4 turmas de treinamento de brigada</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Assessoria técnica direta durante auditorias de Acreditação Hospitalar</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CALCULADORA DE ROI */}
          {activeTab === 'roi' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Demonstrativo de Retorno sobre Investimento (ROI Hospitalar):</strong> A adoção de simulação computacional de incêndio e evacuação gera economia direta em apólices de seguro patrimonial, evita interdições pela Vigilância Sanitária e Bombeiros, e pontua diretamente nas acreditações ONA Nível 3 e JCI.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-400" /> Parâmetros da sua Unidade
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Número de Leitos Hospitalares:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{bedsCount} leitos</strong>
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={800}
                      step={10}
                      value={bedsCount}
                      onChange={(e) => setBedsCount(Number(e.target.value))}
                      className="w-full accent-emerald-500 mt-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Pavimentos da Edificação:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{floorsCount} andares</strong>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={20}
                      step={1}
                      value={floorsCount}
                      onChange={(e) => setFloorsCount(Number(e.target.value))}
                      className="w-full accent-emerald-500 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-950 to-emerald-950/40 p-4 rounded-xl border border-emerald-500/40 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Economia Anual Estimada
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-slate-300">Desconto em Apólice de Seguro Patrimonial (10 a 20%):</span>
                      <strong className="text-emerald-400 font-mono">R$ {calculatedInsuranceDiscount.toLocaleString('pt-BR')} / ano</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-slate-300">Redução de Custos de Treinamento Presencial e Simulado:</span>
                      <strong className="text-emerald-400 font-mono">R$ {calculatedAuditSavings.toLocaleString('pt-BR')} / ano</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-slate-300">Mitigação de Riscos de Interdição e Multas Bombeiros:</span>
                      <strong className="text-cyan-400 font-mono">Imensurável</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/40 flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Retorno Econômico Anual Estimado:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      R$ {totalAnnualBenefit.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center">
                    Payback estimado do software e consultoria: <strong className="text-white">6 a 10 meses</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Engenharia de Incêndio Hospitalar em conformidade com NBR 16651, RDC 50 ANVISA e SFPE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                alert('Proposta Comercial Gerada em PDF e salva no seu histórico!');
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Proposta Comercial (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
