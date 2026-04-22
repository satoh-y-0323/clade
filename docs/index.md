---
layout: home

hero:
  name: "Clade（クレイド）"
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
  - icon: 🔒
    title: プロジェクト内完結
    details: すべての設定は .claude/ ディレクトリに収まり、リポジトリとともに管理されます。/promote コマンドを意図的に実行しない限り、グローバル設定を一切変更しません。

  - icon: 📝
    title: ノーコードでカスタマイズ
    details: エージェントの動作・ルール・スキルはすべて Markdown ファイルで管理。コードを書かずに、言葉で説明したりプロンプトに受け答えするだけでカスタマイズできます。

  - icon: 🌐
    title: あらゆる開発言語に対応
    details: /agent-project-setup コマンドでコーディング規約を対話形式で設定。TypeScript・Python・C#・Go・Java・Ruby など、どんな言語のプロジェクトにも簡単に対応できます。

  - icon: 🔌
    title: MCP サーバの簡単セットアップ
    details: /agent-mcp-setup コマンドで公開 MCP サーバはもちろん、社内 MCP・個人 MCP など非公開のサーバも簡単にセットアップ可能。スキルファイルも自動生成します。

  - icon: 🧠
    title: 使いながら育てるフレームワーク
    details: セッションをまたいだメモリ永続化はもちろん、過去の成功・失敗パターンをルール化・スキル化できます。使えば使うほど、あなたのプロジェクトに最適化されていきます。

  - icon: 🤖
    title: 役割ベースのエージェント
    details: インタビュアー・アーキテクト・プランナー・デベロッパー・テスター・レビュアーなど、各フェーズに専門エージェントを配置。構造化されたワークフローで連携します。
---

## Clade とは

**Clade**（読み方：クレイド）は [Claude Code](https://claude.ai/code) 上に構築されたマルチエージェント開発支援フレームワークです。

> **由来：** *Claude* ＋ *made*（作られた）の造語。生物学では **clade（クレード）** は「共通の祖先を持つグループ」を意味し、Claude から生まれたエージェントたちがチームとして協働するイメージを込めています。

### コンセプト

**「プロジェクトに寄り添い、使いながら育てる」**

Clade は3つのコンセプトを軸に設計されています。

**1. グローバルを汚さない**

すべての設定は `.claude/` ディレクトリに閉じており、リポジトリとともに管理されます。スキルやルールを複数プロジェクトで共有したくなったときだけ、`/promote` コマンドで意図的にグローバルへ昇格できます。昇格するかどうかは常にあなたが決めます。

**2. 言葉だけでカスタマイズできる**

コードを書く必要はありません。`/agent-project-setup` で言語やコーディング規約を対話形式で設定し、`/agent-mcp-setup` で使いたい MCP サーバを追加するだけです。社内の独自ルールも、プロンプトに答えるだけで反映されます。

**3. 使いながら育つ**

セッションをまたいでメモリが永続化されるだけでなく、過去の成功・失敗パターンをルールやスキルとして蓄積できます。プロジェクトが進むほど、Clade はあなたのチームに最適化されていきます。

---

## 必要なもの

- [Claude Code](https://claude.ai/code)（CLI または VS Code 拡張）
- Node.js v18 以上
- Git
- [GitHub CLI (gh)](https://cli.github.com)
- Windows / macOS / Linux

## CLI での実行を推奨

VS Code 拡張には現在既知のバグがあり、プロジェクトレベルの `permissions.allow` が反映されません。フック実行のたびに確認ダイアログが表示されるため、**CLI での実行を推奨します**。

詳細は [はじめ方](/getting-started) を参照してください。

---

## 最近の更新

### [v1.23.1] - 2026-04-23

`clade-manifest.json` の `skills` リストに `project/planner/clade-parallel-manifest.md` が漏れていた問題を修正。v1.23.0 で追加されたこのファイルが `/update` 経由でユーザーに配布されていなかった。

### [v1.23.0] - 2026-04-23

`CLAUDE.md` に Compact Instructions セクションを追加（圧縮時の保持・破棄ルールを明示）。`plan-to-manifest.js` を clade-parallel v0.5 マニフェスト仕様に対応（`timeout_sec` / `idle_timeout_sec` / `read_only` をグループごとに frontmatter から読み取り）。プランナー専用スキル `skills/project/planner/clade-parallel-manifest.md` を追加。

### [v1.22.0] - 2026-04-21

clade-parallel 連携の基盤を実装。`worktree-developer` エージェント（並列開発用非対話型 developer）・`plan-to-manifest.js`（plan-report → マニフェスト変換・静的衝突チェック付き）・`check-writes-isolation.js`（writes 範囲外ブロック）を追加。`agent-developer` に並列実行モード、`agent-planner` に `parallel_groups` フロントマター仕様を追加。`settings.json` の `.claude/` 配下 Write パーミッションと 6 スクリプトの Bash 許可を補完。

[すべての変更履歴を見る →](/changelog)
