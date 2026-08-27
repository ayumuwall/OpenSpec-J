import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, links } from './shared';

/** ドキュメントレイアウトの共通オプション。 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // ドキュメント専用サイトなので、ロゴはリダイレクト元の `/` ではなく
      // ドキュメント索引へリンクする。
      url: '/docs',
      title: (
        <img
          src="/openspec-pixel.svg"
          alt={appName}
          className="h-3 w-auto dark:invert [#nd-sidebar_&]:ml-2"
        />
      ),
    },
    // ナビバーのレイアウトタブから移動できるため、ここに「ドキュメント」リンクは置かない。
    links: [
      {
        text: 'Discord',
        url: links.discord,
        external: true,
        on: 'nav',
      },
    ],
    githubUrl: links.github,
  };
}
