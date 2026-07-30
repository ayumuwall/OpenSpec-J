/**
 * 実験的なアーティファクトワークフロー設定のウェルカム画面。
 * 左にアニメーション ASCII アート、右にウェルカム文を並べて表示する。
 */

import chalk from 'chalk';
import {
  execFileSync,
  type ExecFileSyncOptionsWithStringEncoding,
} from 'node:child_process';
import { WELCOME_ANIMATION } from './ascii-patterns.js';
import { getOnboardingCommands } from '../core/onboarding-commands.js';

// 横並びレイアウトの最小ターミナル幅
const MIN_WIDTH = 60;

// ASCII アート列の幅（パディング込み）
const ART_COLUMN_WIDTH = 24;

/**
 * ウェルカム文（右カラム）
 */
function getWelcomeText(workflows: readonly string[]): string[] {
  const onboardingCommands = getOnboardingCommands(workflows);
  const quickStart: string[] = [];

  if (onboardingCommands.length > 0) {
    const commandWidth = Math.max(...onboardingCommands.map((c) => c.command.length));
    quickStart.push(chalk.white('Quick start after setup:'));
    for (const { command, description } of onboardingCommands) {
      quickStart.push(`  ${chalk.yellow(command.padEnd(commandWidth + 1))} ${chalk.dim(description)}`);
    }
    // These are the canonical names. How each tool spells them differs
    // (/opsx-propose, @opsx-propose, $openspec-propose ...) and cannot be known
    // until tools are picked, one prompt later — so flag it rather than let the
    // canonical form read as the literal thing to type. "Getting started"
    // prints the real spelling once the selection is known.
    quickStart.push(chalk.dim('  (spelling varies by tool)'));
    quickStart.push('');
  }

  return [
    chalk.white.bold('OpenSpec へようこそ'),
    chalk.dim('軽量な仕様駆動フレームワーク'),
    '',
    chalk.white('このセットアップで次を構成します:'),
    chalk.dim('  • AI ツール向けの Agent Skills'),
    chalk.dim('  • 対応している場合はワークフローコマンド'),
    '',
    ...quickStart,
    chalk.cyan('Enterでツールを選択...'),
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

const REDUCED_MOTION_EXEC_OPTIONS: ExecFileSyncOptionsWithStringEncoding = {
  encoding: 'utf8',
  timeout: 500,
  // SIGKILL so a wedged lookup can never outlive the timeout and stall init.
  killSignal: 'SIGKILL',
  stdio: ['ignore', 'pipe', 'ignore'],
};

/**
 * Best-effort check of the OS-level reduced-motion preference (#722).
 * Any lookup failure (missing binary, unset key, timeout) means
 * "no preference detected" and animation stays enabled.
 */
export function prefersReducedMotion(
  platform: NodeJS.Platform = process.platform
): boolean {
  try {
    if (platform === 'darwin') {
      // The key only exists once the user has toggled Reduce Motion; when it
      // is unset `defaults` exits non-zero and lands in the catch below.
      const out = execFileSync(
        'defaults',
        ['read', 'com.apple.universalaccess', 'reduceMotion'],
        REDUCED_MOTION_EXEC_OPTIONS
      );
      return out.trim() === '1';
    }
    if (platform === 'linux') {
      const out = execFileSync(
        'gsettings',
        ['get', 'org.gnome.desktop.interface', 'enable-animations'],
        REDUCED_MOTION_EXEC_OPTIONS
      );
      return out.trim() === 'false';
    }
  } catch {
    // Detection is best-effort only.
  }
  return false;
}

/**
 * ターミナルがアニメーションに対応しているか確認する
 */
function canAnimate(): boolean {
  // TTY 必須
  if (!process.stdout.isTTY) return false;

  // NO_COLOR を尊重
  if (process.env.NO_COLOR) return false;

  // アニメーションを抑えたい利用者向けの手動設定。空値でも存在すれば無効化する。
  if (process.env.OPENSPEC_NO_ANIMATION !== undefined) return false;

  // ターミナル幅を確認
  const columns = process.stdout.columns || 80;
  if (columns < MIN_WIDTH) return false;

  // Last so only interactive terminals pay for the OS lookup
  if (prefersReducedMotion()) return false;

  return true;
}

/**
 * Enter キーを待つ
 */
async function waitForEnter(): Promise<void> {
  if (!process.stdin.isTTY) {
    return;
  }

  // Keep all interactive input on Inquirer's keypress lifecycle. Mixing a raw
  // `data` listener between Inquirer prompts breaks arrow/space keys on Windows.
  const { createPrompt, isEnterKey, useKeypress } = await import('@inquirer/core');
  const prompt = createPrompt<void, Record<string, never>>((_config, done) => {
    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.stdout.write('\n');
        process.exit(0);
      }

      if (isEnterKey(key)) {
        done(undefined);
      }
    });

    return '';
  });

  await prompt({});
}

/**
 * アニメーション付きウェルカム画面を表示する。
 * Enter で終了する。
 */
export async function showWelcomeScreen(
  workflows: readonly string[],
  options: { animate?: boolean } = {}
): Promise<void> {
  const textLines = getWelcomeText(workflows);

  if (options.animate === false || !canAnimate()) {
    // 静的表示。TTYでのみEnter待ちを表示し、非TTYでは該当行を除外する。
    const staticLines = process.stdin.isTTY
      ? textLines
      : textLines.filter((line) => !line.includes('Enterでツール'));
    const frame = WELCOME_ANIMATION.frames[3]; // Peak frame
    process.stdout.write('\n' + renderFrame(frame, staticLines) + '\n\n');
    await waitForEnter();
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
