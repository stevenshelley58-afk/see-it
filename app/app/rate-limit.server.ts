// Simple in-memory rate limiter for app-proxy routes
// Tracks requests per room_session_id to prevent quota draining attacks

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export function checkRateLimit(roomSessionId: string): boolean {
    const now = Date.now();
    const key = roomSessionId;

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    const record = rateLimitStore.get(key);

    // Reset if window expired
    if (now > record.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    // Check if limit exceeded
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    // Increment count
    record.count++;
    return true;
}

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);
