/**
 * Validation threshold constants
 */

// Minimum character lengths
export const MIN_WHY_SECTION_LENGTH = 50;
export const MIN_PURPOSE_LENGTH = 50;

// Maximum character/item limits
export const MAX_WHY_SECTION_LENGTH = 1000;
export const MAX_REQUIREMENT_TEXT_LENGTH = 500;
export const MAX_DELTAS_PER_CHANGE = 10;

// Validation messages
export const VALIDATION_MESSAGES = {
  // Required content
  SCENARIO_EMPTY: 'シナリオの本文を空にはできません',
  REQUIREMENT_EMPTY: '要件文を空にはできません',
  REQUIREMENT_NO_SHALL: '要件には SHALL または MUST を含める必要があります',
  REQUIREMENT_NO_SCENARIOS: '要件には少なくとも 1 つのシナリオが必要です',
  SPEC_NAME_EMPTY: '仕様名を空にはできません',
  SPEC_PURPOSE_EMPTY: 'Purpose セクションは必須です',
  SPEC_NO_REQUIREMENTS: '仕様には少なくとも 1 つの要件が必要です',
  CHANGE_NAME_EMPTY: '変更名を空にはできません',
  CHANGE_WHY_TOO_SHORT: `Why セクションは少なくとも ${MIN_WHY_SECTION_LENGTH} 文字必要です`,
  CHANGE_WHY_TOO_LONG: `Why セクションは ${MAX_WHY_SECTION_LENGTH} 文字を超えないでください`,
  CHANGE_WHAT_EMPTY: 'What Changes セクションは必須です',
  CHANGE_NO_DELTAS: '変更には少なくとも 1 つのデルタが必要です',
  CHANGE_TOO_MANY_DELTAS: `デルタが ${MAX_DELTAS_PER_CHANGE} 個を超える場合は分割を検討してください`,
  DELTA_SPEC_EMPTY: '仕様名を空にはできません',
  DELTA_DESCRIPTION_EMPTY: 'デルタの説明を空にはできません',
  
  // Warnings
  PURPOSE_TOO_BRIEF: `Purpose セクションが短すぎます（${MIN_PURPOSE_LENGTH} 文字未満）`,
  REQUIREMENT_TOO_LONG: `要件文が長すぎます（>${MAX_REQUIREMENT_TEXT_LENGTH} 文字）。分割を検討してください。`,
  DELTA_DESCRIPTION_TOO_BRIEF: 'デルタの説明が短すぎます',
  DELTA_MISSING_REQUIREMENTS: 'デルタには要件を含めてください',
  DELTA_SECTION_WITHOUT_REQUIREMENTS: (sections: string) =>
    `デルタセクション ${sections} は見つかりましたが、要件が解析されませんでした。各セクションに少なくとも 1 つの "### Requirement:" ブロックを含めてください（REMOVED は箇条書きも可）。`,
  DELTA_SECTION_MISSING_HEADER:
    'デルタセクションが見つかりません。"## ADDED Requirements" などの見出しを追加するか、デルタ以外のメモは specs/ の外に移動してください。',
  
  // Guidance snippets (appended to primary messages for remediation)
  GUIDE_NO_DELTAS:
    'デルタが見つかりません。変更には specs/ ディレクトリ（例: specs/http-server/spec.md）とデルタヘッダー（## ADDED/MODIFIED/REMOVED/RENAMED Requirements）を使う .md ファイルを用意し、各要件に少なくとも 1 つの "#### Scenario:" ブロックを含めてください。ヒント: `openspec change show <change-id> --json --deltas-only` で解析結果を確認できます。',
  GUIDE_MISSING_SPEC_SECTIONS:
    '必須セクションが不足しています。必要な見出し: "## Purpose" と "## Requirements"。例:\n## Purpose\n[簡潔な目的]\n\n## Requirements\n### Requirement: 明確な要件文\nUsers SHALL ...\n\n#### Scenario: シナリオ名\n- **WHEN** ...\n- **THEN** ...',
  GUIDE_MISSING_CHANGE_SECTIONS:
    '必須セクションが不足しています。必要な見出し: "## Why" と "## What Changes"。デルタは specs/ 配下でデルタ用ヘッダーを使って記載してください。',
  GUIDE_SCENARIO_FORMAT:
    'シナリオは level-4 見出しを使ってください。箇条書きは次の形式に変換します:\n#### Scenario: 短い名前\n- **WHEN** ...\n- **THEN** ...\n- **AND** ...',
} as const;
