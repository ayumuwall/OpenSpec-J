// このサイトはドキュメント専用で、マーケティング用ランディングページは別リポジトリで管理する。
// 静的エクスポート自体はHTTPリダイレクトを返せないため、Cloudflare Pagesでは
// public/_redirectsを使う。このmeta refreshはローカルプレビューと_redirectsを
// 無視するホスト向けのフォールバック。
export default function Home() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/docs" />
      <p>
        <a href="/docs">ドキュメント</a>へ移動しています…
      </p>
    </>
  );
}
