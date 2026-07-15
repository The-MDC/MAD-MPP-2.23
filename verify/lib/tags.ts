import { z } from 'zod';

// Tag Validation Logic
export const TagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(50).regex(/^[a-z0-9\-]+$/, 'Tags must be lowercase alphanumeric with hyphens'),
  category: z.enum(['nft', 'market', 'agent', 'gambit', 'brand']),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.date().optional(),
});

export type Tag = z.infer<typeof TagSchema>;

// Optimize Tag Index Performance
export class TagIndex {
  private index = new Map<string, Tag[]>();

  add(tag: Tag) {
    const key = tag.category;
    if (!this.index.has(key)) this.index.set(key, []);
    this.index.get(key)!.push(tag);
  }

  search(query: string, category?: string): Tag[] {
    // Optimized search with prefix or exact match
    const results: Tag[] = [];
    this.index.forEach((tags, cat) => {
      if (!category || cat === category) {
        tags.forEach(t => {
          if (t.name.includes(query)) results.push(t);
        });
      }
    });
    return results;
  }
}

// Cache Warming Strategies
export async function warmTagCache(tags: Tag[]) {
  const index = new TagIndex();
  tags.forEach(tag => index.add(tag));
  // Simulate warming Vercel/Next.js cache or Redis
  console.log('✅ Tag cache warmed');
  return index;
}

export { TagSchema, TagIndex, warmTagCache };