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
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// frontmatter 的 coverage 仍按中文存（覆盖 … 北京时间），展示时转英文
export const covEn = (s: string) => s.replace(/覆盖\s*/g, 'Covers ').replace(/\s*北京时间/g, ' Beijing Time');
const wdIdx = (k: string) => new Date(`${k}T12:00:00+08:00`).getUTCDay();
export const dayTitle = (k: string) => `${k} · ${WD[wdIdx(k)]}`;
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
    const countItems = (b = '') => b.split('\n').filter((l) => /^(\d+\.|[-*])\s/.test(l)).length;
    const nItems = (arr: typeof asc) => arr.reduce((s, p) => s + countItems(p.body), 0);
    const withSum = [...asc].reverse().find((p) => p.data.daySummary);
    const summaryEn = withSum?.data.daySummaryEn || '';
    const summary = withSum?.data.daySummary || [...heads(xai.at(-1)?.body, 1), ...heads(tech.at(-1)?.body, 1)].join('；');
    const allScores = asc.flatMap((p) => p.data.scores);
    const top = allScores.filter((x) => x >= 4).length;
    return { date, summary, summaryEn, wd: wdIdx(date), total: nItems(asc), aiCount: nItems(xai), techCount: nItems(tech), top, pids: asc.map((p) => p.id), title: dayTitle(date), posts: asc, xai, tech, aiHeads: latest(xai), techHeads: latest(tech), tags, last: asc[asc.length - 1].data.date };
  });
}
export type Day = Awaited<ReturnType<typeof allDays>>[number];
