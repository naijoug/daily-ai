import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const TAGS = ['模型', 'Agent', '编程工具', '开源', '产品', '研究', '行业', '安全', '中文社区'] as const;

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
  }),
});
export const collections = { posts };
