// 产品数据的共享工具：读写 src/content/products/*.json、去重（规范化域名 + 别名表）、追加榜单记录、应用榜单快照。
// 只增不删：任何函数都不会删除产品文件或已有 rankings 记录（同 source+list+date 的记录会被同值覆盖）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PRODUCTS_DIR = path.join(ROOT, 'src/content/products');
export const SNAP_DIR = path.join(ROOT, 'src/data/snapshots');
export const ALIAS_FILE = path.join(ROOT, 'src/data/product-aliases.json');
export const CATEGORIES = ['对话助手', '编程/Agent', '办公', '图像', '视频', '音频', '搜索', '研究', '开发者平台', '其他'];

const bjFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
export const bjToday = () => bjFmt.format(new Date());

// URL 规范化：小写、去 www.、去 query/hash、去末尾斜杠
export function normUrl(u) {
  try {
    const x = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
    return { host: x.hostname.toLowerCase().replace(/^www\./, ''), path: x.pathname.replace(/\/+$/, '').toLowerCase() };
  } catch { return null; }
}
export const urlKey = (u) => { const n = normUrl(u); return n ? n.host + n.path : ''; };
// 名称规范化：去掉「｜公司」「 - 副标题」后缀，小写，去空白和标点
export function normName(s = '') {
  return String(s).split(/[｜|]| - |（|\(/)[0].toLowerCase().replace(/[\s·.\-_:：'’"!！]/g, '');
}
const SOCIAL = /(^|\.)((x|twitter|youtube|youtu|github|weixin\.qq|mp\.weixin\.qq|t|bilibili|reddit|news\.ycombinator|linkedin|threads|producthunt|huggingface)\.(com|be|co|net)|t\.co)$/;
export const isSocial = (u) => { const n = normUrl(u); return !n || SOCIAL.test(n.host) || n.host === 'mp.weixin.qq.com'; };

export function loadAliases() {
  try { return JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf8')); } catch { return {}; }
}
export function loadProducts() {
  if (!fs.existsSync(PRODUCTS_DIR)) return [];
  return fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR, f), 'utf8')));
}
const ORDER = ['id', 'name', 'aliases', 'url', 'domains', 'category', 'region', 'maker', 'oneLiner', 'oneLinerEn', 'score', 'growth', 'growthNote', 'firstSeen', 'updated', 'tags', 'rankings'];
export function saveProduct(p) {
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  const o = {};
  for (const k of ORDER) if (p[k] !== undefined && p[k] !== null) o[k] = p[k];
  for (const k of Object.keys(p)) if (!(k in o) && p[k] !== undefined) o[k] = p[k];
  const file = path.join(PRODUCTS_DIR, `${p.id}.json`);
  const next = JSON.stringify(o, null, 2) + '\n';
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === next) return false;
  fs.writeFileSync(file, next);
  return true;
}
export const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 去重查找：slug → URL（最长前缀匹配；domains 里的备用域名同样参与）→ 名称/别名
export function findProduct(products, { id, url, name }, aliases = loadAliases()) {
  if (id) { const p = products.find((x) => x.id === id); if (p) return p; }
  if (url && !isSocial(url)) {
    const k = urlKey(url); let best = null; let bestLen = -1;
    for (const p of products) for (const u of [p.url, ...(p.domains || [])]) {
      const pk = urlKey(u);
      if (pk && (k === pk || k.startsWith(pk + '/')) && pk.length > bestLen) { best = p; bestLen = pk.length; }
    }
    if (best) return best;
  }
  if (name) {
    const n = normName(name); if (!n) return null;
    for (const p of products) {
      const names = [p.name, p.id, ...(p.aliases || []), ...(aliases[p.id] || [])];
      if (names.some((x) => normName(x) === n)) return p;
    }
  }
  return null;
}

export function addRanking(p, r) {
  p.rankings = p.rankings || [];
  const i = p.rankings.findIndex((x) => x.source === r.source && x.list === r.list && x.date === r.date);
  const clean = Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  if (i >= 0) p.rankings[i] = { ...p.rankings[i], ...clean }; else p.rankings.push(clean);
  p.rankings.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.source.localeCompare(b.source)));
}

export function readSnapshots() {
  const out = [];
  if (!fs.existsSync(SNAP_DIR)) return out;
  for (const key of fs.readdirSync(SNAP_DIR)) {
    const dir = path.join(SNAP_DIR, key); if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) out.push({ key, date: f.replace(/\.json$/, ''), ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) });
  }
  return out;
}
export function writeSnapshot(key, date, obj) {
  const dir = path.join(SNAP_DIR, key); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${date}.json`);
  fs.writeFileSync(file, JSON.stringify(obj, null, 1) + '\n');
  return file;
}

// 把一份快照里能对上的行写进产品的 rankings（只对已登记的产品；不新建产品）
export function applySnapshot(products, snap, aliases) {
  if (snap.kind === 'models' || snap.kind === 'feed') return [];
  const touched = new Set();
  for (const row of snap.rows || []) {
    if (row.rank == null) continue;
    const p = findProduct(products, { url: row.url, name: row.name }, aliases);
    if (!p) continue;
    addRanking(p, { source: snap.source, list: snap.list, badge: snap.badge, rank: row.rank, metric: snap.metric, value: row.value, mom: row.mom, date: snap.period || snap.date, url: snap.url, snap: `${snap.key}/${snap.date}` });
    const mom = typeof row.mom === 'string' && /^-?[\d.]+%$/.test(row.mom) ? Number(row.mom.replace('%', '')) : null;
    const d = snap.period || snap.date;
    if (mom !== null && (!p.growthDate || d >= p.growthDate)) { p.growth = mom; p.growthDate = d; p.growthNote = `${snap.badge || snap.sourceName} ${d} 环比`; }
    touched.add(p.id);
  }
  return [...touched];
}
