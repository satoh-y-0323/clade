# 変更履歴

## [v1.13.0] - 2026-04-12

### New

- `/end-session` に `--no-promote` フラグを追加（昇格候補提示ステップをスキップ）
- session-start hook を廃止し `/init-session` 手動実行に統一（system-reminder サイズ制限の回避）

### Fix

- `.tmp` 読み込み時に `CLADE:SESSION:JSON` ブロックを除去してトークン消費を削減
- `agent-workflow-builder` の追記先を `/update` で消えない `## User Agents` セクションに変更
- `cluster-promote` エラーメッセージのセクション名を修正（`## Global Rules` → `## User Rules`）

---

## [v1.12.0] - 2026-04-11

### New

- `update-clade-section.js` に `remove-rule` サブコマンドを追加（`add-rule` と対称的な設計）

### Fix

- `.tmp` フォーマットに `CLADE:SESSION:JSON` ブロックを追加し、機械的パースの耐性を向上
- `stop.js` が事実ログ更新時に JSON ブロックを消してしまうバグを修正

---

## [v1.11.0] - 2026-04-11

### New: 整理コマンドの追加

- `/prune-rules` — `/cluster-promote` で昇格したルールを対話形式で整理。重複・類似ルールの統合と孤立クラスタの削除をサポート
- `/prune-reports` — 蓄積したレポートファイルを種別ごとに直近N件を残して削除

### Fix

- セッション開始時のセットアップ未実行警告が誤発していた問題を修正（`settings.local.json` の有無で判定するよう変更）
- `/cluster-promote` のセクション見出し照合を部分一致に変更し、見出しの微妙なバリエーションで候補が抽出されなくなる問題を修正

---

## [v1.10.1] - 2026-04-11

### Fix

- `/cluster-promote` で昇格したルールが Global Rules に追記されていた問題を修正。正しく User Rules セクションに追記されるよう改善
- `.claude/instincts/raw/` ディレクトリを `.gitignore` に追加。個人データが誤って GitHub に公開されるのを防止

---

## [v1.10.0] - 2026-04-11

### New: 育てる動線の強化

- `/end-session` に昇格候補の提示機能を統合。セッション終了時に `/cluster-promote` が検出したルール・スキル候補を一覧表示し、その場で保存・保留・スキップを選択できるようになりました
- セッション終了時に使用エージェント・作業時間などのメタ情報をセッションファイルに自動記録するよう改善
- ルール昇格時に CLAUDE.md の `User Rules` セクションへの自動追記に対応

### New: ドキュメント

- 変更履歴ページ（`/changelog`）を GitHub Pages に追加
- トップページに「最近の更新」セクションを追加（最新3バージョンの概要を表示）

### Fix

- エージェントスキルファイルの heredoc 構文を修正

---

## [v1.9.0] - 2026-04-10

### New / Fix

- セッション開始時にセットアップ未実行を検出し、案内をユーザーに直接表示するよう改善
- ドキュメント: `/update` コマンドの説明をセッション管理ページに追加

---

## [v1.8.3] - 2026-04-10

### Fix

- セットアップ未実行の警告が「hook エラー」として表示されるだけだった問題を修正。警告内容が Claude のコンテキストに正しく伝わるよう変更

---

## [v1.8.2] - 2026-04-10

### Fix

- `/update` コマンド実行時に不要なディレクトリが作成される問題を修正

---

## [v1.8.1] - 2026-04-10

### Fix

- セットアップ未実行検出の誤検知を修正。`README.md` が存在するだけで警告が出ていた問題を解消

---

## [v1.8.0] - 2026-04-10

### New: `/update` コマンド

Clade 自体をアップデートするコマンドを追加しました。GitHub リリースの最新版と現在のインストールを比較し、差分を確認・適用・ロールバックできます。

```
/update          # 最新バージョンを確認・適用
/update --check  # 差分を確認するだけ（適用しない）
```

### New: VitePress ドキュメントサイト

公式ドキュメントサイト（VitePress）を追加し、GitHub Pages で公開しました。セットアップ手順・エージェント一覧・ワークフロー解説などをまとめています。

### New: セットアップ未実行検出

セットアップスクリプト（`setup.sh` / `setup.ps1`）を実行せずにそのまま使おうとした場合に、セッション開始時に警告と案内を表示する機能を追加しました。

### New: トラブルシューティングページ

ドキュメントサイトにトラブルシューティングページを追加しました。使い始めのエンジニア・非エンジニアが詰まりやすい5つのケースをカバーしています。

- セットアップのやり方がわからない
- セットアップがうまくいかない
- Clade を入れてみたけど何をしたらいいかわからない
- カスタムコマンドが動かない
- エラーメッセージが出たけどどうしたらいいかわからない

