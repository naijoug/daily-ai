#!/usr/bin/env node
// 把一份源 digest（X AI 汇总或科技速递）转换成 src/content/posts/<type>-<YYYY-MM-DD-HHMM>.md
// 用法：node scripts/import.mjs <file> [<file> ...] [--type x-ai|tech]
// 幂等：同一 id 会被覆盖。
// 可选字段（格式见 docs/digest-format.md）：条目行尾 `[AI:4]` → frontmatter scores；`日摘要：…` 行 → daySummary；
// `## 新产品` 小节的条目与带 `[P:slug]` 标记的条目 → 登记/更新 src/content/products/<slug>.json（去重：规范化域名 + 别名表），frontmatter products。
//会去掉关注/List 相关行、内部去重笔记以及工具失败/限流之类的内部说明。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProducts, saveProduct, findProduct, loadAliases, isSocial, normUrl, normName, slugify, CATEGORIES } from './lib/products.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/content/posts');

const TAG_RULES = {
  'Models': /模型|LLM|GPT|Claude|Gemini|Qwen|DeepSeek|Llama|MoE|参数|权重|Opus|Sonnet|Mistral|MiniMax|推理/i,
  'Agents': /agent|智能体|harness|子 agent|多 agent/i,
  'Dev Tools': /Codex|Claude Code|Cursor|OpenCode|IDE|编程|编码|代码|coding|CLI|MCP|skill|插件|git/i,
  'Open Source': /开源|GitHub|Apache 2\.0|MIT|Hugging Face|open[- ]?source|开放权重|权重开放/i,
  'Products': /发布|上线|推出|App|产品|功能|Product Hunt/i,
  'Research': /论文|arXiv|研究|基准|benchmark|评测|实验|技术报告/i,
  'Industry': /融资|估值|收购|IPO|收入|营收|亿美元|公司|市场|价格战|裁员/i,
  'Security': /安全|漏洞|攻击|泄露|越权|隐私|风险|security|CVE|黑客/i,
  'Chinese Community': /V2EX|LinuxDo|linux\.do|知乎|中文圈|掘金|少数派|IT之家|公众号|宝玉|dotey/i,
};

// 关注 / List 管理相关行（注意：不要匹配普通英文单词 Following，否则会误删英文条目）
const FOLLOW_RE = /新关注|关注了|已关注|Following(?:\s+list\b|\s*[:：])|List「|加进.{0,20}List|私密 List|加入.{0,20}List|待关注|分批关注/;
// 内部运行状态说明（工具失败、限流、补跑、抓取失败等）
const INTERNAL_RE = /定时任务|平台错误|补跑|没有产出|限流|rate.?limit|429|没抓到|抓不到|没解析|未解析|解析不出|没拿到|拦住|被 Cloudflare|RSS|调用失败|工具失败|超时|报错|去重用/i;

function usage(msg) {
  if (msg) console.error(msg);
  console.error('用法：node scripts/import.mjs <digest.md> [...] [--type x-ai|tech]');
  process.exit(1);
}

function detectType(file, forced) {
  if (forced) return forced;
  const p = path.resolve(file);
  if (/x-ai/.test(p)) return 'x-ai';
  if (/tech-digest|tech/.test(p)) return 'tech';
  usage(`无法从路径判断类型：${file}，请加 --type`);
}

// 句子级过滤：只用于说明性段落（括号注释、引用、说明：），避免误删正文
function filterSentences(text) {
  const parts = text.split(/(?<=[。；;])/);
  const kept = parts.filter((s) => !INTERNAL_RE.test(s) && !FOLLOW_RE.test(s));
  return kept.join('').trim();
}

