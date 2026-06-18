// Optional dynamic import of ioredis to avoid dev-time type errors when package not installed
let redisClient: any = null;
let memoryMap: Map<string, { count: number; lastReset: number }> | null = new Map();

async function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const IORedis = (await import("ioredis")).default;
    redisClient = new IORedis(url);
    // clear memory fallback when using redis
    memoryMap = null;
    return redisClient;
  } catch (err) {
    // ioredis not installed or failed to load
    console.warn("ioredis not available, falling back to in-memory rate limiter.");
    return null;
  }
}

/**
 * Check and increment a rate counter. Uses Redis if `REDIS_URL` is set,
 * otherwise falls back to an in-memory Map (best-effort, non-persistent).
 * @param ip Client IP string
 * @param scopeKey Logical key (e.g., 'coach', 'simulate')
 * @param max Max requests in window
 * @param windowMs Window length in milliseconds
 */
export async function isRateLimited(ip: string, scopeKey = "global", max = 60, windowMs = 60000): Promise<boolean> {
  const redis = await getRedis();
  const key = `rate:${scopeKey}:${ip}`;

  if (redis) {
    try {
      const cur = await redis.incr(key);
      if (cur === 1) {
        await redis.pexpire(key, windowMs);
      }
      return cur > max;
    } catch (err) {
      console.error("RateLimiter Redis error:", err);
      // fall through to in-memory fallback if available
    }
  }

  // In-memory fallback
  if (!memoryMap) memoryMap = new Map();
  const now = Date.now();
  const entry = memoryMap.get(key);
  if (!entry) {
    memoryMap.set(key, { count: 1, lastReset: now });
    return false;
  }
  if (now - entry.lastReset > windowMs) {
    memoryMap.set(key, { count: 1, lastReset: now });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

export function resetMemoryRateLimits() {
  if (memoryMap) memoryMap.clear();
}

const rateLimiter = { isRateLimited, resetMemoryRateLimits };
export default rateLimiter;
