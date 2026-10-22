#!/usr/bin/env node
// 每日产品/模型榜刷新：抓 Product Hunt AI RSS、Hugging Face trending Spaces、OpenRouter rankings（App 与模型 token 用量）、
// Artificial Analysis Intelligence Index，写成 src/data/snapshots/<key>/<北京日期>.json，并把能对上的行写进已登记产品的 rankings。
// 用法：node scripts/products-refresh.mjs [--dry] [--only producthunt,hf,openrouter,aa]
// 安全：幂等（同一天重跑只覆盖当天快照、同 source+list+date 的 rankings 记录）；从不删除文件或记录；
//       某个源失败只打印警告并跳过，不会写空快照；退出码始终为 0（除非参数错误）。
import { bjToday, loadProducts, saveProduct, readSnapshots, writeSnapshot, applySnapshot, loadAliases } from './lib/products.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const onlyI = args.indexOf('--only');
const ONLY = onlyI >= 0 ? args[onlyI + 1].split(',') : null;
const want = (k) => !ONLY || ONLY.includes(k);
const DATE = bjToday();
const NOW = new Date().toISOString();
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

async function get(url, type = 'text') {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: type === 'json' ? 'application/json' : '*/*' }, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return type === 'json' ? r.json() : r.text();
  } finally { clearTimeout(t); }
}
// Next.js RSC：把 self.__next_f.push([1,"..."]) 拼回文本
function rsc(html) {
  let out = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)) { try { out += JSON.parse(`"${m[1]}"`); } catch {} }
  return out;
}
function jsonAt(text, marker) {
  const i = text.indexOf(marker); if (i < 0) return null;
  let s = i + marker.length; while (text[s] !== '[' && text[s] !== '{') s++;
  const open = text[s], close = open === '[' ? ']' : '}';
  let depth = 0, str = false, esc = false;
  for (let j = s; j < text.length; j++) {
    const c = text[j];
    if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === open || c === '{' || c === '[') depth++; else if (c === close || c === '}' || c === ']') { depth--; if (depth === 0) return JSON.parse(text.slice(s, j + 1)); }
  }
  return null;
}
const fmtTok = (n) => { n = Number(n); return n >= 1e12 ? `${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : `${(n / 1e6).toFixed(0)}M`; };
const decode = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const snaps = [];
const ok = (key, obj) => { if (!obj.rows?.length) throw new Error('0 行，跳过写入'); snaps.push([key, obj]); console.log(`✓ ${key}/${DATE}  ${obj.rows.length} 行`); };

const jobs = {
  async producthunt() {
    const url = 'https://www.producthunt.com/feed?category=artificial-intelligence';
    const xml = await get(url);
    const rows = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 30).map(([, e]) => ({
      name: decode((e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '').trim(),
      url: (e.match(/<link[^>]*href="([^"]+)"/) || [])[1],
      value: decode((e.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140),
      date: ((e.match(/<published>([^<]+)/) || [])[1] || '').slice(0, 10),
    })).filter((r) => r.name);
    ok('producthunt-ai', { source: 'producthunt', sourceName: 'Product Hunt', kind: 'feed', badge: 'Product Hunt', list: 'Artificial Intelligence 分类 RSS', metric: 'Feed 顺序（不是排名）', url, period: DATE, fetched: NOW, note: 'Product Hunt AI 分类的 Atom feed 原样记录，不含票数，顺序不代表排名。', rows });
  },
  async hf() {
    const url = 'https://huggingface.co/api/spaces?sort=trendingScore&direction=-1&limit=30';
    const d = await get(url, 'json');
    const rows = d.map((s, i) => ({ rank: i + 1, name: s.id, url: `https://huggingface.co/spaces/${s.id}`, value: `♥ ${s.likes ?? 0}`, extra: s.sdk || undefined }));
    ok('hf-spaces-trending', { source: 'hf', sourceName: 'Hugging Face', kind: 'feed', badge: 'HF Spaces', list: 'Trending Spaces', metric: 'trendingScore 排序（API 顺序）', url: 'https://huggingface.co/spaces?sort=trending', period: DATE, fetched: NOW, rows });
  },
  async openrouter() {
    const url = 'https://openrouter.ai/rankings';
    const t = rsc(await get(url));
    const a = (() => { const i = t.indexOf('"data":{"day":['); return i < 0 ? null : jsonAt(t.slice(i), '"data":'); })();
    if (!a?.week?.length) throw new Error('页面里没找到 apps 数据');
    const appRows = [...a.week].sort((x, y) => x.rank - y.rank).map((x) => ({ rank: x.rank, name: x.app.title, url: x.app.origin_url || x.app.main_url || undefined, value: `${fmtTok(x.total_tokens)} tokens` }));
    ok('openrouter-apps-week', { source: 'openrouter', sourceName: 'OpenRouter', kind: 'products', badge: 'OpenRouter', list: 'Apps · 本周 token 用量', metric: '经 OpenRouter 的 token 总量（本周）', url: 'https://openrouter.ai/rankings#apps', period: DATE, fetched: NOW, note: 'rank 取 OpenRouter 页面原值；页面只公开部分 App，排名可能不连续。', rows: appRows });
    const mi = t.indexOf('"queryKey":["rankings","models",{"view":"week"}]');
    const before = mi > 0 ? t.lastIndexOf('"state":{"data":[', mi) : -1;
    const models = before > 0 ? jsonAt(t.slice(before), '"data":') : null;
    if (models?.length) {
      const rows = models.map((m) => ({ name: m.model_permaslug, tok: m.total_prompt_tokens + m.total_completion_tokens, variant: m.variant }))
        .sort((x, y) => y.tok - x.tok).map((m, i) => ({ rank: i + 1, name: m.name + (m.variant && m.variant !== 'standard' ? ` (${m.variant})` : ''), value: `${fmtTok(m.tok)} tokens` }));
      ok('openrouter-models-week', { source: 'openrouter', sourceName: 'OpenRouter', kind: 'models', badge: 'OpenRouter 模型', list: 'Models · 本周 token 用量（页面前 20）', metric: 'prompt + completion tokens（本周）', url: 'https://openrouter.ai/rankings', period: DATE, fetched: NOW, note: '按页面给出的本周 token 总量排序。', rows });
    } else console.warn('! openrouter: 没找到模型周榜数据，跳过');
  },
  async aa() {
    const url = 'https://artificialanalysis.ai/leaderboards/models';
    const t = rsc(await get(url));
    const ms = jsonAt(t, '"initialModels":');
    if (!ms?.length) throw new Error('页面里没找到 initialModels');
    const rows = ms.filter((m) => m.intelligenceIndex != null && !m.deprecated).sort((a, b) => b.intelligenceIndex - a.intelligenceIndex).slice(0, 20)
      .map((m, i) => ({ rank: i + 1, name: m.name, org: m.modelCreatorName, value: m.intelligenceIndex.toFixed(1) + (m.intelligenceIndexIsEstimated ? '（估）' : ''), extra: m.isOpenWeights ? '开放权重' : undefined }));
    ok('aa-intelligence', { source: 'aa', sourceName: 'Artificial Analysis', kind: 'models', badge: 'AA Index', list: 'Intelligence Index（前 20）', metric: 'Artificial Analysis Intelligence Index（综合多项评测）', url: 'https://artificialanalysis.ai/leaderboards/models', period: DATE, fetched: NOW, rows });
  },
};

for (const [k, fn] of Object.entries(jobs)) {
  if (!want(k)) continue;
  try { await fn(); } catch (e) { console.warn(`! ${k}: ${e.message}（跳过，不影响已有数据）`); }
}
if (DRY) { console.log('--dry：不写文件'); process.exit(0); }
for (const [key, obj] of snaps) writeSnapshot(key, DATE, obj);
// 重新应用全部快照（含手工录入的 AICPB / a16z / LMArena），保证幂等
const products = loadProducts(); const aliases = loadAliases();
const touched = new Set();
for (const s of readSnapshots()) applySnapshot(products, s, aliases).forEach((id) => touched.add(id));
let n = 0;
for (const p of products) { if (saveProduct(p)) n++; }
console.log(`产品 ${products.length} 个，匹配到榜单 ${touched.size} 个，本次改动 ${n} 个文件。快照日期 ${DATE}（北京时间）。`);
