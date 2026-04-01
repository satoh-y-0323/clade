# /agent コマンド

指定したエージェントをサブエージェントとして起動する。

## 使い方
```
/agent:interviewer        # 要件ヒアリング担当（作業開始前の要望聞き出し）
/agent:architect          # 設計・アーキテクチャ担当
/agent:planner            # 計画立案・タスク割り振り担当
/agent:developer          # 実装・デバッグ担当（テスト作成はtesterが行う）
/agent:tester             # テスト仕様設計・実行・結果報告担当
/agent:code-reviewer      # コード品質・保守性・パフォーマンスのレビュー担当
/agent:security-reviewer  # セキュリティ脆弱性診断担当
```

## 動作
各エージェントは `.claude/agents/{name}.md` の YAML frontmatter に従い、
指定されたモデル・ツール・権限でサブエージェントとして起動される。

| エージェント | モデル | 主な権限 | レポート出力先 |
|---|---|---|---|
| interviewer | sonnet | 読み取り・実行のみ（Write/Edit不可）| `requirements-report-*.md` |
| architect | sonnet | 読み書き・実行（削除は確認後）| `architecture-report-*.md` |
| planner | sonnet | 読み取り・実行のみ（Write/Edit不可）| `plan-report-*.md` |
| developer | sonnet | 読み書き・実行・TodoWrite | - |
| tester | sonnet | 読み取り・実行のみ（Write/Edit不可）| `test-report-*.md` |
| code-reviewer | sonnet | 読み取り・実行のみ（Write/Edit不可）| `code-review-report-*.md` |
| security-reviewer | sonnet | 読み取り・実行のみ（Write/Edit不可）| `security-review-report-*.md` |

※ 全レポートは `.claude/reports/` 配下にタイムスタンプ付きで保存される。

## 標準ワークフロー（フェーズ構成）

### フェーズ1: 要件定義・設計
```
Step 0. /agent:interviewer  → 要件ヒアリング・requirements-report 出力・承認
        ※ 機能追加・バグ修正では必ず実施。新規開発の場合は省略可。
Step 1. /agent:architect    → requirements-report 読み込み・設計・architecture-report 出力・承認
```
このフェーズ完了時点で存在するレポート: requirements-report, architecture-report

### フェーズ2: 初回計画立案
```
Step 2. /agent:planner      → requirements-report + architecture-report を読み込み
                              初回 plan-report 出力・承認
                              ※ test/review レポートはまだ存在しないためスキップ（正常）
```
このフェーズ完了時点で存在するレポート: + plan-report

### フェーズ3: 実装・テスト（TDDサイクル）
```
Step 3. /agent:tester       → plan-report 確認・テスト仕様設計・失敗テスト作成（Red）
Step 4. /agent:developer    → plan-report 確認・実装（Green → Refactor）
Step 5. /agent:tester       → テスト再実行・test-report 出力・承認
```
このフェーズ完了時点で存在するレポート: + test-report

### フェーズ4: レビュー・計画更新
```
Step 6. /agent:code-reviewer     → code-review-report 出力・承認
Step 7. /agent:security-reviewer → security-review-report 出力・承認
Step 8. /agent:planner           → 全レポート統合・更新 plan-report 出力・承認
```
指摘がなくなるまで Step 3〜8 を繰り返す。

## TDD フロー（developer ↔ tester）
1. `/agent:tester` でテスト仕様設計・失敗テスト作成（Red）
2. `/agent:developer` で実装（Green）→ testerに再確認依頼
3. `/agent:developer` でリファクタ（Refactor）→ testerに再確認依頼
4. 不合格がなくなるまで2〜3を繰り返す
