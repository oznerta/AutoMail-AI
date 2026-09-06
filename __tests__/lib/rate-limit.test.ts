/**
 * @jest-environment node
 */
import { checkRateLimit, getRateLimitHeaders, _resetRateLimit } from '../../lib/rate-limit';

describe('Rate Limiter Utility', () => {
    beforeEach(() => {
        _resetRateLimit();
    });

    it('should allow requests under the limit and decrement remaining', () => {
        const id = 'test-client-1';
        const res1 = checkRateLimit(id, { windowMs: 10000, maxRequests: 5 });
        expect(res1.allowed).toBe(true);
        expect(res1.remaining).toBe(4);
        expect(res1.limit).toBe(5);

        const res2 = checkRateLimit(id, { windowMs: 10000, maxRequests: 5 });
        expect(res2.allowed).toBe(true);
        expect(res2.remaining).toBe(3);
    });

    it('should block requests when limit is exceeded', () => {
        const id = 'test-client-2';
        for (let i = 0; i < 3; i++) {
            const res = checkRateLimit(id, { windowMs: 10000, maxRequests: 3 });
            expect(res.allowed).toBe(true);
        }

        const blockedRes = checkRateLimit(id, { windowMs: 10000, maxRequests: 3 });
        expect(blockedRes.allowed).toBe(false);
        expect(blockedRes.remaining).toBe(0);
        expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should generate standard rate limit headers', () => {
        const id = 'test-client-3';
        const res = checkRateLimit(id, { windowMs: 60000, maxRequests: 10 });
        const headers = getRateLimitHeaders(res);

        expect(headers['X-RateLimit-Limit']).toBe('10');
        expect(headers['X-RateLimit-Remaining']).toBe('9');
        expect(headers['X-RateLimit-Reset']).toBeDefined();
        expect(headers['Retry-After']).toBeUndefined();

        // Exceed limit
        for (let i = 0; i < 9; i++) {
            checkRateLimit(id, { windowMs: 60000, maxRequests: 10 });
        }
        const blocked = checkRateLimit(id, { windowMs: 60000, maxRequests: 10 });
        const blockedHeaders = getRateLimitHeaders(blocked);

        expect(blockedHeaders['X-RateLimit-Remaining']).toBe('0');
        expect(blockedHeaders['Retry-After']).toBeDefined();
    });

    it('should track separate limits for different identifiers', () => {
        const idA = 'client-A';
        const idB = 'client-B';

        for (let i = 0; i < 2; i++) {
            checkRateLimit(idA, { windowMs: 10000, maxRequests: 2 });
        }

        const resA = checkRateLimit(idA, { windowMs: 10000, maxRequests: 2 });
        const resB = checkRateLimit(idB, { windowMs: 10000, maxRequests: 2 });

        expect(resA.allowed).toBe(false);
        expect(resB.allowed).toBe(true);
    });
});
