import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { appName, siteUrl } from '@/lib/shared';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

const description =
  'OpenSpec は、あなたと AI の間で合意を形成する軽量なレイヤーです。コードを書く前に何を作るか合意できます。30 種類以上の AI コーディングアシスタントに対応しています。';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} | 先に合意し、自信を持って構築する`,
    template: `%s | ${appName}`,
  },
  description,
  // The openspec.dev routing Worker sends /docs/* to this site, but root paths
  // go to the landing site, so icons (and the logo) live under public/docs.
  icons: {
    icon: [
      { url: '/docs/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/docs/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/docs/apple-icon.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    title: `${appName} | 先に合意し、自信を持って構築する`,
    description,
    siteName: appName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: appName,
    description,
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
