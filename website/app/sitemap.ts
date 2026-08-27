import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

// 静的エクスポートでsitemap.xmlとして出力するサイトマップ。
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/$/, '');
  // `/` は/docsへリダイレクトするため、ドキュメントページだけをサイトマップに含める。
  // ドキュメント索引の優先度を最も高くする。
  return source.getPages().map((page) => ({
    url: `${base}${page.url}`,
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 1 : 0.7,
  }));
}
