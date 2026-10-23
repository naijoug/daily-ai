import { tt } from './i18n';
// 内联 SVG 图标；状态（outline/filled）由 CSS 的 .on 控制
export const BOOKMARK = '<svg class="ic ic-bm" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.6L5 21V4.5a1 1 0 0 1 1-1z"/></svg>';
export const CHECK = '<svg class="ic ic-ck" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle class="rtrack" cx="12" cy="12" r="10.6"/><circle class="ring" cx="12" cy="12" r="10.6" pathLength="100"/><circle class="rc" cx="12" cy="12" r="9"/><path class="tick" d="M8 12.4l2.8 2.8L16.2 9.6"/></svg>';
export const favBtn = (attr = 'data-act="fav"') => `<button type="button" class="ibtn icob" ${attr} aria-pressed="false" aria-label="${tt('fav')}" title="${tt('fav')}">${BOOKMARK}</button>`;
export const readBtn = () => `<button type="button" class="ibtn icob" data-act="read" aria-pressed="false" aria-label="${tt('read.mark')}" title="${tt('read.mark')}">${CHECK}</button>`;
export function setFav(b: Element, on: boolean) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); const t = tt(on ? 'fav.remove' : 'fav'); b.setAttribute('aria-label', t); b.setAttribute('title', t); }
export function setRead(b: Element, on: boolean, word: 'read' | 'seen' = 'read') { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); const t = tt(on ? `${word}.done` : `${word}.mark`); b.setAttribute('aria-label', t); b.setAttribute('title', t); }
const STAR_PATH = 'M12 3.6l2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z';
export const STAR = `<svg class="ic ic-st" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
export const starsHtml = () => `<span class="stars" role="radiogroup" aria-label="${tt('stars.group')}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" data-star="${n}" aria-label="${tt('star.rate', { n })}" title="${tt('star.rate', { n })}">${STAR}</button>`).join('')}</span>`;
export const starsStatic = (n: number) => n ? `<span class="mine" title="${tt('mine', { n })}" aria-label="${tt('mine', { n })}">${Array.from({ length: n }, () => STAR).join('')}</span>` : '';
export function setStars(root: Element, rt: number) {
  root.querySelectorAll<HTMLElement>('[data-star]').forEach((b) => {
    const n = Number(b.dataset.star); b.classList.toggle('on', n <= rt);
    b.setAttribute('aria-checked', String(n === rt));
    b.setAttribute('aria-label', tt('star.rate', { n }));
    b.setAttribute('title', tt(n === rt ? 'star.clear' : 'star.rate', { n }));
  });
  root.querySelector('.stars')?.setAttribute('aria-label', tt('stars.group'));
}
// 方向键在星级间移动并选择
export function starKeys(root: Element) {
  root.addEventListener('keydown', (e) => {
    const ke = e as KeyboardEvent; const b = (ke.target as HTMLElement).closest<HTMLElement>('[data-star]'); if (!b) return;
    const d = ke.key === 'ArrowRight' || ke.key === 'ArrowUp' ? 1 : ke.key === 'ArrowLeft' || ke.key === 'ArrowDown' ? -1 : 0; if (!d) return;
    ke.preventDefault(); const n = Math.min(5, Math.max(1, Number(b.dataset.star) + d));
    const nb = b.parentElement!.querySelector<HTMLElement>(`[data-star="${n}"]`)!; nb.focus(); nb.click();
  });
}

// 翻译折叠块：<details class="itr">，默认折叠；summary 只有地球图标，名称随 UI 语言与开合状态（见 Base.astro 的 toggle 同步）
export const GLOBE = '<svg class="ic ic-gl" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z"/><path d="M3 12h18"/><path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z"/></svg>';
export const trDetails = (lang: 'en' | 'zh', html: string) => {
  const l = tt('tr.show.' + lang).replace(/[<>&"]/g, '');
  return `<details class="itr" data-tlang="${lang}"><summary class="ibtn icob" aria-label="${l}" title="${l}" data-i18n-attrs='{"title":"tr.show.${lang}","aria-label":"tr.show.${lang}"}'>${GLOBE}</summary><div class="itr-body"${lang === 'zh' ? ' lang="zh-CN"' : ''}>${html}</div></details>`;
};
// 按开合状态同步 summary 的名称（折叠=显示，展开=收起）
export function syncTr(root: ParentNode = document) {
  root.querySelectorAll<HTMLDetailsElement>('details.itr').forEach((d) => {
    const s = d.querySelector('summary'); if (!s) return;
    const t = tt(`tr.${d.open ? 'hide' : 'show'}.${d.dataset.tlang}`); s.setAttribute('aria-label', t); s.setAttribute('title', t);
  });
}
