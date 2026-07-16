import { ensureCliBuilt, terminateActiveCliChildren } from './test/helpers/run-cli.js';

// Silence noisy CLI deprecation warnings during test runs.
process.env.OPENSPEC_SUPPRESS_DEPRECATIONS = '1';

// Ensure the CLI bundle exists before tests execute
export async function setup() {
  await ensureCliBuilt();
}

export async function teardown() {
  terminateActiveCliChildren();
}
