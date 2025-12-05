const warnedKeys = new Set<string>();

function isSuppressed(): boolean {
  return process.env.OPENSPEC_SUPPRESS_DEPRECATIONS === '1';
}

export function emitDeprecationWarning(key: string, message: string): void {
  if (isSuppressed()) return;
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.error(message);
}

export function resetDeprecationWarnings(): void {
  warnedKeys.clear();
}
