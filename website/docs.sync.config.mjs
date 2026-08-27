// ドキュメントサイトのコンテンツを管理する唯一の情報源。
//
// `content/docs/` 配下のページは手作業で編集しない。`npm run build` / `npm run dev` の
// 最初に実行される `scripts/sync-docs.mjs` が、リポジトリの `docs-lab/**/*.md` から生成する。
// `../docs-lab` の文書を編集すると、ローカル環境とCIの両方でサイトへ自動反映される。
//
// 公開する文書、slug / URL、サイドバーのセクションと順序は、このマニフェストだけで決める。
//
// `source` はリポジトリルートの `docs-lab/` からの相対パス。
// `slug` は `/docs/` 配下のページパス。
//
// セクションの `pages` にはフォルダ項目（`{ folder, label, pages }`）も指定できる。
// 配下のページは `<folder>/...` のslugで公開され、サイドバーでは折りたたみ可能な
// グループとして表示される。`<folder>/index` は `/docs/<folder>` で配信する
// フォルダのランディングページ。フォルダは入れ子にでき、`folder` には
// `schemas/spec-driven` のようなフルパスを指定する。
//
// ページ説明は各ページ先頭の `> ...` 引用からsync-docs.mjsがfrontmatterへ移す。
// ここには重複して記載しない。
export const docsDir = '../docs-lab';

