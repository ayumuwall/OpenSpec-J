# skills.sh向けOpenSpecスキル

[skills.sh](https://skills.sh) 対応の任意のエージェントへ、OpenSpecワークフロースキルをインストールできます。

```bash
npx skills add ayumuwall/OpenSpec-J
```

ここにある各 `openspec-*/SKILL.md` は、`openspec init` がプロジェクトへ書き込むものと同じスキルです。スキルは `openspec` CLIを操作します。CLI、`openspec/` プロジェクトの雛形、スラッシュコマンドを含む完全なセットアップを行うには、次を実行してください。

```bash
npx @ayumuwall/openspec@latest init
```

> これらのファイルはスキルテンプレートから生成されるため、手動で編集しないでください。テンプレートを変更した後は `pnpm build && pnpm generate:skills` を実行してください。内容に差異があると `skillssh-parity.test.ts` が失敗します。
