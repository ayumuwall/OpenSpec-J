#!/usr/bin/env node
// リポジトリの `docs-lab/**/*.md` を機械的に複製し、Fumadocsの
// コンテンツ一式（`content/docs/**`）を生成する。
// `build` / `dev` の最初と、CIの定期処理で実行する。
//
// 公開する各文書（docs.sync.config.mjsを参照）について次を行う。
//   - 先頭の `# H1` からページタイトルを取得し、H1を本文から削除する
//   - 先頭の `> ...` 引用をfrontmatterのdescriptionへ移す
//   - Fumadocsのfrontmatter（title / description / githubSource）を追加する
//   - 内部の `*.md` リンクを `/docs/...` ルートへ書き換える
//   - 結果を `.md` として書き込む（Fumadocsが通常のMarkdownとして解析するため、
//     `<placeholders>` と `{braces}` はリテラルのまま維持される）
//   - サイドバー順序を示す `meta.json` を出力する
//
// 生成ファイルはcontent/docs/配下にあり、Gitの管理対象外。直接編集せず、
// ../docs-labを編集する。

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { docsDir, pages, sections } from '../docs.sync.config.mjs';

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(websiteRoot, 'content', 'docs');
const sourceRoot = resolve(websiteRoot, docsDir);
// GitHubリンクに使う、リポジトリルートから見たソースディレクトリのパス（例: `docs-lab`）。
const repoDocsDir = posix.normalize(docsDir).replace(/^\.\.\//, '');
const gitBranch = 'ja-docs';
const gitBlobBase = 'https://github.com/ayumuwall/OpenSpec-J/blob';

// 文書間のMarkdownリンクを解決するため、各ソースファイルを/docsルートへ対応付ける。
const routeBySource = new Map();
for (const page of pages) {
  const key = posix.normalize(page.source);
  if (!routeBySource.has(key)) {
    // ルートまたは `<folder>/index` の `index` slugは親パスで配信する。
    const route = page.slug === 'index' ? '' : `/${page.slug.replace(/\/index$/, '')}`;
    routeBySource.set(key, `/docs${route}`);
  }
}

// すべての出力ファイルをここで処理する。同じ内容の書き込みを省いてmtimeを維持し、
// fumadocs-mdxの開発用watcherが変更ページだけを再ビルドできるようにする。
// `written` には古いファイルを削除するため、期待する出力一式を記録する。
const written = new Set();
function writeOutputFile(path, content) {
  written.add(path);
  let current = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {
    // ファイルがない、または読み込めない場合は書き込む。
  }
  if (current === content) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function removeStaleOutputs(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeStaleOutputs(path);
      if (readdirSync(path).length === 0) rmSync(path, { recursive: true });
    } else if (!written.has(path)) {
      rmSync(path);
    }
  }
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// 本文から最初の `# Heading` を取り出し、{ title, rest } を返す。
function extractTitle(markdown, fallback) {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = /^#\s+(.+?)\s*$/.exec(lines[i]);
    if (match) {
      lines.splice(0, i + 1);
      return { title: match[1].trim(), rest: lines.join('\n').replace(/^\n+/, '') };
    }
    if (lines[i].trim() !== '') break; // H1より前に内容があれば、そのまま維持する
  }
  return { title: fallback, rest: markdown };
}

// 執筆規則として、H1直後の `> ...` 引用をページの1行説明として扱う。
// frontmatterへ移して本文から削除し、タイトル下にも説明を表示するFumadocsで
// 同じ文が重複しないようにする。
function extractLeadingQuote(markdown) {
  const lines = markdown.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length || !lines[i].startsWith('>')) return { quote: '', rest: markdown };
  const buffer = [];
  while (i < lines.length && lines[i].startsWith('>')) {
    buffer.push(lines[i].replace(/^>\s?/, '').trim());
    i++;
  }
  const quote = buffer.join(' ').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
  return { quote, rest: lines.slice(i).join('\n').replace(/^\n+/, '') };
}

// 最初の通常段落を、1行のメタ説明へ変換する。
function extractDescription(markdown) {
  const lines = markdown.split('\n');
  const buffer = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (buffer.length === 0) {
      if (trimmed === '') continue;
      // 見出し、引用、リスト、表、フェンスなど段落以外で始まる場合はスキップする。
      if (/^(#|>|[-*+]\s|\d+\.\s|\||```|:::)/.test(trimmed)) return '';
      buffer.push(trimmed);
    } else {
      if (trimmed === '') break;
      buffer.push(trimmed);
    }
  }
  let text = buffer.join(' ');
  text = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/[*_`]/g, '') // emphasis / code ticks
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > 200) {
    text = text.slice(0, 200).replace(/\s+\S*$/, '') + '…';
  }
  return text;
}

// 他の文書を指す内部Markdownリンクを書き換える。
// `sourceRel` はソースディレクトリから見た現在の文書パス。
function rewriteLinks(markdown, sourceRel) {
  const sourceFileDir = posix.dirname(sourceRel);
  return markdown.replace(/\]\(([^)]+)\)/g, (whole, target) => {
    // 外部リンク、アンカーだけのリンク、.md以外のリンクは変更しない。
    if (/^(https?:|mailto:|#|\/)/.test(target)) return whole;
    const [rawPath, hash] = target.split('#');
    if (!/\.md$/i.test(rawPath)) return whole;
    const resolved = posix.normalize(posix.join(sourceFileDir, rawPath)).replace(/^\.\//, '');
    const route = routeBySource.get(resolved);
    const suffix = hash ? `#${hash}` : '';
    if (route) return `](${route}${suffix})`;
    // 公開しない文書へのリンクはGitHub上のソースへフォールバックする。
    // ソースフォルダ外へ出る `../` も正規化する。
    const repoPath = posix.join(repoDocsDir, resolved);
    return `](${gitBlobBase}/${gitBranch}/${repoPath}${suffix})`;
  });
}

