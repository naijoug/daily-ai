import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
export async function GET(context) {
  const posts = (await getCollection('posts')).sort((a, b) => b.data.date - a.data.date);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: 'Daily AI · 每日 AI 动态',
    description: 'X AI 热点与每日科技速递',
    site: new URL(base + '/', context.site).href,
    customData: '<language>zh-cn</language>',
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.summary,
      categories: p.data.tags,
      link: `${base}/posts/${p.id}/`,
    })),
  });
}
