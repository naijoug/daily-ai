// 内联 SVG 图标；状态（outline/filled）由 CSS 的 .on 控制
export const BOOKMARK = '<svg class="ic ic-bm" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.6L5 21V4.5a1 1 0 0 1 1-1z"/></svg>';
export const CHECK = '<svg class="ic ic-ck" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path class="tick" d="M8 12.4l2.8 2.8L16.2 9.6"/></svg>';
export const favBtn = (attr = 'data-act="fav"') => `<button type="button" class="ibtn icob" ${attr} aria-pressed="false" aria-label="收藏" title="收藏">${BOOKMARK}</button>`;
export const readBtn = () => `<button type="button" class="ibtn icob" data-act="read" aria-pressed="false" aria-label="标为已读" title="标为已读">${CHECK}</button>`;
export function setFav(b: Element, on: boolean) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); const t = on ? '取消收藏' : '收藏'; b.setAttribute('aria-label', t); b.setAttribute('title', t); }
export function setRead(b: Element, on: boolean, word = '已读') { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); const t = on ? `${word} · 点击标为未${word.slice(1)}` : `标为${word}`; b.setAttribute('aria-label', t); b.setAttribute('title', t); }
