/**
 * HEDS - Hospital Emergency Decision Simulator
 * Synchronization Service between IndexedDB and MySQL Backend REST API
 */

import { dbService, SyncQueueItem } from './db';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

class SyncService {
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleConnectivityChange(true));
      window.addEventListener('offline', () => this.handleConnectivityChange(false));

      // Attempt periodic sync if online
      setInterval(() => {
        if (navigator.onLine) {
          this.triggerSync();
        }
      }, 30000);
    }
  }

  private handleConnectivityChange(online: boolean) {
    this.notify();
    if (online) {
      console.log('[HEDS Sync] Conexão detectada. Iniciando sincronização em segundo plano...');
      this.triggerSync();
    }
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    this.notify();
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  public async getStatus(): Promise<SyncStatus> {
    const pendingItems = await dbService.getPendingSyncItems();
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: pendingItems.length,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError
    };
  }

  private async notify() {
    const status = await this.getStatus();
    this.statusListeners.forEach((fn) => fn(status));
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, syncedCount: 0, error: 'Sem conexão com a Internet.' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      const pendingItems = await dbService.getPendingSyncItems();

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.lastSyncTime = new Date().toISOString();
        this.notify();
        return { success: true, syncedCount: 0 };
      }

      // Send batch to backend REST API
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: pendingItems })
      });

      if (!response.ok) {
        throw new Error(`Servidor respondeu com código ${response.status}`);
      }

      const result = await response.json();
      const syncedIds = pendingItems.map((item) => item.id);
      await dbService.markSyncItemsSynced(syncedIds);

      this.lastSyncTime = new Date().toISOString();
      this.isSyncing = false;
      this.notify();
      return { success: true, syncedCount: pendingItems.length };
    } catch (err: any) {
      console.warn('[HEDS Sync] Falha ao sincronizar com servidor REST:', err.message);
      this.lastError = err.message || 'Falha de comunicação com o backend MySQL.';
      this.isSyncing = false;
      this.notify();
      return { success: false, syncedCount: 0, error: this.lastError || undefined };
    }
  }
}

export const syncService = new SyncService();
