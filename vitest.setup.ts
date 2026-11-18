import { promises as fs } from 'fs';
import path from 'path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureCliBuilt, terminateActiveCliChildren } from './test/helpers/run-cli.js';

// Silence noisy CLI deprecation warnings during test runs.
process.env.OPENSPEC_SUPPRESS_DEPRECATIONS = '1';

// Ensure the CLI bundle exists before tests execute
export async function setup() {
  execFileSync(process.execPath, [fileURLToPath(new URL('./test/helpers/skill-release.mjs', import.meta.url)), path.join(process.env.OPENSPEC_TEST_HOME!, 'release')]);
  await ensureCliBuilt();
}

export async function teardown() {
  terminateActiveCliChildren();
  const testHome = process.env.OPENSPEC_TEST_HOME;
  if (testHome && path.basename(testHome).startsWith('openspec-test-home-')) {
    await fs.rm(testHome, { recursive: true, force: true });
  }
}
