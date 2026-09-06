/**
 * In-Memory Sliding-Window Rate Limiter
 * 
 * Provides rate-limiting capability for API endpoints with RFC 6585
 * and standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining,
 * X-RateLimit-Reset, Retry-After).
 */

export interface RateLimitConfig {
    windowMs: number;       // Window duration in milliseconds (default: 60,000ms / 1 min)
    maxRequests: number;    // Maximum allowed requests within the window (default: 120)
}

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;        // Unix timestamp in milliseconds when window resets
    retryAfterSeconds: number; // Seconds to wait before retrying (0 if allowed)
}

interface WindowBucket {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, WindowBucket>();

/**
 * Checks whether a given identifier has exceeded its rate limit.
 */
export function checkRateLimit(
    identifier: string,
    options?: Partial<RateLimitConfig>
): RateLimitResult {
    const windowMs = options?.windowMs ?? 60000;
    const maxRequests = options?.maxRequests ?? 120;
    const now = Date.now();

    // Occasional cleanup to avoid unbounded memory growth
    if (rateLimitStore.size > 5000) {
        for (const [key, bucket] of rateLimitStore.entries()) {
            if (now >= bucket.resetAt) {
                rateLimitStore.delete(key);
            }
        }
    }

    let bucket = rateLimitStore.get(identifier);

    if (!bucket || now >= bucket.resetAt) {
        // First request or window expired
        bucket = {
            count: 1,
            resetAt: now + windowMs,
        };
        rateLimitStore.set(identifier, bucket);

        return {
            allowed: true,
            limit: maxRequests,
            remaining: Math.max(0, maxRequests - 1),
            resetAt: bucket.resetAt,
            retryAfterSeconds: 0,
        };
    }

    // Existing active window
    bucket.count++;

    const allowed = bucket.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - bucket.count);
    const retryAfterSeconds = allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000);

    return {
        allowed,
        limit: maxRequests,
        remaining,
        resetAt: bucket.resetAt,
        retryAfterSeconds,
    };
}

/**
 * Formats rate limit result into standard HTTP headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    };

    if (!result.allowed) {
        headers['Retry-After'] = result.retryAfterSeconds.toString();
    }

    return headers;
}

/**
 * Test helper to reset the rate limiter store.
 */
export function _resetRateLimit(identifier?: string) {
    if (identifier) {
        rateLimitStore.delete(identifier);
    } else {
        rateLimitStore.clear();
    }
}
