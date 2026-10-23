import { getCollection } from 'astro:content';
import { allPosts } from './posts';
import { dayKey } from './days';

export type Snapshot = { key: string; date: string; source: string; sourceName: string; kind: 'products' | 'models' | 'feed'; badge?: string; list: string; metric?: string; url: string; period?: string; published?: string; fetched?: string; manual?: boolean; note?: string; rows: { rank?: number; name: string; url?: string; value?: string; mom?: string; org?: string; extra?: string; date?: string }[] };

const files = import.meta.glob('../data/snapshots/*/*.json', { eager: true, import: 'default' }) as Record<string, any>;
export const snapshots: Snapshot[] = Object.entries(files).map(([p, d]) => {
  const m = p.match(/snapshots\/([^/]+)\/([^/]+)\.json$/)!;
  return { key: m[1], date: m[2], ...d };
});
// 每个 key 最新一期 + 历史
export function latestSnapshots(kind?: Snapshot['kind']) {
  const by = new Map<string, Snapshot[]>();
  for (const s of snapshots) { if (kind && s.kind !== kind) continue; if (!by.has(s.key)) by.set(s.key, []); by.get(s.key)!.push(s); }
  return [...by.entries()].map(([key, arr]) => { arr.sort((a, b) => (a.date < b.date ? 1 : -1)); return { key, latest: arr[0], history: arr }; });
}

export async function allProducts() {
  return (await getCollection('products')).map((e) => e.data);
}
export type Product = Awaited<ReturnType<typeof allProducts>>[number];

export const REGION_LABEL = { cn: 'Domestic', global: 'Global' } as const;
// 产品 JSON 里的 category 仍是中文枚举（内容），展示用英文标签
export const CAT_LABEL: Record<string, string> = { '对话助手': 'Assistants', '编程/Agent': 'Coding / Agents', '办公': 'Office', '图像': 'Image', '视频': 'Video', '音频': 'Audio', '搜索': 'Search', '研究': 'Research', '开发者平台': 'Dev Platforms', '其他': 'Other' };
export const catLabel = (c: string) => CAT_LABEL[c] || c;

// 每个 badge 取最新日期的一条，用于卡片徽章
export function badges(p: Product) {
  const m = new Map<string, Product['rankings'][number]>();
  for (const r of p.rankings) { if (r.rank == null) continue; const k = r.badge || r.source; const o = m.get(k); if (!o || r.date > o.date) m.set(k, r); }
  return [...m.values()].sort((a, b) => (a.rank! - b.rank!) || (a.date < b.date ? 1 : -1));
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const strip = (l: string) => l.replace(/^(\d+\.|[-*])\s+/, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/[*_`]/g, '').trim();

// 反查：本站 digest 里提到该产品的条目（显式 [P:slug] 标记 + 官网域名 + 名称/别名）
export async function mentionsIndex(products: Product[]) {
  const posts = await allPosts();
  const out = new Map<string, { id: string; day: string; text: string; date: Date; explicit: boolean }[]>();
  const matchers = products.map((p) => {
    const hosts = [p.url, ...p.domains].map((u) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').toLowerCase());
    const names = (p.matchNames || [p.name, ...p.aliases]).filter((n) => n.length >= 3 || /[^\x00-\x7f]/.test(n));
    const res = names.map((n) => new RegExp(/^[\x00-\x7f]+$/.test(n) ? `(?<![A-Za-z0-9])${esc(n)}(?![A-Za-z0-9])` : esc(n), /^[\x00-\x7f]+$/.test(n) ? '' : 'i'));
    return { p, hosts, res };
  });
  for (const post of posts) {
    const explicit = new Map<number, string[]>();
    for (const t of post.data.products) { const [i, id] = t.split(':'); if (!explicit.has(+i)) explicit.set(+i, []); explicit.get(+i)!.push(id); }
    let n = 0;
    for (const raw of (post.body || '').split('\n')) {
      if (!/^(\d+\.|[-*])\s/.test(raw)) continue;
      n++;
      const id = `${post.id}-${n}`;
      const ex = explicit.get(n) || [];
      for (const { p, hosts, res } of matchers) {
        let line = raw;
        for (const e of p.mentionExclude) line = line.split(e).join('');
        const isEx = ex.includes(p.id);
        if (!isEx && !hosts.some((h) => line.toLowerCase().includes(h)) && !res.some((r) => r.test(line))) continue;
        if (!out.has(p.id)) out.set(p.id, []);
        out.get(p.id)!.push({ id, day: dayKey(post.data.date), text: strip(raw).slice(0, 120), date: post.data.date, explicit: isEx });
      }
    }
  }
  for (const arr of out.values()) arr.sort((a, b) => b.date.getTime() - a.date.getTime());
  return out;
}

export function bjToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export const addDays = (d: string, n: number) => new Date(new Date(`${d}T12:00:00+08:00`).getTime() + n * 864e5).toISOString().slice(0, 10);
