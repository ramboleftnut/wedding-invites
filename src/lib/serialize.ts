// Recursively convert any non-serializable value (Date, Firestore Timestamp class instances)
// to a plain serializable form so Next.js can pass props across the server→client boundary.
export function deepSerialize<T>(v: T): T {
  if (v === null || v === undefined) return v
  if (v instanceof Date) return v.toISOString() as unknown as T
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (typeof obj['toDate'] === 'function') {
      return (obj['toDate'] as () => Date)().toISOString() as unknown as T
    }
    if (Array.isArray(v)) return v.map(deepSerialize) as unknown as T
    return Object.fromEntries(
      Object.entries(obj).map(([k, val]) => [k, deepSerialize(val)])
    ) as unknown as T
  }
  return v
}
