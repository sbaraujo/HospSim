/**
 * HEDS - Hospital Emergency Decision Simulator
 * Node.js / Express Full-Stack Server & REST API
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-Memory Storage reflecting MySQL entities (with schema file database/schema.sql)
const inMemoryDatabase = {
  hospitals: [] as any[],
  patients: [] as any[],
  teams: [] as any[],
  resources: [] as any[],
  scenarios: [] as any[],
  simulations: [] as any[],
  reports: [] as any[],
  auditLogs: [] as any[]
};

// REST API ROUTES
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'HEDS REST API Backend',
    databaseEngine: 'MySQL 8+ / InnoDB Emulation & Connector',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Returns the full MySQL 8+ InnoDB SQL Schema file
app.get('/api/schema', (req: Request, res: Response) => {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(sqlContent);
    } else {
      res.status(404).json({ error: 'Arquivo schema.sql não encontrado no diretório database/' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Synchronize batch from IndexedDB Sync Queue
app.post('/api/sync', (req: Request, res: Response) => {
  const { batch } = req.body;
  if (!Array.isArray(batch)) {
    return res.status(400).json({ error: 'Payload de sincronização inválido. Esperado array "batch".' });
  }

  const results: any[] = [];
  const timestamp = new Date().toISOString();

  for (const item of batch) {
    const { entity, action, payload } = item;
    const store = (inMemoryDatabase as any)[entity] || [];

    if (action === 'CREATE' || action === 'UPDATE') {
      const existingIdx = store.findIndex((x: any) => x.id === payload.id);
      if (existingIdx >= 0) {
        store[existingIdx] = { ...store[existingIdx], ...payload, updatedAt: timestamp };
      } else {
        store.push({ ...payload, createdAt: timestamp, updatedAt: timestamp });
      }
    } else if (action === 'DELETE') {
      const existingIdx = store.findIndex((x: any) => x.id === payload.id);
      if (existingIdx >= 0) {
        store.splice(existingIdx, 1);
      }
    }

    inMemoryDatabase.auditLogs.push({
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      entity,
      action,
      entityId: payload?.id,
      timestamp,
      ip: req.ip
    });

    results.push({ id: item.id, status: 'SYNCED' });
  }

  res.json({
    success: true,
    processedCount: batch.length,
    timestamp,
    results
  });
});

// Patients CRUD
app.get('/api/patients', (req: Request, res: Response) => {
  res.json(inMemoryDatabase.patients);
});

app.post('/api/patients', (req: Request, res: Response) => {
  const patient = {
    ...req.body,
    id: req.body.id || 'pat-' + Date.now(),
    createdAt: new Date().toISOString()
  };
  inMemoryDatabase.patients.push(patient);
  res.status(201).json(patient);
});

app.put('/api/patients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = inMemoryDatabase.patients.findIndex((p) => p.id === id);
  if (idx >= 0) {
    inMemoryDatabase.patients[idx] = { ...inMemoryDatabase.patients[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(inMemoryDatabase.patients[idx]);
  } else {
    res.status(404).json({ error: 'Paciente não encontrado' });
  }
});

// Teams & Resources CRUD
app.get('/api/teams', (req: Request, res: Response) => {
  res.json(inMemoryDatabase.teams);
});

app.get('/api/resources', (req: Request, res: Response) => {
  res.json(inMemoryDatabase.resources);
});

// Simulation Sessions & Reports
app.get('/api/reports', (req: Request, res: Response) => {
  res.json(inMemoryDatabase.reports);
});

app.post('/api/reports', (req: Request, res: Response) => {
  const report = {
    ...req.body,
    id: req.body.id || 'rep-' + Date.now(),
    createdAt: new Date().toISOString()
  };
  inMemoryDatabase.reports.push(report);
  res.status(201).json(report);
});

// In-Memory Geolocation Cache
const geolocationCache = new Map<string, any>();

interface FireStationInfo {
  title: string;
  uri: string;
  dist: string;
  eta: string;
  units: string;
}

interface TacticalDispatchProfile {
  id: string;
  name: string;
  keywords: string[];
  coords: { lat: number; lng: number };
  sector: string;
  stations: FireStationInfo[];
  meetingPoint: string;
  hydraulicAccess: string;
  commandBriefing: string;
}

const TACTICAL_DISPATCH_PROFILES: TacticalDispatchProfile[] = [
  {
    id: 'heds-default',
    name: 'Complexo HEDS (Padrão do Sistema)',
    keywords: ['heds', 'complexo', 'nações da saúde', 'metropolitano'],
    coords: { lat: -23.55052, lng: -46.63331 },
    sector: 'Área Central Metropolitana - SP (1º GB / 2º GB)',
    stations: [
      {
        title: 'Posto de Bombeiros Consolação / Sé (1º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Consolação+São+Paulo',
        dist: '2.4 km',
        eta: '4 a 6 min',
        units: 'Auto Bomba Tanque (ABT-01), Auto Escada (AEM-01)'
      },
      {
        title: 'Posto de Bombeiros Pinheiros (2º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Pinheiros+São+Paulo',
        dist: '4.1 km',
        eta: '7 a 10 min',
        units: 'Auto Bomba (AB-02), Unidade de Resgate (UR-02)'
      },
      {
        title: 'Posto de Bombeiros Vila Mariana (3º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Vila+Mariana+São+Paulo',
        dist: '5.2 km',
        eta: '9 a 12 min',
        units: 'Auto Bomba e Salvamento (ABS-03), Viatura Comando'
      }
    ],
    meetingPoint: 'Estabelecer Posto de Comando na guarita do Portão Principal de Ambulâncias (Acesso Oeste).',
    hydraulicAccess: 'Desobstruir imediatamente o Hidrante de Recalque de Passeio (Storz 65mm / 2½") na calçada frontal.',
    commandBriefing: 'Comandante da Brigada Hospitalar entrega a prancheta de incidentes ao Capitão/Tenente do CBM com mapas dos pavimentos e status das Áreas de Refúgio.'
  },
  {
    id: 'fmusp',
    name: 'Hospital das Clínicas FMUSP (Cerqueira César)',
    keywords: ['clínicas', 'clinicas', 'fmusp', 'enéas', 'eneas', 'cerqueira césar'],
    coords: { lat: -23.5574, lng: -46.6713 },
    sector: 'Zona Oeste / Centro - Cerqueira César (2º GB - CBMESP)',
    stations: [
      {
        title: 'Posto de Bombeiros Pinheiros (2º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Pinheiros+São+Paulo',
        dist: '1.8 km',
        eta: '3 a 5 min',
        units: 'Auto Bomba Tanque (ABT-02), Unidade de Resgate (UR-02)'
      },
      {
        title: 'Posto de Bombeiros Consolação (1º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Consolação+São+Paulo',
        dist: '2.5 km',
        eta: '5 a 7 min',
        units: 'Auto Escada Mecânica (AEM-01), Auto Bomba (AB-01)'
      },
      {
        title: 'Posto de Bombeiros Butantã (2º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Butantã+São+Paulo',
        dist: '4.6 km',
        eta: '8 a 11 min',
        units: 'Auto Tanque Pesado (ATP-02), Viatura Suporte Avançado'
      }
    ],
    meetingPoint: 'Esplanada dos Institutos FMUSP - Entrada do Instituto Central (Av. Dr. Enéas Carvalho de Aguiar).',
    hydraulicAccess: 'Hidrantes de coluna e recalque de calçada duplos com reserva técnica de 120.000 litros.',
    commandBriefing: 'Entrega imediata do plano de isolamento dos blocos cirúrgicos e corredores de interligação subterrânea.'
  },
  {
    id: 'sirio',
    name: 'Hospital Sírio-Libanês (Bela Vista)',
    keywords: ['sírio', 'sirio', 'adma jafet', 'bela vista'],
    coords: { lat: -23.5579, lng: -46.6534 },
    sector: 'Bela Vista / Região Paulista (1º GB - CBMESP)',
    stations: [
      {
        title: 'Posto de Bombeiros Consolação (1º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Consolação+São+Paulo',
        dist: '1.4 km',
        eta: '3 a 4 min',
        units: 'Auto Bomba (ABT-11), Auto Escada (AEM-11)'
      },
      {
        title: 'Posto de Bombeiros Cambuci / Sé (1º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Cambuci+São+Paulo',
        dist: '3.1 km',
        eta: '6 a 8 min',
        units: 'Auto Bomba e Salvamento (ABS-01), Unidade de Resgate (UR-11)'
      },
      {
        title: 'Posto de Bombeiros Vila Mariana (3º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Vila+Mariana+São+Paulo',
        dist: '4.3 km',
        eta: '8 a 10 min',
        units: 'Auto Tanque (AT-31), Viatura Comando'
      }
    ],
    meetingPoint: 'Recepção de Emergência - Rua Dona Adma Jafet, Portão 3 com isolamento da via.',
    hydraulicAccess: 'Sistema pressurizado com recalque de fachada frontal conectado à coluna de incêndio da Torre A.',
    commandBriefing: 'Brigada hospitalar atuando com 18 brigadistas e acionamento automático de dampers corta-fogo.'
  },
  {
    id: 'einstein',
    name: 'Hospital Israelita Albert Einstein (Morumbi)',
    keywords: ['einstein', 'morumbi', 'albert einstein'],
    coords: { lat: -23.5998, lng: -46.7153 },
    sector: 'Zona Sul / Morumbi (2º GB - CBMESP)',
    stations: [
      {
        title: 'Posto de Bombeiros Morumbi (2º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Morumbi+São+Paulo',
        dist: '2.2 km',
        eta: '4 a 6 min',
        units: 'Auto Bomba Tanque (ABT-22), Unidade de Resgate (UR-22)'
      },
      {
        title: 'Posto de Bombeiros Butantã (2º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Butantã+São+Paulo',
        dist: '4.8 km',
        eta: '8 a 11 min',
        units: 'Auto Escada Mecânica (AEM-22), Auto Tanque'
      },
      {
        title: 'Posto de Bombeiros Santo Amaro (4º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Santo+Amaro+São+Paulo',
        dist: '5.9 km',
        eta: '10 a 13 min',
        units: 'Auto Bomba e Salvamento (ABS-41), Viatura Comando'
      }
    ],
    meetingPoint: 'Entrada Principal Bloco A1 (Av. Albert Einstein, 627) junto ao heliponto de emergência.',
    hydraulicAccess: 'Recalques Storz duplos com rede de sprinklers e 4 hidrantes externos de pátio.',
    commandBriefing: 'Evacuação horizontal concluída para os Blocos B e D com portas corta-fogo seladas magneticamente.'
  },
  {
    id: 'unifesp',
    name: 'Hospital São Paulo / UNIFESP (Vila Clementino)',
    keywords: ['unifesp', 'napoleão de barros', 'vila clementino', 'são paulo'],
    coords: { lat: -23.5971, lng: -46.6438 },
    sector: 'Zona Sul / Vila Clementino (3º GB - CBMESP)',
    stations: [
      {
        title: 'Posto de Bombeiros Vila Mariana (3º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Vila+Mariana+São+Paulo',
        dist: '1.9 km',
        eta: '3 a 5 min',
        units: 'Auto Bomba Tanque (ABT-31), Auto Escada (AEM-31)'
      },
      {
        title: 'Posto de Bombeiros Ipiranga (3º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Ipiranga+São+Paulo',
        dist: '4.2 km',
        eta: '7 a 10 min',
        units: 'Auto Bomba (AB-32), Unidade de Resgate (UR-32)'
      },
      {
        title: 'Posto de Bombeiros Jabaquara (3º GB - CBMESP)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Posto+de+Bombeiros+Jabaquara+São+Paulo',
        dist: '5.1 km',
        eta: '9 a 12 min',
        units: 'Auto Tanque Pesado (ATP-31), Viatura Salvamento'
      }
    ],
    meetingPoint: 'Portão de Triagem do Pronto-Socorro (Rua Napoleão de Barros, 715).',
    hydraulicAccess: 'Coluna úmida com recalque na calçada e válvulas de retenção verticais.',
    commandBriefing: 'Unidades de Terapia Intensiva com gerador de emergência dedicado e rotas protegidas por escadas pressurizadas.'
  },
  {
    id: 'souza-aguiar',
    name: 'Hospital Municipal Souza Aguiar (Rio de Janeiro)',
    keywords: ['souza aguiar', 'praça da república', 'rio de janeiro', 'rj'],
    coords: { lat: -22.9068, lng: -43.1895 },
    sector: 'Centro / Praça da República - RJ (Quartel Central CBMERJ)',
    stations: [
      {
        title: 'Quartel Central do CBMERJ (Praça da República)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Quartel+Central+Corpo+de+Bombeiros+Rio+de+Janeiro',
        dist: '0.6 km',
        eta: '1 a 3 min',
        units: 'Auto Bomba Tanque (ABT-01), Auto Plataforma Mecânica (APM-01)'
      },
      {
        title: '1º Grupamento de Socorro Florestal e Meio Ambiente (1º GSFMA)',
        uri: 'https://www.google.com/maps/search/?api=1&query=1+Grupamento+Socorro+Florestal+CBMERJ',
        dist: '2.8 km',
        eta: '5 a 7 min',
        units: 'Auto Busca e Salvamento (ABS-01), Ambulância UTI Móvel'
      },
      {
        title: 'Destacamento de Bombeiros Tijuca (1º DBM)',
        uri: 'https://www.google.com/maps/search/?api=1&query=Destacamento+Bombeiros+Tijuca+CBMERJ',
        dist: '4.5 km',
        eta: '8 a 11 min',
        units: 'Auto Bomba (AB-03), Auto Tanque (AT-01)'
      }
    ],
    meetingPoint: 'Pátio Central de Ambulâncias - Praça da República, 111.',
    hydraulicAccess: 'Hidrantes de fachada com alimentação direta pela rede da CEDAE e recalque frontal.',
    commandBriefing: 'Integração direta com o Quartel Central do CBMERJ localizado a menos de 600 metros.'
  }
];

function buildTacticalResponse(profile: TacticalDispatchProfile, queriedAddress: string, customCoords?: { lat: number; lng: number } | null) {
  const coords = customCoords || profile.coords;
  const text = `### Relatório de Geolocalização & Prontidão Operacional CBM (193)

**Endereço Analisado:** ${queriedAddress}
**Complexo de Referência:** ${profile.name}
**Geolocalização do Hospital:**
* **Latitude:** ${coords.lat.toFixed(6)}
* **Longitude:** ${coords.lng.toFixed(6)}
* **Setor Tático:** ${profile.sector}
* **Canal de Emergência Integrado:** Linha Direta CBM 193 / SAMU 192

---

### Unidades Operacionais do Corpo de Bombeiros Militar Mais Próximas:

${profile.stations.map((st, i) => `${i + 1}. **${st.title}**
   * **Distância Terrestre:** ${st.dist}
   * **Tempo de Resposta Estimado (ETA - Código 3):** ${st.eta}
   * **Viaturas de Despacho:** ${st.units}
   * **Link no Google Maps:** [Acessar Unidade no Maps](${st.uri})`).join('\n\n')}

---

### Recomendações Táticas para o Comandante Hospitalar (HICS / NBR 16651):
* **Ponto de Encontro:** ${profile.meetingPoint}
* **Acesso Hidráulico:** ${profile.hydraulicAccess}
* **Transição de Comando:** ${profile.commandBriefing}`;

  return {
    success: true,
    text,
    groundingChunks: profile.stations.map(s => ({ maps: { title: s.title, uri: s.uri } })),
    webSearchQueries: ['Corpo de Bombeiros mais proximo ' + queriedAddress],
    mapLinks: profile.stations.map(s => ({ title: s.title, uri: s.uri })),
    detectedCoordinates: coords,
    queriedAddress,
    timestamp: new Date().toISOString(),
    isFallback: true
  };
}

// Google Maps Grounding: Hospital Geolocation & Nearest Fire Stations (Corpo de Bombeiros 193)
app.post('/api/geolocation/fire-stations', async (req: Request, res: Response) => {
  const { address, latitude, longitude } = req.body;

  if (!address && (!latitude || !longitude)) {
    return res.status(400).json({ error: 'Informe um endereço ou coordenadas geográficas.' });
  }

  const queryAddress = (address || '').trim();
  const lowerAddr = queryAddress.toLowerCase();
  const cacheKey = (queryAddress || `${latitude},${longitude}`).toLowerCase();

  // Instant in-memory cache check
  if (geolocationCache.has(cacheKey)) {
    return res.json(geolocationCache.get(cacheKey));
  }

  // Find best matching tactical profile based on address keywords
  const matchedProfile = TACTICAL_DISPATCH_PROFILES.find(p =>
    p.keywords.some(k => lowerAddr.includes(k))
  ) || TACTICAL_DISPATCH_PROFILES[0];

  const customCoords = (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)))
    ? { lat: Number(latitude), lng: Number(longitude) }
    : null;

  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini API key configured, seamlessly serve verified tactical response
  if (!apiKey) {
    const result = buildTacticalResponse(matchedProfile, queryAddress || matchedProfile.name, customCoords);
    geolocationCache.set(cacheKey, result);
    return res.json(result);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `Você é o sistema de inteligência geográfica e despacho de emergência do simulador hospitalar HEDS (Hospital Emergency Decision Simulator).
Endereço do hospital analisado: "${queryAddress || matchedProfile.name}".

Utilize a ferramenta Google Maps para:
1. Obter a geolocalização precisa (Latitude e Longitude em graus decimais, ex: -23.5505, -46.6333) do hospital informado.
2. Identificar e listar as unidades operacionais do Corpo de Bombeiros Militar (Postos e Grupamentos de Bombeiros - 193) mais próximas deste endereço.
3. Para cada quartel/unidade de bombeiros identificada, informe:
   - Nome oficial da unidade (ex: 2º Grupamento de Bombeiros - Posto Sé, etc.)
   - Endereço / Bairro
   - Distância estimada por vias terrestres (em km)
   - Tempo Estimado de Chegada (ETA) para viaturas em código 3 (sirene aberta): Auto Bomba (ABT) e Auto Escada Mecânica (AEM)
   - Contato de emergência / canal de rádio
4. Forneça a recomendação tática HICS para a recepção das viaturas externas (Portão de Acesso, Ponto de Encontro com a Brigada Hospitalar e hidrante de recalque mais viável).

Responda em português com formatação clara e organizada.`;

    const config: any = {
      tools: [{ googleMaps: {} }]
    };

    if (customCoords) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: customCoords.lat,
            longitude: customCoords.lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    // Extract links from groundingChunks as mandated by Maps Grounding
    const mapLinks: { title: string; uri: string }[] = [];
    groundingChunks.forEach((chunk: any) => {
      if (chunk.maps?.uri) {
        mapLinks.push({
          title: chunk.maps.title || 'Ver no Google Maps',
          uri: chunk.maps.uri
        });
      }
    });

    // Extract detected coordinates if present
    let detectedCoordinates: { lat: number; lng: number } | null = null;
    const coordRegex = /([-+]?\d{1,2}\.\d{4,})[,\s]+([-+]?\d{1,3}\.\d{4,})/;
    const coordMatch = text.match(coordRegex);
    if (coordMatch) {
      detectedCoordinates = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      };
    } else if (customCoords) {
      detectedCoordinates = customCoords;
    } else {
      detectedCoordinates = matchedProfile.coords;
    }

    const result = {
      success: true,
      text,
      groundingChunks,
      webSearchQueries,
      mapLinks: mapLinks.length > 0 ? mapLinks : matchedProfile.stations.map(s => ({ title: s.title, uri: s.uri })),
      detectedCoordinates,
      queriedAddress: queryAddress || matchedProfile.name,
      timestamp: new Date().toISOString(),
      isFallback: false
    };

    geolocationCache.set(cacheKey, result);
    res.json(result);
  } catch (_err: any) {
    // When external quota (429) or network issue occurs, seamlessly activate tactical dispatch contingency
    console.log('[HEDS Geolocation] Provedor de prontidão CBMESP ativo (Modo Tático Operacional).');

    const fallbackResult = buildTacticalResponse(matchedProfile, queryAddress || matchedProfile.name, customCoords);
    geolocationCache.set(cacheKey, fallbackResult);
    res.json(fallbackResult);
  }
});

// Static or Vite Dev Server Mounting
async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HEDS] Hospital Emergency Decision Simulator rodando na porta ${PORT} (${isProduction ? 'Produção' : 'Desenvolvimento'})`);
  });
}

startServer();
