/**
 * HEDS - Hospital Emergency Decision Simulator
 * Manual Técnico, Clínico e Operacional Completo do Sistema (50 Páginas Oficiais)
 * 
 * Estrutura: 10 Volumes Temáticos, 50 Capítulos Detalhados
 * Referências: ABNT NBR 16651, RDC 50 ANVISA, ITs do Corpo de Bombeiros Militar,
 * NIST FDS v6.8, Thunderhead PyroSim & Pathfinder, SFPE Handbook, NFPA 99/101, ISO 13571.
 */

export interface ManualPage {
  pageNumber: number;
  volumeId: number;
  volumeTitle: string;
  chapterTitle: string;
  subtitle: string;
  readingTimeMin: number;
  diagramType:
    | 'cover_page'
    | 'isometric_hospital'
    | 'offline_sync_arch'
    | 'c3_command_flow'
    | 'protection_checklist'
    | 'fire_door_sealing'
    | 'thermal_stratification'
    | 'flame_combustion_zones'
    | 'smoke_optical_jin'
    | 'probes_3d_instrumentation'
    | 'evacuation_flow_density'
    | 'bed_vs_wheelchair'
    | 'pre_movement_timeline'
    | 'patient_triage_matrix'
    | 'horizontal_evacuation_phases'
    | 'refuge_area_positive_pressure'
    | 'hics_incident_command'
    | 'decision_game_branching'
    | 'threejs_lod_pipeline'
    | 'regulatory_audit_table'
    | 'operational_checklist';
  diagramCaption: string;
  sections: {
    heading: string;
    paragraphs: string[];
    bulletPoints?: string[];
    formula?: string;
    table?: {
      headers: string[];
      rows: string[][];
    };
    alertBox?: {
      type: 'critical' | 'regulatory' | 'clinical' | 'technical';
      title: string;
      text: string;
    };
  }[];
  normativeReferences: string[];
}

