// 给每篇 post 正文里的顶层列表项（编号新闻 / 干货）加稳定 id 与 AI 评分。
// id = `${postId}-${index}`，index 从 1 开始，按正文中出现顺序全局递增。
// 评分来自 frontmatter `scores: [..]`，与 index 一一对应。
import path from 'node:path';
const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const txt = (value) => ({ type: 'text', value });
// 裸链接显示成「域名/短路径」，避免长 URL 撑满一行
function shortLink(href) {
  try {
    const u = new URL(href); const host = u.hostname.replace(/^www\./, '');
    if (/(^|\.)x\.com$|twitter\.com$/.test(host)) { const m = u.pathname.match(/^\/([^/]+)\/status/); return m ? `X @${m[1]}` : `X ${u.pathname}`; }
    if (host === 'github.com') return `GitHub ${u.pathname.split('/').filter(Boolean).slice(0, 2).join('/')}`;
    const path = u.pathname.replace(/\/$/, '');
    return host + (path.length > 24 ? path.slice(0, 22) + '…' : path);
  } catch { return href; }
}
function walkLinks(node) {
  if (node.type === 'element' && node.tagName === 'a') {
    const href = node.properties?.href; const t = node.children?.length === 1 && node.children[0].type === 'text' ? node.children[0].value : null;
    if (href && t && (t === href || t === href.replace(/^https?:\/\//, '') || (/^https?:\/\//.test(t) && t.length > 30))) { node.children[0].value = shortLink(href); node.properties.title = href; }
    if (href && /^https?:/.test(href)) { node.properties.target = '_blank'; node.properties.rel = ['noopener']; }
  }
  for (const c of node.children || []) walkLinks(c);
}
// ---- 双语条目：紧跟在条目后的 `> ` 引用块 = 另一种语言的译文，渲染成默认折叠的 <details class="itr"> ----
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
const plain = (n) => (n.type === 'text' ? n.value : (n.children || []).map(plain).join(''));
const langOf = (text) => {
  const t = text.replace(/https?:\/\/\S+/g, ' ');
  const cjk = (t.match(CJK) || []).length; const lat = (t.match(/[A-Za-z]{2,}/g) || []).length;
  return cjk >= Math.max(4, lat * 0.6) ? 'zh' : 'en';
};
const MARK = /^\s*[\[［]\s*(en|zh)\s*[\]］]\s*/i;
// 小节标题（markdown 里保持中文）→ 英文显示；中文由站点字典 sec.<原文> 切回
const SEC_EN = { 'AI 热点': 'AI Hot Topics', '有趣用法和干货': 'Tips & Hands-on', '新产品': 'New Products', '开源': 'Open Source', '科技新闻': 'Tech News', '中文社区': 'Chinese Community', '科技速递': 'Tech Digest' };
const LABEL = { zh: ['Show 中文 translation', 'Hide 中文 translation'], en: ['Show English translation', 'Hide English translation'] };
// 地球图标（与 icons.ts 的 GLOBE 相同）
const globe = () => el('svg', { className: ['ic', 'ic-gl'], viewBox: '0 0 24 24', width: 17, height: 17, ariaHidden: 'true' }, [
  el('path', { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z' }, []), el('path', { d: 'M3 12h18' }, []),
  el('path', { d: 'M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z' }, []),
]);
function takeTranslation(bq) {
  // 返回 { lang, children }；取 [en]/[zh] 标记，缺省按文字推断
  let lang = null;
  const first = bq.children.find((c) => c.type === 'element');
  const fp = first && first.tagName === 'p' ? first : null;
  const t0 = fp?.children?.[0];
  if (t0 && t0.type === 'text') { const m = t0.value.match(MARK); if (m) { lang = m[1].toLowerCase(); t0.value = t0.value.slice(m[0].length); } }
  const children = bq.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
  if (!lang) lang = langOf(plain(bq));
  return { lang, children };
}
function trNode(tr) {
  const lbl = LABEL[tr.lang];
  return el('details', { className: ['itr'], dataTlang: tr.lang }, [
    el('summary', { className: ['ibtn', 'icob'], title: lbl[0], ariaLabel: lbl[0], dataI18nAttrs: JSON.stringify({ title: `tr.show.${tr.lang}`, 'aria-label': `tr.show.${tr.lang}` }) }, [globe()]),
    el('div', { className: ['itr-body'], ...(tr.lang === 'zh' ? { lang: 'zh-CN' } : {}) }, tr.children),
  ]);
}
export default function rehypeItems(opts = {}) {
  const base = (opts.base || '').replace(/\/$/, '');
  return (tree, file) => {
    const fp = file.path || file.history?.[0] || '';
    if (!/content[\\/]posts[\\/]/.test(fp)) return;
    const pid = path.basename(fp, '.md');
    const scores = file.data?.astro?.frontmatter?.scores || [];
    const prods = {};
    for (const t of file.data?.astro?.frontmatter?.products || []) { const [i, id] = String(t).split(':'); (prods[i] ||= []).push(id); }
    walkLinks(tree);
    let n = 0;
    // 1) 紧跟在列表后（中间没有空行）的 blockquote → 挂到上一条的译文
    const kids = tree.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
    const dropped = new Set(); const trOf = new Map(); let prevList = null;
    for (const c of kids) {
      if (c.type === 'element' && ['ol', 'ul'].includes(c.tagName)) { prevList = c; continue; }
      if (c.type === 'element' && c.tagName === 'blockquote' && prevList) {
        const lastLi = [...prevList.children].reverse().find((x) => x.type === 'element' && x.tagName === 'li');
        const adj = lastLi && c.position && prevList.position && c.position.start.line === prevList.position.end.line + 1;
        if (adj) { trOf.set(lastLi, takeTranslation(c)); dropped.add(c); prevList.__mergeNext = true; continue; }
      }
      if (c.type === 'element' && c.tagName === 'h2') {
        const k = plain(c).trim();
        if (SEC_EN[k]) { c.properties = { ...c.properties, dataI18n: `sec.${k}` }; c.children = [txt(SEC_EN[k])]; }
      }
      prevList = null;
    }
    tree.children = tree.children.filter((c) => !dropped.has(c));
    for (const node of tree.children) {
      if (node.type !== 'element' || !['ol', 'ul'].includes(node.tagName)) continue;
      node.properties.className = ['items'];
      for (const li of node.children) {
        if (li.type !== 'element' || li.tagName !== 'li') continue;
        n++;
        const id = `${pid}-${n}`;
        const s = scores[n - 1];
        li.properties = { ...li.properties, id, className: ['item'], dataId: id, ...(s ? { dataScore: String(s) } : {}) };
        // 缩进写在条目内的 blockquote 同样当作译文
        let tr = trOf.get(li);
        if (!tr) { const bq = li.children.find((c) => c.type === 'element' && c.tagName === 'blockquote'); if (bq) { tr = takeTranslation(bq); li.children = li.children.filter((c) => c !== bq); } }
        const plang = langOf(li.children.map(plain).join(''));
        li.properties.dataLang = plang;
        const body = el('div', { className: ['itext'], ...(plang === 'zh' ? { lang: 'zh-CN' } : {}) }, li.children);
        const meta = el('div', { className: ['imeta'] }, [
          s ? el('span', { className: ['ascore', `s${s}`], title: `AI score ${s}/5`, ariaLabel: `AI score ${s}/5`, dataI18nAttrs: JSON.stringify({ title: 'ai.score', 'aria-label': 'ai.score' }), dataI18nA: JSON.stringify({ n: s }) }, [txt(String(s))]) : txt(''),
          ...(prods[n] || []).map((id) => el('a', { className: ['ibtn', 'plink'], href: `${base}/products/${id}/`, dataI18n: 'plink', dataI18nA: JSON.stringify({ id }) }, [txt(`Product · ${id}`)])),
          // 译文开关（地球图标）放进页脚行；展开后的译文块换行显示在页脚下方
          ...(tr && tr.children.length ? [trNode(tr)] : []),
        ]);
        li.children = [body, meta];
      }
    }
    // 被译文引用块隔开的相邻列表合并回一个列表
    const out = [];
    for (const c of tree.children) {
      const prev = out[out.length - 1];
      if (prev?.__mergeNext && c.type === 'text' && !c.value.trim()) continue;
      if (prev?.__mergeNext && c.type === 'element' && c.tagName === prev.tagName) { prev.children.push(...c.children); prev.__mergeNext = c.__mergeNext; continue; }
      out.push(c);
    }
    tree.children = out;
  };
}