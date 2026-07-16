import type { FlagDefinition } from './types.js';

/**
 * 複数のコマンドで使う共通フラグ。
 */
export const COMMON_FLAGS = {
  json: {
    name: 'json',
    description: 'JSON として出力',
  } as FlagDefinition,
  jsonValidation: {
    name: 'json',
    description: '検証結果を JSON として出力',
  } as FlagDefinition,
  strict: {
    name: 'strict',
    description: '厳密検証モードを有効化',
  } as FlagDefinition,
  noInteractive: {
    name: 'no-interactive',
    description: '対話プロンプトを無効化',
  } as FlagDefinition,
  type: {
    name: 'type',
    description: '曖昧な場合に項目種別を指定',
    takesValue: true,
    values: ['change', 'spec'],
  } as FlagDefinition,
  store: {
    name: 'store',
    description:
      "Store id to use as the OpenSpec root (a store is a standalone OpenSpec repo you've registered)",
    takesValue: true,
  } as FlagDefinition,
} as const;
