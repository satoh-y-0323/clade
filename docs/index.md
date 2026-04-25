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

### [v1.28.0] - 2026-04-25

`worktree-developer` の起動コストを削減。外部ルールファイル3件の内容を `INLINE:BEGIN/END` マーカー付きでエージェント定義ファイルに直接埋め込み（並列 N インスタンスで 3N 回の Read を削減）。`plan-to-manifest.js` に `findReportPaths()` を追加し、manifest 生成時にレポートパスを解決してプロンプトに埋め込むことで起動時の Glob を排除（N=4 で最大 20 Glob 削減）。

### [v1.27.0] - 2026-04-25

`plan-updater` エージェントを追加。developer 実装完了後・reviewer 実行前に自動呼び出しされ、plan-report から reviewer 並列グループを削除することで reviewer フェーズを常に逐次実行に保つ。clade-parallel の固定オーバーヘッド（10分以上）を踏まえてタイムアウト値と並列化判断基準も全面改訂。

### [v1.26.0] - 2026-04-24

clade-parallel v0.6.0 の `max_retries` フィールドに対応。plan-report フロントマターのグループに `max_retries: N` を指定すると manifest に出力される。省略時はデフォルト 0 として行を出力しない。

[すべての変更履歴を見る →](/changelog)
