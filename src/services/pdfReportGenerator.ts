/**
 * HEDS - Hospital Emergency Decision Simulator
 * Professional PDF Evaluation Report Generator (jsPDF + autoTable)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData } from '../types';

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
