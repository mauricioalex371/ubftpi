import { Student, ClassEntity, AttendanceRecord, MonthlyFee, CashTransaction, TrialStudent, AppSettings } from '../types';
import { SEED_SETTINGS, SEED_STUDENTS, SEED_CLASSES, SEED_ATTENDANCE, SEED_FEES, SEED_CASH } from './seedData';

const DB_NAME = 'ubf_team_pwa_db';
const DB_VERSION = 1;

export interface DBStores {
  settings: AppSettings;
  students: Student;
  classes: ClassEntity;
  attendance: AttendanceRecord;
  fees: MonthlyFee;
  cash: CashTransaction;
  trials: TrialStudent;
}

export type StoreName = keyof DBStores;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('students')) {
        db.createObjectStore('students', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('classes')) {
        db.createObjectStore('classes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('fees')) {
        db.createObjectStore('fees', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cash')) {
        db.createObjectStore('cash', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('trials')) {
        db.createObjectStore('trials', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Request persistent storage on mobile Safari / Chrome
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn('Storage persistence request failed', e);
    }
  }
  return false;
}

// Generic CRUD operations
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function putInStore<T>(storeName: StoreName, item: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: StoreName, key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get('app_settings');

    request.onsuccess = () => {
      if (request.result && request.result.value) {
        resolve(request.result.value as AppSettings);
      } else {
        // Default empty settings
        resolve({
          academyName: 'UBF Team Parque Indiano',
          masterName: 'Mestre Uarlei Silva',
          isConfigured: false
        });
      }
    };
    request.onerror = () => {
      resolve({
        academyName: 'UBF Team Parque Indiano',
        masterName: 'Mestre Uarlei Silva',
        isConfigured: false
      });
    };
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const request = store.put({ key: 'app_settings', value: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Backup Export & Import (JSON)
export async function exportDatabaseJSON(): Promise<string> {
  const [settings, students, classes, attendance, fees, cash, trials] = await Promise.all([
    getSettings(),
    getAllFromStore<Student>('students'),
    getAllFromStore<ClassEntity>('classes'),
    getAllFromStore<AttendanceRecord>('attendance'),
    getAllFromStore<MonthlyFee>('fees'),
    getAllFromStore<CashTransaction>('cash'),
    getAllFromStore<TrialStudent>('trials')
  ]);

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    students,
    classes,
    attendance,
    fees,
    cash,
    trials
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importDatabaseJSON(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') return false;

    // Clear existing stores
    await Promise.all([
      clearStore('students'),
      clearStore('classes'),
      clearStore('attendance'),
      clearStore('fees'),
      clearStore('cash'),
      clearStore('trials')
    ]);

    // Restore settings
    if (data.settings) {
      await saveSettings({
        ...data.settings,
        lastBackupDate: new Date().toISOString()
      });
    }

    // Restore arrays
    if (Array.isArray(data.students)) {
      for (const s of data.students) await putInStore('students', s);
    }
    if (Array.isArray(data.classes)) {
      for (const c of data.classes) await putInStore('classes', c);
    }
    if (Array.isArray(data.attendance)) {
      for (const a of data.attendance) await putInStore('attendance', a);
    }
    if (Array.isArray(data.fees)) {
      for (const f of data.fees) await putInStore('fees', f);
    }
    if (Array.isArray(data.cash)) {
      for (const c of data.cash) await putInStore('cash', c);
    }
    if (Array.isArray(data.trials)) {
      for (const t of data.trials) await putInStore('trials', t);
    }

    return true;
  } catch (err) {
    console.error('Import backup failed', err);
    return false;
  }
}

// Seed initial data if the database is empty (first install)
export async function seedIfEmpty(): Promise<boolean> {
  try {
    const existingStudents = await getAllFromStore<Student>('students');
    if (existingStudents.length > 0) {
      // Already has data, skip seeding
      return false;
    }

    // Save settings
    await saveSettings(SEED_SETTINGS);

    // Save all seed data in parallel batches
    for (const s of SEED_STUDENTS) await putInStore('students', s);
    for (const c of SEED_CLASSES) await putInStore('classes', c);
    for (const a of SEED_ATTENDANCE) await putInStore('attendance', a);
    for (const f of SEED_FEES) await putInStore('fees', f);
    for (const t of SEED_CASH) await putInStore('cash', t);

    return true;
  } catch (err) {
    console.error('Seed failed', err);
    return false;
  }
}
