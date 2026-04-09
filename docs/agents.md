# エージェント一覧

Clade には役割ごとに専門化されたエージェントが用意されています。各エージェントはカスタムスラッシュコマンドで呼び出せます。

## 標準ワークフローエージェント

開発フローの各フェーズを担当するエージェントです。

| コマンド | 役割 | 出力 |
|---|---|---|
| `/agent-interviewer` | 要件ヒアリング | requirements-report |
| `/agent-architect` | システム設計・アーキテクチャ | architecture-report |
| `/agent-planner` | タスク計画・調整 | plan-report |
| `/agent-developer` | 実装・デバッグ | コード |
| `/agent-tester` | テスト設計・実行 | test-report |
| `/agent-code-reviewer` | コード品質レビュー | code-review-report |
| `/agent-security-reviewer` | セキュリティ脆弱性診断 | security-review-report |

### /agent-interviewer

要件ヒアリングを担当します。作業の種類（新規開発・機能追加・バグ修正）から始まり、「何を実現したいか」「どうなったら完成か」を対話形式で引き出します。ヒアリング結果は `requirements-report` として `.claude/reports/` に保存され、あなたの承認を待ちます。

ソースファイルの編集は行いません。

### /agent-architect

`requirements-report` を読み込み、システム設計・アーキテクチャ設計を行います。認証フロー・データモデル・API インターフェースなどを設計し、`architecture-report` として出力します。

### /agent-planner

`requirements-report` と `architecture-report` を読み込み、具体的な作業計画を立案します。タスクをマイルストーンやグループに分割し、`plan-report` として出力します。並列開発が必要な場合は並列グループも定義します。

ソースファイルの編集は行いません。

### /agent-developer

`plan-report` を読み込み、実装・デバッグを行います。並列モードでは複数の worktree-developer が独立したブランチで並列実行され、完了後に自動マージされます。

### /agent-tester

テスト仕様の設計・失敗するテストの作成（Red）・テスト再実行・`test-report` の出力を担当します。TDD サイクルで developer と連携します。

ソースファイルの編集は行いません。

### /agent-code-reviewer

コード品質・保守性・パフォーマンスを観点にレビューし、`code-review-report` を出力します。セキュリティ診断は security-reviewer が担当します。

ソースファイルの編集は行いません。

### /agent-security-reviewer

SQLインジェクション・XSS・認証認可・秘密情報漏洩・入力値バリデーションなど、セキュリティ脆弱性を診断し、`security-review-report` を出力します。

ソースファイルの編集は行いません。

---

## ユーティリティエージェント

標準ワークフロー外で単独完結するエージェントです。

| コマンド | 役割 |
|---|---|
| `/agent-project-setup` | コーディング規約の設定・`coding-conventions.md` 生成 |
| `/agent-mcp-setup` | MCP サーバの調査・接続設定・スキルファイル生成 |
| `/agent-workflow-builder` | 業務ヒアリングからエージェント群を自動生成 |

### /agent-project-setup

使用言語とコーディング規約についてヒアリングし、`.claude/skills/project/coding-conventions.md` を自動生成します。プロジェクト開始時に一度実行することを推奨します。

### /agent-mcp-setup

公開 MCP サーバや社内プライベート MCP サーバを調査・設定します。スキルファイルも自動生成するため、設定後すぐにエージェントが MCP サーバを活用できます。

### /agent-workflow-builder

業務内容をヒアリングし、その業務に特化したエージェント群を自動生成します。非エンジニアの方でも独自のワークフローを構築できます。詳しくは [ワークフロービルダー](/workflow-builder) を参照してください。

---

## エージェントを直接指定した場合の動作

エージェントを `/agent-xxx` で直接呼び出した場合、作業開始前に以下の確認が行われます：

```
標準ワークフローに沿って作業を進めますか？
  [yes] ワークフローに従い、次フェーズへの連携も行います
  [no]  このエージェントの作業のみ実施します
```

`yes` を選ぶと標準ワークフローに従い、`no` を選ぶとそのエージェントの作業のみ実施して完了報告します。
