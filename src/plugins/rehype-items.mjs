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
export default function rehypeItems() {
  return (tree, file) => {
    const fp = file.path || file.history?.[0] || '';
    if (!/content[\\/]posts[\\/]/.test(fp)) return;
    const pid = path.basename(fp, '.md');
    const scores = file.data?.astro?.frontmatter?.scores || [];
    walkLinks(tree);
    let n = 0;
    for (const node of tree.children) {
      if (node.type !== 'element' || !['ol', 'ul'].includes(node.tagName)) continue;
      node.properties.className = ['items'];
      for (const li of node.children) {
        if (li.type !== 'element' || li.tagName !== 'li') continue;
        n++;
        const id = `${pid}-${n}`;
        const s = scores[n - 1];
        li.properties = { ...li.properties, id, className: ['item'], dataId: id, ...(s ? { dataScore: String(s) } : {}) };
        const body = el('div', { className: ['itext'] }, li.children);
        const meta = el('div', { className: ['imeta'] }, [
          s ? el('span', { className: ['ascore', `s${s}`], title: `AI 评分 ${s}/5` }, [txt(`AI ${s}`)]) : txt(''),
        ]);
        li.children = [body, meta];
      }
    }
  };
}
