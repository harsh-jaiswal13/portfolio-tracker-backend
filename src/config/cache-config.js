import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
let cacheStore;
export async function initCache() {
  console.log(' Initializing file-based cache...')  ;
    cacheStore = createFileCache();
  return cacheStore;
}

function createFileCache() {
  const cacheDir = './cache/stocks';
  
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  class FileStore {
    constructor(cacheDir) {
      this.cacheDir = cacheDir;
      this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    }

    getFilePath(key) {
      const hash = crypto.createHash('md5').update(key).digest('hex');
      return join(this.cacheDir, `${hash}.json`);
    }

    get(key) {
      const filePath = this.getFilePath(key);
      
      try {
        if (!existsSync(filePath)) {
          return undefined;
        }

        const data = readFileSync(filePath, 'utf8');
        const item = JSON.parse(data);
        
        if (item.expires && Date.now() > item.expires) {
          unlinkSync(filePath);
          return undefined;
        }
        
        return item.value;
      } catch (error) {
        console.error(`Error reading cache file ${key}:`, error.message);
        return undefined;
      }
    }

    set(key, value, ttl) {
      const filePath = this.getFilePath(key);
      
      try {
        const item = {
          key,
          value,
          expires: ttl ? Date.now() + ttl : null,
          created: Date.now(),
        };
        
        writeFileSync(filePath, JSON.stringify(item, null, 2));
      } catch (error) {
        console.error(`Error writing cache file ${key}:`, error.message);
      }
    }

    delete(key) {
      const filePath = this.getFilePath(key);
      
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error deleting cache file ${key}:`, error.message);
      }
    }

    clear() {
      try {
        const files = readdirSync(this.cacheDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            unlinkSync(join(this.cacheDir, file));
          }
        }
        
        console.log(`🧹 Cleared ${files.length} cache files`);
      } catch (error) {
        console.error('Error clearing cache:', error.message);
      }
    }

    cleanup() {
      try {
        const files = readdirSync(this.cacheDir);
        let cleaned = 0;
        const now = Date.now();
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = join(this.cacheDir, file);
          
          try {
            const data = readFileSync(filePath, 'utf8');
            const item = JSON.parse(data);
            
            if (item.expires && now > item.expires) {
              unlinkSync(filePath);
              cleaned++;
            }
          } catch (error) {
            unlinkSync(filePath);
            cleaned++;
          }
        }
        
        if (cleaned > 0) {
          console.log(` Cleaned ${cleaned} expired cache files`);
        }
      } catch (error) {
        console.error('Error in cache cleanup:', error.message);
      }
    }

    disconnect() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
    }
  }

  const fileStore = new FileStore(cacheDir);

  process.on('exit', () => fileStore.disconnect());
  process.on('SIGINT', () => {
    fileStore.disconnect();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    fileStore.disconnect();
    process.exit(0);
  });

  return {
    get: async (key) => fileStore.get(key),
    set: async (key, value, ttl) => fileStore.set(key, value, ttl),
    delete: async (key) => fileStore.delete(key),
    clear: async () => fileStore.clear(),
    disconnect: () => fileStore.disconnect(),
  };
}

export function getCache() {
  if (!cacheStore) {
    throw new Error('Cache not initialized');
  }
  return cacheStore;
}