// 条目行（顶层编号或 - 列表），与站点 rehype-items 插件的计数口径一致
const ITEM_RE = /^(\d+\.|[-*])\s/;
const SCORE_RE = /\s*[\[［]\s*AI\s*[:：]\s*([1-5])\s*[\]］]\s*$/i;
const PROD_RE = /\s*[\[［]\s*P\s*[:：]\s*([a-z0-9][a-z0-9-]*)?\s*(?:\|\s*([^|\]］]*?)\s*)?(?:\|\s*(cn|global|国内|海外)\s*)?[\]］]/gi;
const DAYSUM_RE = /^\s*(?:>\s*)?(?:\*\*)?(?:日摘要|DAY_SUMMARY)(?:\*\*)?\s*[:：]\s*(.+?)\s*$/i;
// 英文日摘要：必须顶格（不接受 `>` 前缀，以免误吞条目下面的英文译文引用）
const DAYSUM_EN_RE = /^\s*(?:\*\*)?(?:Day summary|Summary|DAY_SUMMARY_EN)(?:\*\*)?\s*[:：]\s*(.+?)\s*$/i;
// 译文引用：条目下方的 `> [en] …` / `> [zh] …`，或紧贴条目行（无空行）的 `> …`
const TR_MARK_RE = /^\s*>\s*\[(?:en|zh)\]/i;
const CJK_RE = /[\u4e00-\u9fff]/g;
const isZhText = (t) => ((t.match(CJK_RE) || []).length / Math.max(1, t.replace(/\s/g, '').length)) > 0.2;

