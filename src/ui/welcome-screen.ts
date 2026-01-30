/**
 * 実験的なアーティファクトワークフロー設定のウェルカム画面。
 * 左にアニメーション ASCII アート、右にウェルカム文を並べて表示する。
 */

import chalk from 'chalk';
import { WELCOME_ANIMATION } from './ascii-patterns.js';

// 横並びレイアウトの最小ターミナル幅
const MIN_WIDTH = 60;

// ASCII アート列の幅（パディング込み）
const ART_COLUMN_WIDTH = 24;

/**
 * ウェルカム文（右カラム）
 */
function getWelcomeText(): string[] {
  return [
    chalk.white.bold('OpenSpec へようこそ'),
    chalk.dim('軽量な仕様駆動フレームワーク'),
    '',
    chalk.white('このセットアップで次を構成します:'),
    chalk.dim('  • AI ツール向けの Agent Skills'),
    chalk.dim('  • /opsx:* スラッシュコマンド'),
    '',
    chalk.white('セットアップ後のクイックスタート:'),
    `  ${chalk.yellow('/opsx:new')}      ${chalk.dim('変更を作成')}`,
    `  ${chalk.yellow('/opsx:continue')} ${chalk.dim('次のアーティファクト')}`,
    `  ${chalk.yellow('/opsx:apply')}    ${chalk.dim('タスクを実装')}`,
    '',
    chalk.cyan('Enter でツールを選択...'),
  ];
}

/**
 * 横並びレイアウトで 1 フレームを描画する
 */
function renderFrame(artLines: string[], textLines: string[]): string {
  const maxLines = Math.max(artLines.length, textLines.length);
  const lines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const artLine = artLines[i] || '';
    const textLine = textLines[i] || '';

    // アート列を固定幅にパディング
    const paddedArt = artLine.padEnd(ART_COLUMN_WIDTH);

    // 見やすさのためシアンで着色
    const coloredArt = chalk.cyan(paddedArt);

    // 残り文字を防ぐため描画前に行をクリア
    lines.push(`\x1b[2K${coloredArt}${textLine}`);
  }

  return lines.join('\n');
}

/**
 * ターミナルがアニメーションに対応しているか確認する
 */
function canAnimate(): boolean {
  // TTY 必須
  if (!process.stdout.isTTY) return false;

  // NO_COLOR を尊重
  if (process.env.NO_COLOR) return false;

  // ターミナル幅を確認
  const columns = process.stdout.columns || 80;
  if (columns < MIN_WIDTH) return false;

  return true;
}

/**
 * Enter キーを待つ
 */
function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const { stdin } = process;

    // 非 TTY はそのまま通す
    if (!stdin.isTTY) {
      resolve();
      return;
    }

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (data: Buffer): void => {
      const char = data.toString();

      // Enter または Ctrl+C
      if (char === '\r' || char === '\n' || char === '\u0003') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(wasRaw);
        stdin.pause();

        // Ctrl+C を処理
        if (char === '\u0003') {
          process.stdout.write('\n');
          process.exit(0);
        }

        resolve();
      }
    };

    stdin.on('data', onData);
  });
}

/**
 * アニメーション付きウェルカム画面を表示する。
 * Enter で終了する。
 */
export async function showWelcomeScreen(): Promise<void> {
  const textLines = getWelcomeText();

  if (!canAnimate()) {
    // フォールバック: 静的なウェルカム表示
    const frame = WELCOME_ANIMATION.frames[3]; // Peak frame
    process.stdout.write('\n' + renderFrame(frame, textLines) + '\n\n');
    return;
  }

  let frameIndex = 0;
  let running = true;
  let isFirstRender = true;

  // フレーム間移動のための内容高さ
  const numContentLines = Math.max(WELCOME_ANIMATION.frames[0].length, textLines.length);
  const frameHeight = numContentLines + 1; // internal newlines (11) + trailing newlines (2) = 13

  // 初期改行込みの合計高さ（消去用）
  const totalHeight = frameHeight + 1; // 14

  // 初回描画
  process.stdout.write('\n');

  // アニメーションループ
  const interval = setInterval(() => {
    if (!running) return;

    const frame = WELCOME_ANIMATION.frames[frameIndex];

    // 前フレームを上書きするためカーソルを上へ移動（初回以外）
    if (!isFirstRender) {
      process.stdout.write(`\x1b[${frameHeight}A`);
    }
    isFirstRender = false;

    // 現在フレームを描画
    process.stdout.write(renderFrame(frame, textLines) + '\n\n');

    // 次フレームへ
    frameIndex = (frameIndex + 1) % WELCOME_ANIMATION.frames.length;
  }, WELCOME_ANIMATION.interval);

  // Enter を待つ
  await waitForEnter();

  // アニメーション停止
  running = false;
  clearInterval(interval);

  // ウェルカム画面を消して進む
  process.stdout.write(`\x1b[${totalHeight}A`);
  for (let i = 0; i < totalHeight; i++) {
    process.stdout.write('\x1b[2K\n'); // 行をクリア
  }
  process.stdout.write(`\x1b[${totalHeight}A`); // 上に戻す
}
