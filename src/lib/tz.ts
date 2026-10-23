// 时区显示：数据按北京时间（UTC+8）存储与分组，展示时间按读者所选时区换算（默认浏览器时区）。
// 偏好存 localStorage `dailyai:tz`：'auto' | 'z:<IANA>' | 'o:<分钟偏移，如 330>'。
export const TZ_KEY = 'dailyai:tz';
export const SRC_OFFSET_MIN = 480;
export type TzPref = string;
export const COMMON_ZONES = ['Asia/Shanghai', 'Asia/Tokyo', 'Asia/Kolkata', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];
// UTC-12 … UTC+14，含常见半点/45 分偏移
export const OFFSETS: number[] = [-720, -660, -600, -570, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60, 0, 60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 525, 540, 570, 600, 630, 660, 720, 765, 780, 840];
export const getPref = (): TzPref => { try { return localStorage.getItem(TZ_KEY) || 'auto'; } catch { return 'auto'; } };
const browserZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
export const effectiveZone = (pref: TzPref = getPref()): { z?: string; o?: number } => pref.startsWith('o:') ? { o: Number(pref.slice(2)) || 0 } : pref.startsWith('z:') ? { z: pref.slice(2) } : { z: browserZone() };
const fmtCache = new Map<string, Intl.DateTimeFormat>();
const dtf = (z: string) => { let f = fmtCache.get(z); if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: z, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); fmtCache.set(z, f); } return f; };
/** 某时刻该时区相对 UTC 的偏移（分钟），DST 感知 */
export function offsetAt(epoch: number, pref: TzPref = getPref()): number {
  const e = effectiveZone(pref); if (e.o !== undefined) return e.o;
  try {
    const p = Object.fromEntries(dtf(e.z!).formatToParts(new Date(epoch)).map((x) => [x.type, x.value])) as Record<string, string>;
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUtc - Math.floor(epoch / 1000) * 1000) / 60000);
  } catch { return 0; }
}
export const offsetLabel = (min: number) => { const s = min < 0 ? '-' : '+'; const a = Math.abs(min); const h = Math.floor(a / 60), m = a % 60; return `UTC${s}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`; };
export const labelAt = (epoch: number, pref: TzPref = getPref()) => offsetLabel(offsetAt(epoch, pref));
const p2 = (n: number) => String(n).padStart(2, '0');
export function partsAt(epoch: number, pref: TzPref = getPref()) {
  const d = new Date(epoch + offsetAt(epoch, pref) * 60000);
  return { Y: d.getUTCFullYear(), M: d.getUTCMonth() + 1, D: d.getUTCDate(), h: d.getUTCHours(), m: d.getUTCMinutes() };
}
export const hmAt = (epoch: number, pref?: TzPref) => { const p = partsAt(epoch, pref); return `${p2(p.h)}:${p2(p.m)}`; };
export const mdAt = (epoch: number, pref?: TzPref) => { const p = partsAt(epoch, pref); return `${p2(p.M)}/${p2(p.D)}`; };
const ymd = (epoch: number, pref?: TzPref) => { const p = partsAt(epoch, pref); return p.Y * 10000 + p.M * 100 + p.D; };
/** `MM/DD HH:mm – [MM/DD ]HH:mm`：起点总带日期，终点跨日期时才带日期 */
export function rangeText(s: number, e: number, pref?: TzPref) {
  const sameDay = ymd(s, pref) === ymd(e, pref);
  return `${mdAt(s, pref)} ${hmAt(s, pref)} – ${sameDay ? '' : mdAt(e, pref) + ' '}${hmAt(e, pref)}`;
}
const iso = (s: string) => Date.parse(s);
/** 把页面上带 data-tz-* 的元素按当前偏好刷新 */
export function applyTz(root: ParentNode = document) {
  const pref = getPref();
  root.querySelectorAll<HTMLElement>('[data-tz-hm]').forEach((el) => {
    const t = iso(el.dataset.tzHm!); if (isNaN(t)) return;
    el.textContent = hmAt(t, pref);
    const day = el.dataset.tzDay; // 页面所属北京日；本地日期不同则附注日期
    const sup = el.parentElement?.querySelector<HTMLElement>('[data-tz-dd]');
    if (day && sup) { const md = mdAt(t, pref); const bd = day.slice(5).replace('-', '/'); sup.textContent = md === bd ? '' : md; }
  });
  root.querySelectorAll<HTMLElement>('[data-tz-cov]').forEach((el) => {
    const s = iso(el.dataset.tzCs!), e = iso(el.dataset.tzCe!); if (isNaN(s) || isNaN(e)) return;
    el.textContent = rangeText(s, e, pref);
  });
  root.querySelectorAll<HTMLElement>('[data-tz-label]').forEach((el) => {
    const at = el.dataset.tzAt ? iso(el.dataset.tzAt) : Date.now();
    el.textContent = labelAt(isNaN(at) ? Date.now() : at, pref);
  });
  document.documentElement.classList.remove('tz-wait');
}
export function setPref(p: TzPref) {
  try { if (p === 'auto') localStorage.removeItem(TZ_KEY); else localStorage.setItem(TZ_KEY, p); } catch {}
  applyTz(); window.dispatchEvent(new CustomEvent('tzchange', { detail: p }));
}
export const onTz = (fn: (p: TzPref) => void) => window.addEventListener('tzchange', (e) => fn((e as CustomEvent).detail));
