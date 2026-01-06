/**
 * LocalStorage caching utilities for NFT Catalog
 * Provides versioned caching with expiration
 */

const CACHE_VERSION = '1.0';
const CACHE_KEYS = {
  NFT_DATA: 'brinkman_nft_catalog_data',
  PRICE_DATA: 'brinkman_nft_price_data',
  METADATA: 'brinkman_cache_metadata'
};

interface CacheMetadata {
  version: string;
  lastUpdated: string;
  expiresAt: string;
}

interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get cache expiration time (24 hours from now)
 */
function getExpirationTime(hoursFromNow: number = 24): string {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hoursFromNow);
  return expiration.toISOString();
}

/**
 * Check if cache is expired
 */
function isCacheExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Save data to localStorage with metadata
 */
export function saveToCache<T>(key: string, data: T, expirationHours: number = 24): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const cachedData: CachedData<T> = {
      data,
      metadata: {
        version: CACHE_VERSION,
        lastUpdated: new Date().toISOString(),
        expiresAt: getExpirationTime(expirationHours)
      }
    };

    localStorage.setItem(key, JSON.stringify(cachedData));
    console.log(`✅ Cached ${key} (expires in ${expirationHours}h)`);
    return true;
  } catch (e) {
    console.error(`Failed to save to cache: ${key}`, e);
    // If storage is full, try to clear old data
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old cache...');
      clearCache();
      // Try again after clearing
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          metadata: {
            version: CACHE_VERSION,
            lastUpdated: new Date().toISOString(),
            expiresAt: getExpirationTime(expirationHours)
          }
        }));
        return true;
      } catch (retryError) {
        console.error('Failed to save even after clearing cache', retryError);
      }
    }
    return false;
  }
}

/**
 * Get data from localStorage cache
 */
export function getFromCache<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const cachedData: CachedData<T> = JSON.parse(cached);

    // Check version compatibility
    if (cachedData.metadata.version !== CACHE_VERSION) {
      console.log(`Cache version mismatch for ${key}, clearing...`);
      localStorage.removeItem(key);
      return null;
    }

    // Check expiration
    if (isCacheExpired(cachedData.metadata.expiresAt)) {
      console.log(`Cache expired for ${key}, clearing...`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`✅ Loaded ${key} from cache (cached at ${cachedData.metadata.lastUpdated})`);
    return cachedData.data;
  } catch (e) {
    console.error(`Failed to read from cache: ${key}`, e);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Save NFT catalog data to cache
 */
export function cacheNFTData(data: any[]): boolean {
  return saveToCache(CACHE_KEYS.NFT_DATA, data, 24); // Cache for 24 hours
}

/**
 * Get NFT catalog data from cache
 */
export function getCachedNFTData(): any[] | null {
  return getFromCache<any[]>(CACHE_KEYS.NFT_DATA);
}

/**
 * Save price data to cache
 */
export function cachePriceData(prices: Record<string, string>): boolean {
  return saveToCache(CACHE_KEYS.PRICE_DATA, prices, 1); // Cache for 1 hour (prices change frequently)
}

/**
 * Get price data from cache
 */
export function getCachedPriceData(): Record<string, string> | null {
  return getFromCache<Record<string, string>>(CACHE_KEYS.PRICE_DATA);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('✅ Cache cleared');
  } catch (e) {
    console.error('Failed to clear cache', e);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  hasNFTData: boolean;
  hasPriceData: boolean;
  nftDataAge?: string;
  priceDataAge?: string;
  totalSize: number;
} {
  const stats = {
    hasNFTData: false,
    hasPriceData: false,
    nftDataAge: undefined as string | undefined,
    priceDataAge: undefined as string | undefined,
    totalSize: 0
  };

  if (!isLocalStorageAvailable()) {
    return stats;
  }

  try {
    // Check NFT data
    const nftCache = localStorage.getItem(CACHE_KEYS.NFT_DATA);
    if (nftCache) {
      stats.hasNFTData = true;
      stats.totalSize += nftCache.length;
      try {
        const parsed: CachedData<any> = JSON.parse(nftCache);
        stats.nftDataAge = parsed.metadata.lastUpdated;
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check price data
    const priceCache = localStorage.getItem(CACHE_KEYS.PRICE_DATA);
    if (priceCache) {
      stats.hasPriceData = true;
      stats.totalSize += priceCache.length;
      try {
        const parsed: CachedData<any> = JSON.parse(priceCache);
        stats.priceDataAge = parsed.metadata.lastUpdated;
      } catch (e) {
        // Ignore parse errors
      }
    }
  } catch (e) {
    console.error('Failed to get cache stats', e);
  }

  return stats;
}

/**
 * Format cache size in human-readable format
 */
export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
