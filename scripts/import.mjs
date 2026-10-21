#!/usr/bin/env node
// 把一份源 digest（X AI 汇总或科技速递）转换成 src/content/posts/<type>-<YYYY-MM-DD-HHMM>.md
// 用法：node scripts/import.mjs <file> [<file> ...] [--type x-ai|tech]
// 幂等：同一 id 会被覆盖。
// 可选字段（格式见 docs/digest-format.md）：条目行尾 `[AI:4]` → frontmatter scores；`日摘要：…` 行 → daySummary。
//会去掉关注/List 相关行、内部去重笔记以及工具失败/限流之类的内部说明。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/content/posts');

const TAG_RULES = {
  '模型': /模型|LLM|GPT|Claude|Gemini|Qwen|DeepSeek|Llama|MoE|参数|权重|Opus|Sonnet|Mistral|MiniMax|推理/i,
  'Agent': /agent|智能体|harness|子 agent|多 agent/i,
  '编程工具': /Codex|Claude Code|Cursor|OpenCode|IDE|编程|编码|代码|coding|CLI|MCP|skill|插件|git/i,
  '开源': /开源|GitHub|Apache 2\.0|MIT|Hugging Face|open[- ]?source|开放权重|权重开放/i,
  '产品': /发布|上线|推出|App|产品|功能|Product Hunt/i,
  '研究': /论文|arXiv|研究|基准|benchmark|评测|实验|技术报告/i,
  '行业': /融资|估值|收购|IPO|收入|营收|亿美元|公司|市场|价格战|裁员/i,
  '安全': /安全|漏洞|攻击|泄露|越权|隐私|风险|security|CVE|黑客/i,
  '中文社区': /V2EX|LinuxDo|linux\.do|知乎|中文圈|掘金|少数派|IT之家|公众号|宝玉|dotey/i,
};

// 关注 / List 管理相关行
const FOLLOW_RE = /新关注|关注了|已关注|Following|List「|加进.{0,20}List|私密 List|加入.{0,20}List|待关注|分批关注/;
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
const DAYSUM_RE = /^\s*(?:>\s*)?(?:\*\*)?(?:日摘要|DAY_SUMMARY)(?:\*\*)?\s*[:：]\s*(.+?)\s*$/i;

// 抽出日摘要与 AI 评分，并从正文中去掉这些标记
function extractMeta(body) {
  let daySummary = '';
  const scores = [];
  const lines = [];
  for (const line of body.split('\n')) {
    const d = line.match(DAYSUM_RE);
    if (d) { daySummary = d[1].replace(/\*\*/g, '').trim(); continue; }
    if (ITEM_RE.test(line)) {
      const m = line.match(SCORE_RE);
      scores.push(m ? Number(m[1]) : 0);
      lines.push(m ? line.replace(SCORE_RE, '') : line);
    } else lines.push(line);
  }
  return { body: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', daySummary, scores };
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
    if (n >= (tag === '中文社区' ? 2 : 3)) scored.push([tag, n]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  const order = Object.keys(TAG_RULES);
  return scored.slice(0, 4).map(([t]) => t).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

const yq = (s) => JSON.stringify(s);

function importFile(file, forcedType) {
  const base = path.basename(file, '.md');
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);
  if (!m) usage(`文件名需为 YYYY-MM-DD-HHMM.md：${file}`);
  const [, Y, M, D, h, mi] = m;
  const type = detectType(file, forcedType);
  const src = fs.readFileSync(file, 'utf8');
  const cleaned = clean(src, type);
  const { body, daySummary, scores } = extractMeta(cleaned.body);
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
    '---',
    '',
  ].filter((x) => x !== null).join('\n');
  fs.mkdirSync(OUT, { recursive: true });
  const id = `${type}-${base}`;
  const dest = path.join(OUT, `${id}.md`);
  fs.writeFileSync(dest, fm + body);
  console.log(`✓ ${id}  [${tags.join(', ')}]  items=${scores.length} scored=${nScored}${daySummary ? ' +daySummary' : ''}`);
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
