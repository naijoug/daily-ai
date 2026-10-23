// 内联 SVG 图标；状态（outline/filled）由 CSS 的 .on 控制
export const BOOKMARK = '<svg class="ic ic-bm" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.6L5 21V4.5a1 1 0 0 1 1-1z"/></svg>';
export const CHECK = '<svg class="ic ic-ck" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle class="rtrack" cx="12" cy="12" r="10.6"/><circle class="ring" cx="12" cy="12" r="10.6" pathLength="100"/><circle class="rc" cx="12" cy="12" r="9"/><path class="tick" d="M8 12.4l2.8 2.8L16.2 9.6"/></svg>';
export const favBtn = (attr = 'data-act="fav"') => `<button type="button" class="ibtn icob" ${attr} aria-pressed="false" aria-label="Favorite" title="Favorite">${BOOKMARK}</button>`;
export const readBtn = () => `<button type="button" class="ibtn icob" data-act="read" aria-pressed="false" aria-label="Mark as read" title="Mark as read">${CHECK}</button>`;
export function setFav(b: Element, on: boolean) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); const t = on ? 'Remove favorite' : 'Favorite'; b.setAttribute('aria-label', t); b.setAttribute('title', t); }
export function setRead(b: Element, on: boolean, word = 'read') { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); const t = on ? `${word[0].toUpperCase()}${word.slice(1)} · click to mark un${word}` : `Mark as ${word}`; b.setAttribute('aria-label', t); b.setAttribute('title', t); }
const STAR_PATH = 'M12 3.6l2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z';
export const STAR = `<svg class="ic ic-st" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
export const starsHtml = () => `<span class="stars" role="radiogroup" aria-label="My rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" data-star="${n}" aria-label="Rate ${n}/5" title="Rate ${n}/5">${STAR}</button>`).join('')}</span>`;
export const starsStatic = (n: number) => n ? `<span class="mine" title="My rating ${n}/5" aria-label="My rating ${n}/5">${Array.from({ length: n }, () => STAR).join('')}</span>` : '';
export function setStars(root: Element, rt: number) {
  root.querySelectorAll<HTMLElement>('[data-star]').forEach((b) => {
    const n = Number(b.dataset.star); b.classList.toggle('on', n <= rt);
    b.setAttribute('aria-checked', String(n === rt));
    b.setAttribute('title', n === rt ? `Rate ${n}/5 · click again to clear` : `Rate ${n}/5`);
  });
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