### Fix

- エージェントスキルファイルのヒアドキュメント terminator を `CLADE_REPORT_EOF` に統一し、特殊文字を含むレポートが正しく保存されない問題を修正

---

## [v1.7.0] - 2026-04-09

### New: `/agent-workflow-builder`

業務ヒアリングからエージェント群を自動生成するメタエージェントを追加しました。

「Clade を使って Clade のエージェントを作る」再帰的な構造で、非エンジニアでも自分の業務に特化したワークフローを構築できます。

**4フェーズで動作します:**

1. **ヒアリング** — 職種・繰り返し作業・IN/OUT を 5〜6 問で聴取
2. **ワークフロー設計** — ステップごとにエージェントを提案し、ユーザーが確認・調整
3. **エージェントファイル生成** — 各ステップの `.md` 指示書と統括コマンドを自動生成
4. **CLAUDE.md 更新** — `Available Agents` セクションに生成したエージェントを自動追記

```
/agent-workflow-builder
```

質問は「代表例の選択肢 + 自由入力」形式なので、どんな職種・業種にも対応できます。

---

## [v1.6.0] - 2026-04-08

### Apology

v1.5 以前の Clade をお使いの方へ、まずお詫び申し上げます。

`pre-tool.js` / `post-tool.js` フックが **全ツール実行を `observations.jsonl` に逐次記録し続けていました**。この仕組みは「実行パターンから自動学習する」という意図で設計されましたが、実際に生成されたデータは意味のある知見が得られないものでした。意図せず `.claude/instincts/raw/` にゴミファイルを蓄積させてしまい、申し訳ありませんでした。

v1.6 では観察システムを根本から見直し、本当に役立つデータだけを収集するよう改設計しました。

### New: Cleanup Scripts

過去バージョンで蓄積されたゴミデータを削除するスクリプトを追加しました。

