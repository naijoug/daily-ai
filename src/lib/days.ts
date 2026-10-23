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
// frontmatter 的 coverage 是自由文本（北京时间，多种写法）。这里解析成起止时刻（epoch ms），页面再按读者时区换算。
const bjParts = (d: Date) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value])); return { Y: +p.year, M: +p.month, D: +p.day, h: +p.hour % 24, m: +p.minute }; };
const bj = (Y: number, M: number, D: number, h: number, m: number) => Date.UTC(Y, M - 1, D, h - 8, m);
const COV_RE = /(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\/(\d{1,2}))?\s*(\d{1,2}):(\d{2})\s*[–—-]\s*(?:(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\/(\d{1,2}))\s*)?(\d{1,2}):(\d{2})/;
export function parseCov(cov: string | undefined, run: Date): { s: number; e: number; note: string } | null {
  if (!cov) return null;
  const m = cov.match(COV_RE); if (!m) return null;
  const r = bjParts(run); const DAY = 864e5;
  const dateOf = (Y?: string, M?: string, D?: string, M2?: string, D2?: string) => {
    if (Y) return { Y: +Y, M: +M!, D: +D! };
    if (M2) { let y = r.Y; if (bj(y, +M2, +D2!, 12, 0) > run.getTime() + 2 * DAY) y -= 1; return { Y: y, M: +M2, D: +D2! }; }
    return null;
  };
  const sd = dateOf(m[1], m[2], m[3], m[4], m[5]); const ed = dateOf(m[8], m[9], m[10], m[11], m[12]);
  const [h1, n1, h2, n2] = [+m[6], +m[7], +m[13], +m[14]];
  let s: number, e: number;
  if (sd && ed) { s = bj(sd.Y, sd.M, sd.D, h1, n1); e = bj(ed.Y, ed.M, ed.D, h2, n2); }
  else if (sd) { s = bj(sd.Y, sd.M, sd.D, h1, n1); e = bj(sd.Y, sd.M, sd.D, h2, n2); if (e <= s) e += DAY; }
  else { e = bj(r.Y, r.M, r.D, h2, n2); if (e > run.getTime() + 6 * 36e5) e -= DAY; s = bj(r.Y, r.M, r.D, h1, n1); while (s > e) s -= DAY; while (e - s > DAY) s += DAY; }
  if (!(e > s) || e - s > 3 * DAY) return null;
  const note = cov.slice((m.index || 0) + m[0].length).replace(/北京时间/g, '').replace(/^[\s，,、（(]+|[\s，,、）)]+$/g, '').trim();
  return { s, e, note };
}
export const covPlain = (c: string) => c.replace(/^覆盖\s*/, '').replace(/[（(]?北京时间[，,]?/g, '').replace(/[）)]\s*$/, '').trim();
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
