import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // 静的HTMLとしてエクスポートし、`out/` ディレクトリをCloudflare Pagesへ直接デプロイする。
  output: 'export',
  // 静的エクスポートでは画像最適化APIを使用できないため、画像をそのまま配信する。
  // ドキュメント処理がnext/imageで埋め込む図に必要。
  images: { unoptimized: true },
  reactStrictMode: true,
  // このサイトは専用のロックファイルを持ち、OpenSpecモノレポ内に置かれている。
  // Next.jsの複数ロックファイル推論警告を抑えるため、ワークスペースルートを固定する。
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withMDX(config);
