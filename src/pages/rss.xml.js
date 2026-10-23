import rss from '@astrojs/rss';
import { allDays } from '../lib/days';
export async function GET(context) {
  const days = await allDays();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: 'Daily AI',
    description: 'One page per day: AI Hot and Tech',
    site: new URL(base + '/', context.site).href,
    customData: '<language>zh-cn</language>',
    items: days.map((d) => ({
      title: d.title,
      pubDate: d.last,
      description: [d.aiHeads.length ? `AI Hot: ${d.aiHeads.join('; ')}` : '', d.techHeads.length ? `Tech: ${d.techHeads.join('; ')}` : ''].filter(Boolean).join('\n'),
      categories: d.tags,
      link: `${base}/day/${d.date}/`,
    })),
  });
}
