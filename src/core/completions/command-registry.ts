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
        name: 'force',
        description: '確認なしで古いファイルを自動クリーンアップ',
      },
      {
        name: 'profile',
        description: 'グローバル設定のプロファイルを上書き（core または custom）',
        takesValue: true,
        values: ['core', 'custom'],
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
    ],
  },
  {
    name: 'view',
    description: '仕様と変更の対話型ダッシュボードを表示',
    flags: [],
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
      COMMON_FLAGS.type,
      COMMON_FLAGS.strict,
      COMMON_FLAGS.jsonValidation,
      {
        name: 'concurrency',
        description: '同時検証数の上限（デフォルトは OPENSPEC_CONCURRENCY または 6）',
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
        name: 'schema',
        description: '使用するスキーマを上書き',
        takesValue: true,
      },
      COMMON_FLAGS.json,
    ],
  },
  {
    name: 'instructions',
    description: 'アーティファクト作成またはタスク適用用の補足付き指示を出力',
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
            description: '変更に保存する workspace のプロダクトゴール',
            takesValue: true,
          },
          {
            name: 'areas',
            description: '影響を受ける workspace link 名（カンマ区切り）',
            takesValue: true,
          },
          {
            name: 'initiative',
            description: 'リポジトリ内の変更を initiative に紐付け',
            takesValue: true,
          },
          {
            name: 'store',
            description: '--initiative で使う context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '--initiative で使う既存のローカル context store ルート',
            takesValue: true,
          },
          {
            name: 'schema',
            description: '使用するワークフロースキーマ',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
    ],
  },
  {
    name: 'set',
    description: 'チェックインされる OpenSpec メタデータを設定',
    flags: [],
    subcommands: [
      {
        name: 'change',
        description: 'リポジトリ内の変更メタデータを設定',
        acceptsPositional: true,
        positionalType: 'change-id',
        positionals: [{ name: 'name', type: 'change-id' }],
        flags: [
          {
            name: 'initiative',
            description: 'リポジトリ内の変更を initiative に紐付け',
            takesValue: true,
          },
          {
            name: 'store',
            description: '--initiative で使う context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '--initiative で使う既存のローカル context store ルート',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
    ],
  },
  {
    name: 'workspace',
    description: '調整用 workspace をセットアップ・確認',
    flags: [],
    subcommands: [
      {
        name: 'setup',
        description: 'workspace をセットアップし、既存リポジトリまたはフォルダをリンク',
        flags: [
          {
            name: 'name',
            description: 'workspace 名',
            takesValue: true,
          },
          {
            name: 'link',
            description: 'リポジトリまたはフォルダのリンク。<path> または <name>=<path> を指定',
            takesValue: true,
          },
          {
            name: 'opener',
            description: 'デフォルトの開き方: codex-cli、claude、github-copilot、editor',
            takesValue: true,
            values: ['codex-cli', 'claude', 'github-copilot', 'editor'],
          },
          {
            name: 'tools',
            description: 'エージェント用 OpenSpec スキルをインストール（all、none、またはカンマ区切りのツール ID）',
            takesValue: true,
          },
          COMMON_FLAGS.json,
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'list',
        description: '既知の OpenSpec workspace を一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'ls',
        description: '既知の OpenSpec workspace を一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'link',
        description: '既存リポジトリまたはフォルダを workspace にリンク',
        acceptsPositional: true,
        positionals: [
          { name: 'name-or-path', type: 'path', optional: true },
          { name: 'path', type: 'path', optional: true },
        ],
        flags: [
          {
            name: 'workspace',
            description: 'ローカル workspace view の workspace 名',
            takesValue: true,
          },
          COMMON_FLAGS.json,
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'relink',
        description: '既存 workspace link のローカルパスを更新',
        acceptsPositional: true,
        positionals: [
          { name: 'name' },
          { name: 'path', type: 'path' },
        ],
        flags: [
          {
            name: 'workspace',
            description: 'ローカル workspace view の workspace 名',
            takesValue: true,
          },
          COMMON_FLAGS.json,
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'doctor',
        description: 'このマシンで workspace が解決できる内容を確認',
        flags: [
          {
            name: 'workspace',
            description: 'ローカル workspace view の workspace 名',
            takesValue: true,
          },
          COMMON_FLAGS.json,
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'update',
        description: 'ワークスペース内の OpenSpec ガイドとエージェントスキルを更新',
        acceptsPositional: true,
        positionals: [{ name: 'name', optional: true }],
        flags: [
          {
            name: 'workspace',
            description: 'ローカル workspace view の workspace 名',
            takesValue: true,
          },
          {
            name: 'tools',
            description: 'ワークスペーススキルの配布対象エージェントを選択。ワークフローはグローバルプロファイルで選択',
            takesValue: true,
          },
          COMMON_FLAGS.json,
          COMMON_FLAGS.noInteractive,
        ],
      },
      {
        name: 'open',
        description: 'workspace をエージェントまたは VS Code エディタで開く',
        acceptsPositional: true,
        positionals: [{ name: 'name', optional: true }],
        flags: [
          {
            name: 'workspace',
            description: 'ローカル workspace view の workspace 名',
            takesValue: true,
          },
          {
            name: 'initiative',
            description: 'initiative をローカル workspace view として開く',
            takesValue: true,
          },
          {
            name: 'store',
            description: '--initiative で使う context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '--initiative で使う既存のローカル context store ルート',
            takesValue: true,
          },
          {
            name: 'agent',
            description: 'このセッションで使うエージェント: codex-cli、claude、github-copilot',
            takesValue: true,
            values: ['codex-cli', 'claude', 'github-copilot'],
          },
          {
            name: 'editor',
            description: 'workspace を VS Code エディタモードで開く',
          },
          {
            name: 'prepare-only',
            description: '未対応: プレビュー表示は将来の context/query コマンドで扱います',
          },
          COMMON_FLAGS.json,
          {
            name: 'change',
            description: '未対応: 変更単位の open は将来の workspace change planning で扱います',
            takesValue: true,
          },
          COMMON_FLAGS.noInteractive,
        ],
      },
    ],
  },
  {
    name: 'context-store',
    description: 'ローカルの context store をセットアップ・確認',
    flags: [],
    subcommands: [
      {
        name: 'setup',
        description: 'ローカルの context store を作成または登録',
        acceptsPositional: true,
        positionals: [{ name: 'id', optional: true }],
        flags: [
          {
            name: 'path',
            description: 'context store として使うディレクトリ',
            takesValue: true,
          },
          {
            name: 'init-git',
            description: 'context store 内に Git リポジトリを初期化',
          },
          {
            name: 'no-init-git',
            description: 'Git リポジトリの初期化を省略',
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'register',
        description: '既存の context store ディレクトリを登録',
        acceptsPositional: true,
        positionals: [{ name: 'path', type: 'path', optional: true }],
        flags: [
          {
            name: 'id',
            description: 'context store ID',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'unregister',
        description: 'ファイルを削除せずローカルの context-store 登録を解除',
        acceptsPositional: true,
        positionals: [{ name: 'id' }],
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'remove',
        description: 'ローカルの context-store 登録を解除し、フォルダも削除',
        acceptsPositional: true,
        positionals: [{ name: 'id' }],
        flags: [
          {
            name: 'yes',
            description: 'ローカルの context-store フォルダ削除を確認済みにする',
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'list',
        description: '登録済みの context store を一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'ls',
        description: '登録済みの context store を一覧表示',
        flags: [
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'doctor',
        description: 'ローカル context-store 登録とメタデータを確認',
        acceptsPositional: true,
        positionals: [{ name: 'id', optional: true }],
        flags: [
          COMMON_FLAGS.json,
        ],
      },
    ],
  },
  {
    name: 'initiative',
    description: '調整用 initiative を作成・一覧表示',
    flags: [],
    subcommands: [
      {
        name: 'create',
        description: 'context store 内に initiative を作成',
        acceptsPositional: true,
        positionals: [{ name: 'id', optional: true }],
        flags: [
          {
            name: 'store',
            description: 'ローカル context-store レジストリ上の context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '既存のローカル context store ルート',
            takesValue: true,
          },
          {
            name: 'title',
            description: 'initiative のタイトル',
            takesValue: true,
          },
          {
            name: 'summary',
            description: 'initiative の概要',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'show',
        description: 'initiative の場所と読み方を表示',
        acceptsPositional: true,
        positionals: [{ name: 'id' }],
        flags: [
          {
            name: 'store',
            description: 'ローカル context-store レジストリ上の context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '既存のローカル context store ルート',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'list',
        description: '登録済み context store 全体から initiative を一覧表示',
        flags: [
          {
            name: 'store',
            description: 'ローカル context-store レジストリ上の context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '既存のローカル context store ルート',
            takesValue: true,
          },
          COMMON_FLAGS.json,
        ],
      },
      {
        name: 'ls',
        description: '登録済み context store 全体から initiative を一覧表示',
        flags: [
          {
            name: 'store',
            description: 'ローカル context-store レジストリ上の context store ID',
            takesValue: true,
          },
          {
            name: 'store-path',
            description: '既存のローカル context store ルート',
            takesValue: true,
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
