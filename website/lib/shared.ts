export const appName = 'OpenSpec';

// デプロイ先サイトの絶対 URL。Open Graph や SNS 用画像の URL 解決に使う。
// デプロイ環境（Cloudflare Pages など）では NEXT_PUBLIC_SITE_URL に実際の
// ドメインを設定する。未設定または空の場合は、ローカルビルドや CI 用の
// フォールバックを使う（空文字列のままだとビルド時に `new URL()` が失敗する）。
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://openspec.dev';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// 「このページを編集」と GitHub リンクで使う OpenSpec-J のソースリポジトリ。
export const gitConfig = {
  user: 'ayumuwall',
  repo: 'OpenSpec-J',
  branch: 'ja-docs',
};

export const links = {
  github: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  discord: 'https://discord.gg/YctCnvvshC',
  npm: 'https://www.npmjs.com/package/@ayumuwall/openspec',
  x: 'https://x.com/0xTab',
};
