# ストア

> マルチリポジトリ用ストアを支える registry.yaml と store.yaml、およびコマンドが使用するルート。

<!-- 骨組み：見出しのみ。multi-repo グループと同じくベータ。手作業で編集せず
マシンが管理するが、読者が調査、修復できるよう文書化する。概念とワークフローは
multi-repo/stores.md で扱う。ルート解決は src/core/root-selection.ts の契約に従う：
--store フラグ、なければ最も近い上位の openspec/、なければ設定しかない openspec/ の
store: ポインター、なければグローバルの defaultStore、いずれもなければエラー。
このページでは、日常的な場合（最も近い openspec/ を優先）を含む全優先順位を扱い、
このセクションの概要ページはここへリンクするだけにする。場所（store/foundation.ts）：
registry.yaml は <dataDir>/stores/（~/.local/share/openspec/stores/）、store.yaml は各
チェックアウト内の .openspec-store/store.yaml。用語集の「OpenSpec ルート」からここへリンクする。 -->

## registry.yaml

## store.yaml

## Locations

## Root resolution
