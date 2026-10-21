import { allPosts } from './posts';
export function heads(body = '', n = 3) {
  return body.split('\n').filter((l) => /^(\d+\.|[-*])\s/.test(l)).slice(0, n).map((l) =>
    l.replace(/^(\d+\.|[-*])\s+/, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '')
     .replace(/[*_`]/g, '').split(/[：:（(。]/)[0].trim().slice(0, 60));
}
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false });
export const dayKey = (d: Date) => dayFmt.format(d);
export const hhmm = (d: Date) => timeFmt.format(d);
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const dayTitle = (k: string) => `${k} · ${WD[new Date(`${k}T12:00:00+08:00`).getUTCDay()]}`;
export async function allDays() {
  const posts = await allPosts();
  const map = new Map<string, typeof posts>();
  for (const p of posts) { const k = dayKey(p.data.date); if (!map.has(k)) map.set(k, []); map.get(k)!.push(p); }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([date, ps]) => {
    const asc = [...ps].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
    const xai = asc.filter((p) => p.data.type === 'x-ai');
    const tech = asc.filter((p) => p.data.type === 'tech');
    const n = xai.length && tech.length ? 2 : 3;
    const latest = (arr: typeof asc) => (arr.length ? heads(arr[arr.length - 1].body, n) : []);
    const tags = [...new Set(asc.flatMap((p) => p.data.tags))];
    return { date, title: dayTitle(date), posts: asc, xai, tech, aiHeads: latest(xai), techHeads: latest(tech), tags, last: asc[asc.length - 1].data.date };
  });
}
export type Day = Awaited<ReturnType<typeof allDays>>[number];
