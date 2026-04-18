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

### [v1.18.4] - 2026-04-18

バックグラウンドエージェントが `write-report.js` を絶対パスで呼び出すと `permissions.allow` パターンにマッチせず拒否される問題を修正。`reviewer-common.md` に「相対パス必須・絶対パス禁止」の明示ルールを追加。

### [v1.18.3] - 2026-04-18

レビューエージェントがバックグラウンド並列実行時にレポートを書き込めない問題を修正。Claude Code の権限チェックは Bash コマンド全体（ヒアドキュメント本文含む）の文字数に上限があり、レポートが長い場合に無条件拒否されていた。`reviewer-common.md` の出力フローを「必ず分割出力・1回 2000 文字以内」に変更することで対処。

### [v1.18.2] - 2026-04-18

`code-reviewer` / `security-reviewer` のスキルファイルが参照するチェックリストパスが古いままだった問題を修正。チェックリストをサブフォルダへ移動した際に `skills/agents/` 側の参照パスが更新されておらず、レビュー時にチェックリストが読み込まれない状態だった。

### [v1.18.1] - 2026-04-17

`/update` 実行後に旧パスのファイルが残存する問題を修正。`clade-manifest.json` に `removed_files` フィールドを追加し、ファイルが別パスへ移動された際に旧パスのファイルを自動削除するようになった。

### [v1.18.0] - 2026-04-17

`/update` コマンドに対話型の差分処理ループを追加。`settings.json` / `settings.local.json` は差分表示と上書き確認の対話で安全に更新できるようになった。`protected_files` カテゴリで `memory/memory.json` のような蓄積データを保護。ローカル `clade-manifest.json` の `language` フィールドで JA/EN を識別し、EN 版プロジェクトでも `/update` が正しく動作するよう修正。

### [v1.17.3] - 2026-04-17

`settings.json` の `enableWeakerNestedSandbox` を `true` に変更。サブエージェントが sandbox 内で Bash を実行できず write-report.js が呼び出せなかった根本原因を解決。

### [v1.17.2] - 2026-04-17

全レポート出力フローに追記モード（append）と失敗時フォールバックを追加。Bash 書き込みが失敗した際にサブエージェントが単独で諦めず親 Claude へ委譲するよう明示。code-reviewer・security-reviewer のヒアドキュメント terminator インデントバグも修正。

### [v1.17.0] - 2026-04-17

worktree 並列開発の権限設定を大幅改善。`settings.local.json.example` の git 権限パターンを個別化し、`cd && git` 複合コマンドの許可・`.claude/` 配下への Write/Edit 権限を追加。merger エージェントの `cd /path && git ...` 禁止ルールを強調配置。`hook-utils.js` に `getProjectRoot()` を追加し、worktree 実行時にセッションファイルがメインリポジトリへ正しく書き込まれるよう修正。

### [v1.16.2] - 2026-04-16

`/update` コマンドのブートストラップ問題を修正。`clade-update.js` の二段階更新方式（`--apply-files` 内部モード）を導入。Stage 1 で新スクリプトをディスクにコピーし Stage 2 として別プロセスで起動することで、新コードが同一更新実行内で有効になる。

### [v1.14.5] - 2026-04-14

`statusline.js` のリセット時刻が表示されない不具合を修正。`resets_at` を Unix タイムスタンプ（秒）として正しく解釈するよう修正した。

### [v1.14.1] - 2026-04-13

`context-gauge.md` の EN テンプレート誤分類を修正。EN 版のゲージ説明を rate_limits 対応後の表示形式に更新。

### [v1.14.0] - 2026-04-13

`statusline` に `rate_limits` 対応を追加。`context usage:` ラベルを先頭に表示し、Pro・Max プランでは `5hour limits:` と `7day limits:` のゲージ・使用率・リセット時間を横並びで表示。`core.md` の重複ルール4件を削除。

### [v1.13.0] - 2026-04-12

session-start hook を廃止し `/init-session` 手動実行に統一。`/end-session` に `--no-promote` フラグを追加。`.tmp` 読み込み時の `CLADE:SESSION:JSON` ブロック除去でトークン消費を削減。

### [v1.12.0] - 2026-04-11

`update-clade-section.js` に `remove-rule` サブコマンドを追加。`.tmp` フォーマットに `CLADE:SESSION:JSON` ブロックを追加し機械的パースの耐性を向上。

### [v1.12.0] - 2026-04-11

`update-clade-section.js` に `remove-rule` サブコマンドを追加。`.tmp` フォーマットに JSON ブロックを導入し機械的パースの耐性を向上。`stop.js` の JSON ブロック消去バグを修正。

### [v1.11.0] - 2026-04-11

`/prune-rules` と `/prune-reports` を追加。「使いながら育てる」サイクルに「整理する」動線を追加し、ルールやレポートが蓄積しすぎることなく健全に保てるようになりました。

[すべての変更履歴を見る →](/changelog)
