import { defineConfig } from 'astro/config';
import rehypeItems from './src/plugins/rehype-items.mjs';
export default defineConfig({
  site: 'https://naijoug.github.io',
  base: '/dailyai',
  trailingSlash: 'ignore',
  markdown: { rehypePlugins: [[rehypeItems, { base: '/dailyai' }]] },
});