/** サイドバーのラベル付きグループとして表示するセクション（記載順）。 */
export const sections = [
  {
    label: 'はじめに',
    pages: [
      // 一時対応（2026-08-21）: docs-lab/start/overview.mdは書き直し中のTODOだけの
      // ページなので、サイトから除外している。復帰まではpublic/_redirects（Cloudflare）と
      // app/docs/[[...slug]]/page.tsxの空slugフォールバック（ローカル開発・静的エクスポート）で、
      // /docsをInstallationへリダイレクトする。復帰時は下の行を有効にして両方の
      // リダイレクトを削除する。`index` slugは/docsを配信するためのルーター要件で、
      // 執筆元ファイルはoverview.md。
      // { source: 'start/overview.md', slug: 'index' },
      { source: 'start/installation.md', slug: 'installation' },
      { source: 'start/setup.md', slug: 'setup' },
      { source: 'start/quickstart.md', slug: 'quickstart' },
    ],
  },
  // ガイドは執筆完了まで公開しない。公開時はフォルダ構造を維持したまま項目を
  // コメント外へ移し、slugを `<folder>/<name>` のまま保つ。非公開ガイドへのリンクは
  // GitHub上のソースへフォールバックする（scripts/sync-docs.mjsのrewriteLinksを参照）。
  // このセクションを戻すと、ナビバーのガイドタブも自動で復帰する（lib/source.ts）。
  /*
  {
    label: 'ガイド',
    pages: [
      {
        folder: 'understanding',
        label: 'OpenSpecを理解する',
        defaultOpen: true,
        pages: [{ source: 'guides/concepts.md', slug: 'understanding/concepts' }],
      },
      {
        folder: 'using',
        label: 'OpenSpecを使う',
        defaultOpen: true,
        pages: [
          { source: 'guides/explore.md', slug: 'using/explore' },
          { source: 'guides/review-the-plan.md', slug: 'using/review-the-plan' },
          { source: 'guides/apply.md', slug: 'using/apply' },
          { source: 'guides/change-course.md', slug: 'using/change-course' },
        ],
      },
      {
        folder: 'adopting',
        label: 'OpenSpecを導入する',
        defaultOpen: true,
        pages: [
          { source: 'guides/existing-codebases.md', slug: 'adopting/existing-codebases' },
          { source: 'guides/teams.md', slug: 'adopting/teams' },
        ],
      },
    ],
  },
  */
  {
    label: 'カスタマイズ',
    pages: [
      { source: 'customize/overview.md', slug: 'customize' },
      { source: 'customize/profiles.md', slug: 'profiles' },
      { source: 'customize/project-config.md', slug: 'project-config' },
      { source: 'customize/schemas.md', slug: 'customize-schemas' },
    ],
  },
  {
    label: 'マルチリポジトリ（ベータ）',
    pages: [
      { source: 'multi-repo/stores.md', slug: 'stores' },
      { source: 'multi-repo/worksets.md', slug: 'worksets' },
    ],
  },
  {
    label: 'リファレンス',
    pages: [
      { source: 'reference/skills.md', slug: 'skills' },
      { source: 'reference/cli.md', slug: 'cli' },
      {
        folder: 'schemas',
        label: 'スキーマ',
        pages: [
          { source: 'reference/schemas/index.md', slug: 'schemas/index' },
          { source: 'reference/schemas/schema-yaml.md', slug: 'schemas/schema-yaml' },
          { source: 'reference/schemas/spec-driven/index.md', slug: 'schemas/spec-driven' },
        ],
      },
      {
        folder: 'configuration',
        label: '設定',
        pages: [
          { source: 'reference/configuration/index.md', slug: 'configuration/index' },
          { source: 'reference/configuration/config-yaml.md', slug: 'configuration/config-yaml' },
          { source: 'reference/configuration/change-metadata.md', slug: 'configuration/change-metadata' },
          { source: 'reference/configuration/config-json.md', slug: 'configuration/config-json' },
          // TODO（2026-08-21から非公開）: Environment variablesとStoresは見出しだけなので、
          // 執筆完了までナビゲーションへ表示しない。Markdownは
          // docs-lab/reference/configuration/に残す。公開済みページからのリンクは
          // GitHub上のソースへフォールバックする。公開時は項目をコメント外へ移す。
          // { source: 'reference/configuration/environment-variables.md', slug: 'configuration/environment-variables' },
          // { source: 'reference/configuration/stores.md', slug: 'configuration/stores' },
        ],
      },
      { source: 'reference/supported-tools.md', slug: 'supported-tools' },
      { source: 'reference/glossary.md', slug: 'glossary' },
      // TODO（2026-08-21から非公開）: Architectureの3ページは見出しだけなので、
      // 執筆完了までグループを非表示にする。Markdownは
      // docs-lab/reference/architecture/に残し、公開済みページからのリンクは
      // GitHub上のソースへフォールバックする。公開時はフォルダ項目をコメント外へ移す。
      /*
      {
        folder: 'architecture',
        label: 'アーキテクチャ',
        pages: [
          { source: 'reference/architecture/index.md', slug: 'architecture/index' },
          { source: 'reference/architecture/workflow-runs.md', slug: 'architecture/workflow-runs' },
          { source: 'reference/architecture/design-decisions.md', slug: 'architecture/design-decisions' },
        ],
      },
      */
    ],
  },
  // TODO（2026-08-21から非公開）: HelpとLegacyは未完成（FAQは回答1件、
  // TroubleshootingとMigrationは見出しだけ）のため、執筆完了まで非表示にする。
  // Markdownはdocs-lab/help/に残し、公開済みページからのリンクはGitHub上のソースへ
  // フォールバックする（scripts/sync-docs.mjsのrewriteLinksを参照）。公開時はガイドと
  // 同様に項目をコメント外へ移す。
  /*
  {
    label: 'ヘルプ',
    pages: [
      { source: 'help/faq.md', slug: 'faq' },
      { source: 'help/troubleshooting.md', slug: 'troubleshooting' },
    ],
  },
  {
    label: '旧機能',
    pages: [{ source: 'help/legacy/migration.md', slug: 'migration' }],
  },
  */
];

/** フォルダ項目を再帰的に展開した、全公開ルートのフラットな一覧。 */
const expandEntry = (entry) => (entry.folder ? entry.pages.flatMap(expandEntry) : [entry]);
export const pages = sections.flatMap((section) => section.pages.flatMap(expandEntry));