function buildFrontmatter({ title, description, repoSource }) {
  const fm = [`title: ${yamlQuote(title)}`];
  if (description) fm.push(`description: ${yamlQuote(description)}`);
  fm.push(`githubSource: ${yamlQuote(repoSource)}`);
  return `---\n${fm.join('\n')}\n---\n`;
}

function generatePage(page) {
  const repoSource = posix.join(repoDocsDir, posix.normalize(page.source));
  const srcPath = join(sourceRoot, page.source);
  if (!existsSync(srcPath)) {
    throw new Error(`参照元ドキュメントが見つかりません: ${repoSource}（slug "${page.slug}" から参照）`);
  }
  const raw = readFileSync(srcPath, 'utf8');
  const fallbackTitle = page.slug.split('/').pop().replace(/-/g, ' ');
  const { title, rest } = extractTitle(raw, fallbackTitle);
  const { quote, rest: dequoted } = extractLeadingQuote(rest);
  const description = page.description ?? (quote || extractDescription(dequoted));
  const body = rewriteLinks(dequoted, posix.normalize(page.source));

  const frontmatter = buildFrontmatter({
    title,
    description,
    repoSource,
  });

  const outPath = join(outRoot, `${page.slug}.md`);
  writeOutputFile(outPath, `${frontmatter}\n${body.replace(/\s*$/, '')}\n`);
  return outPath;
}

// ドキュメントルートのmeta.jsonには、ラベル付きセクション区切りとページslugを記録する。
// フォルダ項目にはフォルダ名を使い、下で生成する各フォルダのmeta.jsonで
// ラベルとページ順序を指定する。
function writeRootMeta() {
  const items = [];
  for (const section of sections) {
    items.push(`---${section.label}---`);
    for (const entry of section.pages) items.push(entry.folder ?? entry.slug);
  }
  const meta = { title: 'ドキュメント', root: true, pages: items };
  writeOutputFile(join(outRoot, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
}

// 各フォルダ項目のmeta.jsonを生成する。サイドバーでは項目の `label` を使った、
// 既定で閉じた折りたたみグループとして表示する。フォルダは入れ子にできるため、
// 配下のページを再帰的に処理する。親の `pages` 一覧には子フォルダのベース名を記録する。
function writeFolderMetasFor(entries) {
  for (const entry of entries) {
    if (!entry.folder) continue;
    const meta = {
      title: entry.label,
      defaultOpen: entry.defaultOpen ?? false,
      pages: entry.pages.map((page) => posix.basename(page.folder ?? page.slug)),
    };
    writeOutputFile(
      join(outRoot, entry.folder, 'meta.json'),
      `${JSON.stringify(meta, null, 2)}\n`
    );
    writeFolderMetasFor(entry.pages);
  }
}

function writeFolderMetas() {
  for (const section of sections) writeFolderMetasFor(section.pages);
}

// Markdownから `/diagrams/<name>.png` として埋め込めるよう、
// docs-lab/diagrams/*.png|svgをpublic/diagrams/へコピーする。
function copyDiagramAssets() {
  const srcDir = join(sourceRoot, 'diagrams');
  if (!existsSync(srcDir)) return 0;
  const outDir = join(websiteRoot, 'public', 'diagrams');
  mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const name of readdirSync(srcDir)) {
    if (!/\.(png|svg)$/i.test(name)) continue;
    copyFileSync(join(srcDir, name), join(outDir, name));
    count++;
  }
  return count;
}

function main() {
  mkdirSync(outRoot, { recursive: true });

  let count = 0;
  for (const page of pages) {
    generatePage(page);
    count++;
  }
  writeRootMeta();
  writeFolderMetas();
  // 削除・名前変更した文書の古いページを残さない。空ディレクトリから作り直さず
  // 不要なファイルだけを削除し、未変更ファイルのmtimeを開発用watcher向けに維持する。
  removeStaleOutputs(outRoot);
  const assets = copyDiagramAssets();

  const rel = relative(process.cwd(), outRoot);
  console.log(`sync-docs: ${count}ページと図${assets}件を${rel}/へ生成しました`);
}

main();