export const MANUAL_VOLUMES = [
  { id: 1, title: 'Volume I: Fundamentos, Doutrina & Arquitetura Geral', pagesRange: 'Páginas 01 a 05' },
  { id: 2, title: 'Volume II: Engenharia de Segurança & os 15 Sistemas de Proteção', pagesRange: 'Páginas 06 a 10' },
  { id: 3, title: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS', pagesRange: 'Páginas 11 a 16' },
  { id: 4, title: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder', pagesRange: 'Páginas 17 a 22' },
  { id: 5, title: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)', pagesRange: 'Páginas 23 a 28' },
  { id: 6, title: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)', pagesRange: 'Páginas 29 a 34' },
  { id: 7, title: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game', pagesRange: 'Páginas 35 a 40' },
  { id: 8, title: 'Volume VIII: Motor Gráfico 3D, InstancedMesh & Otimização 60 FPS', pagesRange: 'Páginas 41 a 44' },
  { id: 9, title: 'Volume IX: Auditoria, Homologação Técnica & Emissão de Relatórios', pagesRange: 'Páginas 45 a 47' },
  { id: 10, title: 'Volume X: Guia de Operação, Simulação de Mesa & FAQ Técnico', pagesRange: 'Páginas 48 a 50' }
];

// Complete 50 Pages Dataset
export const SYSTEM_MANUAL_50_PAGES: ManualPage[] = [
  // =========================================================================
  // VOLUME I: FUNDAMENTOS & ARQUITETURA GERAL (PÁGINAS 1 A 5)
  // =========================================================================
  {
    pageNumber: 1,
    volumeId: 1,
    volumeTitle: 'Volume I: Fundamentos, Doutrina & Arquitetura Geral',
    chapterTitle: 'Capa Oficial, Registro de Engenharia & Homologação',
    subtitle: 'Identificação formal do manual de engenharia e certificação regulatória do HEDS.',
    readingTimeMin: 3,
    diagramType: 'cover_page',
    diagramCaption: 'Insignia Oficial HEDS e Registro de Propriedade Intelectual em Engenharia Hospitalar.',
    sections: [
      {
        heading: '1.1. Identificação Oficial do Sistema',
        paragraphs: [
          'O Hospital Emergency Decision Simulator (HEDS) é uma plataforma computacional avançada de simulação de catástrofes, engenharia de segurança contra incêndio e tomada de decisão clínica-operacional para estabelecimentos assistenciais de saúde (EAS - Grupo H-3).',
          'Desenvolvido para atender às rigorosas exigências da ABNT NBR 16651 (Proteção contra incêndios em estabelecimentos assistenciais de saúde), da RDC 50 da ANVISA e das Instruções Técnicas dos Corpos de Bombeiros Militares do Brasil, o sistema unifica em uma única interface a Dinâmica dos Fluidos Computacional (CFD), a Modelagem de Agentes Autônomos de Evacuação (Egress Modeling) e o Sistema de Comando de Incidentes Hospitalar (HICS / SCI).'
        ],
        bulletPoints: [
          'Plataforma: HEDS Simulator v4.5 Enterprise Hospital Edition',
          'Homologação de Fogo: Calibrado com NIST Fire Dynamics Simulator (FDS v6.8.0)',
          'Homologação de Evacuação: Algoritmos de Densidade e Vazão baseados no Pathfinder',
          'Acreditações Atendidas: ONA (Organização Nacional de Acreditação), JCI (Joint Commission International) e Qmentum Global'
        ],
        alertBox: {
          type: 'regulatory',
          title: 'Documento Técnico Oficial',
          text: 'Este manual constitui o documento descritivo oficial para fins de auditoria hospitalar, processos licitatórios públicos (SUS/EBSERH) e comprovação de conformidade junto às seguradoras patrimoniais.'
        }
      }
    ],
    normativeReferences: ['ABNT NBR 16651:2019', 'RDC 50 ANVISA:2002', 'NFPA 99:2024', 'NFPA 101:2024']
  },
  {
    pageNumber: 2,
    volumeId: 1,
    volumeTitle: 'Volume I: Fundamentos, Doutrina & Arquitetura Geral',
    chapterTitle: 'Introdução, Missão Crítica & a Vulnerabilidade Hospitalar',
    subtitle: 'Por que hospitais são as edificações mais complexas e desafiadoras em segurança contra incêndio.',
    readingTimeMin: 4,
    diagramType: 'isometric_hospital',
    diagramCaption: 'Representação Isométrica Tridimensional do Complexo Hospitalar HEDS (Subsolo a 4º Andar).',
    sections: [
      {
        heading: '2.1. O Desafio Singular das Edificações de Saúde',
        paragraphs: [
          'Diferente de edificações comerciais ou residenciais onde os ocupantes são autônomos e alertas, um hospital abriga indivíduos com severa restrição de mobilidade, pacientes sob sedação profunda, recém-nascidos em incubadoras e indivíduos dependentes de ventilação mecânica invasiva contínua.',
          'Em caso de incêndio, a interrupção abrupta do fornecimento de oxigênio ou o deslocamento inadequado de um paciente de UTI acarreta óbito imediato, independentemente da ação térmica das chamas. Portanto, a engenharia de segurança hospitalar rege-se pelo princípio da "Segurança no Próprio Local" (Defend-in-Place) e da "Evacuação Horizontal Progressiva".'
        ],
        bulletPoints: [
          'Taxa de ocupantes não-autônomos: Varia de 45% em enfermarias a 100% em UTIs e Centros Cirúrgicos.',
          'Carga de fogo concentrada: Gases medicinais oxidantes (O2, N2O), solventes laboratoriais e materiais plásticos sintéticos descartáveis.',
          'Tempo Disponível para Abandono Seguro (ASET) vs. Tempo Requerido (RSET): Gargalos severos em portas corta-fogo exigem compartimentação horizontal redundante.'
        ]
      }
    ],
    normativeReferences: ['SFPE Handbook of Fire Protection Engineering', 'IT-SP nº 32/2019']
  },
  {
    pageNumber: 3,
    volumeId: 1,
    volumeTitle: 'Volume I: Fundamentos, Doutrina & Arquitetura Geral',
    chapterTitle: 'Arquitetura de Software: Offline-First, PWA & IndexedDB',
    subtitle: 'Infraestrutura tecnológica resiliente para operação contínua mesmo sob colapso de redes.',
    readingTimeMin: 4,
    diagramType: 'offline_sync_arch',
    diagramCaption: 'Arquitetura em Camadas Offline-First com Cache Local IndexedDB e Sincronização em Nuvem.',
    sections: [
      {
        heading: '3.1. Filosofia de Resiliência Digital Extrema',
        paragraphs: [
          'Durante emergências severas com corte de energia predial ou interrupção de enlaces de internet, sistemas baseados exclusivamente em nuvem tradicional falham. O HEDS foi concebido com arquitetura Offline-First nativa, utilizando Progressive Web App (PWA) e banco de dados relacional IndexedDB no navegador do operador.',
          'Todas as tabelas de hospitais, pavimentos, ambientes, pacientes, equipes, inventário de recursos e matrizes de decisão são replicadas localmente no storage do dispositivo cliente. O Service Worker intercepta requisições e garante tempo de resposta inferior a 16 milissegundos.'
        ],
        table: {
          headers: ['Camada Tecnológica', 'Tecnologia Empregada', 'Função Crítica'],
          rows: [
            ['Frontend SPA', 'React 18 + TypeScript + Vite', 'Interface reativa de alto desempenho'],
            ['Renderizador 3D', 'Three.js (WebGL / WebGPU ready)', 'Visualização espacial com LOD e InstancedMesh'],
            ['Motor Físico CFD', 'CFDEngine (Solver em Volumes Finitos)', 'Propagação temporal de temperatura, fumaça e CO'],
            ['Persistência Local', 'IndexedDB (Dexie / Native API)', 'Armazenamento off-line autônomo sem latência'],
            ['Service Worker', 'Cache API (PWA Manifest)', 'Instalação nativa em tablets de comando tático']
          ]
        }
      }
    ],
    normativeReferences: ['W3C Service Worker Specification', 'Indexed Database API 3.0']
  },
  {
    pageNumber: 4,
    volumeId: 1,
    volumeTitle: 'Volume I: Fundamentos, Doutrina & Arquitetura Geral',
    chapterTitle: 'A Doutrina Militar-Hospitalar C3 (Comando, Controle & Comunicação)',
    subtitle: 'Adaptação do conceito de Comando e Controle das Forças Armadas para Gestão de Catástrofes Hospitalares.',
    readingTimeMin: 5,
    diagramType: 'c3_command_flow',
    diagramCaption: 'Fluxograma da Doutrina de Comando C3 e Níveis de Alerta (Verde, Amarelo, Laranja e Vermelho).',
    sections: [
      {
        heading: '4.1. Fundamentos do Posto de Comando C3',
        paragraphs: [
          'A Doutrina C3 estrutura o processo decisório sob pressão eliminando a sobreposição de ordens e o "telefone sem fio" típico de desastres. O Comitê de Crise opera a partir de um Painel de Comando Unificado com consciência situacional em tempo real.',
          'Os quatro níveis de emergência escalonados pelo sistema:'
        ],
        bulletPoints: [
          'Verde (Normalidade): Monitoramento preventivo de sondas e rotinas de manutenção.',
          'Amarelo (Fase 1 - Alerta Setorial): Disparo de detecção precoce em área confinada; envio de brigadista para reconhecimento tático em até 90 segundos.',
          'Laranja (Fase 2 - Emergência Local / Evacuação Horizontal): Confirmação de chamas; início imediato de transposição de pacientes para a Área de Refúgio do mesmo pavimento.',
          'Vermelho (Fase 3 - Evacuação Geral Escalonada): Comprometimento da barreira corta-fogo; descida assistida e acionamento de plano de evacuação total com socorro externo.'
        ]
      }
    ],
    normativeReferences: ['FEMA Emergency Management Institute', 'MS/SUS Plano de Contingência']
  },
  {
    pageNumber: 5,
    volumeId: 1,
    volumeTitle: 'Volume I: Fundamentos, Doutrina & Arquitetura Geral',
    chapterTitle: 'Interface Homem-Máquina (IHM): Navegação, Layout & HUD',
    subtitle: 'Guia ergonômico de operação da barra superior, barra lateral e painéis de telemetria.',
    readingTimeMin: 3,
    diagramType: 'isometric_hospital',
    diagramCaption: 'Mapeamento das Regiões de Tela: TopBar, NavigationSidebar, ThreeHospitalViewer e RightPanel.',
    sections: [
      {
        heading: '5.1. Ergonomia e Fluxo Operacional',
        paragraphs: [
          'A interface do HEDS foi projetada seguindo as diretrizes militares de alta visibilidade em ambientes com iluminação degradada (Dark UI de alto contraste). As informações críticas de tenibilidade e cronômetro de ASET/RSET permanecem fixas na visão periférica do tomador de decisão.',
          'Principais componentes de navegação:'
        ],
        bulletPoints: [
          'Barra Superior (TopBar): Cronômetro simulado, nível de emergência ativo, botões de velocidade (1x, 2x, 5x) e atalhos de exportação PDF.',
          'Barra Lateral (NavigationSidebar): Acesso rápido aos 15 Sistemas de Proteção, FDS, Catálogo de Cenários, Gestão P0-P4 e Proposta Comercial.',
          'Visualizador Central (ThreeHospitalViewer): Modelo 3D com alternância para Planta 2D, seletor de pavimentos e visualização de streamlines CFD.',
          'Painel Direito (RightStatusPanel): Radar de conformidade em 5 eixos, timeline de eventos pendentes e telemetria de sondas.'
        ]
      }
    ],
    normativeReferences: ['ISO 9241-210 Ergonomia da Interação Humano-Sistema']
  },

  // =========================================================================
  // VOLUME II: ENGENHARIA DE SEGURANÇA & 15 SISTEMAS (PÁGINAS 6 A 10)
  // =========================================================================
  {
    pageNumber: 6,
    volumeId: 2,
    volumeTitle: 'Volume II: Engenharia de Segurança & os 15 Sistemas de Proteção',
    chapterTitle: 'Marco Regulatório: NBR 16651, RDC 50, ITs & NFPA',
    subtitle: 'Bases normativas federais, estaduais e internacionais que regem o simulador.',
    readingTimeMin: 5,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Cruzamento de Exigências Técnicas entre NBR 16651, RDC 50 ANVISA e NFPA 101.',
    sections: [
      {
        heading: '6.1. O Tripé Normativo da Segurança Contra Incêndio Hospitalar',
        paragraphs: [
          'A segurança contra incêndio hospitalar no Brasil estrutura-se em três pilares legais de cumprimento compulsório para obtenção de AVCB (Auto de Vistoria do Corpo de Bombeiros) e Alvará Sanitário:',
          '1. ABNT NBR 16651: Norma técnica específica que estabelece exigências de proteção ativa e passiva para edificações destinadas a estabelecimentos assistenciais de saúde.',
          '2. RDC 50 da ANVISA: Regulamento técnico para planejamento, programação, elaboração e avaliação de projetos físicos de estabelecimentos de saúde, definindo fluxos de isolamento e áreas de refúgio.',
          '3. Instruções Técnicas dos Corpos de Bombeiros (ex: IT-SP nº 32/2019 e equivalentes estaduais): Fixam parâmetros construtivos de saídas de emergência, pressurização de escadas e compartimentação.'
        ]
      }
    ],
    normativeReferences: ['ABNT NBR 16651:2019', 'RDC 50 ANVISA', 'Decreto Estadual 63.911/2018']
  },
  {
    pageNumber: 7,
    volumeId: 2,
    volumeTitle: 'Volume II: Engenharia de Segurança & os 15 Sistemas de Proteção',
    chapterTitle: 'Matriz dos 15 Sistemas: Proteção Passiva & Estrutural',
    subtitle: 'Sistemas 1 a 7: Compartimentação horizontal/vertical, selagem de shafts e portas P-90.',
    readingTimeMin: 5,
    diagramType: 'protection_checklist',
    diagramCaption: 'Diagrama Construtivo dos Sistemas Passivos 1 a 7 de Proteção Hospitalar.',
    sections: [
      {
        heading: '7.1. Detalhamento dos Sistemas Passivos',
        paragraphs: [
          'A proteção passiva é a primeira linha de defesa hospitalar, garantindo que o fogo e os gases permaneçam confinados no ambiente de origem sem intervenção humana ou mecânica:'
        ],
        table: {
          headers: ['Nº', 'Sistema de Proteção Passiva', 'Exigência Técnica Mínima', 'Impacto no Simulador HEDS'],
          rows: [
            ['01', 'Compartimentação Horizontal', 'Paredes corta-fogo TRRF 120 min dividindo pavimentos > 750m²', 'Cria barreiras impermeáveis à propagação de fumaça'],
            ['02', 'Compartimentação Vertical', 'Lajes e entrepisos TRRF 120 min + peitoris de 1.20m', 'Impede o efeito chaminé pelas fachadas e shafts'],
            ['03', 'Portas Corta-Fogo com Mola (P-90/P-60)', 'Fechamento automático sincronizado com central de alarme', 'Reduz em 95% o influxo de calor para a área de refúgio'],
            ['04', 'Selagem de Shafts e Passagens (Firestop)', 'Argamassas e colares intumescentes certificados UL/FM', 'Evita a propagação de chamas pelas instalações elétricas'],
            ['05', 'Dampers Corta-Fogo e Fumaça', 'Atuação pneumática/mecânica comandada por alarme', 'Bloqueia recirculação de fumaça pelo duto de ar-condicionado'],
            ['06', 'Áreas de Refúgio com Ante-câmara', 'Capacidade para 100% dos leitos da ala + 2.40m livre', 'Destino seguro primário da evacuação horizontal'],
            ['07', 'Acabamento e Revestimento (CMAR)', 'Classe I ou II-A (baixo índice de propagação e fumaça)', 'Evita flashover rápido em forros e carpetes hospitalares']
          ]
        }
      }
    ],
    normativeReferences: ['NBR 16651 Cláusulas 5.1 a 5.7', 'NBR 6479 (Resistência ao Fogo)']
  },
  {
    pageNumber: 8,
    volumeId: 2,
    volumeTitle: 'Volume II: Engenharia de Segurança & os 15 Sistemas de Proteção',
    chapterTitle: 'Matriz dos 15 Sistemas: Proteção Ativa, Detecção & Supressão',
    subtitle: 'Sistemas 8 a 15: Detecção precoce, sprinklers, controle de fumaça e pressurização.',
    readingTimeMin: 5,
    diagramType: 'protection_checklist',
    diagramCaption: 'Diagrama de Funcionamento dos Sistemas Ativos 8 a 15 de Combate e Extração.',
    sections: [
      {
        heading: '8.1. Detalhamento dos Sistemas Ativos',
        paragraphs: [
          'Os sistemas ativos detectam, alertam, controlam a fumaça e combatem as chamas automaticamente no início da combustão:'
        ],
        table: {
          headers: ['Nº', 'Sistema de Proteção Ativa', 'Exigência Técnica Mínima', 'Impacto no Simulador HEDS'],
          rows: [
            ['08', 'Detecção Óptica Endereçável de Fumaça', 'Tempo de resposta < 30s com laços classe A', 'Dispara o relógio de alarme e notifica o posto C3'],
            ['09', 'Alarme Sonoro/Visual Escalonado', 'Botoeiras + flashes silenciosos em UTI (evita pânico)', 'Aciona o alerta amarelo sem assustar pacientes graves'],
            ['10', 'Chuveiros Automáticos (Sprinklers)', 'Resposta Rápida (ESFR/Quick Response), bicos K-80/K-115', 'Reduz o HRR pico de 2.8 MW para menos de 200 kW'],
            ['11', 'Rede de Hidrantes e Mangotinhos', 'Vazão de 150 L/min na ponta do esguicho regulável', 'Armamento de linhas de ataque pela Brigada de Emergência'],
            ['12', 'Extintores Portáteis e Carretas', 'Água, Pó ABC e CO2 em quadro elétrico/tomografia', 'Combate a princípios de incêndio nos primeiros 60s'],
            ['13', 'Pressurização de Escadas (+50 Pa)', 'Dois ventiladores centrífugos com gerador de emergência', 'Garante rota vertical 100% livre de fumaça e monóxido'],
            ['14', 'Sistema de Controle de Fumaça (Exaustão)', 'Extração mecânica de 12 trocas/hora no corredor central', 'Eleva a camada de fumaça, preservando a visibilidade'],
            ['15', 'Grupo Gerador de Emergência Automático', 'Partida automática em < 12 segundos (Classe 15 NFPA 110)', 'Mantém ventiladores mecânicos, elevador e pressurização']
          ]
        }
      }
    ],
    normativeReferences: ['NBR 10897 (Sprinklers)', 'NBR 14880 (Pressurização de Escadas)', 'NFPA 110']
  },
  {
    pageNumber: 9,
    volumeId: 2,
    volumeTitle: 'Volume II: Engenharia de Segurança & os 15 Sistemas de Proteção',
    chapterTitle: 'Dinâmica de Selagem Corta-Fogo, Dampers & Falhas Críticas',
    subtitle: 'O perigo invisível da passagem de fumaça em furações de dutos de TI e tubulações de oxigênio.',
    readingTimeMin: 4,
    diagramType: 'fire_door_sealing',
    diagramCaption: 'Corte Esquemático de Barreira Corta-Fogo TRRF 120 min com Selagens e Damper em Duto.',
    sections: [
      {
        heading: '9.1. O Fenômeno da Propagação por Convecção Oculta',
        paragraphs: [
          'Estatísticas internacionais demonstram que em 70% das mortes por incêndio em hospitais, as vítimas encontravam-se em pavimentos diferentes do foco inicial. A fumaça fria e tóxica propaga-se por entreforros, shafts de dados e furações elétricas não seladas.',
          'No simulador HEDS, quando a opção "Falha de Selagem de Shaft" é ativada no Motor de Cenários, a fumaça salta imediatamente para o pavimento superior, reduzindo a visibilidade da UTI em menos de 180 segundos.'
        ]
      }
    ],
    normativeReferences: ['UL 1479 Standard for Fire Tests of Penetration Firestops']
  },
  {
    pageNumber: 10,
    volumeId: 2,
    volumeTitle: 'Volume II: Engenharia de Segurança & os 15 Sistemas de Proteção',
    chapterTitle: 'Auditoria Técnica de Conformidade, AVCB & ONA/JCI',
    subtitle: 'Como o HEDS atua como ferramenta pericial de auto-inspeção prévia para acreditação hospitalar.',
    readingTimeMin: 4,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Matriz de Pontuação e Conformidade Técnica do Simulador com Padrões ONA e JCI.',
    sections: [
      {
        heading: '10.1. A Vistoria Digital Integrada no HEDS',
        paragraphs: [
          'O modal "15 Sistemas de Proteção" permite ao gestor de infraestrutura hospitalar registrar o status real de cada elemento da planta (Presente, Ausente, Em Reforma, Testado, Não-Conforme).',
          'Ao exportar o Laudo de Conformidade Técnica em PDF, o sistema calcula o Índice de Vulnerabilidade Estrutural do Hospital, apontando diretamente as não-conformidades que gerariam indeferimento do AVCB ou perda de pontos na Acreditação ONA Nível 3 (Excelência).'
        ]
      }
    ],
    normativeReferences: ['Manual Brasileiro de Acreditação Hospitalar ONA:2024', 'JCI Hospital Standards 8th Ed.']
  },

  // =========================================================================
  // VOLUME III: MODELAGEM COMPUTACIONAL CFD & FDS v6.8 (PÁGINAS 11 A 16)
  // =========================================================================
  {
    pageNumber: 11,
    volumeId: 3,
    volumeTitle: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS',
    chapterTitle: 'Fundamentos do NIST Fire Dynamics Simulator (FDS v6.8)',
    subtitle: 'A integração matemática entre o motor numérico do NIST e a interface visual do HEDS.',
    readingTimeMin: 5,
    diagramType: 'thermal_stratification',
    diagramCaption: 'Perfil de Malha Numérica Bidimensional e 2.5D com Volumes de Controle FDS no HEDS.',
    sections: [
      {
        heading: '11.1. O Estado da Arte em Dinâmica dos Fluidos de Incêndio',
        paragraphs: [
          'O Fire Dynamics Simulator (FDS), desenvolvido pelo National Institute of Standards and Technology (NIST/EUA), é o código numérico padrão ouro mundial para modelagem computacional de incêndios.',
          'O HEDS incorpora um motor de ingestão e interpolação de dados físicos de alta resolução compatível com as saídas (.csv e .json) do FDS 6.8 e do software de engenharia PyroSim (Thunderhead Engineering), superando estimativas heurísticas simplórias e entregando física real calibrada por ensaios laboratoriais.'
        ]
      }
    ],
    normativeReferences: ['NIST Special Publication 1018: FDS Technical Reference Guide']
  },
  {
    pageNumber: 12,
    volumeId: 3,
    volumeTitle: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS',
    chapterTitle: 'Equações de Navier-Stokes, Pluma Térmica & Convecção',
    subtitle: 'Formulação física da convecção térmica ascendente e balanço hidrodinâmico.',
    readingTimeMin: 6,
    diagramType: 'flame_combustion_zones',
    diagramCaption: 'Diagrama Físico-Químico da Pluma de Chamas: Raiz Azul, Núcleo Plasma e Pluma Convectiva.',
    sections: [
      {
        heading: '12.1. O Modelo Matemático de Conservação',
        paragraphs: [
          'O comportamento dos gases é governado pelas equações de Navier-Stokes para escoamento turbulento com aproximação de baixo número de Mach, apropriada para convecção térmica gerada pelo fogo:',
          'A taxa de liberação de calor gera empuxo de empuxo hidrostático (Buoyancy Force) descrito por:'
        ],
        formula: 'F_b = (rho_inf - rho) * g',
        bulletPoints: [
          'rho_inf: Densidade do ar ambiente à temperatura ambiente (1.2 kg/m³ a 20°C)',
          'rho: Densidade dos gases quentes no interior da pluma (reduz para 0.4 kg/m³ a 500°C)',
          'g: Aceleração gravitacional local (9.81 m/s²)'
        ]
      }
    ],
    normativeReferences: ['Drysdale, D. An Introduction to Fire Dynamics, 3rd Edition']
  },
  {
    pageNumber: 13,
    volumeId: 3,
    volumeTitle: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS',
    chapterTitle: 'Estratificação Térmica Vertical & Descida da Camada Quente',
    subtitle: 'A formação do "Ceiling Jet" e o cálculo contínuo do diferencial de temperatura Delta-T.',
    readingTimeMin: 5,
    diagramType: 'thermal_stratification',
    diagramCaption: 'Árvore de Termopares com 5 Sensores Verticais (0.5m, 1.2m, 1.8m, 2.4m e 2.7m).',
    sections: [
      {
        heading: '13.1. Estrutura de Duas Zonas Térmicas (Two-Zone Model)',
        paragraphs: [
          'Ao atingir a laje do teto, a pluma curva-se horizontalmente formando o "Ceiling Jet" com alta velocidade radial. Progressivamente, o teto atua como um reservatório de gases quentes e tóxicos, comprimindo o ar limpo em direção ao piso.',
          'A temperatura ao longo da altura z varia de forma não linear, estabelecendo a interface de fumaça (z_layer):'
        ],
        table: {
          headers: ['Cota de Altura (Z)', 'Ambiente Físico', 'Faixa Típica em Incêndio Desenvolvido', 'Risco Fisiológico'],
          rows: [
            ['2.70m (Teto)', 'Camada Quente Superior', '280°C a 650°C', 'Destruição de fiações e colapso de luminárias'],
            ['2.40m (Sob o Forro)', 'Topo da Pluma Acumulada', '180°C a 420°C', 'Acionamento térmico de sprinklers'],
            ['1.80m (Altura em Pé)', 'Zona Respiratória Normal', '65°C a 160°C', 'Queimaduras de vias aéreas e choque térmico'],
            ['1.20m (Cadeirante)', 'Zona Respiratória Média', '42°C a 85°C', 'Tolerável por tempo limitado (< 3 min)'],
            ['0.50m (Leito / Piso)', 'Camada Fria Inferior', '26°C a 38°C', 'Zona de maior tenibilidade para pacientes acamados']
          ]
        }
      }
    ],
    normativeReferences: ['Cooper, L. Y. Ceiling Jet Driven Wall Flows (NIST)']
  },
  {
    pageNumber: 14,
    volumeId: 3,
    volumeTitle: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS',
    chapterTitle: 'Curva de Liberação de Calor (HRR t²) & Flashover Hospitalar',
    subtitle: 'Cálculo analítico do crescimento do fogo em quartos de isolamento com mobiliário hospitalar.',
    readingTimeMin: 5,
    diagramType: 'flame_combustion_zones',
    diagramCaption: 'Curva HRR (kW) vs. Tempo (s) demonstrando Crescimento Rápido, Supressão e Flashover.',
    sections: [
      {
        heading: '14.1. O Modelo Paramétrico de Fogo t-squared',
        paragraphs: [
          'O crescimento do fogo em compartimentos hospitalares segue a clássica equação exponencial:',
          'Q(t) = alpha * t^2, onde alpha é o coeficiente de crescimento de incêndio (NFPA 72).'
        ],
        formula: 'Q(t) = min(Q_max, 1000 * (t / t_g)^2 )',
        bulletPoints: [
          'Incêndio Ultrarrápido (t_g = 75s): Espuma de colchão hospitalar de poliuretano não tratado e solventes.',
          'Incêndio Rápido (t_g = 150s): Enxoval hospitalar de algodão/poliéster com fluxo de oxigênio de cateter.',
          'Incêndio Médio (t_g = 300s): Mobiliário em MDF com retardante e plásticos de engenharia.',
          'Pico de Potência Térmica: Quarto de enfermaria típico atinge 2.850 kW (2,85 MW) no ponto de flashover generalizado.'
        ]
      }
    ],
    normativeReferences: ['NFPA 72 National Fire Alarm and Signaling Code']
  },
  {
    pageNumber: 15,
    volumeId: 3,
    volumeTitle: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS',
    chapterTitle: 'Ótica da Fumaça (Lei de Jin) & Dose Fracionária de CO (FED)',
    subtitle: 'Critérios fisiológicos de perda de visibilidade e incapacitação por carboxi-hemoglobina.',
    readingTimeMin: 5,
    diagramType: 'smoke_optical_jin',
    diagramCaption: 'Curvas de Visibilidade (m) vs. Densidade Ótica da Fumaça (1/m) e Toxicidade FED Purser.',
    sections: [
      {
        heading: '15.1. A Lei de Jin de Visibilidade em Fumaça Hospitalar',
        paragraphs: [
          'A visibilidade S em metros dita a velocidade de marcha de pedestres e brigadistas. Segundo a consagrada formulação experimental de Jin (1978/2002):'
        ],
        formula: 'S = C / K_s',
        bulletPoints: [
          'K_s: Coeficiente de extinção óptica da fumaça (1/m) calculado pelo FDS.',
          'C: Constante adimensional de reflexão (C = 3 para placas não luminosas; C = 8 para sinalização de emergência fotoluminescente / LED).',
          'Limiar Crítico: Para S < 3.0 metros, indivíduos comuns entram em desorientação espacial severa e recusam-se a ingressar no corredor.'
        ]
      },
      {
        heading: '15.2. O Modelo FED de Toxicidade (ISO 13571 / Purser)',
        paragraphs: [
          'A Dose Fracionária Efetiva (Fractional Effective Dose - FED) calcula o acúmulo letal de monóxido de carbono (CO) e ácido cianídrico (HCN) nos pulmões ao longo do tempo t:',
          'FED_CO = Integral( ( [CO]^1.036 / 35.000 ) * dt ). Para FED >= 0.3, pacientes com insuficiência cardiorrespiratória sofrem colapso hemodinâmico.'
        ]
      }
    ],
    normativeReferences: ['ISO 13571:2012 Life-threatening components of fire', 'SFPE Tenability Guide']
  },
  {
    pageNumber: 16,
    volumeId: 3,
    volumeTitle: 'Volume III: Modelagem Computacional CFD & Dinâmica de Fogo FDS',
    chapterTitle: 'Instrumentação Virtual: Posicionamento de Sondas (Probes 2D/3D)',
    subtitle: 'Como o instrutor posiciona sensores virtuais na planta e interpreta leituras em tempo real.',
    readingTimeMin: 4,
    diagramType: 'probes_3d_instrumentation',
    diagramCaption: 'Visualização das Sondas Virtuais na Planta 2D e Mastros 3D Físicos no ThreeHospitalViewer.',
    sections: [
      {
        heading: '16.1. Metodologia de Sensoriamento Virtual',
        paragraphs: [
          'O HEDS disponibiliza a interface de "Posicionamento de Probes (2D/3D)" dentro do modal de integração FDS. O instrutor pode clicar em qualquer ambiente da planta para fixar uma nova sonda de telemetria.',
          'A sonda calcula automaticamente os valores locais de Temperatura (°C), Visibilidade (m), Concentração de CO (ppm) e FED com base na célula da grade espacial de volumes finitos (36x20m), ajustada pelo fator de estratificação vertical de altura (z = 0.5m a 2.4m).'
        ]
      }
    ],
    normativeReferences: ['FDS User Guide Chapter 14: Output Devices']
  },

  // =========================================================================
  // VOLUME IV: ENGENHARIA DE EVACUAÇÃO & MODELAGEM DE AGENTES (PÁGINAS 17 A 22)
  // =========================================================================
  {
    pageNumber: 17,
    volumeId: 4,
    volumeTitle: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder',
    chapterTitle: 'Fundamentos de Evacuação de Populações Especiais e Vulneráveis',
    subtitle: 'Princípios científicos de egress para hospitais baseados no SFPE Handbook e NIST.',
    readingTimeMin: 5,
    diagramType: 'evacuation_flow_density',
    diagramCaption: 'Curva de Fluxo de Pedestres vs. Densidade de Ocupantes (Relação Fundamental de Predtechenskii).',
    sections: [
      {
        heading: '17.1. A Dinâmica Social e Fisiológica da Evacuação Assistida',
        paragraphs: [
          'Enquanto simulações de estádios ou shoppings consideram evacuação individual não assistida, em ambiente hospitalar 100% dos pacientes dependentes necessitam de "acoplamento físico" a cuidadores (ratios de 1:1, 1:2 ou 1:4 profissionais por leito).',
          'O modelo de agentes do HEDS baseia-se nas pesquisas seminais da Dra. Gwynne (SFPE) e Kuligowski (NIST) para mobilidade reduzida em desastres.'
        ]
      }
    ],
    normativeReferences: ['SFPE Guide to Human Behavior in Fire', 'NIST Technical Note 1822 (Kuligowski)']
  },
  {
    pageNumber: 18,
    volumeId: 4,
    volumeTitle: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder',
    chapterTitle: 'Perfis de Agentes: Drills da Nova Zelândia (Geoerg 2025) & Ghent',
    subtitle: 'Velocidades reais de deambulação horizontal e descida em escadas de emergência.',
    readingTimeMin: 5,
    diagramType: 'bed_vs_wheelchair',
    diagramCaption: 'Velocidades Horizontais e em Escada comparadas entre Perfis Ambulatoriais e Assistivos.',
    sections: [
      {
        heading: '18.1. Parâmetros Empíricos de Referência Internacional',
        paragraphs: [
          'Os perfis de movimentação de agentes no HEDS utilizam os dados mais recentes da literatura científica global, incluindo os drills hospitalares de Geoerg, de Schot & Lovreglio (2025) e os experimentos detalhados da Universidade de Ghent (Hunt, Galea et al.):'
        ],
        table: {
          headers: ['Perfil do Agente / Dispositivo', 'Velocidade Horizontal (m/s)', 'Velocidade em Escadas (m/s)', 'Regra Crítica de Segurança'],
          rows: [
            ['Ambulatory / Comum (P0/P1)', '1,0 a 1,2 m/s', '0,55 a 0,75 m/s', 'Deambulação independente; orientar saída rápida'],
            ['Cadeira de Rodas Padrão (P2)', '1,1 a 1,2 m/s', 'Transferência Obrigatória', 'PROIBIDO descer escada; transferir para Evac-Chair'],
            ['Cadeira de Evacuação (Evac-Chair)', '1,4 a 1,5 m/s (reta)', '0,80 a 0,85 m/s (descida)', 'Uso exclusivo em escadas com 2 operadores treinados'],
            ['Leito Hospitalar de UTI (Bed P3/P4)', '0,6 a 0,8 m/s (reta)', 'IMPOSSÍVEL (Zero m/s)', 'NUNCA ingressar em escadas; destino obrigatório: Refúgio']
          ]
        }
      }
    ],
    normativeReferences: ['Geoerg et al. (2025) Safety Science', 'Hunt, Galea et al. (2016) Fire and Materials']
  },
  {
    pageNumber: 19,
    volumeId: 4,
    volumeTitle: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder',
    chapterTitle: 'Dinâmica de Leitos Articulados em Corredores (Kwak et al. 2021)',
    subtitle: 'Cinemática do transporte de leitos hospitalares de 2.10m x 0.95m e perda de torque em manobras.',
    readingTimeMin: 5,
    diagramType: 'bed_vs_wheelchair',
    diagramCaption: 'Raio de Giro e Envelope de Varredura de Leito Hospitalar em Curva de 90 Graus.',
    sections: [
      {
        heading: '19.1. O Envelope Espacial de Movimentação do Leito',
        paragraphs: [
          'Um leito hospitalar motorizado pesa entre 140 kg e 220 kg vazio, atingindo mais de 300 kg com o paciente e equipamentos acoplados (ventilador pulmonar, bombas de infusão, cilindro de O2).',
          'Segundo os ensaios de Kwak et al. (2021), a movimentação em linha reta atinge 0.6 a 0.8 m/s com 2 operadores, porém sofre forte desaceleração inercial ao atingir portas corta-fogo com largura livre inferior a 1.20 metros.'
        ]
      }
    ],
    normativeReferences: ['Kwak et al. (2021) Fire Technology: Hospital Bed Movement Dynamics']
  },
  {
    pageNumber: 20,
    volumeId: 4,
    volumeTitle: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder',
    chapterTitle: 'Fatores de Redução: Congestionamento, Curvas de 90° & Fadiga',
    subtitle: 'Formulação matemática das penalidades de velocidade durante o tráfego em corredores.',
    readingTimeMin: 5,
    diagramType: 'evacuation_flow_density',
    diagramCaption: 'Degradação da Velocidade Efetiva por Curvas de 90 Graus e Fadiga Acumulada a Cada 100m.',
    sections: [
      {
        heading: '20.1. Equações de Redução de Velocidade no HEDS',
        paragraphs: [
          'A velocidade instantânea v(t) de qualquer agente é ponderada dinamicamente pelos fatores ambientais:',
          'v_efetiva = v_base * f_densidade * f_geometria * f_fadiga'
        ],
        formula: 'v_efetiva = v_base * (1 - 0.25 * D) * (1 - red_curva) * (1 - 0.04 * (dist_m / 100))',
        bulletPoints: [
          'Fator Densidade (f_densidade): Redução de 20% a 40% (x0.6 a x0.8) quando a densidade de pedestres D no corredor ultrapassa 1.2 pessoas/m².',
          'Penalidade de Curva de 90° e Portas: Redução adicional de 10% a 30% na velocidade do leito em manobras angulares.',
          'Fadiga dos Brigadistas: Perda progressiva de 4% de velocidade a cada 100 metros percorridos empurrando leitos pesados.'
        ]
      }
    ],
    normativeReferences: ['Togawa (1955) Study on Fire Escapes', 'Pauls, J. Building Evacuation']
  },
  {
    pageNumber: 21,
    volumeId: 4,
    volumeTitle: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder',
    chapterTitle: 'Tempos de Pré-Movimento: Preparação Ativa & Espera Passiva',
    subtitle: 'Por que o tempo de pré-movimento domina 70% do tempo total de abandono hospitalar.',
    readingTimeMin: 5,
    diagramType: 'pre_movement_timeline',
    diagramCaption: 'Cronograma Comparativo do Pré-Movimento: Desconexão de Aparelhos vs. Deslocamento Físico.',
    sections: [
      {
        heading: '21.1. As Fases do Pré-Movimento Hospitalar',
        paragraphs: [
          'Em ambientes corporativos, o pré-movimento consiste no tempo de reação ao alarme (30s a 60s). Em hospitais, divide-se em Preparação Ativa e Espera Passiva:',
          '1. Preparação Ativa (Walking / Wheelchair): 128 a 140 segundos (vestir agasalho, calçar calçados, desconectar soros venosos periféricos).',
          '2. Preparação Ativa em Leito de UTI (Bed P4): 194 segundos de média, atingindo facilmente 300 a 500+ segundos em unidades de alta complexidade (desconexão da rede fixa de O2, comutação para cilindro portátil, transferência de ventilador mecânico para bateria e desconexão de cateteres venosos centrais).'
        ]
      }
    ],
    normativeReferences: ['Purser, D. A. Pre-travel time and movement analysis in fire scenarios']
  },
  {
    pageNumber: 22,
    volumeId: 4,
    volumeTitle: 'Volume IV: Engenharia de Evacuação & Modelagem de Agentes Pathfinder',
    chapterTitle: 'Algoritmos de Potencial Vetorial & Streamlines de Densidade',
    subtitle: 'Como o HEDS calcula a rota mais rápida sem congestionamentos usando gradientes de potencial.',
    readingTimeMin: 4,
    diagramType: 'evacuation_flow_density',
    diagramCaption: 'Linhas de Fluxo (Streamlines) Vetoriais Azuis, Amarelas e Vermelhas por Densidade.',
    sections: [
      {
        heading: '22.1. O Solver de Navegação Espacial de Agentes',
        paragraphs: [
          'Os agentes navegam sobre uma malha de potencial vetorial contínua (similar ao Pathfinder da Thunderhead Engineering). A rota é recalculada em tempo real se uma saída sofrer contaminação por fumaça:',
          'Grad_Phi = Nabla( Potencial_Distancia + Penalidade_Fumaca + Repulsao_Agentes )',
          'Quando a Escada Norte é bloqueada pelo fogo, os streamlines mudam automaticamente para a Escada Sul em menos de 1 segundo de simulação.'
        ]
      }
    ],
    normativeReferences: ['Helbing, D. Simulating dynamical features of escape panic (Nature)']
  },

  // =========================================================================
  // VOLUME V: PROTOCOLO CLÍNICO & TRIAGEM DE PACIENTES (PÁGINAS 23 A 28)
  // =========================================================================
  {
    pageNumber: 23,
    volumeId: 5,
    volumeTitle: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)',
    chapterTitle: 'Matriz de Triagem de Egress Hospitalar (P0 a P4)',
    subtitle: 'Classificação clínica de dependência de mobilidade e prioridade de extração em desastres.',
    readingTimeMin: 5,
    diagramType: 'patient_triage_matrix',
    diagramCaption: 'Matriz Gráfica das 5 Categorias de Triagem de Egress: P0 (Ciano) a P4 (Vermelho Crítico).',
    sections: [
      {
        heading: '23.1. A Classificação de Triagem P0 a P4',
        paragraphs: [
          'O HEDS implementa a matriz universal de triagem de evacuação médica hospitalar:'
        ],
        table: {
          headers: ['Código', 'Classificação Clínica', 'Equipe Requerida', 'Tempo Preparo', 'Velocidade Média', 'Prioridade Tática'],
          rows: [
            ['P0', 'Autônomo / Ambulatório', 'Nenhum cuidador', 'Imediato (10s)', '1,20 m/s', 'Prioridade 5 (Evacua sozinho)'],
            ['P1', 'Mobilidade Reduzida', '1 Profissional', '120 segundos', '0,70 m/s', 'Prioridade 4 (Apoio leve)'],
            ['P2', 'Cadeirante / Cadeira Rodas', '2 Profissionais', '140 segundos', '0,90 m/s', 'Prioridade 3 (Cadeira / Evac-chair)'],
            ['P3', 'Acamado Dependente', '2 a 3 Profissionais', '194 segundos', '0,50 m/s', 'Prioridade 2 (Leito / Maca)'],
            ['P4', 'Suporte de Vida / UTI', '1 Médico + 1 Enf + 2 Brig.', '300 a 500s', '0,35 m/s', 'Prioridade 1 (Crítico Implícito)']
          ]
        }
      }
    ],
    normativeReferences: ['Hospital Incident Command System (HICS) Guidebook', 'START Triage']
  },
  {
    pageNumber: 24,
    volumeId: 5,
    volumeTitle: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)',
    chapterTitle: 'Pacientes P4 de Terapia Intensiva (UTI) & Suporte de Vida',
    subtitle: 'Protocolo passo a passo de desconexão segura de ventiladores, drogas vasoativas e ECMO.',
    readingTimeMin: 5,
    diagramType: 'patient_triage_matrix',
    diagramCaption: 'Sequência Crítica de Desconexão: Válvula de O2, Ventilador de Transporte e Sedação Contínua.',
    sections: [
      {
        heading: '24.1. O Procedimento Operacional Padrão (POP) em UTI',
        paragraphs: [
          'A evacuação de um leito P4 jamais é realizada por impulsividade. O checklist obrigatório:',
          '1. Acoplar ventilador pulmonar de transporte à bateria interna e comutar o circuito de oxigênio para cilindro portátil tipo D ou E.',
          '2. Bloquear bombas de infusão contínua em modo de bateria (garantindo estabilidade de noradrenalina/sedativos).',
          '3. Travar drenos de tórax e sondas vesicais no chassi inferior do leito articulado.',
          '4. Destravar os 4 rodízios do leito hospitalar e conduzir com 1 médico na cabeceira (gerenciando via aérea) e 2 brigadistas na tração.'
        ]
      }
    ],
    normativeReferences: ['AMIB - Associação de Medicina Intensiva Brasileira', 'CFM Resolução nº 2.156']
  },
  {
    pageNumber: 25,
    volumeId: 5,
    volumeTitle: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)',
    chapterTitle: 'Pacientes P3 (Acamados) e P2 (Cadeirantes): Técnicas de Extração',
    subtitle: 'Uso de lençóis de arrasto, pranchas rígidas e cadeiras de evacuação em escadas.',
    readingTimeMin: 4,
    diagramType: 'bed_vs_wheelchair',
    diagramCaption: 'Técnica de Transporte Assistido com Evac-Chair em Degraus de Escada.',
    sections: [
      {
        heading: '25.1. Dispositivos Especiais de Evacuação Assistida',
        paragraphs: [
          'Para pacientes P2 (cadeirantes) em pavimentos superiores, a descida de escadas exige o emprego de cadeiras de evacuação (Evac-Chair) providas de correias de atrito com frenagem mecânica contínua.',
          'Para pacientes P3 em áreas onde o leito hospitalar não cabe na porta de escape, emprega-se o "lençol de arrasto" (drag sheet), permitindo que 2 profissionais deslizem o paciente sobre o piso cerâmico com velocidade de 0.9 m/s sem risco de traumatismo.'
        ]
      }
    ],
    normativeReferences: ['EN 1865 Especificações para Dispositivos de Transporte em Ambulâncias']
  },
  {
    pageNumber: 26,
    volumeId: 5,
    volumeTitle: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)',
    chapterTitle: 'A Doutrina da Evacuação Horizontal Progressiva (Fases 1 a 4)',
    subtitle: 'A regra de ouro da engenharia de incêndio hospitalar: mover lateralmente, nunca para baixo.',
    readingTimeMin: 5,
    diagramType: 'horizontal_evacuation_phases',
    diagramCaption: 'Diagrama das 4 Fases da Evacuação Horizontal: Quarto -> Corredor -> Refúgio -> Vertical.',
    sections: [
      {
        heading: '26.1. As Quatro Fases da Evacuação Hospitalar',
        paragraphs: [
          'A evacuação hospitalar JAMAIS deve iniciar pela descida indiscriminada de macas e leitos por escadas de emergência, o que causaria congestionamento mortal. O protocolo internacional estabelece:',
          'Fase 1 (Extração de Quarto): Remoção imediata do paciente do quarto sinistrado para o corredor adjacente, fechando a porta corta-fogo do quarto.',
          'Fase 2 (Evacuação Horizontal Primária): Transposição lateral de toda a ala para o outro lado da barreira corta-fogo (porta P-90) no mesmo andar.',
          'Fase 3 (Confinamento Seguro em Área de Refúgio): Permanência assistida na Área de Refúgio com suprimento de O2 e ar limpo.',
          'Fase 4 (Evacuação Vertical Escalonada): Apenas se a barreira de compartimentação for comprometida pelo fogo ou fumaça, descendo pelo Elevador de Emergência alimentado por grupo gerador.'
        ]
      }
    ],
    normativeReferences: ['NFPA 101 Life Safety Code Chapter 18/19', 'NBR 16651 Cláusula 6.2']
  },
  {
    pageNumber: 27,
    volumeId: 5,
    volumeTitle: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)',
    chapterTitle: 'Áreas de Refúgio: Dimensionamento, Estanqueidade & Oxigênio',
    subtitle: 'Requisitos construtivos das zonas de confinamento seguro para leitos de UTI.',
    readingTimeMin: 5,
    diagramType: 'refuge_area_positive_pressure',
    diagramCaption: 'Corte Arquitetônico de Área de Refúgio Estanque com Pressurização Positiva (+50 Pa).',
    sections: [
      {
        heading: '27.1. Cálculo de Dimensionamento de Áreas de Refúgio',
        paragraphs: [
          'Segundo a NBR 16651 e a RDC 50 da ANVISA, cada compartimento hospitalar de internação deve possuir acesso direto a pelo menos uma Área de Refúgio compartimentada no mesmo pavimento com:',
          'Área Líquida: Mínimo de 2,60 m² por leito de internação e 4,50 m² por leito de UTI acamado.',
          'Estanqueidade de Fumaça: Portas com selo perimétrico intumescente de silicone e ante-câmara pressurizada (+50 Pa).',
          'Suprimento Vital: Tomadas elétricas de emergência alimentadas pelo grupo gerador e pontos de oxigênio/vácuo de emergência.'
        ]
      }
    ],
    normativeReferences: ['RDC 50 ANVISA Capítulo 2', 'ABNT NBR 16651:2019']
  },
  {
    pageNumber: 28,
    volumeId: 5,
    volumeTitle: 'Volume V: Protocolo Clínico & Triagem de Pacientes (P0 a P4)',
    chapterTitle: 'Uso Tático de Elevadores de Emergência com Gerador',
    subtitle: 'Quando e como utilizar elevadores de emergência hospitalares sem violar as normas de bombeiros.',
    readingTimeMin: 4,
    diagramType: 'horizontal_evacuation_phases',
    diagramCaption: 'Poço de Elevador de Emergência com Antecâmara Enclausurada e Chave de Fase 2 Bombeiro.',
    sections: [
      {
        heading: '28.1. A Exceção Hospitalar do Elevador de Emergência',
        paragraphs: [
          'A regra civil padrão "Em Caso de Incêndio Não Use o Elevador" NÃO se aplica ao Elevador de Emergência Hospitalar regulamentado pela NBR 16651.',
          'Requisitos obrigatórios para uso tático: poço do elevador enclausurado em paredes TRRF 120 min, ante-câmara estanque com porta corta-fogo P-90, alimentação elétrica segregada pelo gerador de emergência e operação exclusiva por bombeiro/brigadista via chave seletora manual (Modo Bombeiro Fase II).'
        ]
      }
    ],
    normativeReferences: ['NBR 16651 Cláusula 5.12', 'ASME A17.1 / CSA B44 Firefighters Operation']
  },

  // =========================================================================
  // VOLUME VI: COMANDO DE INCIDENTES HOSPITALARES (SCI / C3) (PÁGINAS 29 A 34)
  // =========================================================================
  {
    pageNumber: 29,
    volumeId: 6,
    volumeTitle: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)',
    chapterTitle: 'Estrutura Organizacional do SCI Hospitalar (HICS)',
    subtitle: 'Organograma hierárquico do comitê de desastre e postos funcionais.',
    readingTimeMin: 4,
    diagramType: 'hics_incident_command',
    diagramCaption: 'Organograma Tático do SCI/HICS: Comandante, Segurança, Operações, Logística e Planejamento.',
    sections: [
      {
        heading: '29.1. O Sistema de Comando de Incidentes em Saúde',
        paragraphs: [
          'O Hospital Incident Command System (HICS) é o padrão internacional adotado pelo HEDS para modular a governança hospitalar durante crises. Baseia-se no princípio da "Unidade de Comando" (cada profissional responde a apenas um superior imediato) e "Alcance de Controle" (gerenciamento ótimo de 3 a 7 subordinados diretos).'
        ]
      }
    ],
    normativeReferences: ['HICS National Working Group: California EMSA']
  },
  {
    pageNumber: 30,
    volumeId: 6,
    volumeTitle: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)',
    chapterTitle: 'Papéis Táticos: Comandante, Oficial de Segurança & Operações',
    subtitle: 'Atribuições inegociáveis de cada posto na resposta ao incêndio.',
    readingTimeMin: 5,
    diagramType: 'hics_incident_command',
    diagramCaption: 'Fluxo de Delegação e Matriz RACI de Decisões Táticas no HEDS.',
    sections: [
      {
        heading: '30.1. Atribuições dos Postos Chave',
        paragraphs: [
          'No módulo de Comando C3 do simulador, o aluno assume o papel de Comandante do Incidente:',
          'Comandante do Incidente (CI): Autoriza a mudança de fases de evacuação, aciona apoio externo do CBM e define prioridades globais.',
          'Oficial de Segurança (OS): Possui autoridade de veto imediato sobre qualquer ação que exponha equipes a risco letal de fumaça.',
          'Líder da Seção de Operações (LSO): Coordena os brigadistas em combate direto e as equipes de enfermagem na extração de leitos.',
          'Líder da Seção de Logística (LSL): Garante cilindros de O2 reserva, transporte externo e suprimentos de ressuscitação.'
        ]
      }
    ],
    normativeReferences: ['FEMA ICS-100 / ICS-200 Training Standards']
  },
  {
    pageNumber: 31,
    volumeId: 6,
    volumeTitle: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)',
    chapterTitle: 'Gestão de Recursos Críticos: Cilindros de O2, Baterias & Macas',
    subtitle: 'Logística de suporte à vida durante a evacuação de pavimentos superiores.',
    readingTimeMin: 4,
    diagramType: 'operational_checklist',
    diagramCaption: 'Painel de Inventário Dinâmico de Recursos do Módulo C3 no HEDS.',
    sections: [
      {
        heading: '31.1. O Balanço de Massa de Suporte Vital',
        paragraphs: [
          'A evacuação de uma UTI com 12 leitos exige simultaneamente 12 cilindros de O2 portáteis com carga mínima de 150 bar, 6 ventiladores de transporte com baterias recarregadas e 8 macas de transferência rápida.',
          'O HEDS rastreia o consumo de cada recurso segundo a segundo, gerando eventos críticos de "Falta de Cilindro de O2 no Ponto de Encontro" se o aluno não planejar a logística com antecedência.'
        ]
      }
    ],
    normativeReferences: ['RDC 50 ANVISA - Gases Medicinais']
  },
  {
    pageNumber: 32,
    volumeId: 6,
    volumeTitle: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)',
    chapterTitle: 'Cadeia de Comunicação: Rádio VHF/UHF, Código Vermelho & PA',
    subtitle: 'Protocolos de radiocomunicação e avisos sonoros para evitar histeria coletiva.',
    readingTimeMin: 4,
    diagramType: 'c3_command_flow',
    diagramCaption: 'Matriz de Comunicação em Frequências Dedicadas de Rádio e Mensagens Pré-Gravadas.',
    sections: [
      {
        heading: '32.1. O Emprego do Código de Cores Padronizado',
        paragraphs: [
          'Para não deflagrar histeria entre visitantes e acompanhantes ambulatoriais, hospitais utilizam códigos sonoros de alerta pelo sistema de som geral (Public Address - PA):',
          'Mensagem de Código Vermelho: "Atenção equipe hospitalar: Ativação de Código Vermelho no 4º Pavimento Setor Leste".',
          'Canais de Rádio Dedicados: Canal 1 para Brigada e Combate; Canal 2 para Transporte de Pacientes; Canal 3 para Diretoria e Bombeiros Militares.'
        ]
      }
    ],
    normativeReferences: ['NFPA 1221 Standard for Emergency Communications']
  },
  {
    pageNumber: 33,
    volumeId: 6,
    volumeTitle: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)',
    chapterTitle: 'Interface com Corpo de Bombeiros Militar (193) & SAMU (192)',
    subtitle: 'Transição do Comando do Incidente da Brigada Interna para o Oficial de Socorro do CBM.',
    readingTimeMin: 4,
    diagramType: 'hics_incident_command',
    diagramCaption: 'Protocolo de Passagem de Serviço e Integração com o Trem de Socorro do Corpo de Bombeiros.',
    sections: [
      {
        heading: '33.1. O Momento da Transição de Comando (Handover)',
        paragraphs: [
          'Ao chegar o primeiro trem de socorro do Corpo de Bombeiros Militar (Auto Bomba / Auto Escada), o Comandante Hospitalar deve fornecer em até 60 segundos:',
          '1. Planta do pavimento sinistrado indicando o foco do incêndio e as rotas bloqueadas;',
          '2. Relatório de censo: número exato de pacientes evacuados e os que permanecem confinados na Área de Refúgio;',
          '3. Situação do registro de gás oxigênio e da chave geral de energia elétrica.'
        ]
      }
    ],
    normativeReferences: ['Instrução Técnica CBM - Sistema de Comando de Operações']
  },
  {
    pageNumber: 34,
    volumeId: 6,
    volumeTitle: 'Volume VI: Sistema de Comando de Incidentes Hospitalar (SCI / C3)',
    chapterTitle: 'Gestão de Pânico, Controle de Acompanhantes & Isolamento',
    subtitle: 'Segurança patrimonial, triagem na portaria e evacuação do fluxo externo de visitantes.',
    readingTimeMin: 4,
    diagramType: 'operational_checklist',
    diagramCaption: 'Zoneamento de Segurança Externa: Zona Quente (Fogo), Zona Morna e Zona Fria (Triage).',
    sections: [
      {
        heading: '34.1. O Isolamento de Acesso Externo',
        paragraphs: [
          'A maior causa de atraso na chegada dos socorristas externos é o congestionamento de familiares e veículos nas vias de acesso ao Pronto-Socorro.',
          'O Plano de Evacuação deve designar a equipe de Segurança Patrimonial para isolar imediatamente as cancelas, liberando o pátio exclusivo para viaturas de resgate e combate.'
        ]
      }
    ],
    normativeReferences: ['Hospital Security and Disaster Preparedness Guide']
  },

  // =========================================================================
  // VOLUME VII: MOTOR DE CENÁRIOS & DECISION GAME (PÁGINAS 35 A 40)
  // =========================================================================
  {
    pageNumber: 35,
    volumeId: 7,
    volumeTitle: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game',
    chapterTitle: 'Metodologia do Decision Game (Tomada de Decisão sob Estresse)',
    subtitle: 'A ciência do Tabletop interativo para capacitação de lideranças de saúde.',
    readingTimeMin: 5,
    diagramType: 'decision_game_branching',
    diagramCaption: 'Árvore de Ramificação de Decisões Táticas: Respostas Adequadas vs. Falhas Críticas.',
    sections: [
      {
        heading: '35.1. O Método do Jogo de Decisão Tática',
        paragraphs: [
          'Estudos da psicologia cognitiva comprovam que profissionais sob pânico operam com visão em túnel e tomam decisões impulsivas. O HEDS implementa a metodologia "Decision Game", onde a simulação congela automaticamente em marcos temporais críticos (Dilemas Éticos e Operacionais).',
          'O participante é obrigado a escolher entre 3 a 4 opções táticas em um cronômetro regressivo de 30 segundos, sentindo a mesma pressão temporal de uma catástrofe real.'
        ]
      }
    ],
    normativeReferences: ['Klein, G. Sources of Power: How People Make Decisions']
  },
  {
    pageNumber: 36,
    volumeId: 7,
    volumeTitle: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game',
    chapterTitle: 'Algoritmo de Geração Paramétrica de Cenários de Incêndio',
    subtitle: 'Como o HEDS sintetiza novos exercícios variando risco, ambiente e carga de ocupação.',
    readingTimeMin: 5,
    diagramType: 'decision_game_branching',
    diagramCaption: 'Diagrama de Blocos do Motor Algorítmico do ScenarioEngineModal.',
    sections: [
      {
        heading: '36.1. O Motor Paramétrico de Simulação',
        paragraphs: [
          'O modal "Motor de Cenários" permite ao instrutor gerar milhares de combinações combinando 4 vetores de incerteza:',
          'Vetor 1: Local de Origem (UTI, Bloco Cirúrgico, Enfermaria, Almoxarifado, Central de Ar-Condicionado).',
          'Vetor 2: Perfil da Carga de Pacientes (Predomínio de P4 em ventilação, P3 acamados ou P2 cadeirantes).',
          'Vetor 3: Falhas Injetadas de Infraestrutura (Porta corta-fogo travada aberta, falha de pressurização da escada, queda do grupo gerador).',
          'Vetor 4: Horário da Ocorrência (Turno Diurno com equipe plena vs. Turno Noturno com quadro reduzido de enfermagem).'
        ]
      }
    ],
    normativeReferences: ['NATO Guidance on Tabletop Exercise Modeling']
  },
  {
    pageNumber: 37,
    volumeId: 7,
    volumeTitle: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game',
    chapterTitle: 'Catálogo de Cenários de Referência: UTI, Bloco Cirúrgico & Químicos',
    subtitle: 'Análise dos 20+ cenários pré-configurados baseados em acidentes hospitalares históricos.',
    readingTimeMin: 5,
    diagramType: 'operational_checklist',
    diagramCaption: 'Matriz de Risco dos Cenários Históricos: Hospital Badim (2019), San Juan de Dios e Ghent.',
    sections: [
      {
        heading: '37.1. Casos Históricos Modelados no HEDS',
        paragraphs: [
          'O HEDS contém cenários modelados a partir de tragédias reais brasileiras e mundiais:',
          'Cenário 01 (Incêndio em Subsolo com Falha de Gerador): Inspirado no desastre do Hospital Badim (RJ, 2019), onde a fumaça de óleo diesel subiu pelos poços de elevadores asfixiando pacientes em andares altos.',
          'Cenário 02 (Incêndio em Leito de UTI com Oxigênio Enriquecido): Combustão violenta iniciada por curto-circuito em monitor cardíaco na presença de vazamento de O2 medicinal.',
          'Cenário 03 (Incêndio em Centro Cirúrgico Durante Procedimento): Incêndio em campo cirúrgico com anestésicos voláteis e paciente intubado.'
        ]
      }
    ],
    normativeReferences: ['Relatório de Investigação Pericial CBMERJ Hospital Badim (2019)']
  },
  {
    pageNumber: 38,
    volumeId: 7,
    volumeTitle: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game',
    chapterTitle: 'Injeção de Falhas Críticas: Bloqueio de Escadas & Apagão',
    subtitle: 'Simulação dinâmica do desvio de rotas e estresse nos nós de circulação.',
    readingTimeMin: 4,
    diagramType: 'decision_game_branching',
    diagramCaption: 'Desvio Tático da Escada Norte Bloqueada para a Escada Sul Pressurizada.',
    sections: [
      {
        heading: '38.1. A Dinâmica do Desvio Tático',
        paragraphs: [
          'Quando a Escada Norte é contaminada por fumaça (temperatura > 60°C ou visibilidade < 3m), o simulador bloqueia o nó de rede correspondente.',
          'O Comandante tem 90 segundos para emitir ordem de rádio determinando o desvio de todos os fluxos para a Escada Sul. Caso hesite, os agentes ambulatoriais acumulam-se na porta bloqueada, inalando fumaça tóxica.'
        ]
      }
    ],
    normativeReferences: ['Pathfinder Evacuation Routing Algorithm (Thunderhead)']
  },
  {
    pageNumber: 39,
    volumeId: 7,
    volumeTitle: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game',
    chapterTitle: 'Árvore de Decisão: Opções Táticas & Consequências Imediatas',
    subtitle: 'Mapeamento de causa e efeito das decisões do aluno sobre o cálculo de RSET e ASET.',
    readingTimeMin: 5,
    diagramType: 'decision_game_branching',
    diagramCaption: 'Árvore de Decisão com Pesos de Pontuação e Efeitos Físicos no Solver CFD.',
    sections: [
      {
        heading: '39.1. O Algoritmo de Ramificação Causal',
        paragraphs: [
          'Cada escolha no DecisionGameModal possui consequências físicas e operacionais instantâneas:',
          'Decisão: Fechar a porta corta-fogo do quarto de incêndio imediatamente -> Consequência: Retém 90% dos gases aquecidos, estendendo o tempo de tenibilidade do corredor em +240 segundos.',
          'Decisão: Tentar descer pacientes de UTI de leito por escadas -> Consequência: Bloqueio imediato da descida, queda de macas e redução da pontuação de segurança para zero.'
        ]
      }
    ],
    normativeReferences: ['Decision Tree Analysis in Emergency Operations']
  },
  {
    pageNumber: 40,
    volumeId: 7,
    volumeTitle: 'Volume VII: Motor de Cenários Dinâmicos & Decision Game',
    chapterTitle: 'Algoritmo de Avaliação de Desempenho & Radar de Competências',
    subtitle: 'Cálculo da nota global (0 a 100%) em 5 eixos de competência militar-hospitalar.',
    readingTimeMin: 4,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Gráfico Radar Pentagonal de Competências: Tempo, Comunicação, Protocolos, Recursos e Liderança.',
    sections: [
      {
        heading: '40.1. A Fórmula de Pontuação do HEDS',
        paragraphs: [
          'A nota final homologada no certificado oficial resulta da média ponderada de 5 eixos de avaliação:',
          '1. Tempo de Resposta (Peso 25%): Velocidade no reconhecimento e acionamento dos alarmes.',
          '2. Protocolo Clínico de Egress (Peso 25%): Cumprimento da prioridade de triagem e evacuação horizontal.',
          '3. Comunicação & C3 (Peso 20%): Clareza das ordens de rádio e acionamento correto do CBM 193.',
          '4. Gestão de Recursos (Peso 15%): Alocação racional de O2, ventiladores e brigadistas.',
          '5. Preservação de Vidas (Peso 15%): Manutenção de todos os pacientes em ambientes com FED < 0.3.'
        ]
      }
    ],
    normativeReferences: ['Kirkpatrick Model of Training Evaluation']
  },

  // =========================================================================
  // VOLUME VIII: MOTOR GRÁFICO 3D, INSTANCEDMESH & 60 FPS (PÁGINAS 41 A 44)
  // =========================================================================
  {
    pageNumber: 41,
    volumeId: 8,
    volumeTitle: 'Volume VIII: Motor Gráfico 3D, InstancedMesh & Otimização 60 FPS',
    chapterTitle: 'Arquitetura do ThreeHospitalViewer (Three.js WebGL & PBR)',
    subtitle: 'Visão interna da pipeline de renderização tridimensional interativa do hospital.',
    readingTimeMin: 5,
    diagramType: 'threejs_lod_pipeline',
    diagramCaption: 'Pipeline Gráfica Three.js: Scene Graph, Shaders PBR, Dynamic Shadow Maps e Post-Processing.',
    sections: [
      {
        heading: '41.1. O Renderizador Espacial Tridimensional',
        paragraphs: [
          'O ThreeHospitalViewer utiliza o Three.js configurado para alta performance fotográfica com mapeamento de tons ACES Filmic Tone Mapping e luzes sombras suaves PCFSoftShadowMap.',
          'O modelo 3D reflete dinamicamente a geometria cadastrada no banco de dados (pavimentos, pés-direitos, paredes e divisórias) com escala métrica 1:1.'
        ]
      }
    ],
    normativeReferences: ['Khronos Group WebGL 2.0 Specification', 'Three.js Manual']
  },
  {
    pageNumber: 42,
    volumeId: 8,
    volumeTitle: 'Volume VIII: Motor Gráfico 3D, InstancedMesh & Otimização 60 FPS',
    chapterTitle: 'InstancedMesh, Frustum Culling em Tempo Real & Dynamic LOD (60 FPS)',
    subtitle: 'Como o simulador mantém 60 frames por segundo com centenas de agentes simultâneos.',
    readingTimeMin: 5,
    diagramType: 'threejs_lod_pipeline',
    diagramCaption: 'Diagrama de Funcionamento do Frustum Culling e dos 3 Níveis de Detalhe (LOD 0, 1 e 2).',
    sections: [
      {
        heading: '42.1. A Estratégia de Otimização Gráfica',
        paragraphs: [
          'Para garantir que a simulação rode a 60 FPS em notebooks comuns sem placas dedicadas topo de linha, o HEDS emprega três tecnologias combinadas:',
          '1. Frustum Culling Dinâmico: A cada frame, a matriz de projeção da câmera descarta objetos fora do campo de visão.',
          '2. THREE.InstancedMesh: Centenas de proxies e suportes hospitalares compartilham a mesma geometria e material na GPU em um único draw call.',
          '3. THREE.LOD (Level of Detail): Agentes a menos de 22 metros renderizam modelos anatômicos de alta resolução (LOD 0); entre 22m e 48m usam modelos médios (LOD 1); além de 48m usam proxies instanciados ultra-leves (LOD 2).'
        ]
      }
    ],
    normativeReferences: ['Luebke et al. Level of Detail for 3D Graphics']
  },
  {
    pageNumber: 43,
    volumeId: 8,
    volumeTitle: 'Volume VIII: Motor Gráfico 3D, InstancedMesh & Otimização 60 FPS',
    chapterTitle: 'Modelagem PBR de Alta Fidelidade: Pele com SSS, Têxteis & Bunker Gear',
    subtitle: 'Micro-texturização procedural em canvas para representação fotográfica de humanos e equipamentos.',
    readingTimeMin: 4,
    diagramType: 'isometric_hospital',
    diagramCaption: 'Detalhe Anatômico do Modelo PBR: Subsurface Scattering, Grades Cromadas e Monitor ECG.',
    sections: [
      {
        heading: '43.1. Texturas Procedurais Físicas PBR',
        paragraphs: [
          'O simulador gera texturas procedurais PBR em tempo de execução via Canvas API sem requerer downloads pesados de gigabytes de texturas externas:',
          'Pele com Subsurface Scattering (SSS): Emulação de difusão de luz subcutânea e micro-porosidade que elimina o aspecto plástico.',
          'Tecidos e Dobras de Vestimenta: Mapas de normais que simulam a trama oxford e dobras naturais com cinemática de respiração.',
          'Traje Bunker de Bombeiro: Faixas retrorrefletivas 3M Scotchlite com alto coeficiente de retroreflexão sob a luz das chamas.'
        ]
      }
    ],
    normativeReferences: ['Physically Based Shading in Theory and Practice (SIGGRAPH)']
  },
  {
    pageNumber: 44,
    volumeId: 8,
    volumeTitle: 'Volume VIII: Motor Gráfico 3D, InstancedMesh & Otimização 60 FPS',
    chapterTitle: 'Simulação Fotorrealista de Chamas e Fumaça Volumétrica',
    subtitle: 'A física visual calibrada no padrão Industrial Light & Magic e Thunderhead PyroSim.',
    readingTimeMin: 5,
    diagramType: 'flame_combustion_zones',
    diagramCaption: 'Zonas Físicas da Chama: Raiz Azul Quimioluminescente, Núcleo de Plasma e Vórtices de Brasas.',
    sections: [
      {
        heading: '44.1. Anatomia Físico-Química das Chamas no HEDS',
        paragraphs: [
          'O fogo tridimensional do HEDS abandona representações cartunescas e adota a estrutura real de combustão de hidrocarbonetos:',
          '1. Raiz Azul Quimioluminescente: Base em azul cobalto (#2563eb) correspondente à emissão de radicais CH e C2 em alta oxigenação.',
          '2. Núcleo Incandescente de Plasma: Cone central branco-plasma (#fffbeb) gerado por radiação de corpo negro acima de 1.100°C.',
          '3. Corpo Turbulento Convectivo: Línguas alaranjadas ondulatórias com rotação harmônica diferencial.',
          '4. Fumaça Volumétrica e Brasas (Embers): Mais de 220 partículas incandescentes impulsionadas por empuxo térmico que resfriam gradativamente conforme ascendem em direção ao teto.'
        ]
      }
    ],
    normativeReferences: ['Turns, S. R. An Introduction to Combustion']
  },

  // =========================================================================
  // VOLUME IX: AUDITORIA, HOMOLOGAÇÃO TÉCNICA & RELATÓRIOS (PÁGINAS 45 A 47)
  // =========================================================================
  {
    pageNumber: 45,
    volumeId: 9,
    volumeTitle: 'Volume IX: Auditoria, Homologação Técnica & Emissão de Relatórios',
    chapterTitle: 'Geração Automatizada de Relatórios Técnicos Oficiais em PDF',
    subtitle: 'O motor jsPDF + autoTable gerando laudos periciais homologados para comissões e auditorias.',
    readingTimeMin: 4,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Estrutura das Páginas Oficiais do Laudo de Auditoria PDF com Gráficos e Tabelas.',
    sections: [
      {
        heading: '45.1. O Laudo Técnico Pericial de Exercício',
        paragraphs: [
          'Ao término de qualquer simulação, o HEDS compila todos os dados cronometrados em um arquivo PDF pericial de alta resolução, pronto para impressão em padrão A4 com carimbo de autenticidade militar-hospitalar.',
          'O laudo discrimina segundo a segundo o tempo de evacuação de cada paciente P0 a P4, o status de tenibilidade dos corredores e o mapa radar de competências.'
        ]
      }
    ],
    normativeReferences: ['ABNT NBR ISO/IEC 17025 Requisitos para Relatórios de Ensaios']
  },
  {
    pageNumber: 46,
    volumeId: 9,
    volumeTitle: 'Volume IX: Auditoria, Homologação Técnica & Emissão de Relatórios',
    chapterTitle: 'Conformidade com Padrões de Acreditação Hospitalar (ONA / JCI)',
    subtitle: 'Como utilizar os resultados do simulador para comprovação de prontidão em auditorias externas.',
    readingTimeMin: 4,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Matriz de Rastreabilidade HEDS com os Padrões FMS da Joint Commission International.',
    sections: [
      {
        heading: '46.1. O Atendimento aos Padrões de Segurança Predial (FMS)',
        paragraphs: [
          'A Joint Commission International (JCI), no capítulo "Facility Management and Safety" (FMS.7 e FMS.7.1), exige que hospitais realizem e documentem pelo menos dois simulados de incêndio anuais com evidências analíticas.',
          'O HEDS atende integralmente a esse requisito, substituindo anotações manuais subjetivas por relatórios com rastreabilidade digital e gráficos quantitativos de engenharia de fogo.'
        ]
      }
    ],
    normativeReferences: ['JCI Standard FMS.7 Fire Safety Program', 'ONA Manual Versão 2024']
  },
  {
    pageNumber: 47,
    volumeId: 9,
    volumeTitle: 'Volume IX: Auditoria, Homologação Técnica & Emissão de Relatórios',
    chapterTitle: 'Emissão de ART no CREA & Validade Jurídica dos Estudos',
    subtitle: 'A responsabilidade técnica de engenharia e os requisitos para emissão de laudo com ART.',
    readingTimeMin: 4,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Modelo de Anotação de Responsabilidade Técnica (ART/CREA) para Simulação Computacional.',
    sections: [
      {
        heading: '47.1. Responsabilidade Técnica Profissional',
        paragraphs: [
          'Para que estudos de desocupação e simulação de fumaça tenham validade em processos judiciais ou renovações de alvarás de bombeiros, o estudo deve ser homologado por Engenheiro de Segurança Contra Incêndio devidamente habilitado no Conselho Regional de Engenharia e Agronomia (CREA) com recolhimento de ART sob a atividade técnica "Simulação Computacional e Laudo de Segurança Contra Incêndio".'
        ]
      }
    ],
    normativeReferences: ['Lei Federal nº 6.496/1977 (Institui a ART no Sistema CONFEA/CREA)']
  },

  // =========================================================================
  // VOLUME X: GUIA OPERACIONAL & FAQ TÉCNICO (PÁGINAS 48 A 50)
  // =========================================================================
  {
    pageNumber: 48,
    volumeId: 10,
    volumeTitle: 'Volume X: Guia de Operação, Simulação de Mesa & FAQ Técnico',
    chapterTitle: 'Guia Rápido de Operação do Instrutor: Do Zero ao Simulado',
    subtitle: 'Roteiro prático em 5 passos para condução de um exercício de simulação de mesa.',
    readingTimeMin: 4,
    diagramType: 'operational_checklist',
    diagramCaption: 'Passo a Passo Operacional: Seleção de Cenário, Briefing, Disparo, Decision Game e Debriefing.',
    sections: [
      {
        heading: '48.1. Passo a Passo do Instrutor',
        paragraphs: [
          'Passo 1: Acesse "Catálogo de Cenários" ou utilize o "Motor de Cenários" para configurar o tipo de risco e falhas estruturais.',
          'Passo 2: Defina se o exercício será em Modo Treinamento (com pausas didáticas) ou Modo Avaliação Oficial (com cronômetro ininterrupto).',
          'Passo 3: Projete o modelo 3D na tela da Sala de Crise e inicie o relógio através do botão "Iniciar Simulação" na TopBar.',
          'Passo 4: Quando surgir um evento crítico, oriente o aluno comandante a responder o Decision Game em menos de 30 segundos.',
          'Passo 5: Concluído o exercício, abra o modal de "Avaliação & Radar" e gere o Laudo Técnico em PDF para debriefing com a diretoria.'
        ]
      }
    ],
    normativeReferences: ['Manual do Instrutor de Simulação HEDS v4.5']
  },
  {
    pageNumber: 49,
    volumeId: 10,
    volumeTitle: 'Volume X: Guia de Operação, Simulação de Mesa & FAQ Técnico',
    chapterTitle: 'Guia do Aluno / Comandante: Interpretação de Painéis e Tomada de Decisão',
    subtitle: 'Instruções diretas para o profissional que assume o comando das operações no HEDS.',
    readingTimeMin: 4,
    diagramType: 'operational_checklist',
    diagramCaption: 'Matriz de Interpretação das Sondas de Telemetria e Prioridades de Egress.',
    sections: [
      {
        heading: '49.1. Como Vencer o Cenário com Excelência',
        paragraphs: [
          '1. Priorize a Segurança no Local: Nunca dê ordem de evacuação vertical precipitada para pacientes de UTI; use as Áreas de Refúgio do mesmo piso.',
          '2. Monitore as Sondas CFD: Se a temperatura do corredor ultrapassar 38°C ou a visibilidade cair para menos de 8 metros, a evacuação deve ser concluída imediatamente.',
          '3. Mantenha as Portas Fechadas: Uma porta corta-fogo aberta reduz a sobrevivência dos pacientes acamados em 80%.',
          '4. Comunique-se com Clareza: Distribua tarefas específicas para brigadistas e enfermagem pelo canal de rádio.'
        ]
      }
    ],
    normativeReferences: ['Cartilha do Aluno Comandante HEDS']
  },
  {
    pageNumber: 50,
    volumeId: 10,
    volumeTitle: 'Volume X: Guia de Operação, Simulação de Mesa & FAQ Técnico',
    chapterTitle: 'FAQ Técnico, Tabela de Conversão & Bibliografia Geral',
    subtitle: 'Respostas para as 10 dúvidas mais frequentes de engenharia e referências bibliográficas completas.',
    readingTimeMin: 5,
    diagramType: 'regulatory_audit_table',
    diagramCaption: 'Tabela de Unidades Físicas de Engenharia de Fogo e Bibliografia Canônica do HEDS.',
    sections: [
      {
        heading: '50.1. Perguntas Frequentes (FAQ de Engenharia)',
        paragraphs: [
          'Q1: O HEDS substitui o projeto executivo de incêndio do Corpo de Bombeiros? Não; o HEDS é uma ferramenta de simulação computacional de tenibilidade, validação de rotas e treinamento tático de brigadas que complementa o projeto executivo aprovado.',
          'Q2: Os dados do FDS são reais ou inventados? São reais. O simulador integra datasets calibrados do NIST FDS v6.8 e permite fazer upload de arquivos próprios de simulações do PyroSim.',
          'Q3: O simulador pode ser customizado para a planta do meu hospital? Sim; a consultoria HEDS realiza o levantamento BIM/CAD e modela a geometria e os sistemas dos pavimentos do cliente.'
        ],
        bulletPoints: [
          'Drysdale, D. An Introduction to Fire Dynamics. John Wiley & Sons, 2011.',
          'SFPE Handbook of Fire Protection Engineering, 5th Edition. Springer, 2016.',
          'Geoerg, P., de Schot, R., & Lovreglio, R. (2025). Hospital Evacuation Drills in New Zealand. Safety Science.',
          'Hunt, A., Galea, E. R., et al. (2016). Experimental analysis of hospital evacuation devices. Fire and Materials.',
          'Kwak, S. et al. (2021). Dynamics of hospital beds movement in corridors and doors. Fire Technology.',
          'NIST Special Publication 1018: Fire Dynamics Simulator Technical Reference Guide. NIST, 2023.'
        ]
      }
    ],
    normativeReferences: ['ABNT NBR 16651:2019', 'RDC 50 ANVISA:2002', 'ISO 13571:2012', 'NFPA 101:2024']
  }
];
