import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const TAGS = ['Models', 'Agents', 'Dev Tools', 'Open Source', 'Products', 'Research', 'Industry', 'Security', 'Chinese Community'] as const;
export const tagSlug = (t: string) => t.toLowerCase().replace(/\s+/g, '-');

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['x-ai', 'tech']),
    tags: z.array(z.enum(TAGS)).default([]),
    summary: z.string(),
    coverage: z.string().optional(),
    scores: z.array(z.number().int().min(0).max(5)).default([]),
    daySummary: z.string().optional(),
    daySummaryEn: z.string().optional(),
    products: z.array(z.string()).default([]),
  }),
});
const ranking = z.object({
  source: z.string(), list: z.string(), badge: z.string().optional(), rank: z.number().int().optional(),
  metric: z.string().optional(), value: z.string().optional(), mom: z.string().optional(),
  date: z.string(), url: z.string(), snap: z.string().optional(),
});
export const PRODUCT_CATEGORIES = ['对话助手', '编程/Agent', '办公', '图像', '视频', '音频', '搜索', '研究', '开发者平台', '其他'] as const;
const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    id: z.string(), name: z.string(), aliases: z.array(z.string()).default([]), url: z.string().url(),
    domains: z.array(z.string()).default([]), category: z.enum(PRODUCT_CATEGORIES), region: z.enum(['cn', 'global']),
    maker: z.string().optional(), oneLiner: z.string(), oneLinerEn: z.string().optional(), score: z.number().int().min(1).max(5).optional(),
    growth: z.number().optional(), growthNote: z.string().optional(), growthDate: z.string().optional(),
    firstSeen: z.string(), updated: z.string(), tags: z.array(z.enum(TAGS)).default([]),
    mentionExclude: z.array(z.string()).default([]), matchNames: z.array(z.string()).optional(), rankings: z.array(ranking).default([]),
  }),
});
export const collections = { posts, products };
