/**
 * In-memory rate limiter for auth endpoints.
 *
 * Простой ratelimit без внешних зависимостей (Redis не требуется).
 * Хранит счётчики в Map с автоочисткой каждые 60 секунд.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Автоочистка каждые 60 секунд
const CLEANUP_INTERVAL = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
    // Останавливаем таймер если хранилище пустое
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Проверяет, не превышен ли лимит запросов для данного ключа.
 *
 * @param key — уникальный идентификатор (например, IP-адрес)
 * @param maxRequests — максимальное количество запросов в окне
 * @param windowMs — размер окна в миллисекундах (по умолчанию 60 секунд)
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Новое окно или первый запрос
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  // В пределах окна
  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Возвращает IP-адрес из заголовков запроса.
 * Учитывает X-Forwarded-For (прокси/Vercel).
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
