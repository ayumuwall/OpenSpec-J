import { CommandDefinition, FlagDefinition } from './types.js';

/**
 * Common flags used across multiple commands
 */
const COMMON_FLAGS = {
  json: {
    name: 'json',
    description: 'JSON で出力',
  } as FlagDefinition,
  jsonValidation: {
    name: 'json',
    description: '検証結果を JSON で出力',
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
    description: 'あいまいなときに種別を指定',
    takesValue: true,
    values: ['change', 'spec'],
  } as FlagDefinition,
} as const;

/**
 * Registry of all OpenSpec CLI commands with their flags and metadata.
 * This registry is used to generate shell completion scripts.
 */
export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    name: 'init',
    description: 'OpenSpec をプロジェクトに初期設定',
    acceptsPositional: true,
    positionalType: 'path',
    flags: [
      {
        name: 'tools',
        description: 'AI ツールを非対話で指定（"all" / "none" / カンマ区切りのツール ID）',
        takesValue: true,
      },
    ],
  },
  {
    name: 'update',
    description: 'OpenSpec の手順ファイルを更新',
    acceptsPositional: true,
    positionalType: 'path',
    flags: [],
  },
  {
    name: 'list',
    description: 'アイテム一覧を表示（デフォルトは変更、--specs で仕様）',
    flags: [
      {
        name: 'specs',
        description: '変更ではなく仕様を一覧表示',
      },
      {
        name: 'changes',
        description: '変更を明示的に一覧表示（デフォルト）',
      },
    ],
  },
  {
    name: 'view',
    description: '仕様と変更のインタラクティブダッシュボードを表示',
    flags: [],
  },
  {
    name: 'validate',
    description: '変更・仕様を検証',
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    flags: [
      {
        name: 'all',
        description: '変更と仕様をまとめて検証',
      },
      {
        name: 'changes',
        description: '変更をすべて検証',
      },
      {
        name: 'specs',
        description: '仕様をすべて検証',
      },
      COMMON_FLAGS.type,
      COMMON_FLAGS.strict,
      COMMON_FLAGS.jsonValidation,
      {
        name: 'concurrency',
        description: '同時検証の上限（環境変数 OPENSPEC_CONCURRENCY または 6 がデフォルト）',
        takesValue: true,
      },
      COMMON_FLAGS.noInteractive,
    ],
  },
  {
    name: 'show',
    description: '変更または仕様を表示',
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.type,
      COMMON_FLAGS.noInteractive,
      {
        name: 'deltas-only',
        description: '差分のみを表示（JSON専用、変更）',
      },
      {
        name: 'requirements-only',
        description: 'deltas-only の非推奨エイリアス（変更）',
      },
      {
        name: 'requirements',
        description: '要件のみ表示（シナリオ除外、JSON専用、仕様）',
      },
      {
        name: 'no-scenarios',
        description: 'シナリオを除外（JSON専用、仕様）',
      },
      {
        name: 'requirement',
        short: 'r',
        description: '指定 ID の要件のみ表示（JSON専用、仕様）',
        takesValue: true,
      },
    ],
  },
  {
    name: 'archive',
    description: '完了した変更をアーカイブし、仕様を更新',
    acceptsPositional: true,
    positionalType: 'change-id',
    flags: [
      {
        name: 'yes',
        short: 'y',
        description: '確認プロンプトをスキップ',
      },
      {
        name: 'skip-specs',
        description: '仕様更新をスキップ',
      },
      {
        name: 'no-validate',
        description: '検証をスキップ（非推奨）',
      },
    ],
  },
  {
    name: 'change',
    description: 'OpenSpec の変更提案を管理（非推奨）',
    flags: [],
    subcommands: [
      {
        name: 'show',
        description: '変更提案を表示',
        acceptsPositional: true,
        positionalType: 'change-id',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'deltas-only',
            description: '差分のみを表示（JSON専用）',
          },
          {
            name: 'requirements-only',
            description: 'deltas-only の非推奨エイリアス',
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: 'アクティブな変更を一覧（非推奨）',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'long',
            description: 'ID とタイトルを件数付きで表示',
          },
        ],
      },
      {
        name: 'validate',
        description: '変更提案を検証',
        acceptsPositional: true,
        positionalType: 'change-id',
        flags: [
          COMMON_FLAGS.strict,
          COMMON_FLAGS.jsonValidation,
          COMMON_FLAGS.noInteractive,
        ],
      },
    ],
  },
  {
    name: 'spec',
    description: 'OpenSpec の仕様を管理',
    flags: [],
    subcommands: [
      {
        name: 'show',
        description: '仕様を表示',
        acceptsPositional: true,
        positionalType: 'spec-id',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'requirements',
            description: '要件のみ表示（シナリオ除外、JSON専用）',
          },
          {
            name: 'no-scenarios',
            description: 'シナリオを除外（JSON専用）',
          },
          {
            name: 'requirement',
            short: 'r',
            description: '指定 ID の要件のみ表示（JSON専用）',
            takesValue: true,
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: '仕様を一覧表示',
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'long',
            description: 'ID とタイトルを件数付きで表示',
          },
        ],
      },
      {
        name: 'validate',
        description: '仕様を検証',
        acceptsPositional: true,
        positionalType: 'spec-id',
        flags: [
          COMMON_FLAGS.strict,
          COMMON_FLAGS.jsonValidation,
          COMMON_FLAGS.noInteractive,
        ],
      },
    ],
  },
  {
    name: 'completion',
    description: 'OpenSpec CLI のシェル補完を管理',
    flags: [],
    subcommands: [
      {
        name: 'generate',
        description: 'シェル補完スクリプトを生成（標準出力へ出力）',
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [],
      },
      {
        name: 'install',
        description: 'シェル補完スクリプトをインストール',
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [
          {
            name: 'verbose',
            description: '詳細なインストール内容を表示',
          },
        ],
      },
      {
        name: 'uninstall',
        description: 'シェル補完スクリプトをアンインストール',
        acceptsPositional: true,
        positionalType: 'shell',
        flags: [
          {
            name: 'yes',
            short: 'y',
            description: '確認プロンプトをスキップ',
          },
        ],
      },
    ],
  },
  {
    name: 'config',
    description: 'グローバルな OpenSpec 設定を表示・変更',
    flags: [
      {
        name: 'scope',
        description: '設定スコープ（現在は "global" のみ対応）',
        takesValue: true,
        values: ['global'],
      },
    ],
    subcommands: [
      {
        name: 'path',
        description: '設定ファイルの場所を表示',
        flags: [],
      },
      {
        name: 'list',
        description: '現在の設定を一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'get',
        description: '特定の値を取得（生値、スクリプト向け）',
        acceptsPositional: true,
        flags: [],
      },
      {
        name: 'set',
        description: '値を設定（型は自動推論）',
        acceptsPositional: true,
        flags: [
          {
            name: 'string',
            description: '文字列として保存する',
          },
          {
            name: 'allow-unknown',
            description: '未知のキーの設定を許可',
          },
        ],
      },
      {
        name: 'unset',
        description: 'キーを削除（デフォルトに戻す）',
        acceptsPositional: true,
        flags: [],
      },
      {
        name: 'reset',
        description: '設定をデフォルトに戻す',
        flags: [
          {
            name: 'all',
            description: 'すべての設定をリセット（必須）',
          },
          {
            name: 'yes',
            short: 'y',
            description: '確認プロンプトをスキップ',
          },
        ],
      },
      {
        name: 'edit',
        description: '$EDITOR で設定を開く',
        flags: [],
      },
    ],
  },
];
