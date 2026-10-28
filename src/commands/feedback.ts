import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import os from 'os';

const require = createRequire(import.meta.url);
const MAX_TITLE_LENGTH = 72;
const TITLE_PREFIX = 'Feedback: ';
const REPRO_PROMPT =
  '_未記入です。`openspec feedback` から送信されました。バグの場合は、新規プロジェクトから再現する最短の手順を追記してください。_';

/**
 * Check if gh CLI is installed and available in PATH
 * Uses platform-appropriate command: 'where' on Windows, 'which' on Unix/macOS
 */
function isGhInstalled(): boolean {
  try {
    // execFileSync, not execSync: no shell is needed to look a binary up, and
    // spawning one next to free-form issue text is the shape a future refactor
    // most easily turns into command injection.
    execFileSync(process.platform === 'win32' ? 'where' : 'which', ['gh'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if gh CLI is authenticated
 */
function isGhAuthenticated(): boolean {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get OpenSpec version from package.json
 */
function getVersion(): string {
  try {
    const { version } = require('../../package.json');
    return version;
  } catch {
    return 'unknown';
  }
}

/**
 * Get platform name
 */
function getPlatform(): string {
  return os.platform();
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate metadata footer for feedback
 */
function generateMetadata(): string {
  const version = getVersion();
  const platform = getPlatform();
  const timestamp = getTimestamp();

  return `---
Submitted via OpenSpec CLI
- Version: ${version}
- Platform: ${platform}
- Timestamp: ${timestamp}`;
}

/**
 * Format the feedback title
 */
function formatTitle(message: string): string {
  const normalizedMessage = message.replace(/\s+/g, ' ').trim();
  const title = `${TITLE_PREFIX}${normalizedMessage}`;

  if (Array.from(title).length <= MAX_TITLE_LENGTH) {
    return title;
  }

  const availableLength = MAX_TITLE_LENGTH - TITLE_PREFIX.length - 1;
  let candidate = '';
  let candidateLength = 0;
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
    normalizedMessage
  );

  for (const { segment } of segments) {
    const segmentLength = Array.from(segment).length;
    if (candidateLength + segmentLength > availableLength) {
      break;
    }
    candidate += segment;
    candidateLength += segmentLength;
  }

  candidate = candidate.trimEnd();
  const lastSpace = candidate.lastIndexOf(' ');
  const summary = lastSpace > 0 ? candidate.slice(0, lastSpace) : candidate;
  return `${TITLE_PREFIX}${summary}…`;
}

/**
 * Format the full feedback body
 *
 * The headings mirror the bug form's labels (.github/ISSUE_TEMPLATE/bug_report.yml)
 * so a CLI-filed issue reads like one filed through the form. `gh issue create
 * --body` cannot fill an issue form, so the repro prompt is spelled out instead
 * of being left silently empty.
 */
function formatBody(message: string, bodyText?: string): string {
  const parts = ['### 発生したこと', '', message];

  if (bodyText) {
    parts.push('', '### 詳細', '', bodyText);
  }

  parts.push('', '### 最短の再現手順', '', REPRO_PROMPT);
  parts.push('', generateMetadata());

  return parts.join('\n');
}

/**
 * Generate a pre-filled GitHub issue URL for manual submission
 *
 * Opens the bug form itself. The query keys are the form's own field ids, which
 * is how GitHub prefills an issue form; the fields it leaves empty are the
 * required ones only the reporter can answer.
 */
function generateManualSubmissionUrl(title: string, message: string, bodyText?: string): string {
  const params = new URLSearchParams({
    template: 'bug_report.yml',
    title,
    what_happened: bodyText ? `${message}\n\n${bodyText}` : message,
    version: getVersion(),
    environment: `${getPlatform()}, Node ${process.version}`,
  });

  return `https://github.com/ayumuwall/OpenSpec-J/issues/new?${params.toString()}`;
}

/**
 * Display formatted feedback content for manual submission
 */
function displayFormattedFeedback(title: string, body: string): void {
  console.log('\n--- 整形済みフィードバック ---');
  console.log(`タイトル: ${title}`);
  console.log(`ラベル: feedback`);
  console.log('\n本文:');
  console.log(body);
  console.log('--- フィードバック終わり ---\n');
}

/**
 * Check whether gh refused the issue because the repository does not define
 * the label. gh resolves label names before creating the issue, so this
 * failure means no issue was created.
 *
 * Only gh's stderr is inspected. The error message also embeds the command
 * line, which carries the user's own feedback text.
 */
function isMissingLabelError(error: any): boolean {
  return /could not add label/i.test(error?.stderr?.toString() ?? '');
}

/**
 * Report a gh CLI failure and exit, preserving gh's exit code.
 *
 * gh failed after the user already typed their feedback (issues disabled,
 * network, rate limit, ...), so show the same manual-submission path the
 * missing-gh and unauthenticated flows get instead of discarding the text.
 */
function reportGhFailure(error: any, title: string, body: string, url: string): void {
  // Display the error output from gh CLI
  if (error.stderr) {
    console.error(error.stderr.toString());
  } else if (error.message) {
    console.error(error.message);
  }

  displayFormattedFeedback(title, body);

  console.log('フィードバックを手動で送信してください:');
  console.log(url);

  // Exit with the same code as gh CLI
  process.exit(error.status ?? 1);
}

/**
 * Create the feedback issue via gh CLI
 * Uses execFileSync to prevent shell injection vulnerabilities
 */
function createIssue(title: string, body: string, labels: string[]): string {
  const args = [
    'issue',
    'create',
    '--repo',
    'ayumuwall/OpenSpec-J',
    '--title',
    title,
    '--body',
    body,
  ];

  for (const label of labels) {
    args.push('--label', label);
  }

  const result = execFileSync('gh', args, { encoding: 'utf-8', stdio: 'pipe' });

  return result.trim();
}

/**
 * Submit feedback via gh CLI
 */
function submitViaGhCli(title: string, body: string, url: string): void {
  let issueUrl: string;
  let labelApplied = true;

  try {
    issueUrl = createIssue(title, body, ['feedback']);
  } catch (error: any) {
    if (!isMissingLabelError(error)) {
      reportGhFailure(error, title, body, url);
      return;
    }

    // The repository does not define the 'feedback' label. Nothing was
    // created, so retry unlabeled rather than dropping the feedback.
    try {
      issueUrl = createIssue(title, body, []);
      labelApplied = false;
    } catch (retryError: any) {
      reportGhFailure(retryError, title, body, url);
      return;
    }
  }

  console.log(`\n✓ フィードバックを送信しました！`);
  console.log(`Issue URL（課題 URL）: ${issueUrl}\n`);

  if (!labelApplied) {
    console.log(
      "注: リポジトリに 'feedback' ラベルがないため、ラベルなしで作成しました。\n"
    );
  }
}

/**
 * Handle fallback when gh CLI is not available or not authenticated
 */
function handleFallback(
  title: string,
  body: string,
  url: string,
  reason: 'missing' | 'unauthenticated'
): void {
  if (reason === 'missing') {
    console.log('⚠️  GitHub CLI が見つかりません。手動送信が必要です。');
  } else {
    console.log('⚠️  GitHub の認証が必要です。手動送信が必要です。');
  }

  displayFormattedFeedback(title, body);

  console.log('手動でフィードバックを送信してください:');
  console.log(url);

  if (reason === 'unauthenticated') {
    console.log('\n自動送信するには: gh auth login');
  }

  // Exit with success code (fallback is successful)
  process.exit(0);
}

/**
 * Feedback command implementation
 */
export class FeedbackCommand {
  async execute(message: string, options?: { body?: string }): Promise<void> {
    // Format title and body once for all code paths
    const title = formatTitle(message);
    const body = formatBody(message, options?.body);
    const url = generateManualSubmissionUrl(title, message, options?.body);

    // Check if gh CLI is installed
    if (!isGhInstalled()) {
      handleFallback(title, body, url, 'missing');
      return;
    }

    // Check if gh CLI is authenticated
    if (!isGhAuthenticated()) {
      handleFallback(title, body, url, 'unauthenticated');
      return;
    }

    // Submit via gh CLI
    submitViaGhCli(title, body, url);
  }
}
