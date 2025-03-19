import { toast } from "sonner";

const DB_NAME = 'gitalytics';
const DB_VERSION = 1;
const CACHE_STORE = 'apiCache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

class CacheService {
  private db: IDBDatabase | null = null;
  private debug: boolean = true; // Enable debug logging

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        if (this.debug) {
          console.log("✅ IndexedDB connected successfully");
        }
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
          if (this.debug) {
            console.log("📦 Cache store created");
          }
        }
      };
    });
  }

  async get(key: string): Promise<any | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry;
        if (!entry) {
          if (this.debug) {
            console.log(`🔍 Cache miss for key: ${key}`);
          }
          resolve(null);
          return;
        }

        // Check if cache is expired
        if (Date.now() - entry.timestamp > CACHE_DURATION) {
          if (this.debug) {
            console.log(`⏰ Cache expired for key: ${key}`);
          }
          this.delete(key); // Clean up expired entry
          resolve(null);
          return;
        }

        if (this.debug) {
          console.log(`✨ Cache hit for key: ${key}`);
          console.log(`📅 Cached at: ${new Date(entry.timestamp).toLocaleString()}`);
          console.log(`⏳ Time until expiry: ${Math.round((CACHE_DURATION - (Date.now() - entry.timestamp)) / 1000)}s`);
        }

        resolve(entry.data);
      };

      request.onerror = () => {
        console.error("Error reading from cache:", request.error);
        resolve(null);
      };
    });
  }

  async set(key: string, data: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.put({
        key,
        data,
        timestamp: Date.now()
      });

      request.onsuccess = () => {
        if (this.debug) {
          console.log(`💾 Cached data for key: ${key}`);
          console.log(`📦 Cache size: ${JSON.stringify(data).length} bytes`);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.delete(key);

      request.onsuccess = () => {
        if (this.debug) {
          console.log(`🗑️ Deleted cache for key: ${key}`);
        }
        resolve();
      };

      request.onerror = () => {
        console.error("Error deleting from cache:", request.error);
        resolve();
      };
    });
  }

  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);

      // Get count before clearing
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        const count = countRequest.result;

        // Clear the store
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
          if (this.debug) {
            console.log(`🧹 Cleared ${count} items from cache`);
          }
          toast.success(`Cleared ${count} cached items successfully`);
          resolve();
        };

        clearRequest.onerror = () => {
          console.error("Error clearing cache:", clearRequest.error);
          toast.error("Failed to clear cache");
          resolve();
        };
      };
    });
  }

  // New method to get cache statistics
  async getStats(): Promise<{ count: number; size: number; entries: CacheEntry[] }> {
    await this.init();
    if (!this.db) return { count: 0, size: 0, entries: [] };

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];
        const stats = {
          count: entries.length,
          size: new Blob([JSON.stringify(entries)]).size,
          entries
        };

        if (this.debug) {
          console.log('📊 Cache Statistics:', {
            count: stats.count,
            size: `${Math.round(stats.size / 1024)} KB`,
            entries: entries.map(e => ({
              key: e.key,
              age: Math.round((Date.now() - e.timestamp) / 1000) + 's',
              expires: Math.round((CACHE_DURATION - (Date.now() - e.timestamp)) / 1000) + 's'
            }))
          });
        }

        resolve(stats);
      };

      request.onerror = () => {
        console.error("Error getting cache stats:", request.error);
        resolve({ count: 0, size: 0, entries: [] });
      };
    });
  }
}

export const cacheService = new CacheService();