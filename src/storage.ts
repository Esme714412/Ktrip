const DATABASE_NAME = 'ktrip-offline';
const DATABASE_VERSION = 1;
const STORE_NAME = 'appData';

export const DATA_KEYS = [
  'rates',
  'categories',
  'posts',
  'itinerary',
  'shopping',
  'expenses',
  'tripStartDate',
  'displayCurrency'
] as const;

export type DataKey = typeof DATA_KEYS[number];

type StoredValue = {
  key: DataKey;
  value: unknown;
};

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('此瀏覽器不支援 IndexedDB，無法離線儲存旅行資料。'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('無法開啟 IndexedDB。'));
    request.onblocked = () => reject(new Error('IndexedDB 升級遭其他分頁阻擋，請關閉其他 ktrip 分頁後重試。'));
  }).catch((error) => {
    databasePromise = undefined;
    throw error;
  });

  return databasePromise;
}

function readValue(database: IDBDatabase, key: DataKey): Promise<StoredValue | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result as StoredValue | undefined);
    request.onerror = () => reject(request.error ?? new Error(`無法讀取 IndexedDB 資料：${key}`));
    transaction.onabort = () => reject(transaction.error ?? new Error(`讀取 IndexedDB 交易失敗：${key}`));
  });
}

function writeValues(database: IDBDatabase, values: StoredValue[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    values.forEach((entry) => store.put(entry));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('無法儲存旅行資料至 IndexedDB。'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 儲存交易已中止。'));
  });
}

export async function loadAppData<T extends Record<DataKey, unknown>>(
  defaults: T
): Promise<T> {
  const database = await openDatabase();
  const storedValues = await Promise.all(DATA_KEYS.map((key) => readValue(database, key)));
  const result = { ...defaults };
  const migratedValues: StoredValue[] = [];

  DATA_KEYS.forEach((key, index) => {
    const stored = storedValues[index];
    if (stored) {
      result[key] = stored.value as T[typeof key];
      return;
    }

    const legacyValue = window.localStorage.getItem(`ktrip_${key}`);
    const value = legacyValue === null ? defaults[key] : JSON.parse(legacyValue);
    result[key] = value as T[typeof key];
    migratedValues.push({ key, value });
  });

  if (migratedValues.length > 0) {
    await writeValues(database, migratedValues);
  }

  return result;
}

export async function saveAppData(key: DataKey, value: unknown): Promise<void> {
  const database = await openDatabase();
  await writeValues(database, [{ key, value }]);
}
