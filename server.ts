/**
 * HEDS - Hospital Emergency Decision Simulator
 * Node.js / Express Full-Stack Server & REST API
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
