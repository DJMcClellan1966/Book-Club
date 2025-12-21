const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: Missing required Supabase environment variables.');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Optimized client configuration for speed and reliability
const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Server-side doesn't need persistence
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'bookclub-backend',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting for real-time
    },
  },
};

// Client for user-facing operations (respects RLS)
// Uses connection pooling automatically
const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);

// Admin client for server-side operations (bypasses RLS)
// Optimized for high-performance server operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  ...clientOptions,
  auth: {
    autoRefreshToken: false, // Admin doesn't need token refresh
    persistSession: false,
  },
});

// In-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cached query wrapper for read operations
 * @param {string} cacheKey - Unique cache key
 * @param {Function} queryFn - Function that returns a Supabase query promise
 * @param {number} ttl - Cache TTL in milliseconds (default: 5 minutes)
 */
async function cachedQuery(cacheKey, queryFn, ttl = CACHE_TTL) {
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await queryFn();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Cleanup old cache entries
  if (cache.size > 1000) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  return data;
}

/**
 * Invalidate cache by key or pattern
 */
function invalidateCache(keyPattern) {
  if (typeof keyPattern === 'string') {
    cache.delete(keyPattern);
  } else if (keyPattern instanceof RegExp) {
    for (const key of cache.keys()) {
      if (keyPattern.test(key)) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Retry wrapper for database operations
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 */
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.code && error.code.toString().startsWith('4')) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Batch operations helper for bulk inserts/updates
 * @param {string} table - Table name
 * @param {Array} items - Items to insert/update
 * @param {number} batchSize - Size of each batch
 */
async function batchOperation(table, items, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert(batch)
      .select();
    
    if (error) throw error;
    results.push(...data);
  }
  
  return results;
}

module.exports = { 
  supabase, 
  supabaseAdmin,
  cachedQuery,
  invalidateCache,
  withRetry,
  batchOperation,
};
