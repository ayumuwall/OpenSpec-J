import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';

// 一時対応（2026-08-21）: Overviewページ（/docsで配信するドキュメント索引）は
// 書き直し中のためdocs.sync.config.mjsの同期対象から除外されている。
// Cloudflareはpublic/_redirectsで/docsをリダイレクトする。このmeta refreshは、
// HTTPリダイレクトを返せないローカル開発環境と静的エクスポート向けのフォールバック。
// Overviewを戻したら、この定数、下の2か所の使用箇所、`{ slug: [] }` を削除する。
const TEMP_DOCS_INDEX_REDIRECT = '/docs/installation';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    if (!params.slug?.length) {
      return (
        <>
          <meta httpEquiv="refresh" content={`0; url=${TEMP_DOCS_INDEX_REDIRECT}`} />
          <p>
            <a href={TEMP_DOCS_INDEX_REDIRECT}>インストール</a>へ移動しています…
          </p>
        </>
      );
    }
    notFound();
  }

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={{ enabled: true, includeRoot: false, includePage: false }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/${
            page.data.githubSource ?? `website/content/docs/${page.path}`
          }`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const params: { slug: string[] }[] = source.generateParams();
  // 一時対応: 索引ページがなくても/docsを生成し、静的エクスポートに
  // 上記のmeta refreshフォールバックを含める。
  if (!params.some((p) => !p.slug?.length)) params.push({ slug: [] });
  return params;
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    // 一時対応: /docsのリダイレクト用フォールバックに使うメタデータ（上記Pageを参照）。
    if (!params.slug?.length) return { title: 'ドキュメント', robots: { index: false } };
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
