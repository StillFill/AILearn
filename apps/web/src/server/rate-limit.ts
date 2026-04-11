/**
 * Rate limit em memória por instância de processo (adequado a dev e a um único worker).
 * Em serverless multi-instância o limite é aproximado; para produção rigorosa usar Redis/Upstash.
 */

const buckets = new Map<string, number[]>();

export function rateLimitKey(scope: string, id: string): string {
  return `${scope}:${id}`;
}

/** @returns true se o pedido é permitido; false se excedeu o limite. */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let arr = buckets.get(key) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

export function getClientIp(request: { headers: Headers }): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
