import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { remarkMdxMermaid, remarkNpm } from 'fumadocs-core/mdx-plugins';
import { remarkGfmAlert } from './lib/remark-gfm-alert';
import { remarkFileSteps } from './lib/remark-file-steps';
import { remarkFaq } from './lib/remark-faq';
import { z } from 'zod';

// frontmatterと `meta.json` のZodスキーマはここでカスタマイズできる。
// 詳細: https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // `githubSource` はscripts/sync-docs.mjsが追加し、ページの生成元となる
    // 正式な `docs-lab/**/*.md` を指す。「このページを編集」リンクから、
    // 生成済みの複製ではなく実際のソースを開けるようにする。
    schema: pageSchema.extend({ githubSource: z.string().optional() }),
    postprocess: {
      includeProcessedMarkdown: {
        mdxAsPlaceholder: ['Mermaid', 'Callout', 'FileSteps', 'Accordions', 'Accordion'],
      },
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // 言語が `npm` のフェンスを、コピー操作付きのパッケージマネージャータブ
    //（npm / pnpm / yarn / bun）へ変換する。persistはブロック間で読者の選択を維持する。
    // `remarkGfmAlert` はGitHub形式の `> [!NOTE]` 引用をCalloutとして表示する。
    remarkPlugins: [
      remarkMdxMermaid,
      remarkGfmAlert,
      remarkFileSteps,
      remarkFaq,
      [remarkNpm, { persist: { id: 'package-manager' } }],
    ],
  },
});
