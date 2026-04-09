---
layout: home

hero:
  name: "Clade"
  text: "マルチエージェント開発支援フレームワーク"
  tagline: Claude Code 上に構築。要件定義から実装・レビューまで、専門エージェントがチームとして協働します。
  actions:
    - theme: brand
      text: はじめ方
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/satoh-y-0323/clade

features:
  - icon: 🤖
    title: 役割ベースのエージェント
    details: インタビュアー・アーキテクト・プランナー・デベロッパー・テスター・レビュアーなど、各フェーズに専門エージェントを配置。それぞれに明確な責務とルールを定義しています。

  - icon: 🔄
    title: 構造化されたワークフロー
    details: 要件定義 → 設計 → 計画 → 実装 → テスト → レビューのフェーズ構成。各フェーズでレポートを出力し、あなたの承認を待ってから次へ進みます。

  - icon: ⚡
    title: 並列開発
    details: プランナーが作業をグループに分割し、複数のエージェントが独立した worktree で並列実行。全グループ完了後に自動マージします。

  - icon: 🧠
    title: セッションをまたぐ記憶
    details: 前回の残タスク・成功アプローチ・失敗パターンをセッションをまたいで保存。翌日でも前回の続きからスムーズに再開できます。

  - icon: 📝
    title: コード不要
    details: すべての設定を Markdown ファイルで管理。エージェントの動作・ルール・スキルはテキストで書くだけでカスタマイズできます。

  - icon: 🔧
    title: 完全カスタマイズ可能
    details: エージェント・ルール・スキル・MCP サーバをチームの規約に合わせて自由に変更。必要なときだけグローバルに昇格できます。
---

## Clade とは

**Clade**（読み方：クレイド）は [Claude Code](https://claude.ai/code) 上に構築されたマルチエージェント開発支援フレームワークです。

> **由来：** *Claude* ＋ *made*（作られた）の造語。生物学では **clade（クレード）** は「共通の祖先を持つグループ」を意味し、Claude から生まれたエージェントたちがチームとして協働するイメージを込めています。

設定はすべて Markdown ファイルで記述するため、コードを書く必要はありません。プロジェクトに `.claude/` ディレクトリを配置するだけで動作します。

## 必要なもの

- [Claude Code](https://claude.ai/code)（CLI または VS Code 拡張）
- Node.js v18 以上
- Git
- [GitHub CLI (gh)](https://cli.github.com)
- Windows / macOS / Linux

## CLI での実行を推奨

VS Code 拡張には現在既知のバグがあり、プロジェクトレベルの `permissions.allow` が反映されません。並列バックグラウンドエージェントが正常動作しないため、**CLI での実行を推奨します**。

詳細は [はじめ方](/getting-started) を参照してください。
