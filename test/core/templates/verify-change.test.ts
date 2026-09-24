import { describe, expect, it } from 'vitest';

import {
  getOpsxVerifyCommandTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

const skill = getVerifyChangeSkillTemplate();
const command = getOpsxVerifyCommandTemplate();

const bodies: Array<[string, string]> = [
  ['skill', skill.instructions],
  ['command', command.content],
];

describe('verify-change templates', () => {
  it('keeps active no-task changes eligible for ambiguous selection', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('一覧に返されたすべてのアクティブな変更を表示');
      expect(body, label).toContain('`status: "no-tasks"` の変更も含め');
      expect(body, label).not.toContain(
        'show changes that have implementation tasks (tasks artifact exists)'
      );
    }
  });

  it('prefers schema-aware apply task fields without assuming a tasks artifact id', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('最上位の `tasks` と `progress`');
      expect(body, label).toContain("スキーマの `apply.tracks`");
      expect(body, label).toContain('一致して読み取れたすべての具体的なファイルから集計');
      expect(body, label).toContain("追跡対象のアーティファクト ID に関係なく");
      expect(body, label).toContain('`contextFiles` のキーから追跡設定を推測しません');
    }
  });

  it('marks partial tracking evidence as not verified', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('`unavailableTrackingFiles` が空でなければ');
      expect(body, label).toContain('利用できないパスと理由をすべて記載');
      expect(body, label).toContain('部分的な `tasks` と `progress` から完了とは判断しません');
    }
  });


  it('does not lose incomplete checkboxes omitted from the task list', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('`progress.remaining` が 0 より大きい場合');
      expect(body, label).toContain('説明のない未完了チェックボックス');
      expect(body, label).toContain('一覧のタスクだけで完了を判断しません');
    }
  });

  it('requires usable evidence rather than just existing artifact paths', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('読み取れない場合や、利用できる要件・シナリオ・設計上の決定がない場合');
      expect(body, label).toContain('残りの証拠で裏付けられるチェックは続けます');
      expect(body, label).toContain('入力の一部だけを確認しても検証済みとはしません');
      expect(body, label).toContain('実装変更を特定できない場合は、**コードパターンの一貫性** を未検証');
    }
  });

  it('does not mistake apply readiness for verification or execute apply instructions', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('apply の `state` と `instruction` は背景情報として扱い、検証の判定には使いません');
      expect(body, label).toContain('検証中にタスクを実装したり、変更をアーカイブしたりしないでください');
    }
  });

  it('preserves optional artifacts and the existing archive workflow', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('検証は助言のために行います');
      expect(body, label).toContain('`skip_specs: true`');
      expect(body, label).toContain('タスク追跡のないスキーマ');
      expect(body, label).toContain('任意または意図的に省略されたアーティファクトを要求したり作成したりしません');
      expect(body, label).toContain('スキーマが定義しないチェックや、状態が意図的なスキップを示すアーティファクトは **対象外** とします');
      expect(body, label).toContain('これらはスキップしたチェックの件数とアーカイブ準備状況の評価から除外します');
      expect(body, label).toContain('`taskTrackingConfigured` が false なら、**タスクの完了** は対象外と報告');
      expect(body, label).toContain('`taskTrackingConfigured` が true で `tasks` が空なら、**タスクの完了** を未検証');
      expect(body, label).toContain('`未検証` はレポートの限界を示すもので、アーカイブの新しい前提条件ではありません');
      expect(body, label).toContain('アーカイブ独自のチェックとユーザー確認の動作は維持されます');
    }
  });

  it('preserves task-only verification without dropping checks supported by other artifacts', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('適用対象のチェックで使える証拠がタスクだけなら、タスクの完了だけを検証');
      expect(body, label).toContain('**コードパターンの一貫性** を含む残りの適用対象は、「タスクの証拠しかないため」という理由を付けて未検証');
      expect(body, label).toContain('他に裏付けとなるアーティファクトがあれば **コードパターンの一貫性** は実行');
    }
  });

  it('covers warning and suggestion outcomes without claiming all checks passed', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('重大な問題がなく、警告が 1 件以上あり、スキップしたチェックがない場合');
      expect(body, label).toContain('提案だけで、スキップしたチェックがない場合');
      expect(body, label).toContain('提案があれば件数を記載');
    }
  });

  it('maps missing supporting artifacts to every check they prevent', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        '**仕様範囲**、**要件実装マッピング**、**シナリオの対象範囲** を未検証'
      );
      expect(body, label).toContain('**設計の遵守** を未検証');
      expect(body, label).toContain('**コードパターンの一貫性** は実行');
    }
  });

  it('never reports a skipped check as passing or archive-ready', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain('スキップしたチェックごとに `未検証（<理由>）`');
      expect(body, label).toContain('スキップしたチェックを合格にせず');
      expect(body, label).toContain('未検証または一部しか検証していないチェックは、最終評価ではすべてスキップとして扱います');
      expect(body, label).toContain('スキップしたチェックがあり、重大な問題がない場合');
      expect(body, label).toContain(
        'スキップしたチェックがあれば、すべてのチェック名と理由も記載'
      );
      expect(body, label).toContain('準備ができたとは報告せず');
      expect(body, label).toContain('問題がなく、スキップしたチェックもない場合');
    }
  });
});
