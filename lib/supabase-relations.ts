/** PostgREST 관계가 객체 또는 배열로 올 때 한 형태로 맞춤 */
export function relationOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}
