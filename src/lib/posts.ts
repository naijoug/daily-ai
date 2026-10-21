import { getCollection } from 'astro:content';
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (p: string) => `${BASE}${p}`;
export const TYPE_LABEL: Record<string, string> = { 'x-ai': 'AI Hot', tech: 'Tech' };
export async function allPosts() {
  return (await getCollection('posts')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
