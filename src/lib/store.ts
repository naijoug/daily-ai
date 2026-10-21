// 本地个人数据（静态站，存 localStorage）。key: dailyai:v1
export type FavItem = { id: string; day: string; html: string; text: string; score?: number; ts: number };
export type Store = { v: 1; read: Record<string, number>; rating: Record<string, number>; fav: Record<string, FavItem> };
const KEY = 'dailyai:v1';
export function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { v: 1, read: s.read || {}, rating: s.rating || {}, fav: s.fav || {} };
  } catch { return { v: 1, read: {}, rating: {}, fav: {} }; }
}
export function save(s: Store) { localStorage.setItem(KEY, JSON.stringify(s)); }
export function merge(a: Store, b: Partial<Store>): Store {
  return { v: 1, read: { ...a.read, ...(b.read || {}) }, rating: { ...a.rating, ...(b.rating || {}) }, fav: { ...a.fav, ...(b.fav || {}) } };
}