// 抽出日摘要与 AI 评分，并从正文中去掉这些标记
function extractMeta(body) {
  let daySummary = '';
  let daySummaryEn = '';
  let lastItem = null; // 最近一条条目（用于挂译文）
  const scores = [];
  const lines = [];
  const prods = []; // { index, line, slug?, category?, region?, inSection }
  let section = '';
  for (let line of body.split('\n')) {
    const d = line.match(DAYSUM_RE);
    if (d) { daySummary = d[1].replace(/\*\*/g, '').trim(); continue; }
    const de = line.match(DAYSUM_EN_RE);
    if (de && !ITEM_RE.test(line)) { daySummaryEn = de[1].replace(/\*\*/g, '').trim(); continue; }
    if (/^\s*>/.test(line) && lastItem) { const t = line.replace(/^\s*>\s*(?:\[(?:en|zh)\]\s*)?/i, '').trim(); lastItem.tr = (lastItem.tr ? lastItem.tr + ' ' : '') + t; lines.push(line); continue; }
    if (!/^\s*>/.test(line)) lastItem = null;
    const h = line.match(/^##\s+(.+?)\s*$/); if (h) section = h[1];
    if (ITEM_RE.test(line)) {
      const marks = [...line.matchAll(PROD_RE)];
      if (marks.length) line = line.replace(PROD_RE, '');
      const m = line.match(SCORE_RE);
      const score = m ? Number(m[1]) : 0;
      scores.push(score);
      line = m ? line.replace(SCORE_RE, '') : line;
      line = line.replace(/\s+$/, '');
      const inSection = /^新产品/.test(section);
      lastItem = null;
      if (marks.length) for (const k of marks) { const o = { index: scores.length, line, score, slug: k[1], category: k[2], region: k[3], inSection }; prods.push(o); lastItem = o; }
      else if (inSection) { const o = { index: scores.length, line, score, inSection }; prods.push(o); lastItem = o; }
      else lastItem = {};
      lines.push(line);
    } else lines.push(line);
  }
  return { body: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', daySummary, daySummaryEn, scores, prods };
}

function clean(src, type) {
  let lines = src.replace(/\r\n/g, '\n').split('\n');
  let coverage = '';
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (i === 0 && /^#\s/.test(line)) {
      const m = line.match(/（(.*)）\s*$/);
      if (m) coverage = m[1].replace(/补跑[，,]\s*/, '');
      continue;
    }
    if (/^覆盖时段[:：]/.test(line)) { coverage = line.replace(/^覆盖时段[:：]\s*/, ''); continue; }
    // 译文引用（`> [en]`/`> [zh]`，或紧贴条目行的 `>`）原样保留，不做关注/内部说明过滤
    const prevOut = out.length ? out[out.length - 1] : '';
    const lastNonQ = out.slice().reverse().find((l) => !/^\s*>/.test(l)) || '';
    const isTr = TR_MARK_RE.test(line) || (/^\s*>/.test(line) && prevOut.trim() !== '' && ITEM_RE.test(lastNonQ));
    if (isTr) { out.push(line); continue; }
    if (FOLLOW_RE.test(line)) continue;
    // 早期汇总格式：话题清单
    if (/^已写入的话题/.test(line)) { out.push('## AI 热点'); continue; }
    if (/^干货[:：]\s*$/.test(line)) { out.push('', '## 有趣用法和干货'); continue; }
    if (/^##\s*干货\s*$/.test(line)) { out.push('## 有趣用法和干货'); continue; }
    const isNote = /^\s*(>|（|\(|说明[:：])/.test(line);
    if (isNote) {
      const prefix = (line.match(/^\s*(>\s*|说明[:：]\s*)/) || [''])[0];
      let body = line.slice(prefix.length);
      const paren = /^（[\s\S]*）$/.test(body.trim());
      if (paren) body = body.trim().slice(1, -1);
      body = filterSentences(body);
      if (!body || /^(其他[:：])?$/.test(body)) continue;
      line = prefix + (paren ? `（${body}${/[。）)]$/.test(body) ? '' : '。'}）` : body);
    }
    out.push(line);
  }
  let body = out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return { body, coverage: coverage.trim().split(/(?<=[，,。；;])/).filter((x) => !INTERNAL_RE.test(x) && !FOLLOW_RE.test(x)).join('').replace(/[，,。；;\s]+$/, '') };
}

function itemHeads(body) {
  const heads = [];
  for (const l of body.split('\n')) {
    const m = l.match(/^\s*(?:\d+\.|-)\s+(.*)$/);
    if (!m) continue;
    let t = m[1];
    const b = t.match(/^\*\*(.+?)\*\*/);
    if (b) t = b[1];
    else t = t.split(/[：:]|https?:\/\//)[0];
    t = t.replace(/（[^）]*）|\([^)]*\)/g, '').replace(/[*`]/g, '').replace(/[（(][^）)]*$/, '').trim();
    if (t) heads.push(t.length > 40 ? t.slice(0, 40) + '…' : t);
    if (heads.length >= 3) break;
  }
  return heads;
}

function autoTags(body) {
  // 按命中次数排序，取最多 4 个；次数过少的不打
  const scored = [];
  for (const [tag, re] of Object.entries(TAG_RULES)) {
    const n = (body.match(new RegExp(re.source, re.flags + 'g')) || []).length;
    if (n >= (tag === 'Chinese Community' ? 2 : 3)) scored.push([tag, n]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  const order = Object.keys(TAG_RULES);
  return scored.slice(0, 4).map(([t]) => t).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

const yq = (s) => JSON.stringify(s);

// 从条目行解析产品信息并登记（新建或更新）；返回 slug，失败返回 null
const TAG_LIST = Object.keys(TAG_RULES);
const REGION = { cn: 'cn', global: 'global', 国内: 'cn', 海外: 'global' };
function registerProduct(pr, day, products, aliases) {
  const text = pr.line.replace(ITEM_RE, '').trim();
  const urls = [...text.matchAll(/https?:\/\/[^\s)）\]>，。；]+/g)].map((m) => m[0]);
  const site = urls.find((u) => !isSocial(u));
  const bold = text.match(/^\*\*(.+?)\*\*/);
  let name = (bold ? bold[1] : text.split(/[：:]/)[0]).replace(/[*`]/g, '').trim();
  name = name.split(/[：:]/)[0].trim().slice(0, 40);
  let p = findProduct(products, { id: pr.slug, url: site, name }, aliases);
  if (!p) {
    if (!site) { console.warn(`! 产品未登记（缺官网链接）：第 ${pr.index} 条「${name}」`); return null; }
    const id = pr.slug || slugify(name) || slugify(normUrl(site).host.split('.')[0]);
    if (!id) { console.warn(`! 产品未登记（无法生成 slug，请加 [P:slug]）：第 ${pr.index} 条「${name}」`); return null; }
    const flat = (t) => t.replace(/^\*\*.+?\*\*\s*[：:]?\s*/, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
    const first = (t) => t.split(/(?<=[。；;.])\s/)[0].slice(0, 90);
    let one = flat(text), oneEn = '';
    if (pr.tr) { const tr = flat(pr.tr); if (isZhText(one) && !isZhText(tr)) oneEn = tr; else if (!isZhText(one) && isZhText(tr)) { oneEn = one; one = tr; } }
    else if (!isZhText(one)) { oneEn = one; }
    const cat = CATEGORIES.includes(pr.category) ? pr.category : '其他';
    const host = normUrl(site).host;
    const region = REGION[pr.region] || (/\.cn$/.test(host) || /[\u4e00-\u9fff]/.test(name) ? 'cn' : 'global');
    p = { id, name, aliases: [], url: site.replace(/[?#].*$/, ''), category: cat, region, oneLiner: (isZhText(one) ? one.split(/(?<=[。；;])/)[0].slice(0, 90) : first(one)) || name, ...(oneEn ? { oneLinerEn: first(oneEn) } : {}), score: pr.score || undefined, firstSeen: day, updated: day, tags: autoTags(text).filter((t) => TAG_LIST.includes(t)), rankings: [] };
    products.push(p);
    console.log(`  + 新产品 ${id}（${name}，${p.url}）`);
  } else {
    if (!p.firstSeen || day < p.firstSeen) p.firstSeen = day;
    if (!p.updated || day > p.updated) p.updated = day;
    if (pr.category && CATEGORIES.includes(pr.category) && p.category === '其他') p.category = pr.category;
    if (name && normName(name) !== normName(p.name) && !(p.aliases || []).some((a) => normName(a) === normName(name)) && !(aliases[p.id] || []).some((a) => normName(a) === normName(name))) p.aliases = [...(p.aliases || []), name];
    if (!p.score && pr.score) p.score = pr.score;
    console.log(`  · 更新产品 ${p.id}（firstSeen ${p.firstSeen}）`);
  }
  saveProduct(p);
  return p.id;
}

function importFile(file, forcedType) {
  const base = path.basename(file, '.md');
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);
  if (!m) usage(`文件名需为 YYYY-MM-DD-HHMM.md：${file}`);
  const [, Y, M, D, h, mi] = m;
  const type = detectType(file, forcedType);
  const src = fs.readFileSync(file, 'utf8');
  const cleaned = clean(src, type);
  const { body, daySummary, daySummaryEn, scores, prods } = extractMeta(cleaned.body);
  const products = prods.length ? loadProducts() : []; const aliases = prods.length ? loadAliases() : {};
  const prodRefs = [...new Set(prods.map((pr) => { const id = registerProduct(pr, `${Y}-${M}-${D}`, products, aliases); return id ? `${pr.index}:${id}` : null; }).filter(Boolean))];
  const coverage = cleaned.coverage;
  const nScored = scores.filter(Boolean).length;
  if (nScored && nScored < scores.length) console.warn(`! ${base}: ${scores.length - nScored}/${scores.length} 条没有 [AI:n] 评分（记为 0，不显示）`);
  const label = type === 'x-ai' ? 'AI 热点' : '科技速递';
  const title = `${label} · ${Y}-${M}-${D} ${h}:${mi}`;
  const date = `${Y}-${M}-${D}T${h}:${mi}:00+08:00`;
  const heads = itemHeads(body);
  const summary = heads.length ? heads.join('；') : title;
  const tags = autoTags(body);
  const fm = [
    '---',
    `title: ${yq(title)}`,
    `date: ${yq(date)}`,
    `type: ${yq(type)}`,
    `tags: [${tags.map(yq).join(', ')}]`,
    `summary: ${yq(summary)}`,
    coverage ? `coverage: ${yq(coverage)}` : null,
    nScored ? `scores: [${scores.join(',')}]` : null,
    daySummary ? `daySummary: ${yq(daySummary)}` : null,
    daySummaryEn ? `daySummaryEn: ${yq(daySummaryEn)}` : null,
    prodRefs.length ? `products: [${prodRefs.map(yq).join(', ')}]` : null,
    '---',
    '',
  ].filter((x) => x !== null).join('\n');
  fs.mkdirSync(OUT, { recursive: true });
  const id = `${type}-${base}`;
  const dest = path.join(OUT, `${id}.md`);
  fs.writeFileSync(dest, fm + body);
  console.log(`✓ ${id}  [${tags.join(', ')}]  items=${scores.length} scored=${nScored}${daySummary ? ' +daySummary' : ''}${daySummaryEn ? ' +daySummaryEn' : ''}${prodRefs.length ? ` products=${prodRefs.length}` : ''}`);
  return dest;
}

const args = process.argv.slice(2);
let forced;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type') { forced = args[++i]; if (!['x-ai', 'tech'].includes(forced)) usage('type 只能是 x-ai 或 tech'); }
  else files.push(args[i]);
}
if (!files.length) usage();
for (const f of files) {
  if (/follows\.md$/.test(f)) { console.error(`跳过（不发布）：${f}`); continue; }
  importFile(f, forced);
}
