/**
 * HEDS - Hospital Emergency Decision Simulator
 * Database, Synchronization & MySQL Configuration Modal
 */

import React, { useState, useEffect } from 'react';
import { SyncStatus } from '../services/syncService';
import { dbService } from '../services/db';
import {
  Database,
  RefreshCw,
  Server,
  FileCode,
  Download,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Copy,
  Check
} from 'lucide-react';

interface ConfigSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  onTriggerSync: () => void;
  onResetDatabase: () => void;
}

export const ConfigSyncModal: React.FC<ConfigSyncModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onTriggerSync,
  onResetDatabase
}) => {
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'schema' | 'instrucoes'>('sync');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/schema')
      .then((r) => r.text())
      .then((sql) => setSchemaSql(sql))
      .catch(() => setSchemaSql('-- Erro ao carregar schema do backend'));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSchema = () => {
    const blob = new Blob([schemaSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heds-mysql8-innodb-schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ARQUITETURA, SINCRONIZAÇÃO E BANCO MYSQL</h2>
              <p className="text-xs text-slate-400">
                IndexedDB Offline ↔ REST API ↔ MySQL 8+ / InnoDB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'sync' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Fila de Sincronização & Status
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'schema' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> Schema SQL (MySQL 8+ / InnoDB)
          </button>
          <button
            onClick={() => setActiveTab('instrucoes')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'instrucoes' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Instruções de Instalação Local
          </button>
        </div>

        {/* Tab 1: Sync Status */}
        {activeTab === 'sync' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Status de Conectividade</div>
                <div className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                  {syncStatus.isOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Online (Conectado)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Offline (IndexedDB)
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Itens Pendentes na Fila</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                  {syncStatus.pendingCount} registros
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Última Sincronização</div>
                <div className="text-xs font-mono text-slate-300 mt-2">
                  {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString('pt-BR') : 'Aguardando sincronismo'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Garantia de Isolamento Arquitetural (Off-line First)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Em estrita conformidade com a especificação, o frontend <strong>NÃO realiza chamadas diretas ao banco MySQL</strong>.
                Todas as operações de criação, leitura, atualização e exclusão ocorrem localmente no <strong>IndexedDB</strong> através do Service Worker.
                Quando a conexão com a Internet for restaurada, os dados acumulados são empacotados e transmitidos via requisição segura para o endpoint <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">/api/sync</code> do Express.js, que persiste no banco relacional.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={onResetDatabase}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Restaurar Dados Iniciais de Fábrica
              </button>

              <button
                onClick={onTriggerSync}
                disabled={syncStatus.isSyncing}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar com MySQL Agora
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: SQL Schema */}
        {activeTab === 'schema' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Arquivo <code className="text-cyan-300">database/schema.sql</code> (Todas as 35+ tabelas, constraints e seeds)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar SQL'}
                </button>
                <button
                  onClick={handleDownloadSchema}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar .SQL
                </button>
              </div>
            </div>

            <pre className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-200/90 overflow-y-auto max-h-[50vh] leading-relaxed">
              {schemaSql || '-- Carregando script DDL do MySQL 8+ / InnoDB...'}
            </pre>
          </div>
        )}

        {/* Tab 3: Local Instructions */}
        {activeTab === 'instrucoes' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300 leading-relaxed">
            <h3 className="text-sm font-bold text-white">Instruções para Execução Local com MySQL 8+</h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400">1. Clonar ou Baixar o Projeto</h4>
              <p>Execute no terminal da máquina:</p>
              <pre className="bg-slate-900 p-2.5 rounded font-mono text-slate-200 text-[11px]">
                git clone &lt;repo-url&gt; &amp;&amp; cd heds-simulator
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400">2. Instalação das Dependências</h4>
              <p>Instale os pacotes Node.js e ferramentas de build:</p>
              <pre className="bg-slate-900 p-2.5 rounded font-mono text-slate-200 text-[11px]">
                npm install
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400">3. Inicializar o Banco de Dados MySQL 8+</h4>
              <p>Execute o script SQL fornecido na pasta <code className="text-cyan-300">database/schema.sql</code>:</p>
              <pre className="bg-slate-900 p-2.5 rounded font-mono text-slate-200 text-[11px]">
                mysql -u root -p &lt; database/schema.sql
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400">4. Executar em Modo de Desenvolvimento</h4>
              <p>Inicie o servidor full-stack Express + Vite dev na porta 3000:</p>
              <pre className="bg-slate-900 p-2.5 rounded font-mono text-slate-200 text-[11px]">
                npm run dev
              </pre>
              <p className="text-slate-400">Acesse em seu navegador: <code className="text-white">http://localhost:3000</code></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
