export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : new URL(request.url).origin;
  return origin === expected;
}
// Límite por proceso; en despliegues con varias réplicas sumar rate limit en el proxy.
const buckets = new Map<string, { at: number; count: number }>();
export function allowRequest(key: string, limit = 12, windowMs = 60000) {
  const now = Date.now();
  for (const [k, v] of buckets) if (now - v.at > windowMs) buckets.delete(k);
  const current = buckets.get(key);
  if (!current) {
    if (buckets.size > 10000) return false;
    buckets.set(key, { at: now, count: 1 });
    return true;
  }
  current.count++;
  return current.count <= limit;
}
export function requestKey(request: Request) {
  // El proxy debe sobrescribir x-real-ip; sin proxy se comparte el límite local.
  return request.headers.get("x-real-ip") || "local";
}