**日本語版（Windows）:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\cleanup.ps1 -ProjectPath "C:\path\to\your\project"
```

**日本語版（macOS/Linux）:**
```bash
chmod +x cleanup.sh
./cleanup.sh /path/to/your/project
```

**英語版（Windows）:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\cleanup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**英語版（macOS/Linux）:**
```bash
chmod +x cleanup_en.sh
./cleanup_en.sh /path/to/your/project
```

スクリプトは以下を削除します（存在しない場合は自動スキップ）:
- `.claude/instincts/raw/observations.jsonl`
- `.claude/instincts/raw/patterns_*.json`
- `.claude/hooks/extract-patterns.js`

### Changed: Observation System Redesign

観察システムを以下のように再設計しました:

| | v1.5 以前 | v1.6 |
|---|---|---|
| 記録対象 | 全ツール実行（Read・Edit・Bash・Glob 等） | Bash コマンドのみ |
| 記録先 | `observations.jsonl` | `bash-log.jsonl` |
| 自動パターン抽出 | あり（`extract-patterns.js`） | なし（廃止） |
| `/cluster-promote` の分析元 | `patterns_*.json` | `bash-log.jsonl` の失敗記録 + セッション `.tmp` ファイルの振り返り |

### Upgrade

**ステップ 1: ゴミデータを削除する（上記クリーンアップスクリプトを実行）**

**ステップ 2: フックファイルを更新する（セットアップスクリプトを再実行）**

---

## [v1.5.0] - 2026-04-08

### Features

- **`isolation: "worktree"` による並列開発** — `worktree-developer` エージェントが `Agent({ isolation: "worktree" })` で起動するようになり、各エージェントが自動的に独立した Git worktree を取得します。並列実行時の `Already in a worktree session` コンフリクトを解消しました（[clade#1](https://github.com/satoh-y-0323/clade/issues/1) 修正）。
- **`settings.local.json.example` テンプレート** — 推奨設定を含む `settings.local.json` テンプレートが追加されました。セットアップスクリプト実行時に自動配置されます。
- **セットアップスクリプトの自動配置** — 全セットアップスクリプトが `settings.local.json` を自動配置するステップを含むようになりました。

### Bug Fixes

- **Git worktree 内での `enable-sandbox.js` エラーを修正** — worktree 内での起動時にエラーが発生していた問題を修正
- **並列エージェントの権限不足を修正** — `settings.local.json.example` に必要な権限エントリを追加

### Upgrade

セットアップスクリプトを再実行してください:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.4.0] - 2026-04-08

### Features

- **並列開発** — プランナーが `plan-report` で `parallel_groups` を定義できるようになりました。`agent-developer` が複数の `worktree-developer` エージェントをバックグラウンドで並列起動し、完了後に自動でマージします。
- **`worktree-developer` エージェント** — 専用 worktree に入り、割り当てグループのタスクを実装するバックグラウンド専用エージェントを追加
- **`merger` エージェント** — 並列開発完了後に全 worktree ブランチをベースブランチへマージするエージェントを追加。コンフリクト検出時はユーザーに確認します。
- **ファイル所有権の強制** — グループの担当外ファイルへの書き込みをブロックするフックを追加。並列開発中の意図しない干渉を防ぎます。

### Bug Fixes

- バックグラウンドサブエージェントでの承認フローを修正
- `reviewer.md` → `code-reviewer.md` にリネーム（命名規約の統一）
- マイルストーン進捗管理を親 Claude に移動（バックグラウンド実行との非互換を解消）

### Upgrade

セットアップスクリプトを再実行してください:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.3.3] - 2026-04-07

### Bug Fixes

- **全エージェントのマルチターン会話を修正** — エージェントが質問のたびに新しいセッションを起動していた問題を修正。全9エージェントが `AskUserQuestion` ツールを使うよう統一し、1セッション内でコンテキストを保持したまま会話できるようになりました。

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.3.2] - 2026-04-07

### Bug Fixes

- **エージェントのルールファイルパスを修正** — 全7ワークフローエージェントで、存在しないパスを参照していたためルールセットが読み込まれていなかった問題を修正
- **重複コンテンツを整理** — `agents/*.md` の冗長な記述を削除し、詳細ルールを `skills/agents/*.md` に統一

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.3.1] - 2026-04-07

### Bug Fixes

- **ヒアドキュメントによるレポート出力** — `write-report.js` が stdin からコンテンツを受け取るよう変更。OS のコマンドライン引数長制限（約8,000文字）を回避し、大きなレポートも正しく保存されるようになりました。
- OS の引数長制限でエラーになった場合、エージェントが別の方法を勝手に試みることを禁止するルールを追加

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.3.0] - 2026-04-06

### Features

- **VS Code 拡張の環境チェック** — セッション開始時に CLI / VS Code 拡張のどちらで動作しているかを検出。VS Code 拡張の場合は並列バックグラウンド実行の制限について警告し、逐次実行モードで続行するか CLI に切り替えるかを選択できます。
- **マイルストーンベースのワークフロー** — `plan-report` にマイルストーンを定義できるようになりました。`confirm` モード（マイルストーン完了後に確認）または `auto` モード（自動継続）を選択できます。

### Bug Fixes

- `sandbox` 設定のフォーマットを修正（`true` → オブジェクト形式）。boolean 形式は設定パースエラーを起こし、全 `permissions.allow` が無効になっていた
- `httpProxyPort: null` / `socksProxyPort: null` によるバリデーションエラーを修正

### Documentation

- README にセットアップ手順・CLI 推奨・VS Code 拡張の挙動説明を追加
- `CHANGELOG.md` を追加

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.2.0] - 2026-04-06

### Refactoring

- GitHub MCP を gh CLI に置き換え
  - `--mcp` / `-MCP` セットアップフラグと PAT 管理を廃止
  - `GITHUB_PERSONAL_ACCESS_TOKEN` が不要になりました
  - セットアップスクリプトで gh CLI の存在と認証状態を確認するよう変更

### Features

- エージェントごとの GitHub 操作権限を追加
  - 読み取り専用の `gh` コマンドは自動承認
  - 書き込み操作は確認ダイアログでゲート

### Bug Fixes

- `permissions.allow` のパスパターンと hooks フォーマットを修正

---

## [v1.1.1] - 2026-04-05

### Bug Fixes

- **英語版テンプレートの `settings.json` が欠けていた問題を修正** — v1.1.0 で英語テンプレートを使ってセットアップしたユーザーが、Clade フックスクリプトの実行ごとに権限確認を求められていた問題を解消

---

## [v1.1.0] - 2026-04-04

### Features

- **英語版テンプレート** — `templates/en/.claude/` に全ファイルの英語訳を追加
- 英語版セットアップスクリプト（`setup_en.ps1` / `setup_en.sh`）を追加
- **macOS/Linux サポート** — 日本語版の `setup.sh` を追加

---

## [v1.0.0] - 2026-04-04

初回リリース。

- 役割ベースの7エージェント: interviewer / architect / planner / developer / tester / code-reviewer / security-reviewer
- 構造化ワークフロー: 要件定義 → 設計 → 計画 → 実装 → テスト → レビュー
- 全フェーズでの Human-in-the-loop 承認
- セッションメモリ: セッションをまたいだ作業状態の自動保存・復元
- MCP サーバ対応: Playwright / Memory / Sequential-thinking
- プロジェクト内完結: 全設定が `.claude/` に収まる
- `/promote` でスキル・ルールをグローバルスコープへ昇格
