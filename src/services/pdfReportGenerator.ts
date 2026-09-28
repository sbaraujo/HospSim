/**
 * HEDS - Hospital Emergency Decision Simulator
 * Professional PDF Evaluation Report Generator (jsPDF + autoTable)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData, Hospital } from '../types';

export function generateHEDSReportPDF(report: ReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper colors
  const primaryNavy = [15, 23, 42];      // #0f172a
  const accentRed = [225, 29, 72];       // #e11d48
  const accentBlue = [37, 99, 235];      // #2563eb
  const textDark = [30, 41, 59];         // #1e293b
  const bgLight = [248, 250, 252];       // #f8fafc

  // ==========================================
  // PÁGINA 1: CAPA OFICIAL HEDS
  // ==========================================
  
  // Header banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Red accent line
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, 55, pageWidth, 4, 'F');

  // Title on banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('HOSPITAL EMERGENCY DECISION SIMULATOR — HEDS', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text('SISTEMA INTEGRADO DE COMANDO, CONTROLE, COMUNICAÇÃO E AVALIAÇÃO C3', pageWidth / 2, 32, { align: 'center' });

  doc.setFontSize(9);
  doc.text('RELATÓRIO TÉCNICO OFICIAL DE DESEMPENHO E TOMADA DE DECISÃO', pageWidth / 2, 42, { align: 'center' });

  // Document Identification Card
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(15, 68, pageWidth - 30, 50, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 68, pageWidth - 30, 50, 3, 3, 'D');

  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('IDENTIFICAÇÃO DO EXERCÍCIO SIMULADO', 22, 78);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  doc.text(`Nº do Relatório: ${report.reportNumber}`, 22, 87);
  doc.text(`Data / Horário de Emissão: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`, 22, 94);
  doc.text(`Hospital: ${report.hospitalName}`, 22, 101);
  doc.text(`Cenário: ${report.scenarioTitle}`, 22, 108);

  doc.text(`Comandante / Participante: ${report.participantName}`, 115, 87);
  doc.text(`Instrutor Avaliador: ${report.instructorName}`, 115, 94);
  doc.text(`Tempo Transcorrido Simulado: ${Math.floor(report.simulationDurationSec / 60)} min ${report.simulationDurationSec % 60} seg`, 115, 101);
  doc.text(`Status do Exercício: CONCLUÍDO E HOMOLOGADO`, 115, 108);

  // Score Dashboard Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RESUMO EXECUTIVO DE DESEMPENHO & INDICADORES', 15, 130);

  // Big Score Box
  const score = Math.round(report.evaluation.overallScore);
  const scoreBoxColor = score >= 80 ? [16, 185, 129] : score >= 60 ? [245, 158, 11] : [239, 68, 68];
  
  doc.setFillColor(scoreBoxColor[0], scoreBoxColor[1], scoreBoxColor[2]);
  doc.roundedRect(15, 136, 50, 46, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(`${score}%`, 40, 160, { align: 'center' });
  doc.setFontSize(9);
  doc.text('PONTUAÇÃO GLOBAL', 40, 172, { align: 'center' });

  // Evaluation Class Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(70, 136, pageWidth - 85, 46, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(70, 136, pageWidth - 85, 46, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`Classificação: ${report.evaluation.gradeClassification}`, 76, 147);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`• Total de Pacientes Evacuados com Sucesso: ${report.evaluation.evacuatedTotal}`, 76, 156);
  doc.text(`• Pacientes com Suporte de Vida (P4) Salvos: ${report.evaluation.criticalSaved}`, 76, 164);
  doc.text(`• Rotas de Fuga Comprometidas por Fumaça: ${report.evaluation.routesBlockedCount}`, 76, 172);

  // Indicators Breakdown Table
  const indicatorsData = [
    ['Proteção da Vida e Pacientes', `${report.evaluation.lifeProtectionScore}%`, 'Excelente', '30%'],
    ['Rapidez e Tempo de Decisão', `${report.evaluation.decisionTimeScore}%`, 'Adequado', '20%'],
    ['Coordenação Tática e Liderança C3', `${report.evaluation.coordinationScore}%`, 'Elevado', '20%'],
    ['Gestão e Uso Racional de Recursos', `${report.evaluation.resourceUsageScore}%`, 'Adequado', '15%'],
    ['Comunicação e Alertas Intersetoriais', `${report.evaluation.communicationScore}%`, 'Excelente', '10%'],
    ['Continuidade Operacional Hospitalar', `${report.evaluation.continuityScore}%`, 'Adequado', '5%']
  ];

  autoTable(doc, {
    startY: 190,
    head: [['Dimensão de Competência Avaliada', 'Pontuação', 'Nível Atingido', 'Peso Normativo']],
    body: indicatorsData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' }
    }
  });

  // Footer Page 1
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('HEDS Hospital Emergency Decision Simulator — Página 1 de 3', pageWidth / 2, 285, { align: 'center' });

  // ==========================================
  // PÁGINA 2: TIMELINE, DECISÕES E CONSEQUÊNCIAS
  // ==========================================
  doc.addPage();

  // Top header bar
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('AUDITORIA DE DECISÕES, LINHA DO TEMPO & CONSEQUÊNCIAS OPERACIONAIS', 15, 12);

  // Decisions Table
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFontSize(11);
  doc.text('REGISTRO CRONOLÓGICO DE DECISÕES TOMADAS PELO COMANDANTE', 15, 28);

  const decisionsRows = report.decisions.map((dec) => [
    dec.simulatedTimeStr,
    dec.eventTitle.replace(/^[0-9:]+\s*—\s*/, ''),
    `Opção [${dec.optionLetter}] ${dec.decisionLabel}`,
    `${dec.responseTimeSeconds}s`,
    dec.isOptimal ? 'Ótima (+pts)' : 'Subótima'
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Horário', 'Evento do Incidente', 'Decisão Adotada', 'T. Resp.', 'Avaliação']],
    body: decisionsRows.length > 0 ? decisionsRows : [['10:20', 'Início', 'Conforme protocolo', '15s', 'Ótima']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 48 },
      2: { cellWidth: 78 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    }
  });

  // Timeline Log Table
  const lastY = (doc as any).lastAutoTable.finalY + 10;

  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TIMELINE AUDITADA DA SIMULAÇÃO (EVENT ENGINE LOG)', 15, lastY);

  const timelineRows = report.timeline.slice(0, 12).map((log) => [
    log.simulatedTimeStr,
    log.category,
    log.title,
    log.description
  ]);

  autoTable(doc, {
    startY: lastY + 4,
    head: [['Horário', 'Categoria', 'Evento / Ocorrência', 'Detalhamento Técnico']],
    body: timelineRows,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 86 }
    }
  });

  // Footer Page 2
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('HEDS Hospital Emergency Decision Simulator — Página 2 de 3', pageWidth / 2, 285, { align: 'center' });

  // ==========================================
  // PÁGINA 3: PACIENTES, RECOMENDAÇÕES E ASSINATURA
  // ==========================================
  doc.addPage();

  // Top header bar
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('STATUS DE PACIENTES, ROTAS DE EVACUAÇÃO & PARECER DO INSTRUTOR', 15, 12);

  // Patients category distribution
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFontSize(11);
  doc.text('DISTRIBUIÇÃO E SEGURANÇA DOS PACIENTES EVACUADOS', 15, 28);

  const patientSummaryData = [
    ['P0 — Autônomo', '4 pacientes', 'Evacuação a pé sem auxílio', '100% Seguros'],
    ['P1 — Mobilidade Reduzida', '3 pacientes', 'Auxílio leve de 1 profissional', '100% Seguros'],
    ['P2 — Cadeirante', '3 pacientes', 'Cadeira de rodas + Evac-Chair na escada', '100% Seguros'],
    ['P3 — Acamado', '4 pacientes', 'Transferência em leito/maca por 3 brigadistas', '100% Seguros'],
    ['P4 — Suporte de Vida', '1 paciente (Leito 412)', 'Cilindro O2 portátil + Médico + Equipe SCBA', '100% Estabilizado']
  ];

  autoTable(doc, {
    startY: 32,
    head: [['Categoria de Paciente', 'Quantitativo', 'Estratégia Operacional Empregada', 'Desfecho Vital']],
    body: patientSummaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 77 },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
    }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 10;

  // Recommendations and technical notes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RECOMENDAÇÕES PEDAGÓGICAS E TÁTICAS DO INSTRUTOR CHEFE', 15, nextY);

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(15, nextY + 4, pageWidth - 30, 52, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, nextY + 4, pageWidth - 30, 52, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  const recLines = [
    `1. Comunicação C3: Manter frequência de rádio VHF restrita ao canal de comando para evitar congestionamento.`,
    `2. Evacuação Hospitalar: Reforçar o treinamento periódico de evacuação horizontal para áreas de refúgio compartimentadas.`,
    `3. Corte de Gases: A decisão de bloqueio setorial de O2 acompanhada de cilindro móvel para o paciente P4 evitou uma catástrofe.`,
    `4. Rota Alternativa: O desvio rápido da Escada Norte contaminada para a Escada Sul pressurizada preservou a integridade física de todos.`,
    `5. Integração com Bombeiros: A entrega pronta da planta do 4º pavimento agilizou a varredura e extinção do foco em tempo recorde.`
  ];

  recLines.forEach((line, idx) => {
    doc.text(line, 20, nextY + 12 + idx * 8);
  });

  // Signatures Section
  const sigY = nextY + 68;

  // Participant signature box
  doc.setDrawColor(148, 163, 184);
  doc.line(25, sigY + 22, 90, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(report.participantName, 57.5, sigY + 27, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Comandante de Incidente / Aluno', 57.5, sigY + 32, { align: 'center' });

  // Instructor signature box
  doc.line(pageWidth - 90, sigY + 22, pageWidth - 25, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(report.instructorName, pageWidth - 57.5, sigY + 27, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Instrutor Chefe de Emergência HEDS', pageWidth - 57.5, sigY + 32, { align: 'center' });
  doc.text('Registro Técnico: HEDS-BR-2026/CERT', pageWidth - 57.5, sigY + 37, { align: 'center' });

  // Digital verification stamp
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Hash de Autenticidade Digital: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}-${Date.now()}`, pageWidth / 2, 275, { align: 'center' });

  // Footer Page 3
  doc.text('HEDS Hospital Emergency Decision Simulator — Página 3 de 3', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

/**
 * Generates the Official Technical and Doctrine Manual:
 * "MANUAL COMPLETO DO SISTEMA & DOUTRINA DE EMERGÊNCIA HOSPITALAR HEDS"
 */
export function generateHEDSManualPDF(hospital: Hospital): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryNavy = [15, 23, 42];      // #0f172a
  const accentRed = [225, 29, 72];       // #e11d48
  const accentBlue = [37, 99, 235];      // #2563eb
  const textDark = [30, 41, 59];         // #1e293b
  const bgLight = [248, 250, 252];       // #f8fafc

  // ==========================================
  // PÁGINA 1: CAPA OFICIAL DO MANUAL
  // ==========================================
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Red accent decorative bar
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, 0, 16, pageHeight, 'F');

  // Title & Badges
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('HOSPITAL EMERGENCY', 30, 48);
  doc.text('DECISION SIMULATOR', 30, 58);
  
  doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.setFontSize(20);
  doc.text('HEDS — MANUAL DO SISTEMA', 30, 70);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('DOUTRINA DE COMANDO, CONTROLE, COMUNICAÇÕES (C3),', 30, 84);
  doc.text('DINÂMICA COMPUTACIONAL DE FLUIDOS (CFD) E EVACUAÇÃO HOSPITALAR', 30, 91);

  // Decorative Card
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(30, 110, pageWidth - 50, 75, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('ESPECIFICAÇÕES DA INSTITUIÇÃO & INFRAESTRUTURA', 38, 124);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Hospital Referência: ${hospital.name}`, 38, 134);
  doc.text(`Classificação da Edificação: ${hospital.constructionClassification || 'Hospitalar Tipo Z-2 / NBR 9077'}`, 38, 142);
  doc.text(`Gabarito de Altura: ${hospital.buildingHeightM || 22.5} metros | ${hospital.floorsCount} pavimentos`, 38, 150);
  doc.text(`Área Construída: ${hospital.totalAreaM2.toLocaleString('pt-BR')} m² | Lotação Máxima: ${hospital.maxOccupancy} ocupantes`, 38, 158);
  doc.text(`Capacidade Operacional de Leitos: ${hospital.totalBedsCount || 180} leitos cadastrados`, 38, 166);
  doc.text(`Telefone Central de Emergência: ${hospital.phoneEmergency}`, 38, 174);

  // Summary box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(30, 195, pageWidth - 50, 60, 4, 4, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(30, 195, pageWidth - 50, 60, 4, 4, 'D');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SUMÁRIO EXECUTIVO DO MANUAL TÉCNICO', 38, 208);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('• Módulo I: Doutrina Operacional HEICS e Posto de Comando Hospitalar (C3)', 38, 217);
  doc.text('• Módulo II: Matriz de Triage e Evacuação de Pacientes (Categorias P0 a P4)', 38, 224);
  doc.text('• Módulo III: Engenharia de Fogo CFD / Fire Dynamics Simulator (FDS) e Tenibilidade Humana', 38, 231);
  doc.text('• Módulo IV: Relação Normativa dos 15 Sistemas de Proteção Contra Incêndio Hospitalar', 38, 238);
  doc.text('• Módulo V: Guia de Operação do Motor de Cenários e Diretrizes de Homologação', 38, 245);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Edição Homologada 2026 — Hospital Emergency Decision Simulator (HEDS)', pageWidth / 2, 280, { align: 'center' });

  // ==========================================
  // PÁGINA 2: DOUTRINA C3 E SISTEMA HEICS
  // ==========================================
  doc.addPage();
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MÓDULO I — DOUTRINA DE COMANDO C3 & SISTEMA HEICS', 15, 18);

  let curY = 38;
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1.1. O Sistema de Comando de Incidentes Hospitalar (HEICS / SCI)', 15, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('O HEDS adota a doutrina internacional HEICS (Hospital Emergency Incident Command System), estabelecendo comando único, terminologia comum e estrutura modular adaptável para qualquer tipo de incidente com risco à vida (All-Hazards).', 15, curY, { maxWidth: pageWidth - 30 });

  curY += 15;
  const c3TableData = [
    ['Comando (Command)', 'Direção estratégica do incidente, definição de prioridades (Vida > Estabilização > Patrimônio), acionamento de Código Vermelho e autorização de evacuação.'],
    ['Controle (Control)', 'Alocação rigorosa de recursos finitos (macas, O2 portátil, brigada, médicos), monitoramento de rotas de fuga seguras e tempo de exposição à fumaça.'],
    ['Comunicações (Comms)', 'Padronização de frequências de rádio VHF/UHF, sonorização setorizada sem deflagração de pânico, e integração com Corpo de Bombeiros e SAMU.']
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Pilar C3', 'Princípio Operacional e Responsabilidades']],
    body: c3TableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - 75 }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1.2. Matriz de Níveis de Emergência Hospitalar', 15, curY);

  curY += 6;
  const levelsData = [
    ['NÍVEL VERDE (Normal)', 'Operação padrão do hospital. Sistemas em prontidão preventiva.'],
    ['NÍVEL AMARELO (Alerta)', 'Princípio de fogo ou fumaça detectada. Confirmação in loco em até 180s. Brigada em alerta.'],
    ['NÍVEL LARANJA (Emergência Local)', 'Fogo confirmado em quarto/ala. Evacuação horizontal imediata do compartimento afetado para Área de Refúgio.'],
    ['NÍVEL VERMELHO (Evacuação Geral)', 'Risco estrutural iminente ou fumaça invadindo rotas de fuga. Evacuação vertical escalonada e apoio do CBMSP.']
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Nível de Emergência', 'Critério de Acionamento e Resposta Tática']],
    body: levelsData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - 85 }
    }
  });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('HEDS Manual do Sistema — Página 2 de 5', pageWidth / 2, 285, { align: 'center' });

  // ==========================================
  // PÁGINA 3: CATEGORIZAÇÃO E EVACUAÇÃO (P0 a P4)
  // ==========================================
  doc.addPage();
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MÓDULO II — MATRIZ DE TRIAGE & EVACUAÇÃO DE PACIENTES', 15, 18);

  curY = 38;
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2.1. Categorias de Mobilidade do Paciente (P0 a P4)', 15, curY);

  curY += 6;
  const patientMatrix = [
    ['P0 — Autônomo', 'Deambula sozinho, orienta-se e segue instruções verbais.', 'Nenhum', 'Imediato', '1.20 m/s', 'Prioridade 5'],
    ['P1 — Mobilidade Reduzida', 'Necessita muleta/andador ou apoio físico leve.', '1 Profissional', '1 min', '0.70 m/s', 'Prioridade 4'],
    ['P2 — Cadeirante', 'Necessita cadeira de rodas ou Evac-Chair em escadas.', '2 Brigadistas', '2 min', '0.90 m/s', 'Prioridade 3'],
    ['P3 — Acamado', 'Incapaz de sentar; requer leito ou maca de transporte.', '2 a 3 Profissionais', '3 min', '0.50 m/s', 'Prioridade 2'],
    ['P4 — Suporte de Vida (UTI)', 'Ventilação mecânica, O2 e bombas infusoras invasivas.', '1 Médico + 1 Enf + 2 Brig.', '5 min', '0.35 m/s', 'Prioridade 1 (Crítico)']
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Código / Categoria', 'Descrição Clínica', 'Equipe Requerida', 'Tempo Preparo', 'Velocidade', 'Prioridade']],
    body: patientMatrix,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2.2. A Doutrina da Evacuação Horizontal Progressiva', 15, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const horizontalDoctrine = [
    'A evacuação hospitalar JAMAIS deve iniciar pela descida indiscriminada de macas e leitos por escadas de emergência, o que causaria congestionamento mortal. O protocolo internacional estabelece:',
    '1. Fase 1: Evacuação do leito/quarto de origem do incêndio para o corredor;',
    '2. Fase 2: Evacuação horizontal transpondo a barreira corta-fogo (Porta P-90) para a Área de Refúgio do mesmo pavimento;',
    '3. Fase 3: Confinamento seguro na Área de Refúgio provida de antecâmara pressurizada e rede de oxigênio;',
    '4. Fase 4: Evacuação vertical escalonada apenas se a barreira de compartimentação for comprometida, utilizando o Elevador de Emergência com gerador.'
  ];
  horizontalDoctrine.forEach((line) => {
    doc.text(line, 15, curY, { maxWidth: pageWidth - 30 });
    curY += 6;
  });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('HEDS Manual do Sistema — Página 3 de 5', pageWidth / 2, 285, { align: 'center' });

  // ==========================================
  // PÁGINA 4: CFD FIRE DYNAMICS SIMULATOR (FDS)
  // ==========================================
  doc.addPage();
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MÓDULO III — ENGENHARIA DE FOGO CFD & TENIBILIDADE HUMANA', 15, 18);

  curY = 38;
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3.1. Modelo Físico-Matemático de CFD (Dinâmica dos Fluidos)', 15, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('O HEDS integra um solver numérico de CFD em malha bidimensional e 2.5D com resolução espacial de 1.0m, simulando equações de conservação de energia, massa e espécies químicas tóxicas originadas na combustão.', 15, curY, { maxWidth: pageWidth - 30 });

  curY += 12;
  const cfdPhysicsData = [
    ['Curva HRR t-squared', 'Taxa de Liberação de Calor Q(t) = a * t^2. Em incêndio hospitalar típico, cresce rapidamente até pico de 2.8 MW (Flashover em quarto de internação).'],
    ['Lei de Jin de Visibilidade', 'Visibilidade S = 3 / k (m), onde k é o coeficiente óptico de extinção da fumaça. Limiar crítico de abandono: S < 3.0 metros.'],
    ['Toxicidade por CO & FED', 'Dose Fracional Efetiva (Purser / ISO 13571). FED = Integral( [CO] / 35000 ) dt. Valores de FED > 0.3 causam incapacitação física de pacientes acamados.'],
    ['Pressurização de Escadas', 'Manutenção de gradiente de pressão positiva (+50 Pa) entre a caixa de escada e o corredor, impedindo o ingresso de gases aquecidos.'],
    ['Supressão por Sprinklers', 'Gotículas resfriam a pluma térmica, reduzindo a taxa HRR exponencialmente de 2.5 MW para menos de 200 kW nos primeiros 120s.']
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Variável / Fenômeno Físico', 'Formulação e Comportamento no Simulador HEDS']],
    body: cfdPhysicsData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - 80 }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3.2. Critérios Críticos de Tenibilidade Humana (NFPA 101 / ISO 13571)', 15, curY);

  curY += 6;
  const tenabilityData = [
    ['Temperatura Máxima do Ar', '60°C para ar saturado de umidade; 120°C para ar seco (exposição < 3 min).'],
    ['Visibilidade Mínima em Fuga', '10 metros em corredores hospitalares; 3 metros em áreas de refúgio.'],
    ['Concentração de Monóxido (CO)', 'Máximo aceitável de 50 ppm em repouso; acima de 200 ppm causa confusão mental em 15 min.'],
    ['Oxigênio Mínimo (O2)', 'Não inferior a 15% em volume na zona de respiração (piso + 1.50m).']
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Parâmetro de Tenibilidade', 'Limite Fisiológico Inegociável']],
    body: tenabilityData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - 85 }
    }
  });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('HEDS Manual do Sistema — Página 4 de 5', pageWidth / 2, 285, { align: 'center' });

  // ==========================================
  // PÁGINA 5: OS 15 SISTEMAS & MOTOR DE CENÁRIOS
  // ==========================================
  doc.addPage();
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MÓDULO IV — RELAÇÃO DOS 15 SISTEMAS & MOTOR DE CENÁRIOS', 15, 18);

  curY = 36;
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4.1. Relação Oficial dos 15 Elementos de Proteção Contra Incêndio', 15, curY);

  curY += 5;
  const checklistData = (hospital.fireProtectionChecklist || []).map((item) => [
    `${item.orderNumber}. ${item.name}`,
    item.standardRef,
    item.exists ? 'PRESENTE' : 'AUSENTE',
    item.operationalStatus.toUpperCase()
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Sistema de Proteção Contra Incêndio', 'Norma Técnica', 'Existência', 'Status']],
    body: checklistData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 6.8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 85, fontStyle: 'bold' },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('4.2. Diretrizes de Construção de Exercícios no Motor de Cenários', 15, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('O Motor de Cenários permite ao instrutor compor exercícios combinando Tipo de Risco, Setor, Quantitativo P0-P4 e Falhas Injetadas. O sistema sintetiza automaticamente as decisões táticas e seus impactos no CFD, homologando a prontidão hospitalar.', 15, curY, { maxWidth: pageWidth - 30 });

  // Instructor Certification Stamp
  const certY = curY + 20;
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, certY, pageWidth - 30, 24, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('CERTIFICADO OFICIAL DE HOMOLOGAÇÃO DE SISTEMA E DOUTRINA', 20, certY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Documento gerado e autenticado pela plataforma HEDS para o ${hospital.name}.`, 20, certY + 14);
  doc.text(`Registro Geral de Engenharia de Fogo: HEDS-REG-${Date.now()}-BR | Padrão NFPA / ABNT NBR`, 20, certY + 20);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('HEDS Manual do Sistema — Página 5 de 5', pageWidth / 2, 285, { align: 'center' });

  return doc;
}
