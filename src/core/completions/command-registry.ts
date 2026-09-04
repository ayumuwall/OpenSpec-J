import { COMMON_FLAGS } from './shared-flags.js';
import type { CommandDefinition } from './types.js';
export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    name: 'init',
    description: 'プロジェクトで OpenSpec を初期化',
    acceptsPositional: true,
    positionalType: 'path',
    positionals: [{ name: 'path', type: 'path', optional: true }],
    flags: [
      {
        name: 'tools',
        description: 'AI ツールを非対話で設定（例: "all"、"none"、カンマ区切りのツール ID）',
        takesValue: true,
      },
      {
        name: 'language',
        description: '新しい OpenSpec アーティファクトをこの言語で作成',
        takesValue: true,
      },
      {
        name: 'force',
        description: '確認なしで古いファイルを自動クリーンアップ',
      },
      {
        name: 'profile',
        description: 'グローバル設定のプロファイルを上書き（core または custom）',
        takesValue: true,
        values: ['core', 'custom'],
      },
      {
        name: 'no-animation',
        description: 'アニメーションの代わりに静的なウェルカム画面を表示',
      },
      {
        name: 'copilot-cloud',
        description: 'GitHub Copilot クラウドコーディングエージェント用ファイルを生成（明示的な有効化。既定では確認）',
      },
      {
        name: 'no-copilot-cloud',
        description: 'GitHub Copilot クラウドコーディングエージェント用ファイルの生成をスキップ',
      },
    ],
  },
  {
    name: 'update',
    description: 'OpenSpec の指示ファイルを更新',
    acceptsPositional: true,
    positionalType: 'path',
    positionals: [{ name: 'path', type: 'path', optional: true }],
    flags: [
      {
        name: 'force',
        description: 'ツールが最新でも強制的に更新',
      },
    ],
  },
  {
    name: 'list',
    description: '項目を一覧表示（デフォルトは変更、--specs で仕様）',
    flags: [
      {
        name: 'specs',
        description: '変更ではなく仕様を一覧表示',
      },
      {
        name: 'changes',
        description: '変更を明示的に一覧表示（デフォルト）',
      },
      {
        name: 'sort',
        description: '並び順: "recent"（デフォルト）または "name"',
        takesValue: true,
        values: ['recent', 'name'],
      },
      COMMON_FLAGS.json,
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'view',
    description: '仕様と変更の対話型ダッシュボードを表示',
    flags: [
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'validate',
    description: '変更と仕様を検証',
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    positionals: [{ name: 'item-name', type: 'change-or-spec-id', optional: true }],
    flags: [
      {
        name: 'all',
        description: 'すべての変更と仕様を検証',
      },
      {
        name: 'changes',
        description: 'すべての変更を検証',
      },
      {
        name: 'specs',
        description: 'すべての仕様を検証',
      },
      {
        name: 'archived',
        description: 'アーカイブ済みの変更ですべてのタスクが完了しているか検証（pre-commit lint 向け）',
      },
      {
        name: 'report',
        description: '一括レポートに含める内容を選択',
        takesValue: true,
        values: ['full', 'findings'],
      },
      COMMON_FLAGS.type,
      COMMON_FLAGS.strict,
      COMMON_FLAGS.jsonValidation,
      {
        name: 'concurrency',
        description: '同時検証数の上限（デフォルトは OPENSPEC_CONCURRENCY または 6）',
        takesValue: true,
      },
      COMMON_FLAGS.noInteractive,
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'show',
    description: '変更または仕様を表示',
    acceptsPositional: true,
    positionalType: 'change-or-spec-id',
    positionals: [{ name: 'item-name', type: 'change-or-spec-id', optional: true }],
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.type,
      COMMON_FLAGS.noInteractive,
      {
        name: 'deltas-only',
        description: '差分だけを表示（JSON のみ、変更向け）',
      },
      {
        name: 'requirements-only',
        description: '--deltas-only のエイリアス（非推奨、変更向け）',
      },
      {
        name: 'diff',
        description: '差分仕様の要件ごとの差分を表示（変更向け）',
      },
      {
        name: 'requirements',
        description: '要件だけを表示し、シナリオを除外（JSON のみ、仕様向け）',
      },
      {
        name: 'no-scenarios',
        description: 'シナリオ本文を除外（JSON のみ、仕様向け）',
      },
      {
        name: 'requirement',
        short: 'r',
        description: '指定した ID の要件を表示（JSON のみ、仕様向け）',
        takesValue: true,
      },
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'archive',
    description: '完了した変更をアーカイブし、メイン仕様を更新',
    acceptsPositional: true,
    positionalType: 'change-id',
    positionals: [{ name: 'change-name', type: 'change-id', optional: true }],
    flags: [
      {
        name: 'yes',
        short: 'y',
        description: '確認プロンプトを省略',
      },
      {
        name: 'skip-specs',
        description: '仕様更新処理を省略',
      },
      {
        name: 'no-validate',
        description: '検証を省略（非推奨）',
      },
      {
        name: 'json',
        description: 'JSON として出力（非対話）',
      },
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'status',
    description: '変更のアーティファクト完了状況を表示',
    flags: [
      {
        name: 'change',
        description: '状況を表示する変更名',
        takesValue: true,
      },
      {
        name: 'all',
        description: 'アクティブな変更をすべて対象に状況を表示',
      },
      {
        name: 'schema',
        description: '使用するスキーマを上書き',
        takesValue: true,
      },
      COMMON_FLAGS.json,
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'instructions',
    description: 'アーティファクト作成、適用、アーカイブ用の補足付き指示を出力',
    acceptsPositional: true,
    positionals: [{ name: 'artifact', optional: true }],
    flags: [
      {
        name: 'change',
        description: '変更名',
        takesValue: true,
      },
      {
        name: 'schema',
        description: '使用するスキーマを上書き',
        takesValue: true,
      },
      COMMON_FLAGS.json,
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'templates',
    description: 'スキーマ内の全アーティファクトで解決されたテンプレートパスを表示',
    flags: [
      {
        name: 'schema',
        description: '使用するスキーマ',
        takesValue: true,
      },
      COMMON_FLAGS.json,
    ],
  },
  {
    name: 'schemas',
    description: '利用可能なワークフロースキーマを説明付きで一覧表示',
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'new',
    description: '新しい項目を作成',
    flags: [],
    subcommands: [
      {
        name: 'change',
        description: '新しい変更ディレクトリを作成',
        acceptsPositional: true,
        positionals: [{ name: 'name' }],
        flags: [
          {
            name: 'description',
            description: 'README.md に追加する説明',
            takesValue: true,
          },
          {
            name: 'goal',
            description: '変更に保存する任意の目標メタデータ',
            takesValue: true,
          },
          {
            name: 'schema',
            description: '使用するワークフロースキーマ',
            takesValue: true,
          },
          COMMON_FLAGS.json,
          COMMON_FLAGS.store,
        ],
      },
    ],
  },
  {
    name: 'store',
    description:
      'このマシンに登録する独立した OpenSpec リポジトリ（ストア）を作成・管理',
    flags: [],
    subcommands: [
      {
        name: 'setup',
        description: 'ローカルストアを作成または登録',
        acceptsPositional: true,
        positionals: [{ name: 'id', optional: true }],
        flags: [
          {
            name: 'path',
            description: 'ストアに使用するディレクトリ',
            takesValue: true,
            completionType: 'path',
          },
          {
            name: 'init-git',
            description: 'ストア内で Git リポジトリを初期化',
          },
          {
            name: 'no-init-git',
            description: 'Git リポジトリの初期化を省略',
          },
          {
            name: 'remote',
            description: 'store.yaml に記録する正規 clone 元',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'register',
        description: '既存のストアディレクトリを登録',
        acceptsPositional: true,
        positionals: [{ name: 'path', type: 'path', optional: true }],
        flags: [
          {
            name: 'id',
            description: 'ストア ID',
            takesValue: true,
          },
          {
            name: 'yes',
            description: 'ストア識別メタデータの作成を確認',
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'unregister',
        description: 'ファイルを削除せずにローカルストア登録を解除',
        acceptsPositional: true,
        positionals: [{ name: 'id' }],
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'remove',
        description: 'ローカルストア登録を解除し、ローカルフォルダーを削除',
        acceptsPositional: true,
        positionals: [{ name: 'id' }],
        flags: [
          {
            name: 'yes',
            description: 'ローカルストアフォルダーの削除を確認',
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'list',
        description: '登録済みストアを一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'ls',
        description: '登録済みストアを一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'doctor',
        description: 'ローカルストア登録とメタデータを確認',
        acceptsPositional: true,
        positionals: [{ name: 'id', optional: true }],
        flags: [
          COMMON_FLAGS.json,
        ],
      },
    ],
  },
  {
    name: 'context',
    description: '解決済み OpenSpec ルートの作業コンテキストを出力',
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.store,
      {
        name: 'code-workspace',
        description: 'この集合用の VS Code workspace ファイルも書き出す',
        takesValue: true,
        completionType: 'path',
      },
      {
        name: 'force',
        description: '既存の --code-workspace ファイルを上書き',
      },
    ],
  },
  {
    name: 'doctor',
    description: '解決済み OpenSpec ルートの関連状態を診断',
    flags: [
      COMMON_FLAGS.json,
      COMMON_FLAGS.store,
    ],
  },
  {
    name: 'workset',
    description: '個人用の作業ビューを構成・保存・表示（ローカル限定）',
    flags: [],
    subcommands: [
      {
        name: 'create',
        description: '選択したフォルダーから名前付きの作業ビューを構成して保存',
        acceptsPositional: true,
        positionals: [{ name: 'name', optional: true }],
        flags: [
          {
            name: 'member',
            description:
              'メンバーフォルダーを <path> または <name>=<path> で指定（複数回指定可、最初がプライマリ）',
            takesValue: true,
            completionType: 'path',
          },
          {
            name: 'tool',
            description: 'このワークセットを開く優先ツール',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'list',
        description: '保存済みワークセットとメンバーを表示',
        flags: [COMMON_FLAGS.json],
      },
      {
        name: 'ls',
        description: '保存済みワークセットとメンバーを表示',
        flags: [COMMON_FLAGS.json],
      },
      {
        name: 'open',
        description:
          '保存済みワークセットをツールで開く（エディターウィンドウまたはエージェントセッション）',
        acceptsPositional: true,
        positionals: [{ name: 'name' }],
        flags: [
          {
            name: 'tool',
            description: '今回だけこのツールで開く',
            takesValue: true,
          },
        ],
      },
      {
        name: 'remove',
        description: '保存済みワークセットを削除（メンバーフォルダーは削除しません）',
        acceptsPositional: true,
        positionals: [{ name: 'name' }],
        flags: [
          {
            name: 'yes',
            description: '非対話で削除を確認',
          },
          COMMON_FLAGS.json,
        ],
      },
    ],
  },
  {
    name: 'feedback',
    description: 'OpenSpec へのフィードバックを送信',
    acceptsPositional: true,
    positionals: [{ name: 'message' }],
    flags: [
      {
        name: 'body',
        description: 'フィードバックの詳細説明',
        takesValue: true,
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
        positionals: [{ name: 'change-name', type: 'change-id', optional: true }],
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'deltas-only',
            description: '差分だけを表示（JSON のみ）',
          },
          {
            name: 'requirements-only',
            description: '--deltas-only のエイリアス（非推奨）',
          },
          {
            name: 'diff',
            description: '差分仕様の要件ごとの差分を表示',
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: 'すべてのアクティブな変更を一覧表示（非推奨）',
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
        positionals: [{ name: 'change-name', type: 'change-id', optional: true }],
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
        positionals: [{ name: 'spec-id', type: 'spec-id', optional: true }],
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'requirements',
            description: '要件だけを表示し、シナリオを除外（JSON のみ）',
          },
          {
            name: 'no-scenarios',
            description: 'シナリオ本文を除外（JSON のみ）',
          },
          {
            name: 'requirement',
            short: 'r',
            description: '指定した ID の要件を表示（JSON のみ）',
            takesValue: true,
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: 'すべての仕様を一覧表示',
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
        positionals: [{ name: 'spec-id', type: 'spec-id', optional: true }],
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
        description: 'シェル用の補完スクリプトを生成（標準出力へ出力）',
        acceptsPositional: true,
        positionalType: 'shell',
        positionals: [{ name: 'shell', type: 'shell', optional: true }],
        flags: [],
      },
      {
        name: 'install',
        description: 'シェル用の補完スクリプトをインストール',
        acceptsPositional: true,
        positionalType: 'shell',
        positionals: [{ name: 'shell', type: 'shell', optional: true }],
        flags: [
          {
            name: 'verbose',
            description: 'インストールの詳細出力を表示',
          },
        ],
      },
      {
        name: 'uninstall',
        description: 'シェル用の補完スクリプトをアンインストール',
        acceptsPositional: true,
        positionalType: 'shell',
        positionals: [{ name: 'shell', type: 'shell', optional: true }],
        flags: [
          {
            name: 'yes',
            short: 'y',
            description: '確認プロンプトを省略',
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
        description: '現在の設定をすべて表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'get',
        description: '特定の値を取得（生の値、スクリプト向け）',
        acceptsPositional: true,
        positionals: [{ name: 'key' }],
        flags: [],
      },
      {
        name: 'set',
        description: '値を設定（型は自動変換）',
        acceptsPositional: true,
        positionals: [{ name: 'key' }, { name: 'value' }],
        flags: [
          {
            name: 'string',
            description: '値を文字列として保存',
          },
          {
            name: 'allow-unknown',
            description: '未知のキーの設定を許可',
          },
        ],
      },
      {
        name: 'unset',
        description: 'キーを削除（デフォルトへ戻す）',
        acceptsPositional: true,
        positionals: [{ name: 'key' }],
        flags: [],
      },
      {
        name: 'reset',
        description: '設定をデフォルトへリセット',
        flags: [
          {
            name: 'all',
            description: 'すべての設定をリセット（必須）',
          },
          {
            name: 'yes',
            short: 'y',
            description: '確認プロンプトを省略',
          },
        ],
      },
      {
        name: 'edit',
        description: '$EDITOR で設定を開く',
        flags: [],
      },
      {
        name: 'profile',
        description: 'ワークフロープロファイルを設定（対話選択またはプリセット指定）',
        acceptsPositional: true,
        positionals: [{ name: 'preset', optional: true }],
        flags: [],
      },
    ],
  },
  {
    name: 'schema',
    description: 'ワークフロースキーマを管理',
    flags: [],
    subcommands: [
      {
        name: 'which',
        description: 'スキーマの解決元を表示',
        acceptsPositional: true,
        positionalType: 'schema-name',
        positionals: [{ name: 'name', type: 'schema-name', optional: true }],
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'all',
            description: 'すべてのスキーマを解決元付きで一覧表示',
          },
        ],
      },
      {
        name: 'validate',
        description: 'スキーマ構造とテンプレートを検証',
        acceptsPositional: true,
        positionalType: 'schema-name',
        positionals: [{ name: 'name', type: 'schema-name', optional: true }],
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'verbose',
            description: '詳細な検証ステップを表示',
          },
        ],
      },
      {
        name: 'fork',
        description: 'カスタマイズ用に既存スキーマをプロジェクトへコピー',
        acceptsPositional: true,
        positionalType: 'schema-name',
        positionals: [
          { name: 'source', type: 'schema-name' },
          { name: 'name', optional: true },
        ],
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'force',
            description: '既存のコピー先を上書き',
          },
        ],
      },
      {
        name: 'init',
        description: '新しいプロジェクトローカルスキーマを作成',
        acceptsPositional: true,
        positionals: [{ name: 'name' }],
        flags: [
          COMMON_FLAGS.json,
          {
            name: 'description',
            description: 'スキーマの説明',
            takesValue: true,
          },
          {
            name: 'artifacts',
            description: 'アーティファクト ID（カンマ区切り）',
            takesValue: true,
          },
          {
            name: 'default',
            description: 'プロジェクトのデフォルトスキーマに設定',
          },
          {
            name: 'no-default',
            description: 'デフォルト設定の確認を表示しない',
          },
          {
            name: 'force',
            description: '既存スキーマを上書き',
          },
        ],
      },
    ],
  },
];
