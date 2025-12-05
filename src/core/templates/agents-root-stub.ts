export const agentsRootStubTemplate = `# OpenSpec Instructions

このプロジェクトで作業する AI アシスタント向けの指示です。

次のような依頼を受けたら必ず \`@/openspec/AGENTS.md\` を開いてください:
- proposal / spec / change / plan など企画や提案に関する話題が出たとき
- 新機能・破壊的変更・アーキテクチャ変更・大きな性能/セキュリティ対応を行うとき
- 要件があいまいで、実装前に正確な仕様を確認したいとき

\`@/openspec/AGENTS.md\` では次の情報を確認できます:
- 変更提案の作成方法と適用手順
- 仕様フォーマットと守るべき慣習
- プロジェクト構成や運用ガイドライン

この管理ブロックは残したままにし、'openspec update' で指示を安全に更新できるようにしてください。
`;
