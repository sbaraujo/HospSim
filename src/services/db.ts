/**
 * HEDS - Hospital Emergency Decision Simulator
 * IndexedDB Offline Storage & Local Persistence Service
 */

import {
  Hospital,
  Floor,
  Room,
  Patient,
  Team,
  ResourceItem,
  Equipment,
  Scenario,
  SimulationDecisionRecord,
  SimulationLogEntry,
  EvaluationResult,
  ReportData
} from '../types';

import {
  INITIAL_HOSPITAL,
  INITIAL_FLOORS,
  INITIAL_ROOMS,
  INITIAL_PATIENTS,
  INITIAL_TEAMS,
  INITIAL_RESOURCES,
  INITIAL_EQUIPMENT,
  MASTER_SCENARIO
} from '../data/seedData';

const DB_NAME = 'heds_offline_db';
const DB_VERSION = 1;

export interface SyncQueueItem {
  id: string;
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const stores = [
          'hospitals',
          'floors',
          'rooms',
          'patients',
          'teams',
          'resources',
          'equipment',
          'scenarios',
          'simulation_sessions',
          'simulation_decisions',
          'simulation_logs',
          'evaluations',
          'reports',
          'sync_queue'
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        const db = request.result;
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Initialize with seed data if database is empty
  async initializeWithSeedData(): Promise<void> {
    const db = await this.openDB();
    const existingPatients = await this.getAll<Patient>('patients');

    if (existingPatients.length === 0) {
      console.log('[HEDS IndexedDB] Base de dados vazia. Semeando dados iniciais...');
      await this.put('hospitals', INITIAL_HOSPITAL);
      
      for (const floor of INITIAL_FLOORS) {
        await this.put('floors', floor);
      }
      for (const room of INITIAL_ROOMS) {
        await this.put('rooms', room);
      }
      for (const patient of INITIAL_PATIENTS) {
        await this.put('patients', patient);
      }
      for (const team of INITIAL_TEAMS) {
        await this.put('teams', team);
      }
      for (const resource of INITIAL_RESOURCES) {
        await this.put('resources', resource);
      }
      for (const equip of INITIAL_EQUIPMENT) {
        await this.put('equipment', equip);
      }
      await this.put('scenarios', MASTER_SCENARIO);
      console.log('[HEDS IndexedDB] Semeação concluída com sucesso!');
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: string | number): Promise<T | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T extends { id: any }>(storeName: string, item: T, queueSync = true): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = async () => {
        if (queueSync && storeName !== 'sync_queue') {
          await this.addToSyncQueue(storeName, 'UPDATE', item);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string | number, queueSync = true): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = async () => {
        if (queueSync && storeName !== 'sync_queue') {
          await this.addToSyncQueue(storeName, 'DELETE', { id });
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue management
  async addToSyncQueue(entity: string, action: 'CREATE' | 'UPDATE' | 'DELETE', payload: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      entity,
      action,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.put(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const all = await this.getAll<SyncQueueItem>('sync_queue');
    return all.filter((item) => item.status === 'PENDING');
  }

  async markSyncItemsSynced(ids: string[]): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');

    for (const id of ids) {
      store.delete(id);
    }
  }

  async resetToDefaults(): Promise<void> {
    const db = await this.openDB();
    const stores = [
      'hospitals',
      'floors',
      'rooms',
      'patients',
      'teams',
      'resources',
      'equipment',
      'scenarios',
      'simulation_sessions',
      'simulation_decisions',
      'simulation_logs',
      'evaluations',
      'reports',
      'sync_queue'
    ];

    const transaction = db.transaction(stores, 'readwrite');
    for (const name of stores) {
      transaction.objectStore(name).clear();
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = async () => {
        await this.initializeWithSeedData();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const dbService = new IndexedDBStorage();
