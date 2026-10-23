// 站点 UI 多语言（en 默认 / zh）。服务端渲染英文并带 data-i18n 标记，浏览器端按 localStorage `dailyai:lang` 切换。
// 内容（条目正文）不随 UI 语言切换，只有界面文字切换。
export type Lang = 'en' | 'zh';
export const LANG_KEY = 'dailyai:lang';
type Dict = Record<string, string>;
const en: Dict = {
  'site.title': 'Daily AI · Daily AI digest',
  'nav.label': 'Main navigation', 'nav.home': 'Home', 'nav.products': 'Products', 'nav.tags': 'Tags', 'nav.search': 'Search', 'nav.favorites': 'Favorites',
  'theme.toggle': 'Toggle theme', 'lang.label': 'Language', 'lang.en': 'English', 'lang.zh': '中文',
  'foot.text': 'Content from the daily digests', 'foot.rss': 'Subscribe via RSS',
  // home / gallery
  'home.intro': 'One page per day: AI Hot and Tech digests from X. {n} days.', 'home.daily': '▦ Daily', 'home.search': '⌕ Search',
  'gallery.newTitle': 'Products first seen on this day', 'gallery.new': 'New today', 'gallery.topTitle': 'Items with AI score ≥ 4', 'gallery.top': '★ {n} top-rated',
  'prog': '{r}/{t} read',
  // day
  'day.crumb': 'Daily', 'day.title': '{date} · {wd}', 'day.meta': '· {n} runs · {t} items', 'day.meta.one': '· 1 run · {t} items',
  'day.hide': 'Hide read', 'day.pager': 'Pagination', 'day.cov': 'Covers', 'day.allread': '✓ All read · uncheck “Hide read” to show them again',
  'tz.label': 'Time zone', 'tz.btn': 'Time zone: {z}. Click to change', 'tz.auto': 'Auto (browser)', 'tz.auto.cur': 'Auto (browser) · {z}', 'tz.common': 'Common time zones', 'tz.offsets': 'UTC offsets', 'tz.note': 'Digest times are recorded in UTC+8 and converted for display. Days stay grouped by the UTC+8 date.', 'tz.close': 'Close',
  'tz.Asia/Shanghai': 'China · Asia/Shanghai', 'tz.Asia/Tokyo': 'Japan · Asia/Tokyo', 'tz.Asia/Kolkata': 'India · Asia/Kolkata', 'tz.Europe/London': 'UK · Europe/London', 'tz.Europe/Berlin': 'Germany · Europe/Berlin', 'tz.America/New_York': 'US Eastern · America/New_York', 'tz.America/Los_Angeles': 'US Pacific · America/Los_Angeles', 'tz.Australia/Sydney': 'Australia · Australia/Sydney',
  'sec.AI 热点': 'AI Hot Topics', 'sec.有趣用法和干货': 'Tips & Hands-on', 'sec.新产品': 'New Products', 'sec.开源': 'Open Source', 'sec.科技新闻': 'Tech News', 'sec.中文社区': 'Chinese Community', 'sec.科技速递': 'Tech Digest',
  'wd.0': 'Sun', 'wd.1': 'Mon', 'wd.2': 'Tue', 'wd.3': 'Wed', 'wd.4': 'Thu', 'wd.5': 'Fri', 'wd.6': 'Sat',
  // item controls
  'fav': 'Favorite', 'fav.remove': 'Remove favorite', 'read.mark': 'Mark as read', 'read.done': 'Read · click to mark unread',
  'seen.mark': 'Mark as seen', 'seen.done': 'Seen · click to mark unseen',
  'stars.group': 'My rating', 'star.rate': 'Rate {n}/5', 'star.clear': 'Rate {n}/5 · click again to clear', 'mine': 'My rating {n}/5',
  'ai.score': 'AI score {n}/5', 'plink': 'Product · {id}',
  'tr.show.zh': 'Show 中文 translation', 'tr.hide.zh': 'Hide 中文 translation', 'tr.show.en': 'Show English translation', 'tr.hide.en': 'Hide English translation',
  // tags
  'tags.title': 'Tags', 'tag.title': 'Tag: {tag}', 'days': '{n} days', 'days.one': '1 day',
  'tag.Models': 'Models', 'tag.Agents': 'Agents', 'tag.Dev Tools': 'Dev Tools', 'tag.Open Source': 'Open Source', 'tag.Products': 'Products', 'tag.Research': 'Research', 'tag.Industry': 'Industry', 'tag.Security': 'Security', 'tag.Chinese Community': 'Chinese Community',
  // search
  'search.title': 'Search', 'search.ph': 'Search all digests…', 'search.zero': 'No results for “[SEARCH_TERM]”', 'search.many': '[COUNT] results for “[SEARCH_TERM]”', 'search.one': '1 result for “[SEARCH_TERM]”',
  // favorites
  'fav.title': 'Favorites', 'fav.desc': 'Favorites, read state and ratings are stored only in this browser (localStorage). Export JSON to move them to another device.',
  'fav.s.ts': 'By date favorited', 'fav.s.mine': 'By my rating', 'fav.s.ai': 'By AI score', 'fav.s.day': 'By date', 'sort': 'Sort',
  'fav.export': 'Export JSON', 'fav.import': 'Import JSON', 'fav.empty': 'No favorites yet. Click the bookmark icon under an item on a day page, or on a product page.',
  'fav.stat': '{f} favorites · {r} read · {m} rated', 'fav.product': 'Product page', 'fav.source': '{day} source', 'fav.gp': 'Products · {n}', 'fav.gi': 'Items · {n}',
  'fav.badfmt': 'Invalid format', 'fav.imported': 'Imported and merged with existing data', 'fav.failed': 'Import failed: ',
  // products
  'p.title': 'AI Products', 'p.intro': '{n} products. Ranking data comes from public sources such as a16z, AICPB, OpenRouter, each labeled with source and date; lists use different methodologies and are not merged into one score.',
  'p.tab.all': '▦ Products', 'p.tab.rank': '☰ Rankings', 'p.tab.models': '◆ Models', 'p.search': '⌕ Search',
  'p.fresh': 'New this week', 'p.fresh.sub': '· first seen after {d}', 'all': 'All', 'region.cn': 'Domestic', 'region.global': 'Global',
  'p.s.score': 'By AI score', 'p.s.trend': 'By trend (latest MoM)', 'p.s.new': 'By newest (first seen)', 'p.site': 'Website ↗',
  'p.rank.note': 'Product rankings are recorded as published; each table states its source, data period and methodology. AICPB does not disclose its collection method, so treat it as indicative only; Product Hunt / HF are automatic daily snapshots.',
  'p.models.note': 'Model rankings are shown separately from the product library. The three sources measure different things (OpenRouter: token usage, Artificial Analysis: benchmark composite index, LMArena: human blind-vote score), so they are shown side by side and not combined into one score.',
  'p.count': 'Showing {n} / {t}', 'p.seen': 'Seen',
  'p.crumb': 'AI Products', 'p.first': 'First seen {d}', 'p.hist': 'Ranking history', 'p.nohist': 'No ranking records yet.',
  'p.th.list': 'List', 'p.th.period': 'Period', 'p.th.value': 'Value', 'p.th.mom': 'MoM',
  'p.hist.note': 'Each row’s methodology is given by the list name (MAU, traffic and token usage differ), so rows are not comparable. AICPB does not disclose its collection method.',
  'p.mentions': 'Mentioned on this site', 'p.nomentions': 'No daily digest item mentions it yet.', 'p.all': '← All products', 'p.models': 'Models →',
  'r.period': 'Data period {d}', 'r.published': 'Published {d}', 'r.manual': 'Manual snapshot', 'r.source': 'Source ↗', 'r.name': 'Name', 'r.summary': 'Summary', 'r.value': 'Value', 'r.mom': 'MoM', 'r.earlier': 'Earlier snapshots: {l}',
  'cat.对话助手': 'Assistants', 'cat.编程/Agent': 'Coding / Agents', 'cat.办公': 'Office', 'cat.图像': 'Image', 'cat.视频': 'Video', 'cat.音频': 'Audio', 'cat.搜索': 'Search', 'cat.研究': 'Research', 'cat.开发者平台': 'Dev Platforms', 'cat.其他': 'Other',
};
const zh: Dict = {
  'site.title': 'Daily AI · 每日 AI 动态',
  'nav.label': '主导航', 'nav.home': '首页', 'nav.products': '产品', 'nav.tags': '标签', 'nav.search': '搜索', 'nav.favorites': '收藏',
  'theme.toggle': '切换深浅色', 'lang.label': '语言', 'lang.en': 'English', 'lang.zh': '中文',
  'foot.text': '内容来自每日汇总', 'foot.rss': '订阅 RSS',
  'home.intro': '每天一页：X 上的 AI Hot 与 Tech 速递。共 {n} 天。', 'home.daily': '▦ 每日', 'home.search': '⌕ 搜索',
  'gallery.newTitle': '首次出现在这一天的产品', 'gallery.new': '今日新产品', 'gallery.topTitle': 'AI 评分 ≥4 的条目', 'gallery.top': '★ {n} 条高分',
  'prog': '{r}/{t} 已读',
  'day.crumb': '每日', 'day.title': '{date} · {wd}', 'day.meta': '· {n} 期 · {t} 条', 'day.meta.one': '· 1 期 · {t} 条',
  'day.hide': '隐藏已读', 'day.pager': '翻页', 'day.cov': '覆盖', 'day.allread': '✓ 已全部读完 · 取消勾选「隐藏已读」可重新显示',
  'tz.label': '时区', 'tz.btn': '时区：{z}，点击切换', 'tz.auto': '自动（浏览器）', 'tz.auto.cur': '自动（浏览器）· {z}', 'tz.common': '常用时区', 'tz.offsets': 'UTC 偏移', 'tz.note': '汇总时间按 UTC+8 记录，显示时换算为所选时区；每日页仍按 UTC+8 日期分组。', 'tz.close': '关闭',
  'tz.Asia/Shanghai': '中国 · Asia/Shanghai', 'tz.Asia/Tokyo': '日本 · Asia/Tokyo', 'tz.Asia/Kolkata': '印度 · Asia/Kolkata', 'tz.Europe/London': '英国 · Europe/London', 'tz.Europe/Berlin': '德国 · Europe/Berlin', 'tz.America/New_York': '美东 · America/New_York', 'tz.America/Los_Angeles': '美西 · America/Los_Angeles', 'tz.Australia/Sydney': '澳大利亚 · Australia/Sydney',
  'sec.AI 热点': 'AI 热点', 'sec.有趣用法和干货': '有趣用法和干货', 'sec.新产品': '新产品', 'sec.开源': '开源', 'sec.科技新闻': '科技新闻', 'sec.中文社区': '中文社区', 'sec.科技速递': '科技速递',
  'wd.0': '周日', 'wd.1': '周一', 'wd.2': '周二', 'wd.3': '周三', 'wd.4': '周四', 'wd.5': '周五', 'wd.6': '周六',
  'fav': '收藏', 'fav.remove': '取消收藏', 'read.mark': '标为已读', 'read.done': '已读 · 点击标为未读',
  'seen.mark': '标为已看', 'seen.done': '已看 · 点击标为未看',
  'stars.group': '我的评分', 'star.rate': '评分 {n}/5', 'star.clear': '评分 {n}/5 · 再点清除', 'mine': '我的评分 {n}/5',
  'ai.score': 'AI 评分 {n}/5', 'plink': '产品 · {id}',
  'tr.show.zh': '显示中文翻译', 'tr.hide.zh': '收起中文翻译', 'tr.show.en': '显示英文翻译', 'tr.hide.en': '收起英文翻译',
  'tags.title': '标签', 'tag.title': '标签：{tag}', 'days': '共 {n} 天', 'days.one': '共 1 天',
  'tag.Models': '模型', 'tag.Agents': 'Agent', 'tag.Dev Tools': '编程工具', 'tag.Open Source': '开源', 'tag.Products': '产品', 'tag.Research': '研究', 'tag.Industry': '行业', 'tag.Security': '安全', 'tag.Chinese Community': '中文社区',
  'search.title': '全文搜索', 'search.ph': '搜索全部汇总…', 'search.zero': '没有找到“[SEARCH_TERM]”的结果', 'search.many': '找到 [COUNT] 条“[SEARCH_TERM]”的结果', 'search.one': '找到 1 条“[SEARCH_TERM]”的结果',
  'fav.title': '收藏', 'fav.desc': '收藏、已读和个人评分只保存在这台设备的浏览器里（localStorage）。换设备时可以导出 JSON 再导入。',
  'fav.s.ts': '按收藏时间', 'fav.s.mine': '按我的评分', 'fav.s.ai': '按 AI 评分', 'fav.s.day': '按日期', 'sort': '排序',
  'fav.export': '导出 JSON', 'fav.import': '导入 JSON', 'fav.empty': '还没有收藏。在每日页面点条目下方的书签图标，或在产品页点书签图标即可。',
  'fav.stat': '{f} 条收藏 · {r} 条已读 · {m} 条已评分', 'fav.product': '产品页', 'fav.source': '{day} 原文', 'fav.gp': '产品 · {n}', 'fav.gi': '条目 · {n}',
  'fav.badfmt': '格式不对', 'fav.imported': '已导入并与现有数据合并', 'fav.failed': '导入失败：',
  'p.title': 'AI 产品', 'p.intro': '{n} 个产品，榜单数据来自 a16z、AI产品榜 AICPB、OpenRouter 等公开来源，均标注来源与日期；不同榜单口径不同，不合并计分。',
  'p.tab.all': '▦ 产品', 'p.tab.rank': '☰ 榜单', 'p.tab.models': '◆ 模型榜', 'p.search': '⌕ 搜索',
  'p.fresh': '本周新上榜', 'p.fresh.sub': '· 首次出现在 {d} 之后', 'all': '全部', 'region.cn': '国内', 'region.global': '海外',
  'p.s.score': '按 AI 评分', 'p.s.trend': '按趋势（最近环比）', 'p.s.new': '按最新（首次出现）', 'p.site': '官网 ↗',
  'p.rank.note': '产品类榜单原样记录，每张表注明来源、数据期与口径。AICPB 未公开采集方法，仅供参考；Product Hunt / HF 为每日自动快照。',
  'p.models.note': '模型榜单独展示，与产品库分开。三个来源的指标完全不同（OpenRouter 是 token 用量、Artificial Analysis 是评测综合指数、LMArena 是人工盲评投票分），只并排展示，不合成一个分数。',
  'p.count': '显示 {n} / {t} 个', 'p.seen': '已看',
  'p.crumb': 'AI 产品', 'p.first': '首次出现 {d}', 'p.hist': '榜单记录', 'p.nohist': '暂无榜单记录。',
  'p.th.list': '榜单', 'p.th.period': '数据期', 'p.th.value': '数值', 'p.th.mom': '环比',
  'p.hist.note': '每行的口径见榜单名称（MAU、访问量、token 用量各不相同），不可横向比较。AICPB 未公开采集方法。',
  'p.mentions': '本站提到它的条目', 'p.nomentions': '每日速递里还没有提到它的条目。', 'p.all': '← 全部产品', 'p.models': '模型榜 →',
  'r.period': '数据期 {d}', 'r.published': '发布 {d}', 'r.manual': '手动快照', 'r.source': '来源 ↗', 'r.name': '名称', 'r.summary': '简介', 'r.value': '数值', 'r.mom': '环比', 'r.earlier': '历史快照：{l}',
  'cat.对话助手': '对话助手', 'cat.编程/Agent': '编程/Agent', 'cat.办公': '办公', 'cat.图像': '图像', 'cat.视频': '视频', 'cat.音频': '音频', 'cat.搜索': '搜索', 'cat.研究': '研究', 'cat.开发者平台': '开发者平台', 'cat.其他': '其他',
};
export const DICT: Record<Lang, Dict> = { en, zh };
export type Args = Record<string, string | number | string[] | undefined>;
export function t(key: string, args: Args = {}, lang: Lang = 'en'): string {
  let k = key;
  if (args.n === 1 && DICT[lang][key + '.one'] !== undefined) k = key + '.one';
  let s = DICT[lang][k] ?? DICT.en[k] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, a) => {
    if (a === 'wd' && args.wdk !== undefined) return t('wd.' + args.wdk, {}, lang);
    if (a === 'tag' && args.tagk !== undefined) return t(String(args.tagk), {}, lang);
    const v = args[a]; if (v === undefined) return `{${a}}`;
    return Array.isArray(v) ? v.join(lang === 'zh' ? '、' : ', ') : String(v);
  });
}
// 服务端：生成 data-i18n 属性（文本）/ 属性翻译
const ja = (a?: Args) => (a && Object.keys(a).length ? JSON.stringify(a) : undefined);
export const ia = (key: string, args?: Args) => ({ 'data-i18n': key, 'data-i18n-a': ja(args) });
export const iattr = (map: Record<string, string>, args?: Args) => ({
  ...Object.fromEntries(Object.entries(map).map(([a, k]) => [a, t(k, args)])),
  'data-i18n-attrs': JSON.stringify(map), 'data-i18n-a': ja(args),
});
export const tagKey = (tag: string) => `tag.${tag}`;
export const catKey = (c: string) => `cat.${c}`;
// ---- 浏览器端 ----
export const getLang = (): Lang => ((typeof document !== 'undefined' && document.documentElement.dataset.lang) === 'zh' ? 'zh' : 'en');
export const tt = (key: string, args?: Args) => t(key, args, getLang());
export function applyI18n(root: ParentNode = document) {
  const lang = getLang();
  const argsOf = (el: Element): Args => { try { return JSON.parse(el.getAttribute('data-i18n-a') || '{}'); } catch { return {}; } };
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')!, argsOf(el), lang); });
  root.querySelectorAll('[data-i18n-attrs]').forEach((el) => {
    const m = JSON.parse(el.getAttribute('data-i18n-attrs') || '{}') as Record<string, string>; const a = argsOf(el);
    for (const [attr, key] of Object.entries(m)) el.setAttribute(attr, t(key, a, lang));
  });
  const ti = document.querySelector('title[data-tkey]');
  if (ti) document.title = t(ti.getAttribute('data-tkey')!, argsOf(ti), lang) + ' | Daily AI';
  else if (!document.querySelector('title[data-tfixed]')) document.title = t('site.title', {}, lang);
}
export function setLang(l: Lang) {
  try { localStorage.setItem(LANG_KEY, l); } catch {}
  const h = document.documentElement; h.dataset.lang = l; h.lang = l === 'zh' ? 'zh-CN' : 'en';
  applyI18n(); updateSwitcher();
  window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
}
export function updateSwitcher() {
  const l = getLang();
  document.querySelectorAll<HTMLElement>('[data-setlang]').forEach((b) => { const on = b.dataset.setlang === l; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
}
export const onLang = (fn: (l: Lang) => void) => window.addEventListener('langchange', (e) => fn((e as CustomEvent).detail));
